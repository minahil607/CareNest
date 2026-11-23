import React, { useState } from 'react';
import { Mic, MicOff, PhoneOff, Send, Volume2, X } from 'lucide-react';
import type { VoiceStatus, VoiceTranscriptItem } from '../hooks/useLiveVoice';

interface VoiceCompanionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  status: VoiceStatus;
  errorMessage: string | null;
  micNotice: string | null;
  hasMic: boolean;
  isMuted: boolean;
  isAssistantSpeaking: boolean;
  transcripts: VoiceTranscriptItem[];
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleMute: () => void;
  onSendText: (text: string) => void;
  onClearTranscripts: () => void;
}

const QUICK_PROMPTS = [
  'What medicines are due today?',
  'Read allergies and care notes',
  'When is the next doctor visit?',
];

export function VoiceCompanionDrawer({
  isOpen,
  onClose,
  status,
  errorMessage,
  micNotice,
  hasMic,
  isMuted,
  isAssistantSpeaking,
  transcripts,
  onConnect,
  onDisconnect,
  onToggleMute,
  onSendText,
  onClearTranscripts,
}: VoiceCompanionDrawerProps) {
  const [textInput, setTextInput] = useState('');

  if (!isOpen) return null;

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !isConnected) return;
    onSendText(textInput);
    setTextInput('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="CareNest Live Voice Assistant"
    >
      <div className="w-full max-w-md bg-white h-full flex flex-col border-l border-[#DCE6DF]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DCE6DF]">
          <div>
            <h2 className="text-lg font-bold text-[#14221B]">CareNest Voice</h2>
            <p className="text-xs text-[#4A5F53]">
              {isConnected
                ? isAssistantSpeaking
                  ? 'Speaking response'
                  : !hasMic
                    ? 'Connected · Text & spoken reply mode'
                    : isMuted
                      ? 'Connected · Microphone muted'
                      : 'Listening live'
                : isConnecting
                  ? 'Connecting voice session...'
                  : 'Real-time voice conversations'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close voice assistant"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4A5F53] hover:bg-[#EDF4EF] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 border-b border-[#DCE6DF] bg-[#F6FAF7] space-y-4">
          <div className="flex items-center gap-3">
            {!isConnected ? (
              <button
                type="button"
                onClick={onConnect}
                disabled={isConnecting}
                className="flex-1 min-h-[48px] px-5 py-3 rounded-xl bg-[#1F7A53] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#176040] disabled:opacity-60 transition-colors whitespace-nowrap"
              >
                <Mic className="w-4 h-4" />
                <span>{isConnecting ? 'Connecting...' : 'Start Voice Conversation'}</span>
              </button>
            ) : (
              <>
                {hasMic && (
                  <button
                    type="button"
                    onClick={onToggleMute}
                    className={`flex-1 min-h-[48px] px-4 py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                      isMuted
                        ? 'bg-[#FFF4D6] border-[#E7C973] text-[#7A5901]'
                        : 'bg-white border-[#DCE6DF] text-[#14221B] hover:bg-[#EDF4EF]'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#1F7A53]" />}
                    <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onDisconnect}
                  className={`${hasMic ? '' : 'flex-1 '}min-h-[48px] px-4 py-3 rounded-xl bg-[#C62828] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#A61E1E] transition-colors whitespace-nowrap`}
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>{hasMic ? 'End' : 'End Voice Session'}</span>
                </button>
              </>
            )}
          </div>

          {isConnected && (
            <div className="flex items-center justify-between text-xs text-[#4A5F53]">
              <span className="flex items-center gap-2">
                {isAssistantSpeaking ? (
                  <Volume2 className="w-4 h-4 text-[#1F7A53]" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#1F7A53] animate-pulse" />
                )}
                <span>
                  {isAssistantSpeaking
                    ? 'CareNest is speaking — speak anytime to interrupt'
                    : hasMic
                      ? 'Speak naturally about medications, tasks, or visits'
                      : 'Ask a question below to hear CareNest respond'}
                </span>
              </span>
            </div>
          )}

          {micNotice && (
            <div className="p-3 rounded-xl bg-[#FFF4D6] border border-[#E7C973] text-xs text-[#7A5901]">
              {micNotice}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-[#FDECEC] border border-[#F5C2C2] text-xs text-[#7D1A1A]">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {transcripts.length === 0 ? (
            <div className="space-y-4 py-4">
              <p className="text-sm text-[#4A5F53] leading-relaxed">
                Start a live voice conversation to ask about today’s medication schedule, care notes, allergies, or upcoming appointments.
              </p>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#4A5F53]">Example questions</p>
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={!isConnected}
                    onClick={() => onSendText(prompt)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-[#DCE6DF] bg-[#F6FAF7] text-sm text-[#14221B] hover:bg-[#EDF4EF] disabled:opacity-60 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClearTranscripts}
                  className="text-xs font-medium text-[#4A5F53] hover:text-[#14221B] underline"
                >
                  Clear conversation
                </button>
              </div>
              {transcripts.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col ${
                    item.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <span className="text-[11px] font-medium text-[#4A5F53] mb-1">
                    {item.role === 'user' ? 'You' : 'CareNest'}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      item.role === 'user'
                        ? 'bg-[#1F7A53] text-white'
                        : 'bg-[#F6FAF7] border border-[#DCE6DF] text-[#14221B]'
                    }`}
                  >
                    {item.text}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <form
          onSubmit={handleSubmitText}
          className="p-4 border-t border-[#DCE6DF] flex items-center gap-2 bg-white"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={!isConnected}
            placeholder={
              isConnected ? 'Type a quick note or question...' : 'Start voice session to chat'
            }
            className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] bg-[#F6FAF7] text-sm text-[#14221B] focus:outline-none focus:border-[#1F7A53] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!isConnected || !textInput.trim()}
            aria-label="Send message"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[#1F7A53] text-white hover:bg-[#176040] disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
