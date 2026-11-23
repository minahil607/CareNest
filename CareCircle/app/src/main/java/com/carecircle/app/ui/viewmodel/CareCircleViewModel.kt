package com.carecircle.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.carecircle.app.data.local.AppointmentEntity
import com.carecircle.app.data.local.CareProfileEntity
import com.carecircle.app.data.local.CareTaskEntity
import com.carecircle.app.data.local.CareUpdateEntity
import com.carecircle.app.data.local.EmergencyContactEntity
import com.carecircle.app.data.local.FamilyMemberEntity
import com.carecircle.app.data.local.MedicationEntity
import com.carecircle.app.data.repository.CareRepository
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate

data class CareCircleUiState(
    val medications: List<MedicationEntity> = emptyList(),
    val tasks: List<CareTaskEntity> = emptyList(),
    val appointments: List<AppointmentEntity> = emptyList(),
    val profile: CareProfileEntity? = null,
    val emergencyContacts: List<EmergencyContactEntity> = emptyList(),
    val familyMembers: List<FamilyMemberEntity> = emptyList(),
    val careUpdates: List<CareUpdateEntity> = emptyList(),
    val todayEpochDay: Long = LocalDate.now().toEpochDay(),
    val isLoaded: Boolean = false
)

class CareCircleViewModel(
    private val repository: CareRepository
) : ViewModel() {

    private val _events = MutableSharedFlow<String>(extraBufferCapacity = 8)
    val events: SharedFlow<String> = _events.asSharedFlow()

    private val primaryDataFlow = combine(
        repository.medications,
        repository.tasks,
        repository.appointments,
        repository.profile
    ) { medications, tasks, appointments, profile ->
        PrimaryDataBundle(medications, tasks, appointments, profile)
    }

    private val familyDataFlow = combine(
        repository.emergencyContacts,
        repository.familyMembers,
        repository.careUpdates
    ) { contacts, members, updates ->
        FamilyDataBundle(contacts, members, updates)
    }

    val uiState: StateFlow<CareCircleUiState> = combine(
        primaryDataFlow,
        familyDataFlow
    ) { primary, family ->
        CareCircleUiState(
            medications = primary.medications,
            tasks = primary.tasks,
            appointments = primary.appointments,
            profile = primary.profile,
            emergencyContacts = family.contacts,
            familyMembers = family.members,
            careUpdates = family.updates,
            todayEpochDay = LocalDate.now().toEpochDay(),
            isLoaded = true
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = CareCircleUiState()
    )

    fun saveMedication(medication: MedicationEntity) {
        viewModelScope.launch {
            val saved = repository.saveMedication(medication)
            val statusMsg = if (saved.reminderEnabled) {
                "Saved ${saved.name} and scheduled daily reminder"
            } else {
                "Saved ${saved.name}"
            }
            _events.tryEmit(statusMsg)
        }
    }

    fun deleteMedication(medication: MedicationEntity) {
        viewModelScope.launch {
            repository.deleteMedication(medication)
            _events.tryEmit("Removed ${medication.name}")
        }
    }

    fun toggleMedicationTaken(medication: MedicationEntity) {
        viewModelScope.launch {
            val wasTaken = medication.isTakenOn(LocalDate.now().toEpochDay())
            repository.toggleMedicationTakenToday(medication)
            _events.tryEmit(
                if (wasTaken) "${medication.name} marked as not taken yet"
                else "${medication.name} marked as taken"
            )
        }
    }

    fun toggleMedicationReminder(medication: MedicationEntity) {
        viewModelScope.launch {
            repository.toggleMedicationReminder(medication)
            _events.tryEmit(
                if (medication.reminderEnabled) "Reminder paused for ${medication.name}"
                else "Reminder enabled for ${medication.name}"
            )
        }
    }

    fun sendTestMedicationReminder(medication: MedicationEntity) {
        repository.sendTestMedicationNotification(medication)
        _events.tryEmit("Test reminder sent for ${medication.name}")
    }

    fun saveTask(task: CareTaskEntity) {
        viewModelScope.launch {
            repository.saveTask(task)
            _events.tryEmit("Saved task: ${task.title}")
        }
    }

    fun deleteTask(task: CareTaskEntity) {
        viewModelScope.launch {
            repository.deleteTask(task)
            _events.tryEmit("Deleted task: ${task.title}")
        }
    }

    fun toggleTaskCompleted(task: CareTaskEntity) {
        viewModelScope.launch {
            val wasDone = task.isCompletedOn(LocalDate.now().toEpochDay())
            repository.toggleTaskCompletedToday(task)
            _events.tryEmit(
                if (wasDone) "${task.title} reopened"
                else "Completed: ${task.title}"
            )
        }
    }

    fun saveAppointment(appointment: AppointmentEntity) {
        viewModelScope.launch {
            repository.saveAppointment(appointment)
            _events.tryEmit("Saved appointment with ${appointment.doctorName}")
        }
    }

    fun deleteAppointment(appointment: AppointmentEntity) {
        viewModelScope.launch {
            repository.deleteAppointment(appointment)
            _events.tryEmit("Removed appointment with ${appointment.doctorName}")
        }
    }

    fun toggleAppointmentCompleted(appointment: AppointmentEntity) {
        viewModelScope.launch {
            repository.toggleAppointmentCompleted(appointment)
            _events.tryEmit(
                if (appointment.isCompleted) "Marked visit as upcoming"
                else "Marked visit with ${appointment.doctorName} completed"
            )
        }
    }

    fun saveProfile(profile: CareProfileEntity) {
        viewModelScope.launch {
            repository.saveProfile(profile)
            _events.tryEmit("Care profile updated")
        }
    }

    fun updateRecipientPhoto(photoUri: String?) {
        val current = uiState.value.profile ?: return
        viewModelScope.launch {
            repository.saveProfile(current.copy(photoUri = photoUri))
            _events.tryEmit("Profile photo updated")
        }
    }

    fun saveEmergencyContact(contact: EmergencyContactEntity) {
        viewModelScope.launch {
            repository.saveEmergencyContact(contact)
            _events.tryEmit("Saved emergency contact: ${contact.name}")
        }
    }

    fun deleteEmergencyContact(contact: EmergencyContactEntity) {
        viewModelScope.launch {
            repository.deleteEmergencyContact(contact)
            _events.tryEmit("Removed ${contact.name}")
        }
    }

    fun saveFamilyMember(member: FamilyMemberEntity) {
        viewModelScope.launch {
            repository.saveFamilyMember(member)
            _events.tryEmit("Saved family member: ${member.name}")
        }
    }

    fun deleteFamilyMember(member: FamilyMemberEntity) {
        viewModelScope.launch {
            repository.deleteFamilyMember(member)
            _events.tryEmit("Removed ${member.name}")
        }
    }

    fun addCareUpdate(authorName: String, message: String) {
        if (message.isBlank()) return
        viewModelScope.launch {
            repository.addCareUpdate(
                authorName = authorName.ifBlank { "Family Caregiver" },
                message = message
            )
            _events.tryEmit("Shared care update posted")
        }
    }

    fun deleteCareUpdate(update: CareUpdateEntity) {
        viewModelScope.launch {
            repository.deleteCareUpdate(update)
            _events.tryEmit("Care update removed")
        }
    }

    private data class PrimaryDataBundle(
        val medications: List<MedicationEntity>,
        val tasks: List<CareTaskEntity>,
        val appointments: List<AppointmentEntity>,
        val profile: CareProfileEntity?
    )

    private data class FamilyDataBundle(
        val contacts: List<EmergencyContactEntity>,
        val members: List<FamilyMemberEntity>,
        val updates: List<CareUpdateEntity>
    )

    companion object {
        fun provideFactory(repository: CareRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return CareCircleViewModel(repository) as T
                }
            }
    }
}
