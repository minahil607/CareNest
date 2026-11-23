import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import type { Appointment, CareTask } from '../types/care';
import { getTodayDayKey } from '../services/careFirestore';
import { formatDateISO, formatTime } from '../utils/formatters';

interface TasksAppointmentsViewProps {
  tasks: CareTask[];
  appointments: Appointment[];
  onAddTask: () => void;
  onEditTask: (task: CareTask) => void;
  onDeleteTask: (task: CareTask) => void;
  onToggleTask: (task: CareTask) => void;
  onAddAppointment: () => void;
  onEditAppointment: (appt: Appointment) => void;
  onDeleteAppointment: (appt: Appointment) => void;
  onToggleAppointment: (appt: Appointment) => void;
}

type FilterMode = 'all' | 'tasks' | 'appointments';

export function TasksAppointmentsView({
  tasks,
  appointments,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleTask,
  onAddAppointment,
  onEditAppointment,
  onDeleteAppointment,
  onToggleAppointment,
}: TasksAppointmentsViewProps) {
  const [filter, setFilter] = useState<FilterMode>('all');
  const today = getTodayDayKey();

  const sortedTasks = [...tasks].sort(
    (a, b) => a.dueHour * 60 + a.dueMinute - (b.dueHour * 60 + b.dueMinute)
  );

  const sortedAppointments = [...appointments].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    if (a.dateISO !== b.dateISO) return a.dateISO.localeCompare(b.dateISO);
    return a.timeHour * 60 + a.timeMinute - (b.timeHour * 60 + b.timeMinute);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#14221B]">
            Tasks & Appointments
          </h1>
          <p className="text-sm text-[#4A5F53]">
            Daily care routine checklist and upcoming doctor visits
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onAddTask}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1F7A53] text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#176040] whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
          <button
            type="button"
            onClick={onAddAppointment}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-[#DCE6DF] text-[#14221B] text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#EDF4EF] whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-[#1F7A53]" />
            <span>Add Visit</span>
          </button>
        </div>
      </div>

      <div className="inline-flex items-center gap-1 p-1 bg-[#EDF4EF] rounded-xl">
        {(
          [
            ['all', 'All'],
            ['tasks', 'Daily Tasks'],
            ['appointments', 'Appointments'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`min-h-[40px] px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              filter === key
                ? 'bg-white text-[#14221B] shadow-xs'
                : 'text-[#4A5F53] hover:text-[#14221B]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {(filter === 'all' || filter === 'tasks') && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#14221B]">Daily Care Checklist</h2>
          {sortedTasks.length === 0 ? (
            <div className="bg-white border border-[#DCE6DF] rounded-2xl p-6 text-sm text-[#4A5F53]">
              No daily care tasks yet.
            </div>
          ) : (
            <div className="bg-white border border-[#DCE6DF] rounded-2xl divide-y divide-[#EDF4EF]">
              {sortedTasks.map((task) => {
                const isDone = task.lastCompletedDay === today;
                return (
                  <div
                    key={task.id}
                    className="p-4 flex items-start justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleTask(task)}
                      className="flex items-start gap-3.5 text-left flex-1 min-w-0"
                    >
                      <span className="mt-0.5 shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="w-6 h-6 text-[#1F7A53]" />
                        ) : (
                          <Circle className="w-6 h-6 text-[#7A9185]" />
                        )}
                      </span>
                      <div className="space-y-1 min-w-0">
                        <p
                          className={`text-base font-semibold ${
                            isDone ? 'line-through text-[#4A5F53]' : 'text-[#14221B]'
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.details && (
                          <p className="text-sm text-[#4A5F53]">{task.details}</p>
                        )}
                        <p className="text-xs text-[#1F7A53] font-medium tabular-nums">
                          Due {formatTime(task.dueHour, task.dueMinute)}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditTask(task)}
                        aria-label={`Edit ${task.title}`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4A5F53] hover:bg-[#EDF4EF]"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTask(task)}
                        aria-label={`Delete ${task.title}`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#C62828] hover:bg-[#FDECEC]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {(filter === 'all' || filter === 'appointments') && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#14221B]">Doctor Appointments</h2>
          {sortedAppointments.length === 0 ? (
            <div className="bg-white border border-[#DCE6DF] rounded-2xl p-6 text-sm text-[#4A5F53]">
              No doctor appointments scheduled.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 ${
                    appt.isCompleted
                      ? 'bg-[#F0F7F3] border-[#CBE4D4]'
                      : 'bg-white border-[#DCE6DF]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-semibold text-[#1F7A53] tabular-nums">
                          {formatDateISO(appt.dateISO)} · {appt.specialty}
                        </p>
                        <h3
                          className={`text-xl font-bold truncate ${
                            appt.isCompleted
                              ? 'line-through text-[#4A5F53]'
                              : 'text-[#14221B]'
                          }`}
                        >
                          {appt.doctorName}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onEditAppointment(appt)}
                          aria-label={`Edit ${appt.doctorName}`}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4A5F53] hover:bg-[#EDF4EF]"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteAppointment(appt)}
                          aria-label={`Delete ${appt.doctorName}`}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#C62828] hover:bg-[#FDECEC]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm text-[#4A5F53]">
                      <p className="flex items-center gap-2 tabular-nums">
                        <Clock className="w-4 h-4 text-[#1F7A53] shrink-0" />
                        <span>{formatTime(appt.timeHour, appt.timeMinute)}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#1F7A53] shrink-0" />
                        <span>{appt.location}</span>
                      </p>
                      <p className="flex items-center gap-2 tabular-nums">
                        <Calendar className="w-4 h-4 text-[#1F7A53] shrink-0" />
                        <span>{appt.dateISO}</span>
                      </p>
                    </div>
                    {appt.notes && (
                      <p className="text-sm text-[#4A5F53] pt-1">{appt.notes}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#E4EEE8]">
                    <button
                      type="button"
                      onClick={() => onToggleAppointment(appt)}
                      className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                        appt.isCompleted
                          ? 'bg-[#DDF3E7] text-[#0D3B26] hover:bg-[#CCEAD9]'
                          : 'bg-white border border-[#DCE6DF] text-[#14221B] hover:bg-[#EDF4EF]'
                      }`}
                    >
                      {appt.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                      <span>{appt.isCompleted ? 'Visit Completed' : 'Mark Visit Completed'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
