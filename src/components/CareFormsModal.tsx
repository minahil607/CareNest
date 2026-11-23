import React, { useState } from 'react';
import { X } from 'lucide-react';
import type {
  Appointment,
  CareProfile,
  CareTask,
  EmergencyContact,
  FamilyMember,
  Medication,
} from '../types/care';
import { getOffsetDayKey } from '../services/careFirestore';

function toTimeInputValue(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function parseTimeInputValue(val: string): { hour: number; minute: number } {
  const [h, m] = val.split(':').map(Number);
  return {
    hour: Number.isFinite(h) ? h : 9,
    minute: Number.isFinite(m) ? m : 0,
  };
}

interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function ModalShell({ title, onClose, children }: ModalShellProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white border border-[#DCE6DF] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCE6DF]">
          <h2 className="text-lg font-bold text-[#14221B]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4A5F53] hover:bg-[#EDF4EF]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function MedicationModal({
  existing,
  onClose,
  onSave,
}: {
  existing?: Medication | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    dosage: string;
    instructions: string;
    timeHour: number;
    timeMinute: number;
    reminderEnabled: boolean;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(existing?.name ?? '');
  const [dosage, setDosage] = useState(existing?.dosage ?? '');
  const [instructions, setInstructions] = useState(existing?.instructions ?? '');
  const [timeVal, setTimeVal] = useState(
    toTimeInputValue(existing?.timeHour ?? 9, existing?.timeMinute ?? 0)
  );
  const [reminderEnabled, setReminderEnabled] = useState(existing?.reminderEnabled ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const { hour, minute } = parseTimeInputValue(timeVal);
    await onSave({
      name: name.trim(),
      dosage: dosage.trim() || '1 dose',
      instructions: instructions.trim(),
      timeHour: hour,
      timeMinute: minute,
      reminderEnabled,
    });
    setSaving(false);
    onClose();
  };

  return (
    <ModalShell title={existing ? 'Edit Medication' : 'Add Medication'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#14221B] mb-1">
            Medicine Name *
          </label>
          <input
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lisinopril"
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#14221B] mb-1">Dosage *</label>
          <input
            type="text"
            required
            maxLength={80}
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="e.g. 10 mg · 1 tablet"
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#14221B] mb-1">
            Instructions
          </label>
          <textarea
            rows={2}
            maxLength={300}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Take with water after breakfast"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-sm font-semibold text-[#14221B] mb-1">
              Reminder Time
            </label>
            <input
              type="time"
              value={timeVal}
              onChange={(e) => setTimeVal(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
            />
          </div>
          <label className="flex items-center gap-3 min-h-[44px] pt-5 cursor-pointer">
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
              className="w-5 h-5 accent-[#1F7A53]"
            />
            <span className="text-sm font-medium text-[#14221B]">Daily reminder active</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#DCE6DF] text-sm font-semibold text-[#4A5F53] hover:bg-[#F6FAF7]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#1F7A53] text-white text-sm font-semibold hover:bg-[#176040] disabled:opacity-60"
          >
            {saving ? 'Saving...' : existing ? 'Save Changes' : 'Add Medicine'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function TaskModal({
  existing,
  onClose,
  onSave,
}: {
  existing?: CareTask | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    details: string;
    dueHour: number;
    dueMinute: number;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState(existing?.title ?? '');
  const [details, setDetails] = useState(existing?.details ?? '');
  const [timeVal, setTimeVal] = useState(
    toTimeInputValue(existing?.dueHour ?? 10, existing?.dueMinute ?? 0)
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const { hour, minute } = parseTimeInputValue(timeVal);
    await onSave({
      title: title.trim(),
      details: details.trim(),
      dueHour: hour,
      dueMinute: minute,
    });
    setSaving(false);
    onClose();
  };

  return (
    <ModalShell title={existing ? 'Edit Care Task' : 'Add Care Task'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#14221B] mb-1">Task Title *</label>
          <input
            type="text"
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Morning blood pressure check"
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#14221B] mb-1">Care Notes</label>
          <textarea
            rows={2}
            maxLength={400}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Optional instructions"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#14221B] mb-1">Due Time</label>
          <input
            type="time"
            value={timeVal}
            onChange={(e) => setTimeVal(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#DCE6DF] text-sm font-semibold text-[#4A5F53] hover:bg-[#F6FAF7]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#1F7A53] text-white text-sm font-semibold hover:bg-[#176040] disabled:opacity-60"
          >
            {saving ? 'Saving...' : existing ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function AppointmentModal({
  existing,
  onClose,
  onSave,
}: {
  existing?: Appointment | null;
  onClose: () => void;
  onSave: (data: {
    doctorName: string;
    specialty: string;
    location: string;
    dateISO: string;
    timeHour: number;
    timeMinute: number;
    notes: string;
  }) => Promise<void>;
}) {
  const [doctorName, setDoctorName] = useState(existing?.doctorName ?? '');
  const [specialty, setSpecialty] = useState(existing?.specialty ?? '');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [dateISO, setDateISO] = useState(existing?.dateISO ?? getOffsetDayKey(1));
  const [timeVal, setTimeVal] = useState(
    toTimeInputValue(existing?.timeHour ?? 10, existing?.timeMinute ?? 30)
  );
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim()) return;
    setSaving(true);
    const { hour, minute } = parseTimeInputValue(timeVal);
    await onSave({
      doctorName: doctorName.trim(),
      specialty: specialty.trim() || 'General Care',
      location: location.trim() || 'Clinic',
      dateISO,
      timeHour: hour,
      timeMinute: minute,
      notes: notes.trim(),
    });
    setSaving(false);
    onClose();
  };

  return (
    <ModalShell title={existing ? 'Edit Appointment' : 'Add Appointment'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#14221B] mb-1">
            Doctor / Provider *
          </label>
          <input
            type="text"
            required
            maxLength={100}
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            placeholder="e.g. Dr. Elena Rostova"
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#14221B] mb-1">Specialty</label>
            <input
              type="text"
              maxLength={80}
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. Cardiology"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#14221B] mb-1">Location</label>
            <input
              type="text"
              maxLength={160}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Clinic or suite"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#14221B] mb-1">Date</label>
            <input
              type="date"
              required
              value={dateISO}
              onChange={(e) => setDateISO(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#14221B] mb-1">Time</label>
            <input
              type="time"
              required
              value={timeVal}
              onChange={(e) => setTimeVal(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#14221B] mb-1">Visit Notes</label>
          <textarea
            rows={2}
            maxLength={400}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Questions to ask or documents to bring"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#DCE6DF] text-sm font-semibold text-[#4A5F53] hover:bg-[#F6FAF7]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !doctorName.trim()}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#1F7A53] text-white text-sm font-semibold hover:bg-[#176040] disabled:opacity-60"
          >
            {saving ? 'Saving...' : existing ? 'Save Changes' : 'Save Visit'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function ProfileModal({
  existing,
  onClose,
  onSave,
}: {
  existing: CareProfile;
  onClose: () => void;
  onSave: (data: Omit<CareProfile, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}) {
  const [recipientName, setRecipientName] = useState(existing.recipientName);
  const [age, setAge] = useState(String(existing.age));
  const [dateOfBirth, setDateOfBirth] = useState(existing.dateOfBirth);
  const [bloodType, setBloodType] = useState(existing.bloodType);
  const [primaryDoctor, setPrimaryDoctor] = useState(existing.primaryDoctor);
  const [address, setAddress] = useState(existing.address);
  const [allergies, setAllergies] = useState(existing.allergies);
  const [careNotes, setCareNotes] = useState(existing.careNotes);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) return;
    setSaving(true);
    await onSave({
      recipientName: recipientName.trim(),
      age: Number(age) || existing.age,
      dateOfBirth: dateOfBirth.trim(),
      bloodType: bloodType.trim() || 'Unknown',
      primaryDoctor: primaryDoctor.trim(),
      address: address.trim(),
      allergies: allergies.trim(),
      careNotes: careNotes.trim(),
    });
    setSaving(false);
    onClose();
  };

  return (
    <ModalShell title="Edit Care Profile" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#14221B] mb-1">
            Care Recipient Name *
          </label>
          <input
            type="text"
            required
            maxLength={100}
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#14221B] mb-1">Age</label>
            <input
              type="number"
              min={0}
              max={130}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#14221B] mb-1">Blood Type</label>
            <input
              type="text"
              maxLength={16}
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#14221B] mb-1">
              Date of Birth
            </label>
            <input
              type="text"
              maxLength={40}
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#14221B] mb-1">
              Primary Doctor
            </label>
            <input
              type="text"
              maxLength={100}
              value={primaryDoctor}
              onChange={(e) => setPrimaryDoctor(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#14221B] mb-1">Home Address</label>
          <input
            type="text"
            maxLength={200}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#14221B] mb-1">Allergies</label>
          <input
            type="text"
            maxLength={400}
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="Comma separated"
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#14221B] mb-1">Care Notes</label>
          <textarea
            rows={3}
            maxLength={1000}
            value={careNotes}
            onChange={(e) => setCareNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#DCE6DF] text-sm font-semibold text-[#4A5F53] hover:bg-[#F6FAF7]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !recipientName.trim()}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#1F7A53] text-white text-sm font-semibold hover:bg-[#176040] disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function EmergencyContactModal({
  existing,
  onClose,
  onSave,
}: {
  existing?: EmergencyContact | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    relationship: string;
    phoneNumber: string;
    isPrimary: boolean;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(existing?.name ?? '');
  const [relationship, setRelationship] = useState(existing?.relationship ?? '');
  const [phoneNumber, setPhoneNumber] = useState(existing?.phoneNumber ?? '');
  const [isPrimary, setIsPrimary] = useState(existing?.isPrimary ?? false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phoneNumber.trim()) return;
    setSaving(true);
    await onSave({
      name: name.trim(),
      relationship: relationship.trim() || 'Emergency Contact',
      phoneNumber: phoneNumber.trim(),
      isPrimary,
    });
    setSaving(false);
    onClose();
  };

  return (
    <ModalShell
      title={existing ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#14221B] mb-1">Name *</label>
          <input
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#14221B] mb-1">Relationship</label>
          <input
            type="text"
            maxLength={80}
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="e.g. Daughter · Primary Caregiver"
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#14221B] mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            required
            maxLength={32}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
          />
        </div>
        <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className="w-5 h-5 accent-[#1F7A53]"
          />
          <span className="text-sm font-medium text-[#14221B]">Primary emergency contact</span>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#DCE6DF] text-sm font-semibold text-[#4A5F53] hover:bg-[#F6FAF7]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim() || !phoneNumber.trim()}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#1F7A53] text-white text-sm font-semibold hover:bg-[#176040] disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Contact'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function FamilyMemberModal({
  existing,
  onClose,
  onSave,
}: {
  existing?: FamilyMember | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    relationship: string;
    role: string;
    phoneNumber: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(existing?.name ?? '');
  const [relationship, setRelationship] = useState(existing?.relationship ?? '');
  const [role, setRole] = useState(existing?.role ?? '');
  const [phoneNumber, setPhoneNumber] = useState(existing?.phoneNumber ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      name: name.trim(),
      relationship: relationship.trim() || 'Family',
      role: role.trim() || 'Caregiver',
      phoneNumber: phoneNumber.trim(),
    });
    setSaving(false);
    onClose();
  };

  return (
    <ModalShell
      title={existing ? 'Edit Family Member' : 'Add Family Member'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#14221B] mb-1">Name *</label>
          <input
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#14221B] mb-1">
            Relationship *
          </label>
          <input
            type="text"
            required
            maxLength={60}
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="e.g. Daughter, Son, Nurse"
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#14221B] mb-1">Care Role</label>
          <input
            type="text"
            maxLength={100}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Weekends & Groceries"
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#14221B] mb-1">Phone Number</label>
          <input
            type="tel"
            maxLength={32}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#DCE6DF] text-sm font-semibold text-[#4A5F53] hover:bg-[#F6FAF7]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#1F7A53] text-white text-sm font-semibold hover:bg-[#176040] disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Member'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
