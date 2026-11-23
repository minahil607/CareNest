import React from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  Mic,
  Plus,
} from 'lucide-react';
import type { Appointment, CareProfile, CareTab, CareTask, Medication } from '../types/care';
import { getTodayDayKey } from '../services/careFirestore';
import { formatDateISO, formatFullTodayDate, formatTime, greetingForNow } from '../utils/formatters';

interface HomeViewProps {
  profile: CareProfile | null;
  medications: Medication[];
  tasks: CareTask[];
  appointments: Appointment[];
  onToggleMedicationTaken: (med: Medication) => void;
  onToggleTaskCompleted: (task: CareTask) => void;
  onOpenAddMedication: () => void;
  onOpenAddTask: () => void;
  onOpenAddAppointment: () => void;
  onOpenVoice: () => void;
  onNavigateTab: (tab: CareTab) => void;
}

export function HomeView({
  profile,
  medications,
  tasks,
  appointments,
  onToggleMedicationTaken,
  onToggleTaskCompleted,
  onOpenAddMedication,
  onOpenAddTask,
  onOpenAddAppointment,
  onOpenVoice,
  onNavigateTab,
}: HomeViewProps) {
  const today = getTodayDayKey();
  const medsTakenCount = medications.filter((m) => m.lastTakenDay === today).length;
  const tasksDoneCount = tasks.filter((t) => t.lastCompletedDay === today).length;

  const sortedMeds = [...medications].sort(
    (a, b) => a.timeHour * 60 + a.timeMinute - (b.timeHour * 60 + b.timeMinute)
  );
  const sortedTasks = [...tasks].sort(
    (a, b) => a.dueHour * 60 + a.dueMinute - (b.dueHour * 60 + b.dueMinute)
  );

  const nextAppointment = [...appointments]
    .filter((a) => !a.isCompleted && a.dateISO >= today)
    .sort((a, b) => {
      if (a.dateISO !== b.dateISO) return a.dateISO.localeCompare(b.dateISO);
      return a.timeHour * 60 + a.timeMinute - (b.timeHour * 60 + b.timeMinute);
    })[0];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-[#DCE6DF] rounded-2xl p-6 flex flex-col justify-between gap-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#1F7A53]">{formatFullTodayDate()}</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#14221B]">
              {greetingForNow()}!
            </h1>
            <p className="text-base text-[#4A5F53]">
              Caring for {profile?.recipientName || 'your loved one'}
              {profile?.primaryDoctor ? ` · Primary Doctor: ${profile.primaryDoctor}` : ''}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#EDF4EF]">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-[#1F7A53] tabular-nums">
                {medsTakenCount} / {medications.length}
              </p>
              <p className="text-xs sm:text-sm text-[#4A5F53]">Medicines taken today</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-[#1F7A53] tabular-nums">
                {tasksDoneCount} / {tasks.length}
              </p>
              <p className="text-xs sm:text-sm text-[#4A5F53]">Daily tasks completed</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#E7F4EC] border border-[#CBE4D4] rounded-2xl p-6 flex flex-col justify-between gap-5">
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-[#0E3B26]">Live Voice Care Companion</h2>
            <p className="text-sm text-[#29533E] leading-relaxed">
              Ask hands-free questions about today’s medicines, dosages, allergies, or upcoming clinic visits.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onOpenVoice}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1F7A53] text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#176040] transition-colors whitespace-nowrap shrink-0"
            >
              <Mic className="w-4 h-4" />
              <span>Start Voice Chat</span>
            </button>
          </div>
        </div>
      </div>

      <section aria-label="Quick actions" className="space-y-3">
        <h2 className="text-base font-semibold text-[#14221B]">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={onOpenAddMedication}
            className="min-h-[48px] px-4 py-3 rounded-2xl bg-white border border-[#DCE6DF] text-sm font-semibold text-[#14221B] flex items-center justify-center gap-2 hover:bg-[#EDF4EF] transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-[#1F7A53]" />
            <span>Add Medicine</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddTask}
            className="min-h-[48px] px-4 py-3 rounded-2xl bg-white border border-[#DCE6DF] text-sm font-semibold text-[#14221B] flex items-center justify-center gap-2 hover:bg-[#EDF4EF] transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-[#1F7A53]" />
            <span>Add Task</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddAppointment}
            className="min-h-[48px] px-4 py-3 rounded-2xl bg-white border border-[#DCE6DF] text-sm font-semibold text-[#14221B] flex items-center justify-center gap-2 hover:bg-[#EDF4EF] transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-[#1F7A53]" />
            <span>Add Appointment</span>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#14221B]">Today’s Medications</h2>
              <p className="text-xs text-[#4A5F53] tabular-nums">
                {medsTakenCount} of {medications.length} taken
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('medications')}
              className="min-h-[44px] px-3 text-sm font-semibold text-[#1F7A53] hover:underline whitespace-nowrap"
            >
              View All
            </button>
          </div>

          {sortedMeds.length === 0 ? (
            <div className="bg-white border border-[#DCE6DF] rounded-2xl p-6 text-sm text-[#4A5F53]">
              No medications scheduled yet. Tap Add Medicine above to create a reminder.
            </div>
          ) : (
            <div className="bg-white border border-[#DCE6DF] rounded-2xl divide-y divide-[#EDF4EF]">
              {sortedMeds.map((med) => {
                const isTaken = med.lastTakenDay === today;
                return (
                  <div
                    key={med.id}
                    className="p-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-base font-semibold text-[#14221B] truncate">{med.name}</p>
                      <p className="text-xs text-[#4A5F53] tabular-nums">
                        {formatTime(med.timeHour, med.timeMinute)} · {med.dosage}
                        {isTaken && med.lastTakenTimeLabel
                          ? ` · Taken ${med.lastTakenTimeLabel}`
                          : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleMedicationTaken(med)}
                      className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                        isTaken
                          ? 'bg-[#E7F4EC] text-[#145639] hover:bg-[#D5ECDE]'
                          : 'bg-[#1F7A53] text-white hover:bg-[#176040]'
                      }`}
                    >
                      {isTaken && <CheckCircle2 className="w-4 h-4" />}
                      <span>{isTaken ? 'Taken' : 'Mark Taken'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#14221B]">Today’s Care Tasks</h2>
              <p className="text-xs text-[#4A5F53] tabular-nums">
                {tasksDoneCount} of {tasks.length} completed
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('tasks')}
              className="min-h-[44px] px-3 text-sm font-semibold text-[#1F7A53] hover:underline whitespace-nowrap"
            >
              View All
            </button>
          </div>

          {sortedTasks.length === 0 ? (
            <div className="bg-white border border-[#DCE6DF] rounded-2xl p-6 text-sm text-[#4A5F53]">
              No daily care tasks yet. Tap Add Task above to set up daily routines.
            </div>
          ) : (
            <div className="bg-white border border-[#DCE6DF] rounded-2xl divide-y divide-[#EDF4EF]">
              {sortedTasks.map((task) => {
                const isDone = task.lastCompletedDay === today;
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onToggleTaskCompleted(task)}
                    className="w-full p-4 flex items-center gap-3.5 text-left hover:bg-[#F6FAF7] transition-colors"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-6 h-6 text-[#1F7A53] shrink-0" />
                    ) : (
                      <Circle className="w-6 h-6 text-[#7A9185] shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-base font-medium truncate ${
                          isDone ? 'line-through text-[#4A5F53]' : 'text-[#14221B]'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-xs text-[#4A5F53] tabular-nums">
                        Due {formatTime(task.dueHour, task.dueMinute)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#14221B]">Upcoming Appointment</h2>
          <button
            type="button"
            onClick={() => onNavigateTab('tasks')}
            className="min-h-[44px] px-3 text-sm font-semibold text-[#1F7A53] hover:underline whitespace-nowrap"
          >
            Manage Visits
          </button>
        </div>

        {!nextAppointment ? (
          <div className="bg-white border border-[#DCE6DF] rounded-2xl p-6 flex items-center justify-between gap-4">
            <p className="text-sm text-[#4A5F53]">No upcoming doctor appointments scheduled.</p>
            <button
              type="button"
              onClick={onOpenAddAppointment}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1F7A53] text-white text-sm font-semibold hover:bg-[#176040] whitespace-nowrap"
            >
              Add Appointment
            </button>
          </div>
        ) : (
          <div className="bg-white border border-[#DCE6DF] rounded-2xl p-6 space-y-2.5">
            <div className="text-xs font-medium text-[#1F7A53] tabular-nums">
              {formatDateISO(nextAppointment.dateISO)} · {nextAppointment.specialty}
            </div>
            <h3 className="text-xl font-bold text-[#14221B]">{nextAppointment.doctorName}</h3>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#4A5F53]">
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <Clock className="w-4 h-4 text-[#1F7A53]" />
                {formatTime(nextAppointment.timeHour, nextAppointment.timeMinute)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#1F7A53]" />
                {nextAppointment.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#1F7A53]" />
                {nextAppointment.dateISO}
              </span>
            </div>
            {nextAppointment.notes && (
              <p className="text-sm text-[#4A5F53] pt-1">{nextAppointment.notes}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
