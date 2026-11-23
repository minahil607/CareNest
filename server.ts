import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

function createGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on('connection', async (clientWs: WebSocket) => {
    if (!process.env.GEMINI_API_KEY) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          message: 'GEMINI_API_KEY is not configured in Settings > Secrets.',
        })
      );
      clientWs.close();
      return;
    }

    let liveSession: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null = null;
    let isClosing = false;

    const closeAll = () => {
      if (isClosing) return;
      isClosing = true;
      try {
        liveSession?.close();
      } catch {
        // Ignore close errors
      }
      liveSession = null;
    };

    clientWs.on('close', closeAll);
    clientWs.on('error', closeAll);

    clientWs.on('message', async (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString()) as
          | { type: 'setup'; careContext?: string; voiceName?: string }
          | { type: 'audio'; data: string }
          | { type: 'text'; text: string };

        if (msg.type === 'setup') {
          if (liveSession) return;
          const ai = createGeminiClient();
          const careContext = msg.careContext?.trim() || 'No care records provided yet.';
          const voiceName = msg.voiceName || 'Zephyr';

          const systemInstruction = [
            'You are CareNest, a calm, warm, practical family care voice assistant.',
            'Speak clearly in concise, reassuring sentences suitable for caregivers and older adults.',
            'Use the family care summary below to answer questions about medications, dosages, daily tasks, appointments, allergies, and emergency contacts.',
            'Never fabricate medical facts beyond the provided records; if a medical emergency is described, advise calling emergency services immediately.',
            '',
            '--- CURRENT CARE CONTEXT ---',
            careContext,
          ].join('\n');

          const session = await ai.live.connect({
            model: 'gemini-3.8-live',
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName },
                },
              },
              inputAudioTranscription: {},
              outputAudioTranscription: {},
              systemInstruction,
            },
            callbacks: {
              onopen: () => {
                // Readiness is emitted after `session` is assigned below
              },
              onmessage: (message: LiveServerMessage) => {
                if (clientWs.readyState !== WebSocket.OPEN) return;
                const content = message.serverContent;

                if (content?.inputTranscription?.text) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'input_transcript',
                      text: content.inputTranscription.text,
                    })
                  );
                }

                if (content?.outputTranscription?.text) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'output_transcript',
                      text: content.outputTranscription.text,
                    })
                  );
                }

                for (const part of content?.modelTurn?.parts ?? []) {
                  if (part.inlineData?.data) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'audio',
                        data: part.inlineData.data,
                      })
                    );
                  }
                }

                if (content?.interrupted) {
                  clientWs.send(JSON.stringify({ type: 'interrupted' }));
                }

                if (content?.turnComplete) {
                  clientWs.send(JSON.stringify({ type: 'turn_complete' }));
                }
              },
              onerror: (err: unknown) => {
                console.error('Gemini Live error:', err);
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'error',
                      message:
                        err instanceof Error ? err.message : 'Live session connection error.',
                    })
                  );
                }
              },
              onclose: (ev: { reason?: string; code?: number }) => {
                console.log('Gemini Live closed:', ev?.code, ev?.reason);
                liveSession = null;
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: 'closed' }));
                }
              },
            },
          });

          if (isClosing || clientWs.readyState !== WebSocket.OPEN) {
            try {
              session.close();
            } catch {
              // Ignore
            }
            return;
          }

          liveSession = session;
          clientWs.send(JSON.stringify({ type: 'ready' }));
          return;
        }

        if (!liveSession) return;

        if (msg.type === 'audio' && msg.data) {
          liveSession.sendRealtimeInput({
            audio: {
              data: msg.data,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        } else if (msg.type === 'text' && msg.text.trim()) {
          liveSession.sendClientContent({
            turns: [
              {
                role: 'user',
                parts: [{ text: msg.text.trim() }],
              },
            ],
            turnComplete: true,
          });
        }
      } catch (err) {
        console.error('Live WS handler error:', err);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({
              type: 'error',
              message: err instanceof Error ? err.message : 'Failed to process live session.',
            })
          );
        }
      }
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`CareNest server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
