import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type {
  AdherenceLog,
  Appointment,
  CareProfile,
  CareTask,
  CareUpdate,
  EmergencyContact,
  FamilyMember,
  Medication,
} from '../types/care';

function clampString(value: string, maxLen: number): string {
  return value.trim().slice(0, maxLen);
}

function clampInt(value: number, min: number, max: number): number {
  const rounded = Math.round(Number.isFinite(value) ? value : min);
  return Math.min(max, Math.max(min, rounded));
}

export function getTodayDayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getOffsetDayKey(offsetDays: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + offsetDays);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function ensureUserAndSeedData(user: User): Promise<void> {
  const uid = user.uid;
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  try {
    const userSnap = await getDoc(userRef);
    const displayName = clampString(user.displayName || 'Family Caregiver', 120) || 'Family Caregiver';
    const email = clampString(user.email || 'caregiver@example.com', 200);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid,
        displayName,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        displayName,
        email,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }

  const profilePath = `users/${uid}/profile/main`;
  const profileRef = doc(db, 'users', uid, 'profile', 'main');

  try {
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      await backfillAdherenceHistoryIfEmpty(uid);
      return;
    }

    const batch = writeBatch(db);

    batch.set(profileRef, {
      ownerId: uid,
      recipientName: 'Margaret Miller',
      age: 78,
      dateOfBirth: 'May 14, 1948',
      bloodType: 'O+',
      primaryDoctor: 'Dr. Marcus Vance',
      address: '412 Oakwood Lane, Meadowbrook',
      allergies: 'Penicillin, Sulfa drugs, Peanuts',
      careNotes:
        'Prefers warm water with morning pills. Uses reading glasses for forms. Enjoys a 15-minute afternoon walk after lunch.',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const meds = [
      {
        name: 'Lisinopril',
        dosage: '10 mg · 1 tablet',
        instructions: 'Take with water after breakfast',
        timeHour: 8,
        timeMinute: 0,
        reminderEnabled: true,
        lastTakenDay: '',
        lastTakenTimeLabel: '',
      },
      {
        name: 'Metformin',
        dosage: '500 mg · 1 tablet',
        instructions: 'Take with lunch to prevent upset stomach',
        timeHour: 12,
        timeMinute: 30,
        reminderEnabled: true,
        lastTakenDay: '',
        lastTakenTimeLabel: '',
      },
      {
        name: 'Atorvastatin',
        dosage: '20 mg · 1 tablet',
        instructions: 'Take in the evening before bedtime',
        timeHour: 21,
        timeMinute: 0,
        reminderEnabled: true,
        lastTakenDay: '',
        lastTakenTimeLabel: '',
      },
    ];
    meds.forEach((med, idx) => {
      const ref = doc(db, 'users', uid, 'medications', `seed_med_${idx + 1}`);
      batch.set(ref, {
        ownerId: uid,
        ...med,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    const tasks = [
      {
        title: 'Morning blood pressure check',
        details: 'Measure sitting down after 5 minutes of rest and record reading',
        dueHour: 8,
        dueMinute: 30,
        lastCompletedDay: '',
      },
      {
        title: '15-minute afternoon walk',
        details: 'Gentle walk around the garden or living room',
        dueHour: 14,
        dueMinute: 0,
        lastCompletedDay: '',
      },
      {
        title: 'Evening hydration & foot check',
        details: 'Full glass of water and check ankles for swelling',
        dueHour: 19,
        dueMinute: 30,
        lastCompletedDay: '',
      },
    ];
    tasks.forEach((task, idx) => {
      const ref = doc(db, 'users', uid, 'tasks', `seed_task_${idx + 1}`);
      batch.set(ref, {
        ownerId: uid,
        ...task,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    const appointments = [
      {
        doctorName: 'Dr. Elena Rostova',
        specialty: 'Cardiology',
        location: 'Mercy Heart Clinic, Suite 304',
        dateISO: getOffsetDayKey(2),
        timeHour: 10,
        timeMinute: 30,
        notes: 'Bring 2-week blood pressure log and medication list',
        isCompleted: false,
      },
      {
        doctorName: 'Dr. Marcus Vance',
        specialty: 'Primary Care',
        location: 'Oakwood Family Practice',
        dateISO: getOffsetDayKey(9),
        timeHour: 14,
        timeMinute: 0,
        notes: 'Quarterly wellness visit and Lisinopril refill review',
        isCompleted: false,
      },
    ];
    appointments.forEach((appt, idx) => {
      const ref = doc(db, 'users', uid, 'appointments', `seed_appt_${idx + 1}`);
      batch.set(ref, {
        ownerId: uid,
        ...appt,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    const contacts = [
      {
        name: 'Sarah Miller',
        relationship: 'Daughter · Primary Caregiver',
        phoneNumber: '+1 555 234 8910',
        isPrimary: true,
      },
      {
        name: 'Dr. Marcus Vance',
        relationship: 'Primary Physician',
        phoneNumber: '+1 555 890 4421',
        isPrimary: false,
      },
      {
        name: 'Emergency Services',
        relationship: 'Urgent Medical Dispatch',
        phoneNumber: '911',
        isPrimary: false,
      },
    ];
    contacts.forEach((contact, idx) => {
      const ref = doc(db, 'users', uid, 'emergencyContacts', `seed_contact_${idx + 1}`);
      batch.set(ref, {
        ownerId: uid,
        ...contact,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    const members = [
      {
        name: 'Sarah Miller',
        relationship: 'Daughter',
        role: 'Primary Caregiver & Medications',
        phoneNumber: '+1 555 234 8910',
      },
      {
        name: 'David Miller',
        relationship: 'Son',
        role: 'Weekends & Groceries',
        phoneNumber: '+1 555 619 3304',
      },
      {
        name: 'Priya Patel',
        relationship: 'Home Care Aide',
        role: 'Weekday Mornings',
        phoneNumber: '+1 555 478 9021',
      },
    ];
    members.forEach((member, idx) => {
      const ref = doc(db, 'users', uid, 'familyMembers', `seed_member_${idx + 1}`);
      batch.set(ref, {
        ownerId: uid,
        ...member,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    const updates = [
      {
        authorName: 'Sarah Miller',
        message:
          'Picked up Margaret’s 30-day Lisinopril refill from Oakwood Pharmacy and organized her weekly pillbox.',
      },
      {
        authorName: 'Priya Patel',
        message:
          'Morning blood pressure was 124/78. She enjoyed oatmeal with berries and seemed in great spirits.',
      },
    ];
    updates.forEach((upd, idx) => {
      const ref = doc(db, 'users', uid, 'careUpdates', `seed_update_${idx + 1}`);
      batch.set(ref, {
        ownerId: uid,
        ...upd,
        createdAt: serverTimestamp(),
      });
    });

    const adherencePattern: Array<{ offset: number; medIndices: number[] }> = [
      { offset: -6, medIndices: [0, 2] },
      { offset: -5, medIndices: [0, 1, 2] },
      { offset: -4, medIndices: [0, 1, 2] },
      { offset: -3, medIndices: [0, 1] },
      { offset: -2, medIndices: [0, 1, 2] },
      { offset: -1, medIndices: [0, 1, 2] },
    ];
    const timeLabels = ['8:05 AM', '12:35 PM', '9:05 PM'];
    adherencePattern.forEach(({ offset, medIndices }) => {
      const dayKey = getOffsetDayKey(offset);
      medIndices.forEach((medIdx) => {
        const med = meds[medIdx];
        const medicationId = `seed_med_${medIdx + 1}`;
        const logId = `${dayKey}_${medicationId}`.slice(0, 128);
        const ref = doc(db, 'users', uid, 'adherenceLogs', logId);
        batch.set(ref, {
          ownerId: uid,
          dayKey,
          medicationId,
          medicationName: clampString(med.name, 100),
          takenAtLabel: timeLabels[medIdx] || '9:00 AM',
          createdAt: serverTimestamp(),
        });
      });
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, profilePath);
  }
}

async function backfillAdherenceHistoryIfEmpty(uid: string): Promise<void> {
  const logsPath = `users/${uid}/adherenceLogs`;
  try {
    const existingLogs = await getDocs(
      query(collection(db, 'users', uid, 'adherenceLogs'), where('ownerId', '==', uid), limit(1))
    );
    if (!existingLogs.empty) return;

    const medsSnap = await getDocs(
      query(collection(db, 'users', uid, 'medications'), where('ownerId', '==', uid))
    );
    if (medsSnap.empty) return;

    const meds = medsSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as Medication)
      .sort((a, b) => a.timeHour * 60 + a.timeMinute - (b.timeHour * 60 + b.timeMinute));

    const batch = writeBatch(db);
    const today = getTodayDayKey();

    for (let offset = -6; offset <= -1; offset++) {
      const dayKey = getOffsetDayKey(offset);
      meds.forEach((med, idx) => {
        // Realistic weekly variation: ~85-100% completion across past 6 days
        const skipped = (offset === -6 && idx === 1) || (offset === -3 && idx === meds.length - 1 && meds.length > 1);
        if (skipped) return;
        const safeMedId = med.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60) || `med_${idx}`;
        const logId = `${dayKey}_${safeMedId}`.slice(0, 128);
        const h12 = med.timeHour % 12 === 0 ? 12 : med.timeHour % 12;
        const suffix = med.timeHour >= 12 ? 'PM' : 'AM';
        const takenAtLabel = `${h12}:${String(med.timeMinute).padStart(2, '0')} ${suffix}`;
        batch.set(doc(db, 'users', uid, 'adherenceLogs', logId), {
          ownerId: uid,
          dayKey,
          medicationId: safeMedId,
          medicationName: clampString(med.name || 'Medication', 100),
          takenAtLabel: clampString(takenAtLabel, 20),
          createdAt: serverTimestamp(),
        });
      });
    }

    // Also reflect any medication already marked taken today
    meds.forEach((med, idx) => {
      if (med.lastTakenDay === today) {
        const safeMedId = med.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60) || `med_${idx}`;
        const logId = `${today}_${safeMedId}`.slice(0, 128);
        batch.set(doc(db, 'users', uid, 'adherenceLogs', logId), {
          ownerId: uid,
          dayKey: today,
          medicationId: safeMedId,
          medicationName: clampString(med.name || 'Medication', 100),
          takenAtLabel: clampString(med.lastTakenTimeLabel || 'Today', 20),
          createdAt: serverTimestamp(),
        });
      }
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, logsPath);
  }
}

export function subscribeOwnedCollection<T>(
  uid: string,
  subcollection: string,
  onData: (items: T[]) => void
): Unsubscribe {
  const path = `users/${uid}/${subcollection}`;
  const q = query(collection(db, 'users', uid, subcollection), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Record<string, unknown>),
      })) as T[];
      onData(rows);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeProfile(
  uid: string,
  onData: (profile: CareProfile | null) => void
): Unsubscribe {
  const path = `users/${uid}/profile/main`;
  return onSnapshot(
    doc(db, 'users', uid, 'profile', 'main'),
    (docSnap) => {
      if (!docSnap.exists()) {
        onData(null);
      } else {
        onData({ id: docSnap.id, ...(docSnap.data() as Omit<CareProfile, 'id'>) });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveMedication(
  uid: string,
  med: Omit<Medication, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<void> {
  const colPath = `users/${uid}/medications`;
  const payload = {
    name: clampString(med.name, 100) || 'Medication',
    dosage: clampString(med.dosage, 80) || '1 dose',
    instructions: clampString(med.instructions || '', 300),
    timeHour: clampInt(med.timeHour, 0, 23),
    timeMinute: clampInt(med.timeMinute, 0, 59),
    reminderEnabled: Boolean(med.reminderEnabled),
  };

  try {
    if (existingId) {
      await updateDoc(doc(db, colPath, existingId), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, colPath), {
        ownerId: uid,
        ...payload,
        lastTakenDay: clampString(med.lastTakenDay || '', 20),
        lastTakenTimeLabel: clampString(med.lastTakenTimeLabel || '', 20),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existingId ? OperationType.UPDATE : OperationType.CREATE,
      existingId ? `${colPath}/${existingId}` : colPath
    );
  }
}

export async function toggleMedicationTaken(uid: string, med: Medication): Promise<void> {
  const path = `users/${uid}/medications/${med.id}`;
  const today = getTodayDayKey();
  const isTaken = med.lastTakenDay === today;
  const nowLabel = clampString(
    new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    20
  );
  const safeMedId = med.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60) || 'med';
  const logId = `${today}_${safeMedId}`.slice(0, 128);
  const logRef = doc(db, 'users', uid, 'adherenceLogs', logId);

  try {
    await updateDoc(doc(db, 'users', uid, 'medications', med.id), {
      lastTakenDay: isTaken ? '' : today,
      lastTakenTimeLabel: isTaken ? '' : nowLabel,
      updatedAt: serverTimestamp(),
    });

    if (isTaken) {
      await deleteDoc(logRef);
    } else {
      const existingLog = await getDoc(logRef);
      if (!existingLog.exists()) {
        await setDoc(logRef, {
          ownerId: uid,
          dayKey: today,
          medicationId: safeMedId,
          medicationName: clampString(med.name, 100) || 'Medication',
          takenAtLabel: nowLabel,
          createdAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleMedicationReminder(uid: string, med: Medication): Promise<void> {
  const path = `users/${uid}/medications/${med.id}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'medications', med.id), {
      reminderEnabled: !med.reminderEnabled,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteOwnedDoc(
  uid: string,
  subcollection: string,
  id: string
): Promise<void> {
  const path = `users/${uid}/${subcollection}/${id}`;
  try {
    await deleteDoc(doc(db, 'users', uid, subcollection, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCareTask(
  uid: string,
  task: Omit<CareTask, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<void> {
  const colPath = `users/${uid}/tasks`;
  const payload = {
    title: clampString(task.title, 120) || 'Care Task',
    details: clampString(task.details || '', 400),
    dueHour: clampInt(task.dueHour, 0, 23),
    dueMinute: clampInt(task.dueMinute, 0, 59),
  };

  try {
    if (existingId) {
      await updateDoc(doc(db, colPath, existingId), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, colPath), {
        ownerId: uid,
        ...payload,
        lastCompletedDay: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existingId ? OperationType.UPDATE : OperationType.CREATE,
      existingId ? `${colPath}/${existingId}` : colPath
    );
  }
}

export async function toggleCareTaskCompleted(uid: string, task: CareTask): Promise<void> {
  const path = `users/${uid}/tasks/${task.id}`;
  const today = getTodayDayKey();
  const isDone = task.lastCompletedDay === today;

  try {
    await updateDoc(doc(db, 'users', uid, 'tasks', task.id), {
      lastCompletedDay: isDone ? '' : today,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveAppointment(
  uid: string,
  appt: Omit<Appointment, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<void> {
  const colPath = `users/${uid}/appointments`;
  const dateISO = /^\d{4}-\d{2}-\d{2}$/.test(appt.dateISO) ? appt.dateISO : getOffsetDayKey(1);
  const payload = {
    doctorName: clampString(appt.doctorName, 100) || 'Doctor',
    specialty: clampString(appt.specialty || 'General Care', 80),
    location: clampString(appt.location || 'Clinic', 160),
    dateISO,
    timeHour: clampInt(appt.timeHour, 0, 23),
    timeMinute: clampInt(appt.timeMinute, 0, 59),
    notes: clampString(appt.notes || '', 400),
  };

  try {
    if (existingId) {
      await updateDoc(doc(db, colPath, existingId), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, colPath), {
        ownerId: uid,
        ...payload,
        isCompleted: Boolean(appt.isCompleted),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existingId ? OperationType.UPDATE : OperationType.CREATE,
      existingId ? `${colPath}/${existingId}` : colPath
    );
  }
}

export async function toggleAppointmentCompleted(
  uid: string,
  appt: Appointment
): Promise<void> {
  const path = `users/${uid}/appointments/${appt.id}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'appointments', appt.id), {
      isCompleted: !appt.isCompleted,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveCareProfile(
  uid: string,
  profile: Omit<CareProfile, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const path = `users/${uid}/profile/main`;
  const payload = {
    recipientName: clampString(profile.recipientName, 100) || 'Care Recipient',
    age: clampInt(profile.age, 0, 130),
    dateOfBirth: clampString(profile.dateOfBirth || '', 40),
    bloodType: clampString(profile.bloodType || 'Unknown', 16),
    primaryDoctor: clampString(profile.primaryDoctor || '', 100),
    address: clampString(profile.address || '', 200),
    allergies: clampString(profile.allergies || '', 400),
    careNotes: clampString(profile.careNotes || '', 1000),
  };

  try {
    await updateDoc(doc(db, 'users', uid, 'profile', 'main'), {
      ...payload,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveEmergencyContact(
  uid: string,
  contact: Omit<EmergencyContact, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<void> {
  const colPath = `users/${uid}/emergencyContacts`;
  const payload = {
    name: clampString(contact.name, 100) || 'Contact',
    relationship: clampString(contact.relationship || 'Emergency Contact', 80),
    phoneNumber: clampString(contact.phoneNumber, 32) || '911',
    isPrimary: Boolean(contact.isPrimary),
  };

  try {
    if (existingId) {
      await updateDoc(doc(db, colPath, existingId), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, colPath), {
        ownerId: uid,
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existingId ? OperationType.UPDATE : OperationType.CREATE,
      existingId ? `${colPath}/${existingId}` : colPath
    );
  }
}

export async function saveFamilyMember(
  uid: string,
  member: Omit<FamilyMember, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<void> {
  const colPath = `users/${uid}/familyMembers`;
  const payload = {
    name: clampString(member.name, 100) || 'Family Member',
    relationship: clampString(member.relationship || 'Family', 60) || 'Family',
    role: clampString(member.role || 'Caregiver', 100),
    phoneNumber: clampString(member.phoneNumber || '', 32),
  };

  try {
    if (existingId) {
      await updateDoc(doc(db, colPath, existingId), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, colPath), {
        ownerId: uid,
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existingId ? OperationType.UPDATE : OperationType.CREATE,
      existingId ? `${colPath}/${existingId}` : colPath
    );
  }
}

export async function addCareUpdate(
  uid: string,
  authorName: string,
  message: string
): Promise<void> {
  const colPath = `users/${uid}/careUpdates`;
  try {
    await addDoc(collection(db, colPath), {
      ownerId: uid,
      authorName: clampString(authorName, 100) || 'Caregiver',
      message: clampString(message, 600),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}
