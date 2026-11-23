package com.carecircle.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "medications")
data class MedicationEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0L,
    val name: String,
    val dosage: String,
    val instructions: String,
    val hour: Int,
    val minute: Int,
    val reminderEnabled: Boolean = true,
    val lastTakenEpochDay: Long? = null,
    val lastTakenTimeLabel: String? = null
) {
    fun isTakenOn(epochDay: Long): Boolean = lastTakenEpochDay == epochDay
}

@Entity(tableName = "care_tasks")
data class CareTaskEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0L,
    val title: String,
    val details: String,
    val dueHour: Int,
    val dueMinute: Int,
    val lastCompletedEpochDay: Long? = null
) {
    fun isCompletedOn(epochDay: Long): Boolean = lastCompletedEpochDay == epochDay
}

@Entity(tableName = "appointments")
data class AppointmentEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0L,
    val doctorName: String,
    val specialty: String,
    val location: String,
    val dateEpochDay: Long,
    val hour: Int,
    val minute: Int,
    val notes: String,
    val isCompleted: Boolean = false
)

@Entity(tableName = "care_profile")
data class CareProfileEntity(
    @PrimaryKey
    val id: Int = 1,
    val recipientName: String,
    val age: Int,
    val dateOfBirth: String,
    val bloodType: String,
    val primaryDoctor: String,
    val address: String,
    val allergies: String,
    val careNotes: String,
    val photoUri: String? = null
)

@Entity(tableName = "emergency_contacts")
data class EmergencyContactEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0L,
    val name: String,
    val relationship: String,
    val phoneNumber: String,
    val isPrimary: Boolean = false
)

@Entity(tableName = "family_members")
data class FamilyMemberEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0L,
    val name: String,
    val relationship: String,
    val role: String,
    val phoneNumber: String
)

@Entity(tableName = "care_updates")
data class CareUpdateEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0L,
    val authorName: String,
    val message: String,
    val createdAtMillis: Long
)
