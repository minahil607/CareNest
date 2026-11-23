import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface VoiceTranscriptItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

function downsampleBuffer(
  buffer: Float32Array,
  inputSampleRate: number,
  targetSampleRate = 16000
): Float32Array {
  if (inputSampleRate === targetSampleRate) {
    return buffer;
  }
  const ratio = inputSampleRate / targetSampleRate;
  const newLength = Math.max(1, Math.round(buffer.length / ratio));
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.min(buffer.length, Math.round((offsetResult + 1) * ratio));
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : buffer[Math.min(offsetBuffer, buffer.length - 1)] || 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

function float32ToBase64Pcm16(float32Array: Float32Array): string {
  const int16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

function base64Pcm16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768;
  }
  return float32;
}

function createOutputAudioContext(): AudioContext {
  try {
    return new AudioContext({ sampleRate: 24000 });
  } catch {
    return new AudioContext();
  }
}

export function useLiveVoice() {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const [hasMic, setHasMic] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [transcripts, setTranscripts] = useState<VoiceTranscriptItem[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isMutedRef = useRef<boolean>(false);

  const stopPlayback = useCallback(() => {
    for (const source of activeSourcesRef.current) {
      try {
        source.stop();
      } catch {
        // Ignore already stopped source
      }
    }
    activeSourcesRef.current.clear();
    if (outputCtxRef.current) {
      nextStartTimeRef.current = outputCtxRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
    setIsAssistantSpeaking(false);
  }, []);

  const disconnect = useCallback(() => {
    stopPlayback();

    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      try {
        processorRef.current.disconnect();
      } catch {
        // Ignore
      }
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (inputCtxRef.current) {
      void inputCtxRef.current.close().catch(() => undefined);
      inputCtxRef.current = null;
    }

    if (outputCtxRef.current) {
      void outputCtxRef.current.close().catch(() => undefined);
      outputCtxRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // Ignore
      }
      wsRef.current = null;
    }

    setStatus('idle');
    setHasMic(false);
    setMicNotice(null);
    setIsMuted(false);
    isMutedRef.current = false;
  }, [stopPlayback]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const appendTranscript = useCallback((role: 'user' | 'assistant', chunk: string) => {
    const cleaned = chunk;
    if (!cleaned) return;
    setTranscripts((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role) {
        return [
          ...prev.slice(0, -1),
          { ...last, text: `${last.text}${cleaned}` },
        ];
      }
      return [
        ...prev,
        { id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, role, text: cleaned },
      ];
    });
  }, []);

  const playAudioChunk = useCallback((base64Data: string) => {
    const ctx = outputCtxRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const floatSamples = base64Pcm16ToFloat32(base64Data);
    const buffer = ctx.createBuffer(1, floatSamples.length, 24000);
    buffer.getChannelData(0).set(floatSamples);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    if (nextStartTimeRef.current < now) {
      nextStartTimeRef.current = now + 0.02;
    }

    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;
    activeSourcesRef.current.add(source);
    setIsAssistantSpeaking(true);

    source.onended = () => {
      activeSourcesRef.current.delete(source);
      if (activeSourcesRef.current.size === 0) {
        setIsAssistantSpeaking(false);
      }
    };
  }, []);

  const connect = useCallback(
    async (careContext: string) => {
      if (status === 'connecting' || status === 'connected') return;
      setErrorMessage(null);
      setMicNotice(null);
      setStatus('connecting');

      try {
        const outputCtx = createOutputAudioContext();
        if (outputCtx.state === 'suspended') {
          await outputCtx.resume();
        }
        outputCtxRef.current = outputCtx;
        nextStartTimeRef.current = outputCtx.currentTime;

        let stream: MediaStream | null = null;
        let inputCtx: AudioContext | null = null;

        if (navigator.mediaDevices?.getUserMedia) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            inputCtx = new AudioContext();
            if (inputCtx.state === 'suspended') {
              await inputCtx.resume();
            }
            inputCtxRef.current = inputCtx;
            setHasMic(true);
          } catch {
            setHasMic(false);
            setMicNotice(
              'Microphone unavailable or permission denied. You can still type questions or tap prompts below for spoken replies.'
            );
          }
        } else {
          setHasMic(false);
          setMicNotice(
            'Microphone is not supported in this browser view. Type questions or tap prompts below for spoken replies.'
          );
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/live`);
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'setup', careContext, voiceName: 'Zephyr' }));
        };

        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data as string) as
            | { type: 'ready' }
            | { type: 'audio'; data: string }
            | { type: 'input_transcript'; text: string }
            | { type: 'output_transcript'; text: string }
            | { type: 'interrupted' }
            | { type: 'turn_complete' }
            | { type: 'error'; message: string }
            | { type: 'closed' };

          if (msg.type === 'ready') {
            setStatus('connected');
            if (stream && inputCtx) {
              const source = inputCtx.createMediaStreamSource(stream);
              const processor = inputCtx.createScriptProcessor(4096, 1, 1);
              processorRef.current = processor;

              processor.onaudioprocess = (e) => {
                if (isMutedRef.current) return;
                if (wsRef.current?.readyState !== WebSocket.OPEN) return;
                const rawChannel = e.inputBuffer.getChannelData(0);
                const pcm16k = downsampleBuffer(rawChannel, inputCtx.sampleRate, 16000);
                const base64 = float32ToBase64Pcm16(pcm16k);
                wsRef.current.send(JSON.stringify({ type: 'audio', data: base64 }));
              };

              source.connect(processor);
              processor.connect(inputCtx.destination);
            }
          } else if (msg.type === 'audio' && msg.data) {
            playAudioChunk(msg.data);
          } else if (msg.type === 'input_transcript' && msg.text) {
            appendTranscript('user', msg.text);
          } else if (msg.type === 'output_transcript' && msg.text) {
            appendTranscript('assistant', msg.text);
          } else if (msg.type === 'interrupted') {
            stopPlayback();
          } else if (msg.type === 'error') {
            setErrorMessage(msg.message);
            setStatus('error');
          } else if (msg.type === 'closed') {
            disconnect();
          }
        };

        ws.onerror = () => {
          setErrorMessage('Unable to connect to the CareNest voice service.');
          setStatus('error');
        };

        ws.onclose = () => {
          if (wsRef.current === ws) {
            disconnect();
          }
        };
      } catch (err) {
        disconnect();
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Unable to initialize audio playback for the live voice session.'
        );
        setStatus('error');
      }
    },
    [appendTranscript, disconnect, playAudioChunk, status, stopPlayback]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      return next;
    });
  }, []);

  const sendTextPrompt = useCallback((text: string) => {
    if (!text.trim() || wsRef.current?.readyState !== WebSocket.OPEN) return;
    if (outputCtxRef.current?.state === 'suspended') {
      void outputCtxRef.current.resume();
    }
    setTranscripts((prev) => [
      ...prev,
      { id: `${Date.now()}_u`, role: 'user', text: text.trim() },
    ]);
    wsRef.current.send(JSON.stringify({ type: 'text', text: text.trim() }));
  }, []);

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
  }, []);

  return {
    status,
    errorMessage,
    micNotice,
    hasMic,
    isMuted,
    isAssistantSpeaking,
    transcripts,
    connect,
    disconnect,
    toggleMute,
    sendTextPrompt,
    clearTranscripts,
  };
}
