import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { CheckSquare, Home, Mic, Pill, Users } from 'lucide-react';
import { auth } from './firebase';
import {
  addCareUpdate,
  deleteOwnedDoc,
  ensureUserAndSeedData,
  saveAppointment,
  saveCareProfile,
  saveCareTask,
  saveEmergencyContact,
  saveFamilyMember,
  saveMedication,
  subscribeOwnedCollection,
  subscribeProfile,
  toggleAppointmentCompleted,
  toggleCareTaskCompleted,
  toggleMedicationReminder,
  toggleMedicationTaken,
} from './services/careFirestore';
import type {
  AdherenceLog,
  Appointment,
  CareProfile,
  CareTab,
  CareTask,
  CareUpdate,
  EmergencyContact,
  FamilyMember,
  Medication,
} from './types/care';
import { buildCareContextSummary } from './utils/formatters';
import { useLiveVoice } from './hooks/useLiveVoice';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SignInView } from './components/SignInView';
import { HomeView } from './components/HomeView';
import { MedicationsView } from './components/MedicationsView';
import { TasksAppointmentsView } from './components/TasksAppointmentsView';
import { FamilyCareView } from './components/FamilyCareView';
import { VoiceCompanionDrawer } from './components/VoiceCompanionDrawer';
import {
  AppointmentModal,
  EmergencyContactModal,
  FamilyMemberModal,
  MedicationModal,
  ProfileModal,
  TaskModal,
} from './components/CareFormsModal';

