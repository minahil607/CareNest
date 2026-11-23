import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { Calendar, HeartHandshake, Mic, Pill } from 'lucide-react';
import { auth, googleProvider } from '../firebase';

export function SignInView() {
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Unable to sign in with Google right now.';
      setAuthError(msg);
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6FAF7] flex flex-col justify-center px-6 py-12">
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-6">
          <p className="text-sm font-semibold text-[#1F7A53]">Family Care & Reminder Companion</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#14221B] leading-tight">
            Coordinate daily care for the people you love.
          </h1>
          <p className="text-base text-[#4A5F53] leading-relaxed max-w-xl">
            Manage daily medications, care checklists, upcoming doctor visits, emergency contacts, and real-time voice conversations in one calm workspace synced securely to your account.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-white border border-[#DCE6DF] rounded-2xl p-4 space-y-1.5">
              <Pill className="w-5 h-5 text-[#1F7A53]" />
              <h2 className="text-sm font-semibold text-[#14221B]">Medication Reminders</h2>
              <p className="text-sm text-[#4A5F53]">
                Track dosages, daily adherence, and schedules across devices.
              </p>
            </div>
            <div className="bg-white border border-[#DCE6DF] rounded-2xl p-4 space-y-1.5">
              <Mic className="w-5 h-5 text-[#1F7A53]" />
              <h2 className="text-sm font-semibold text-[#14221B]">Live Voice Conversations</h2>
              <p className="text-sm text-[#4A5F53]">
                Ask hands-free questions about medicines, allergies, and visits.
              </p>
            </div>
            <div className="bg-white border border-[#DCE6DF] rounded-2xl p-4 space-y-1.5">
              <Calendar className="w-5 h-5 text-[#1F7A53]" />
              <h2 className="text-sm font-semibold text-[#14221B]">Tasks & Appointments</h2>
              <p className="text-sm text-[#4A5F53]">
                Keep blood pressure checks, walks, and clinic visits organized.
              </p>
            </div>
            <div className="bg-white border border-[#DCE6DF] rounded-2xl p-4 space-y-1.5">
              <HeartHandshake className="w-5 h-5 text-[#1F7A53]" />
              <h2 className="text-sm font-semibold text-[#14221B]">Family & Emergency Info</h2>
              <p className="text-sm text-[#4A5F53]">
                Instant access to allergies, care notes, and one-tap calling.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white border border-[#DCE6DF] rounded-3xl p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#14221B]">Sign in to CareNest</h2>
              <p className="text-sm text-[#4A5F53] leading-relaxed">
                Use your Google account to securely save medications, tasks, appointments, and family notes.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-[#FDECEC] border border-[#F5C2C2] text-xs text-[#7D1A1A]">
                {authError}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#1F7A53] text-white font-semibold text-sm flex items-center justify-center gap-3 hover:bg-[#176040] disabled:opacity-60 transition-colors"
            >
              <span>{signingIn ? 'Signing in...' : 'Continue with Google'}</span>
            </button>

            <p className="text-xs text-[#4A5F53] leading-relaxed">
              Your care records are stored privately under your signed-in account in Cloud Firestore.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
