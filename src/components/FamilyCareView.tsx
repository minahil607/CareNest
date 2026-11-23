import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  AlertTriangle,
  LogOut,
  Pencil,
  Phone,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import type {
  CareProfile,
  CareUpdate,
  EmergencyContact,
  FamilyMember,
} from '../types/care';

interface FamilyCareViewProps {
  user: User;
  profile: CareProfile | null;
  emergencyContacts: EmergencyContact[];
  familyMembers: FamilyMember[];
  careUpdates: CareUpdate[];
  onSignOut: () => void;
  onEditProfile: () => void;
  onAddContact: () => void;
  onEditContact: (contact: EmergencyContact) => void;
  onDeleteContact: (contact: EmergencyContact) => void;
  onAddMember: () => void;
  onEditMember: (member: FamilyMember) => void;
  onDeleteMember: (member: FamilyMember) => void;
  onAddCareUpdate: (authorName: string, message: string) => Promise<void>;
  onDeleteCareUpdate: (update: CareUpdate) => void;
}

export function FamilyCareView({
  user,
  profile,
  emergencyContacts,
  familyMembers,
  careUpdates,
  onSignOut,
  onEditProfile,
  onAddContact,
  onEditContact,
  onDeleteContact,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onAddCareUpdate,
  onDeleteCareUpdate,
}: FamilyCareViewProps) {
  const [authorName, setAuthorName] = useState(
    user.displayName || familyMembers[0]?.name || 'Caregiver'
  );
  const [message, setMessage] = useState('');
  const [posting, setPosting] = useState(false);

  const sortedContacts = [...emergencyContacts].sort((a, b) =>
    a.isPrimary === b.isPrimary ? a.name.localeCompare(b.name) : a.isPrimary ? -1 : 1
  );

  const sortedUpdates = [...careUpdates].sort((a, b) => {
    const tA = a.createdAt?.toMillis?.() ?? 0;
    const tB = b.createdAt?.toMillis?.() ?? 0;
    return tB - tA;
  });

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setPosting(true);
    await onAddCareUpdate(authorName.trim() || 'Caregiver', message.trim());
    setMessage('');
    setPosting(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#14221B]">Family & Care</h1>
          <p className="text-sm text-[#4A5F53]">
            Signed in as {user.displayName || user.email}
          </p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-[#DCE6DF] text-sm font-semibold text-[#14221B] inline-flex items-center gap-2 hover:bg-[#EDF4EF] whitespace-nowrap"
        >
          <LogOut className="w-4 h-4 text-[#4A5F53]" />
          <span>Sign Out</span>
        </button>
      </div>

      {profile && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-6 bg-white border border-[#DCE6DF] rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#1F7A53] text-white flex items-center justify-center text-xl font-bold shrink-0">
                  {profile.recipientName
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0]?.toUpperCase() || '')
                    .join('')}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#14221B]">{profile.recipientName}</h2>
                  <p className="text-sm text-[#4A5F53] tabular-nums">
                    Age {profile.age} · Blood Type {profile.bloodType}
                    {profile.dateOfBirth ? ` · DOB ${profile.dateOfBirth}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onEditProfile}
                aria-label="Edit care profile"
                className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-semibold text-[#1F7A53] hover:bg-[#EDF4EF] inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Pencil className="w-4 h-4" />
                <span>Edit</span>
              </button>
            </div>

            <div className="pt-3 border-t border-[#EDF4EF] space-y-1.5 text-sm text-[#4A5F53]">
              <p>
                <span className="font-semibold text-[#14221B]">Primary Doctor:</span>{' '}
                {profile.primaryDoctor || 'Not listed'}
              </p>
              <p>
                <span className="font-semibold text-[#14221B]">Home Address:</span>{' '}
                {profile.address || 'Not listed'}
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white border border-[#DCE6DF] rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#C62828]" />
                <h2 className="text-lg font-bold text-[#14221B]">Allergies & Care Notes</h2>
              </div>
              <button
                type="button"
                onClick={onEditProfile}
                className="min-h-[44px] px-3 text-sm font-semibold text-[#1F7A53] hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FDECEC] border border-[#F5C2C2] text-sm font-semibold text-[#7D1A1A]">
              Allergies: {profile.allergies || 'No known allergies recorded'}
            </div>
            <p className="text-sm text-[#4A5F53] leading-relaxed">
              {profile.careNotes || 'No special care notes yet.'}
            </p>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#14221B]">Emergency Contacts</h2>
            <p className="text-xs text-[#4A5F53]">Tap Call to open the phone dialer</p>
          </div>
          <button
            type="button"
            onClick={onAddContact}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#DCE6DF] text-sm font-semibold text-[#1F7A53] inline-flex items-center gap-1.5 hover:bg-[#EDF4EF] whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sortedContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white border border-[#DCE6DF] rounded-2xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#1F7A53]">
                    {contact.isPrimary ? 'Primary Contact · ' : ''}
                    {contact.relationship}
                  </p>
                  <h3 className="text-lg font-bold text-[#14221B] truncate">{contact.name}</h3>
                  <p className="text-sm font-semibold text-[#4A5F53] tabular-nums">
                    {contact.phoneNumber}
                  </p>
                </div>
                <div className="flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditContact(contact)}
                    aria-label={`Edit ${contact.name}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4A5F53] hover:bg-[#EDF4EF]"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteContact(contact)}
                    aria-label={`Delete ${contact.name}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#C62828] hover:bg-[#FDECEC]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <a
                href={`tel:${contact.phoneNumber.replace(/\s+/g, '')}`}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1F7A53] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#176040] transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Call {contact.name}</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#14221B]">Family Care Circle</h2>
            <button
              type="button"
              onClick={onAddMember}
              className="min-h-[44px] px-3 py-2 text-sm font-semibold text-[#1F7A53] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </div>

          <div className="bg-white border border-[#DCE6DF] rounded-2xl divide-y divide-[#EDF4EF]">
            {familyMembers.map((member) => (
              <div
                key={member.id}
                className="p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-base font-semibold text-[#14221B] truncate">
                    {member.name} · {member.relationship}
                  </p>
                  <p className="text-xs text-[#4A5F53]">
                    {member.role}
                    {member.phoneNumber ? ` · ${member.phoneNumber}` : ''}
                  </p>
                </div>
                <div className="flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditMember(member)}
                    aria-label={`Edit ${member.name}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4A5F53] hover:bg-[#EDF4EF]"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteMember(member)}
                    aria-label={`Delete ${member.name}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#C62828] hover:bg-[#FDECEC]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-7 space-y-3">
          <h2 className="text-lg font-bold text-[#14221B]">Shared Care Updates</h2>

          <form
            onSubmit={handlePostUpdate}
            className="bg-white border border-[#DCE6DF] rounded-2xl p-4 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                maxLength={100}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Your name"
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
              />
              <input
                type="text"
                maxLength={600}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share a vitals note, meal update, or refill..."
                className="sm:col-span-2 min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCE6DF] text-sm focus:outline-none focus:border-[#1F7A53]"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={posting || !message.trim()}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1F7A53] text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#176040] disabled:opacity-60 whitespace-nowrap"
              >
                <Send className="w-4 h-4" />
                <span>{posting ? 'Posting...' : 'Post Update'}</span>
              </button>
            </div>
          </form>

          <div className="bg-white border border-[#DCE6DF] rounded-2xl divide-y divide-[#EDF4EF]">
            {sortedUpdates.length === 0 ? (
              <p className="p-5 text-sm text-[#4A5F53]">No care updates posted yet.</p>
            ) : (
              sortedUpdates.map((upd) => (
                <div key={upd.id} className="p-4 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#1F7A53]">
                      {upd.authorName}
                      {upd.createdAt?.toDate
                        ? ` · ${upd.createdAt.toDate().toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}`
                        : ''}
                    </p>
                    <p className="text-sm text-[#14221B] leading-relaxed">{upd.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteCareUpdate(upd)}
                    aria-label="Delete care update"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4A5F53] hover:bg-[#EDF4EF] shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