function CareCircleWorkspace() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<CareTab>('home');
  const [profile, setProfile] = useState<CareProfile | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [adherenceLogs, setAdherenceLogs] = useState<AdherenceLog[]>([]);
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [careUpdates, setCareUpdates] = useState<CareUpdate[]>([]);

  const [showVoiceDrawer, setShowVoiceDrawer] = useState(false);
  const [medModal, setMedModal] = useState<{ open: boolean; item?: Medication | null }>({
    open: false,
  });
  const [taskModal, setTaskModal] = useState<{ open: boolean; item?: CareTask | null }>({
    open: false,
  });
  const [apptModal, setApptModal] = useState<{ open: boolean; item?: Appointment | null }>({
    open: false,
  });
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [contactModal, setContactModal] = useState<{
    open: boolean;
    item?: EmergencyContact | null;
  }>({ open: false });
  const [memberModal, setMemberModal] = useState<{
    open: boolean;
    item?: FamilyMember | null;
  }>({ open: false });

  const liveVoice = useLiveVoice();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setMedications([]);
      setAdherenceLogs([]);
      setTasks([]);
      setAppointments([]);
      setEmergencyContacts([]);
      setFamilyMembers([]);
      setCareUpdates([]);
      return;
    }

    let cancelled = false;
    const unsubs: Array<() => void> = [];
    setDataLoading(true);

    ensureUserAndSeedData(user)
      .then(() => {
        if (cancelled) return;
        unsubs.push(
          subscribeProfile(user.uid, (p) => {
            setProfile(p);
            setDataLoading(false);
          }),
          subscribeOwnedCollection<Medication>(user.uid, 'medications', setMedications),
          subscribeOwnedCollection<AdherenceLog>(user.uid, 'adherenceLogs', setAdherenceLogs),
          subscribeOwnedCollection<CareTask>(user.uid, 'tasks', setTasks),
          subscribeOwnedCollection<Appointment>(user.uid, 'appointments', setAppointments),
          subscribeOwnedCollection<EmergencyContact>(
            user.uid,
            'emergencyContacts',
            setEmergencyContacts
          ),
          subscribeOwnedCollection<FamilyMember>(user.uid, 'familyMembers', setFamilyMembers),
          subscribeOwnedCollection<CareUpdate>(user.uid, 'careUpdates', setCareUpdates)
        );
      })
      .catch((err) => {
        console.error(err);
        setDataLoading(false);
      });

    return () => {
      cancelled = true;
      unsubs.forEach((unsub) => unsub());
    };
  }, [user]);

  const careContext = useMemo(
    () =>
      buildCareContextSummary({
        profile,
        medications,
        tasks,
        appointments,
        emergencyContacts,
        familyMembers,
        careUpdates,
      }),
    [
      profile,
      medications,
      tasks,
      appointments,
      emergencyContacts,
      familyMembers,
      careUpdates,
    ]
  );

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F6FAF7] flex items-center justify-center p-6">
        <p className="text-sm font-medium text-[#4A5F53]">Loading CareNest...</p>
      </div>
    );
  }

  if (!user) {
    return <SignInView />;
  }

  const navItems: Array<{ id: CareTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'medications', label: 'Medications', icon: Pill },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'family', label: 'Family', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#F6FAF7] text-[#14221B] pb-20 md:pb-8">
      <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-[#DCE6DF]">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          <span className="text-lg font-bold tracking-tight text-[#14221B] whitespace-nowrap shrink-0">
            CareNest
          </span>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                    active
                      ? 'text-[#1F7A53] border-[#1F7A53] font-semibold'
                      : 'text-[#4A5F53] border-transparent hover:text-[#14221B]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setShowVoiceDrawer(true)}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#1F7A53] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#176040] transition-colors whitespace-nowrap shrink-0"
          >
            <Mic className="w-4 h-4" />
            <span>
              {liveVoice.status === 'connected' ? 'Voice Live' : 'Voice Assistant'}
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {dataLoading && medications.length === 0 && !profile ? (
          <div className="py-12 text-center text-sm text-[#4A5F53]">
            Syncing your care circle...
          </div>
        ) : activeTab === 'home' ? (
          <HomeView
            profile={profile}
            medications={medications}
            tasks={tasks}
            appointments={appointments}
            onToggleMedicationTaken={(med) => void toggleMedicationTaken(user.uid, med)}
            onToggleTaskCompleted={(task) => void toggleCareTaskCompleted(user.uid, task)}
            onOpenAddMedication={() => setMedModal({ open: true, item: null })}
            onOpenAddTask={() => setTaskModal({ open: true, item: null })}
            onOpenAddAppointment={() => setApptModal({ open: true, item: null })}
            onOpenVoice={() => setShowVoiceDrawer(true)}
            onNavigateTab={setActiveTab}
          />
        ) : activeTab === 'medications' ? (
          <MedicationsView
            medications={medications}
            adherenceLogs={adherenceLogs}
            onAdd={() => setMedModal({ open: true, item: null })}
            onEdit={(med) => setMedModal({ open: true, item: med })}
            onDelete={(med) => void deleteOwnedDoc(user.uid, 'medications', med.id)}
            onToggleTaken={(med) => void toggleMedicationTaken(user.uid, med)}
            onToggleReminder={(med) => void toggleMedicationReminder(user.uid, med)}
          />
        ) : activeTab === 'tasks' ? (
          <TasksAppointmentsView
            tasks={tasks}
            appointments={appointments}
            onAddTask={() => setTaskModal({ open: true, item: null })}
            onEditTask={(task) => setTaskModal({ open: true, item: task })}
            onDeleteTask={(task) => void deleteOwnedDoc(user.uid, 'tasks', task.id)}
            onToggleTask={(task) => void toggleCareTaskCompleted(user.uid, task)}
            onAddAppointment={() => setApptModal({ open: true, item: null })}
            onEditAppointment={(appt) => setApptModal({ open: true, item: appt })}
            onDeleteAppointment={(appt) =>
              void deleteOwnedDoc(user.uid, 'appointments', appt.id)
            }
            onToggleAppointment={(appt) => void toggleAppointmentCompleted(user.uid, appt)}
          />
        ) : (
          <FamilyCareView
            user={user}
            profile={profile}
            emergencyContacts={emergencyContacts}
            familyMembers={familyMembers}
            careUpdates={careUpdates}
            onSignOut={() => {
              liveVoice.disconnect();
              void signOut(auth);
            }}
            onEditProfile={() => setProfileModalOpen(true)}
            onAddContact={() => setContactModal({ open: true, item: null })}
            onEditContact={(c) => setContactModal({ open: true, item: c })}
            onDeleteContact={(c) =>
              void deleteOwnedDoc(user.uid, 'emergencyContacts', c.id)
            }
            onAddMember={() => setMemberModal({ open: true, item: null })}
            onEditMember={(m) => setMemberModal({ open: true, item: m })}
            onDeleteMember={(m) =>
              void deleteOwnedDoc(user.uid, 'familyMembers', m.id)
            }
            onAddCareUpdate={(author, msg) => addCareUpdate(user.uid, author, msg)}
            onDeleteCareUpdate={(u) => void deleteOwnedDoc(user.uid, 'careUpdates', u.id)}
          />
        )}
      </main>

      <nav
        aria-label="Bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-[#DCE6DF] grid grid-cols-4 items-center"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`min-h-[44px] h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium whitespace-nowrap ${
                active ? 'text-[#1F7A53] font-semibold' : 'text-[#4A5F53]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <VoiceCompanionDrawer
        isOpen={showVoiceDrawer}
        onClose={() => setShowVoiceDrawer(false)}
        status={liveVoice.status}
        errorMessage={liveVoice.errorMessage}
        micNotice={liveVoice.micNotice}
        hasMic={liveVoice.hasMic}
        isMuted={liveVoice.isMuted}
        isAssistantSpeaking={liveVoice.isAssistantSpeaking}
        transcripts={liveVoice.transcripts}
        onConnect={() => void liveVoice.connect(careContext)}
        onDisconnect={liveVoice.disconnect}
        onToggleMute={liveVoice.toggleMute}
        onSendText={liveVoice.sendTextPrompt}
        onClearTranscripts={liveVoice.clearTranscripts}
      />

      {medModal.open && (
        <MedicationModal
          existing={medModal.item}
          onClose={() => setMedModal({ open: false })}
          onSave={(data) =>
            saveMedication(
              user.uid,
              {
                ...data,
                lastTakenDay: medModal.item?.lastTakenDay ?? '',
                lastTakenTimeLabel: medModal.item?.lastTakenTimeLabel ?? '',
              },
              medModal.item?.id
            )
          }
        />
      )}

      {taskModal.open && (
        <TaskModal
          existing={taskModal.item}
          onClose={() => setTaskModal({ open: false })}
          onSave={(data) =>
            saveCareTask(
              user.uid,
              {
                ...data,
                lastCompletedDay: taskModal.item?.lastCompletedDay ?? '',
              },
              taskModal.item?.id
            )
          }
        />
      )}

      {apptModal.open && (
        <AppointmentModal
          existing={apptModal.item}
          onClose={() => setApptModal({ open: false })}
          onSave={(data) =>
            saveAppointment(
              user.uid,
              {
                ...data,
                isCompleted: apptModal.item?.isCompleted ?? false,
              },
              apptModal.item?.id
            )
          }
        />
      )}

      {profileModalOpen && profile && (
        <ProfileModal
          existing={profile}
          onClose={() => setProfileModalOpen(false)}
          onSave={(data) => saveCareProfile(user.uid, data)}
        />
      )}

      {contactModal.open && (
        <EmergencyContactModal
          existing={contactModal.item}
          onClose={() => setContactModal({ open: false })}
          onSave={(data) => saveEmergencyContact(user.uid, data, contactModal.item?.id)}
        />
      )}

      {memberModal.open && (
        <FamilyMemberModal
          existing={memberModal.item}
          onClose={() => setMemberModal({ open: false })}
          onSave={(data) => saveFamilyMember(user.uid, data, memberModal.item?.id)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <CareCircleWorkspace />
    </ErrorBoundary>
  );
}
