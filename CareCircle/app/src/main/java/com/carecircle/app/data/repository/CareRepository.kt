package com.carecircle.app.data.repository

import android.content.Context
import com.carecircle.app.data.local.AppointmentEntity
import com.carecircle.app.data.local.CareCircleDatabase
import com.carecircle.app.data.local.CareProfileEntity
import com.carecircle.app.data.local.CareTaskEntity
import com.carecircle.app.data.local.CareUpdateEntity
import com.carecircle.app.data.local.EmergencyContactEntity
import com.carecircle.app.data.local.FamilyMemberEntity
import com.carecircle.app.data.local.MedicationEntity
import com.carecircle.app.notifications.MedicationAlarmScheduler
import com.carecircle.app.notifications.NotificationHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter

class CareRepository(
    private val context: Context,
    private val database: CareCircleDatabase,
    private val alarmScheduler: MedicationAlarmScheduler
) {
    private val medicationDao = database.medicationDao()
    private val taskDao = database.careTaskDao()
    private val appointmentDao = database.appointmentDao()
    private val profileDao = database.careProfileDao()
    private val contactDao = database.emergencyContactDao()
    private val familyDao = database.familyMemberDao()
    private val updateDao = database.careUpdateDao()

    val medications: Flow<List<MedicationEntity>> = medicationDao.observeAll()
    val tasks: Flow<List<CareTaskEntity>> = taskDao.observeAll()
    val appointments: Flow<List<AppointmentEntity>> = appointmentDao.observeAll()
    val profile: Flow<CareProfileEntity?> = profileDao.observeProfile()
    val emergencyContacts: Flow<List<EmergencyContactEntity>> = contactDao.observeAll()
    val familyMembers: Flow<List<FamilyMemberEntity>> = familyDao.observeAll()
    val careUpdates: Flow<List<CareUpdateEntity>> = updateDao.observeAll()

    suspend fun ensureSeedData() = withContext(Dispatchers.IO) {
        val prefs = context.getSharedPreferences("carecircle_prefs", Context.MODE_PRIVATE)
        val alreadySeeded = prefs.getBoolean("initial_seed_complete", false)
        if (alreadySeeded) {
            val allMeds = medicationDao.getAllOnce()
            alarmScheduler.rescheduleAll(allMeds)
            return@withContext
        }

        val today = LocalDate.now().toEpochDay()
        val nowMillis = System.currentTimeMillis()

        if (profileDao.getProfileOnce() == null) {
            profileDao.upsert(
                CareProfileEntity(
                    id = 1,
                    recipientName = "Margaret Miller",
                    age = 78,
                    dateOfBirth = "May 14, 1948",
                    bloodType = "O+",
                    primaryDoctor = "Dr. Marcus Vance",
                    address = "412 Oakwood Lane, Meadowbrook",
                    allergies = "Penicillin, Sulfa drugs, Peanuts",
                    careNotes = "Prefers warm water with morning pills. Uses reading glasses for forms. Enjoys a 15-minute afternoon walk after lunch.",
                    photoUri = null
                )
            )
        }

        if (medicationDao.count() == 0) {
            val seededIds = medicationDao.insertAll(
                listOf(
                    MedicationEntity(
                        name = "Lisinopril",
                        dosage = "10 mg • 1 tablet",
                        instructions = "Take with water after breakfast",
                        hour = 8,
                        minute = 0,
                        reminderEnabled = true,
                        lastTakenEpochDay = null,
                        lastTakenTimeLabel = null
                    ),
                    MedicationEntity(
                        name = "Metformin",
                        dosage = "500 mg • 1 tablet",
                        instructions = "Take with lunch to prevent upset stomach",
                        hour = 12,
                        minute = 30,
                        reminderEnabled = true,
                        lastTakenEpochDay = null,
                        lastTakenTimeLabel = null
                    ),
                    MedicationEntity(
                        name = "Atorvastatin",
                        dosage = "20 mg • 1 tablet",
                        instructions = "Take in the evening before bedtime",
                        hour = 21,
                        minute = 0,
                        reminderEnabled = true,
                        lastTakenEpochDay = null,
                        lastTakenTimeLabel = null
                    )
                )
            )
            if (seededIds.isNotEmpty()) {
                alarmScheduler.rescheduleAll(medicationDao.getAllOnce())
            }
        }

        if (taskDao.count() == 0) {
            taskDao.insertAll(
                listOf(
                    CareTaskEntity(
                        title = "Morning blood pressure check",
                        details = "Measure sitting down after 5 minutes of rest and record reading",
                        dueHour = 8,
                        dueMinute = 30,
                        lastCompletedEpochDay = null
                    ),
                    CareTaskEntity(
                        title = "15-minute afternoon walk",
                        details = "Gentle walk around the garden or living room",
                        dueHour = 14,
                        dueMinute = 0,
                        lastCompletedEpochDay = null
                    ),
                    CareTaskEntity(
                        title = "Evening hydration & foot check",
                        details = "Full glass of water and check ankles for swelling",
                        dueHour = 19,
                        dueMinute = 30,
                        lastCompletedEpochDay = null
                    )
                )
            )
        }

        if (appointmentDao.count() == 0) {
            appointmentDao.insertAll(
                listOf(
                    AppointmentEntity(
                        doctorName = "Dr. Elena Rostova",
                        specialty = "Cardiology",
                        location = "Mercy Heart Clinic, Suite 304",
                        dateEpochDay = today + 2,
                        hour = 10,
                        minute = 30,
                        notes = "Bring 2-week blood pressure log and medication list"
                    ),
                    AppointmentEntity(
                        doctorName = "Dr. Marcus Vance",
                        specialty = "Primary Care",
                        location = "Oakwood Family Practice",
                        dateEpochDay = today + 9,
                        hour = 14,
                        minute = 0,
                        notes = "Quarterly wellness visit and Lisinopril refill review"
                    )
                )
            )
        }

        if (contactDao.count() == 0) {
            contactDao.insertAll(
                listOf(
                    EmergencyContactEntity(
                        name = "Sarah Miller",
                        relationship = "Daughter • Primary Caregiver",
                        phoneNumber = "+1 555 234 8910",
                        isPrimary = true
                    ),
                    EmergencyContactEntity(
                        name = "Dr. Marcus Vance",
                        relationship = "Primary Physician",
                        phoneNumber = "+1 555 890 4421",
                        isPrimary = false
                    ),
                    EmergencyContactEntity(
                        name = "Emergency Services",
                        relationship = "Urgent Medical Dispatch",
                        phoneNumber = "911",
                        isPrimary = false
                    )
                )
            )
        }

        if (familyDao.count() == 0) {
            familyDao.insertAll(
                listOf(
                    FamilyMemberEntity(
                        name = "Sarah Miller",
                        relationship = "Daughter",
                        role = "Primary Caregiver & Medications",
                        phoneNumber = "+1 555 234 8910"
                    ),
                    FamilyMemberEntity(
                        name = "David Miller",
                        relationship = "Son",
                        role = "Weekends & Groceries",
                        phoneNumber = "+1 555 619 3304"
                    ),
                    FamilyMemberEntity(
                        name = "Priya Patel",
                        relationship = "Home Care Aide",
                        role = "Weekday Mornings",
                        phoneNumber = "+1 555 478 9021"
                    )
                )
            )
        }

        if (updateDao.count() == 0) {
            updateDao.insertAll(
                listOf(
                    CareUpdateEntity(
                        authorName = "Sarah Miller",
                        message = "Picked up Margaret's 30-day Lisinopril refill from Oakwood Pharmacy and organized her weekly pillbox.",
                        createdAtMillis = nowMillis - 3_600_000L
                    ),
                    CareUpdateEntity(
                        authorName = "Priya Patel",
                        message = "Morning blood pressure was 124/78. She had oatmeal with berries and seemed in great spirits.",
                        createdAtMillis = nowMillis - 14_400_000L
                    )
                )
            )
        }

        prefs.edit().putBoolean("initial_seed_complete", true).apply()
    }

    suspend fun saveMedication(medication: MedicationEntity): MedicationEntity = withContext(Dispatchers.IO) {
        val saved = if (medication.id == 0L) {
            val newId = medicationDao.insert(medication)
            medication.copy(id = newId)
        } else {
            medicationDao.update(medication)
            medication
        }
        alarmScheduler.scheduleMedication(saved)
        saved
    }

    suspend fun deleteMedication(medication: MedicationEntity) = withContext(Dispatchers.IO) {
        alarmScheduler.cancelMedication(medication.id)
        NotificationHelper.cancelNotification(context, medication.id)
        medicationDao.delete(medication)
    }

    suspend fun toggleMedicationTakenToday(medication: MedicationEntity) = withContext(Dispatchers.IO) {
        val today = LocalDate.now().toEpochDay()
        val currentlyTaken = medication.isTakenOn(today)
        val updated = if (currentlyTaken) {
            medication.copy(lastTakenEpochDay = null, lastTakenTimeLabel = null)
        } else {
            val timeLabel = LocalTime.now().format(DateTimeFormatter.ofPattern("h:mm a"))
            NotificationHelper.cancelNotification(context, medication.id)
            medication.copy(lastTakenEpochDay = today, lastTakenTimeLabel = timeLabel)
        }
        medicationDao.update(updated)
    }

    suspend fun toggleMedicationReminder(medication: MedicationEntity) = withContext(Dispatchers.IO) {
        val updated = medication.copy(reminderEnabled = !medication.reminderEnabled)
        medicationDao.update(updated)
        alarmScheduler.scheduleMedication(updated)
    }

    fun sendTestMedicationNotification(medication: MedicationEntity) {
        NotificationHelper.showMedicationNotification(
            context = context,
            medicationId = medication.id,
            name = medication.name,
            dosage = medication.dosage,
            instructions = medication.instructions
        )
    }

    suspend fun saveTask(task: CareTaskEntity) = withContext(Dispatchers.IO) {
        if (task.id == 0L) {
            taskDao.insert(task)
        } else {
            taskDao.update(task)
        }
    }

    suspend fun deleteTask(task: CareTaskEntity) = withContext(Dispatchers.IO) {
        taskDao.delete(task)
    }

    suspend fun toggleTaskCompletedToday(task: CareTaskEntity) = withContext(Dispatchers.IO) {
        val today = LocalDate.now().toEpochDay()
        val updated = if (task.isCompletedOn(today)) {
            task.copy(lastCompletedEpochDay = null)
        } else {
            task.copy(lastCompletedEpochDay = today)
        }
        taskDao.update(updated)
    }

    suspend fun saveAppointment(appointment: AppointmentEntity) = withContext(Dispatchers.IO) {
        if (appointment.id == 0L) {
            appointmentDao.insert(appointment)
        } else {
            appointmentDao.update(appointment)
        }
    }

    suspend fun deleteAppointment(appointment: AppointmentEntity) = withContext(Dispatchers.IO) {
        appointmentDao.delete(appointment)
    }

    suspend fun toggleAppointmentCompleted(appointment: AppointmentEntity) = withContext(Dispatchers.IO) {
        appointmentDao.update(appointment.copy(isCompleted = !appointment.isCompleted))
    }

    suspend fun saveProfile(profile: CareProfileEntity) = withContext(Dispatchers.IO) {
        profileDao.upsert(profile.copy(id = 1))
    }

    suspend fun saveEmergencyContact(contact: EmergencyContactEntity) = withContext(Dispatchers.IO) {
        if (contact.id == 0L) {
            contactDao.insert(contact)
        } else {
            contactDao.update(contact)
        }
    }

    suspend fun deleteEmergencyContact(contact: EmergencyContactEntity) = withContext(Dispatchers.IO) {
        contactDao.delete(contact)
    }

    suspend fun saveFamilyMember(member: FamilyMemberEntity) = withContext(Dispatchers.IO) {
        if (member.id == 0L) {
            familyDao.insert(member)
        } else {
            familyDao.update(member)
        }
    }

    suspend fun deleteFamilyMember(member: FamilyMemberEntity) = withContext(Dispatchers.IO) {
        familyDao.delete(member)
    }

    suspend fun addCareUpdate(authorName: String, message: String) = withContext(Dispatchers.IO) {
        updateDao.insert(
            CareUpdateEntity(
                authorName = authorName.trim(),
                message = message.trim(),
                createdAtMillis = System.currentTimeMillis()
            )
        )
    }

    suspend fun deleteCareUpdate(update: CareUpdateEntity) = withContext(Dispatchers.IO) {
        updateDao.delete(update)
    }
}
