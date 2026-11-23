import type {
  Appointment,
  CareProfile,
  CareTask,
  CareUpdate,
  EmergencyContact,
  FamilyMember,
  Medication,
} from '../types/care';
import { getTodayDayKey } from '../services/careFirestore';

export function formatTime(hour: number, minute: number): string {
  const safeHour = ((hour % 24) + 24) % 24;
  const safeMin = Math.max(0, Math.min(59, minute));
  const suffix = safeHour >= 12 ? 'PM' : 'AM';
  const h12 = safeHour % 12 === 0 ? 12 : safeHour % 12;
  return `${h12}:${String(safeMin).padStart(2, '0')} ${suffix}`;
}

export function formatFullTodayDate(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatDateISO(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  if (!y || !m || !d) return dateISO;
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((target.getTime() - todayMidnight.getTime()) / 86_400_000);
  const shortLabel = target.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  if (diffDays === 0) return `Today · ${shortLabel}`;
  if (diffDays === 1) return `Tomorrow · ${shortLabel}`;
  if (diffDays > 1 && diffDays <= 6) return `In ${diffDays} days · ${shortLabel}`;
  return shortLabel;
}

export function buildCareContextSummary(params: {
  profile: CareProfile | null;
  medications: Medication[];
  tasks: CareTask[];
  appointments: Appointment[];
  emergencyContacts: EmergencyContact[];
  familyMembers: FamilyMember[];
  careUpdates: CareUpdate[];
}): string {
  const today = getTodayDayKey();
  const {
    profile,
    medications,
    tasks,
    appointments,
    emergencyContacts,
    familyMembers,
    careUpdates,
  } = params;

  const lines: string[] = [];
  if (profile) {
    lines.push(
      `Care Recipient: ${profile.recipientName}, Age ${profile.age}, Blood Type ${profile.bloodType}, Primary Doctor: ${profile.primaryDoctor}.`,
      `Allergies: ${profile.allergies || 'None recorded'}.`,
      `Care Notes: ${profile.careNotes || 'None'}.`
    );
  }

  lines.push('', 'Medications:');
  medications.forEach((m) => {
    const status = m.lastTakenDay === today ? `Taken at ${m.lastTakenTimeLabel || 'today'}` : 'Due today';
    lines.push(
      `- ${m.name} (${m.dosage}) at ${formatTime(m.timeHour, m.timeMinute)} — ${status}. ${m.instructions}`
    );
  });

  lines.push('', 'Daily Tasks:');
  tasks.forEach((t) => {
    const status = t.lastCompletedDay === today ? 'Completed' : 'Pending';
    lines.push(`- ${t.title} due ${formatTime(t.dueHour, t.dueMinute)} — ${status}. ${t.details}`);
  });

  lines.push('', 'Appointments:');
  appointments.forEach((a) => {
    const status = a.isCompleted ? 'Completed' : 'Upcoming';
    lines.push(
      `- ${a.doctorName} (${a.specialty}) on ${a.dateISO} at ${formatTime(a.timeHour, a.timeMinute)} at ${a.location} [${status}]. Notes: ${a.notes}`
    );
  });

  lines.push('', 'Emergency Contacts:');
  emergencyContacts.forEach((c) => {
    lines.push(`- ${c.name} (${c.relationship}): ${c.phoneNumber}`);
  });

  lines.push('', 'Family Care Circle:');
  familyMembers.forEach((f) => {
    lines.push(`- ${f.name} (${f.relationship}): ${f.role}`);
  });

  if (careUpdates.length > 0) {
    lines.push('', 'Recent Care Updates:');
    careUpdates.slice(0, 5).forEach((u) => {
      lines.push(`- ${u.authorName}: ${u.message}`);
    });
  }

  return lines.join('\n');
}
