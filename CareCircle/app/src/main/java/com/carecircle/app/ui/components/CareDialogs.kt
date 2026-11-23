package com.carecircle.app.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.carecircle.app.data.local.AppointmentEntity
import com.carecircle.app.data.local.CareTaskEntity
import com.carecircle.app.data.local.MedicationEntity
import java.time.LocalDate

@Composable
fun MedicationFormDialog(
    existing: MedicationEntity? = null,
    onDismiss: () -> Unit,
    onSave: (MedicationEntity) -> Unit
) {
    var name by remember { mutableStateOf(existing?.name ?: "") }
    var dosage by remember { mutableStateOf(existing?.dosage ?: "") }
    var instructions by remember { mutableStateOf(existing?.instructions ?: "") }
    var hour by remember { mutableIntStateOf(existing?.hour ?: 9) }
    var minute by remember { mutableIntStateOf(existing?.minute ?: 0) }
    var reminderEnabled by remember { mutableStateOf(existing?.reminderEnabled ?: true) }
    var showTimePicker by remember { mutableStateOf(false) }

    if (showTimePicker) {
        CareTimePickerDialog(
            initialHour = hour,
            initialMinute = minute,
            onDismiss = { showTimePicker = false },
            onConfirm = { h, m ->
                hour = h
                minute = m
                showTimePicker = false
            }
        )
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = if (existing == null) "Add Medication" else "Edit Medication",
                style = MaterialTheme.typography.titleLarge
            )
        },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Medicine Name *") },
                    placeholder = { Text("e.g. Lisinopril") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = dosage,
                    onValueChange = { dosage = it },
                    label = { Text("Dosage *") },
                    placeholder = { Text("e.g. 10 mg • 1 tablet") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = instructions,
                    onValueChange = { instructions = it },
                    label = { Text("Instructions") },
                    placeholder = { Text("e.g. Take with water after breakfast") },
                    maxLines = 3,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedButton(
                    onClick = { showTimePicker = true },
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Rounded.Schedule, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Reminder Time: ${CareFormatters.formatTime(hour, minute)}")
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Daily Notification",
                            style = MaterialTheme.typography.titleSmall
                        )
                        Text(
                            text = "Trigger Android reminder at this time",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                    Switch(
                        checked = reminderEnabled,
                        onCheckedChange = { reminderEnabled = it }
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val item = MedicationEntity(
                        id = existing?.id ?: 0L,
                        name = name.trim(),
                        dosage = dosage.trim().ifBlank { "1 dose" },
                        instructions = instructions.trim(),
                        hour = hour,
                        minute = minute,
                        reminderEnabled = reminderEnabled,
                        lastTakenEpochDay = existing?.lastTakenEpochDay,
                        lastTakenTimeLabel = existing?.lastTakenTimeLabel
                    )
                    onSave(item)
                },
                enabled = name.isNotBlank(),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(if (existing == null) "Add Medicine" else "Save Changes")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun TaskFormDialog(
    existing: CareTaskEntity? = null,
    onDismiss: () -> Unit,
    onSave: (CareTaskEntity) -> Unit
) {
    var title by remember { mutableStateOf(existing?.title ?: "") }
    var details by remember { mutableStateOf(existing?.details ?: "") }
    var hour by remember { mutableIntStateOf(existing?.dueHour ?: 10) }
    var minute by remember { mutableIntStateOf(existing?.dueMinute ?: 0) }
    var showTimePicker by remember { mutableStateOf(false) }

    if (showTimePicker) {
        CareTimePickerDialog(
            initialHour = hour,
            initialMinute = minute,
            onDismiss = { showTimePicker = false },
            onConfirm = { h, m ->
                hour = h
                minute = m
                showTimePicker = false
            }
        )
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = if (existing == null) "Add Care Task" else "Edit Care Task",
                style = MaterialTheme.typography.titleLarge
            )
        },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Task Title *") },
                    placeholder = { Text("e.g. Check blood pressure") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = details,
                    onValueChange = { details = it },
                    label = { Text("Care Notes") },
                    placeholder = { Text("Optional instructions") },
                    maxLines = 3,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedButton(
                    onClick = { showTimePicker = true },
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Rounded.Schedule, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Due Time: ${CareFormatters.formatTime(hour, minute)}")
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onSave(
                        CareTaskEntity(
                            id = existing?.id ?: 0L,
                            title = title.trim(),
                            details = details.trim(),
                            dueHour = hour,
                            dueMinute = minute,
                            lastCompletedEpochDay = existing?.lastCompletedEpochDay
                        )
                    )
                },
                enabled = title.isNotBlank(),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(if (existing == null) "Add Task" else "Save Changes")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun AppointmentFormDialog(
    existing: AppointmentEntity? = null,
    onDismiss: () -> Unit,
    onSave: (AppointmentEntity) -> Unit
) {
    var doctorName by remember { mutableStateOf(existing?.doctorName ?: "") }
    var specialty by remember { mutableStateOf(existing?.specialty ?: "") }
    var location by remember { mutableStateOf(existing?.location ?: "") }
    var notes by remember { mutableStateOf(existing?.notes ?: "") }
    var dateEpochDay by remember {
        mutableLongStateOf(existing?.dateEpochDay ?: LocalDate.now().plusDays(1).toEpochDay())
    }
    var hour by remember { mutableIntStateOf(existing?.hour ?: 10) }
    var minute by remember { mutableIntStateOf(existing?.minute ?: 30) }
    var showDatePicker by remember { mutableStateOf(false) }
    var showTimePicker by remember { mutableStateOf(false) }

    if (showDatePicker) {
        CareDatePickerDialog(
            initialEpochDay = dateEpochDay,
            onDismiss = { showDatePicker = false },
            onConfirm = {
                dateEpochDay = it
                showDatePicker = false
            }
        )
    }

    if (showTimePicker) {
        CareTimePickerDialog(
            initialHour = hour,
            initialMinute = minute,
            onDismiss = { showTimePicker = false },
            onConfirm = { h, m ->
                hour = h
                minute = m
                showTimePicker = false
            }
        )
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = if (existing == null) "Add Appointment" else "Edit Appointment",
                style = MaterialTheme.typography.titleLarge
            )
        },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = doctorName,
                    onValueChange = { doctorName = it },
                    label = { Text("Doctor / Provider *") },
                    placeholder = { Text("e.g. Dr. Elena Rostova") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = specialty,
                    onValueChange = { specialty = it },
                    label = { Text("Specialty") },
                    placeholder = { Text("e.g. Cardiology") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = location,
                    onValueChange = { location = it },
                    label = { Text("Clinic / Location") },
                    placeholder = { Text("e.g. Mercy Heart Clinic") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedButton(
                    onClick = { showDatePicker = true },
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Rounded.CalendarMonth, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(CareFormatters.formatAppointmentDate(dateEpochDay))
                }
                OutlinedButton(
                    onClick = { showTimePicker = true },
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Rounded.Schedule, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Time: ${CareFormatters.formatTime(hour, minute)}")
                }
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Visit Notes") },
                    placeholder = { Text("What to bring or ask") },
                    maxLines = 3,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onSave(
                        AppointmentEntity(
                            id = existing?.id ?: 0L,
                            doctorName = doctorName.trim(),
                            specialty = specialty.trim().ifBlank { "General Care" },
                            location = location.trim().ifBlank { "Clinic" },
                            dateEpochDay = dateEpochDay,
                            hour = hour,
                            minute = minute,
                            notes = notes.trim(),
                            isCompleted = existing?.isCompleted ?: false
                        )
                    )
                },
                enabled = doctorName.isNotBlank(),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(if (existing == null) "Save Visit" else "Save Changes")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
