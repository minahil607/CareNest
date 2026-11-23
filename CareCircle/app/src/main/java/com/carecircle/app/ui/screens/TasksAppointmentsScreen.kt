package com.carecircle.app.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material.icons.rounded.LocationOn
import androidx.compose.material.icons.rounded.RadioButtonUnchecked
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material.icons.rounded.TaskAlt
import androidx.compose.material3.Button
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import com.carecircle.app.data.local.AppointmentEntity
import com.carecircle.app.data.local.CareTaskEntity
import com.carecircle.app.ui.components.AppointmentFormDialog
import com.carecircle.app.ui.components.CareCard
import com.carecircle.app.ui.components.CareFormatters
import com.carecircle.app.ui.components.DeleteConfirmationDialog
import com.carecircle.app.ui.components.EmptyStateCard
import com.carecircle.app.ui.components.InfoBadgeRow
import com.carecircle.app.ui.components.SectionHeader
import com.carecircle.app.ui.components.StatusPill
import com.carecircle.app.ui.components.TaskFormDialog
import com.carecircle.app.ui.theme.CareError
import com.carecircle.app.ui.theme.CareGreenContainer
import com.carecircle.app.ui.theme.CareGreenOnContainer
import com.carecircle.app.ui.theme.CareGreenPrimary
import com.carecircle.app.ui.theme.CareGreenSecondaryContainer
import com.carecircle.app.ui.theme.CareSurface
import com.carecircle.app.ui.theme.CareTextSecondary
import com.carecircle.app.ui.viewmodel.CareCircleUiState

private enum class TasksAppointmentsFilter(val label: String) {
    ALL("All"),
    TASKS("Daily Tasks"),
    APPOINTMENTS("Appointments")
}

@Composable
fun TasksAppointmentsScreen(
    uiState: CareCircleUiState,
    onSaveTask: (CareTaskEntity) -> Unit,
    onDeleteTask: (CareTaskEntity) -> Unit,
    onToggleTaskCompleted: (CareTaskEntity) -> Unit,
    onSaveAppointment: (AppointmentEntity) -> Unit,
    onDeleteAppointment: (AppointmentEntity) -> Unit,
    onToggleAppointmentCompleted: (AppointmentEntity) -> Unit,
    modifier: Modifier = Modifier
) {
    var filter by remember { mutableStateOf(TasksAppointmentsFilter.ALL) }
    var showAddTask by remember { mutableStateOf(false) }
    var editingTask by remember { mutableStateOf<CareTaskEntity?>(null) }
    var pendingDeleteTask by remember { mutableStateOf<CareTaskEntity?>(null) }

    var showAddAppointment by remember { mutableStateOf(false) }
    var editingAppointment by remember { mutableStateOf<AppointmentEntity?>(null) }
    var pendingDeleteAppointment by remember { mutableStateOf<AppointmentEntity?>(null) }

    val todayEpoch = uiState.todayEpochDay

    if (showAddTask) {
        TaskFormDialog(
            onDismiss = { showAddTask = false },
            onSave = {
                onSaveTask(it)
                showAddTask = false
            }
        )
    }

    editingTask?.let { task ->
        TaskFormDialog(
            existing = task,
            onDismiss = { editingTask = null },
            onSave = {
                onSaveTask(it)
                editingTask = null
            }
        )
    }

    pendingDeleteTask?.let { task ->
        DeleteConfirmationDialog(
            title = "Delete Task?",
            message = "Remove \"${task.title}\" from the daily checklist?",
            onDismiss = { pendingDeleteTask = null },
            onConfirm = {
                onDeleteTask(task)
                pendingDeleteTask = null
            }
        )
    }

    if (showAddAppointment) {
        AppointmentFormDialog(
            onDismiss = { showAddAppointment = false },
            onSave = {
                onSaveAppointment(it)
                showAddAppointment = false
            }
        )
    }

    editingAppointment?.let { appointment ->
        AppointmentFormDialog(
            existing = appointment,
            onDismiss = { editingAppointment = null },
            onSave = {
                onSaveAppointment(it)
                editingAppointment = null
            }
        )
    }

    pendingDeleteAppointment?.let { appointment ->
        DeleteConfirmationDialog(
            title = "Delete Appointment?",
            message = "Remove the visit with ${appointment.doctorName}?",
            onDismiss = { pendingDeleteAppointment = null },
            onConfirm = {
                onDeleteAppointment(appointment)
                pendingDeleteAppointment = null
            }
        )
    }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = "Tasks & Appointments",
                    style = MaterialTheme.typography.headlineMedium
                )
                Text(
                    text = "Daily care checklist and upcoming doctor visits",
                    style = MaterialTheme.typography.bodyMedium,
                    color = CareTextSecondary
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Button(
                    onClick = { showAddTask = true },
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Rounded.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Add Task")
                }
                OutlinedButton(
                    onClick = { showAddAppointment = true },
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Rounded.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Add Visit")
                }
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                TasksAppointmentsFilter.entries.forEach { option ->
                    FilterChip(
                        selected = filter == option,
                        onClick = { filter = option },
                        label = { Text(option.label) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = CareGreenContainer,
                            selectedLabelColor = CareGreenOnContainer
                        )
                    )
                }
            }
        }

        if (filter == TasksAppointmentsFilter.ALL || filter == TasksAppointmentsFilter.TASKS) {
            item {
                val completedCount = uiState.tasks.count { it.isCompletedOn(todayEpoch) }
                SectionHeader(
                    title = "Daily Care Checklist",
                    subtitle = "$completedCount of ${uiState.tasks.size} completed today",
                    actionLabel = "+ Task",
                    onActionClick = { showAddTask = true }
                )
            }

            if (uiState.tasks.isEmpty()) {
                item {
                    EmptyStateCard(
                        icon = Icons.Rounded.TaskAlt,
                        title = "No daily care tasks",
                        message = "Add blood pressure checks, meals, walks, or hygiene routines.",
                        actionLabel = "Add Care Task",
                        onActionClick = { showAddTask = true }
                    )
                }
            } else {
                items(uiState.tasks, key = { "task_${it.id}" }) { task ->
                    val isDone = task.isCompletedOn(todayEpoch)
                    CareCard(
                        modifier = Modifier.clickable { onToggleTaskCompleted(task) },
                        containerColor = if (isDone) CareGreenSecondaryContainer.copy(alpha = 0.65f) else CareSurface
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.Top
                        ) {
                            IconButton(
                                onClick = { onToggleTaskCompleted(task) },
                                modifier = Modifier.size(40.dp)
                            ) {
                                Icon(
                                    imageVector = if (isDone) Icons.Rounded.CheckCircle else Icons.Rounded.RadioButtonUnchecked,
                                    contentDescription = if (isDone) "Completed" else "Mark task done",
                                    tint = if (isDone) CareGreenPrimary else CareTextSecondary,
                                    modifier = Modifier.size(30.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = task.title,
                                    style = MaterialTheme.typography.titleMedium,
                                    textDecoration = if (isDone) TextDecoration.LineThrough else TextDecoration.None,
                                    color = if (isDone) CareTextSecondary else MaterialTheme.colorScheme.onSurface
                                )
                                if (task.details.isNotBlank()) {
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = task.details,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = CareTextSecondary
                                    )
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                InfoBadgeRow(
                                    icon = Icons.Rounded.Schedule,
                                    text = "Due ${CareFormatters.formatTime(task.dueHour, task.dueMinute)}"
                                )
                            }
                            Row {
                                IconButton(onClick = { editingTask = task }) {
                                    Icon(
                                        imageVector = Icons.Rounded.Edit,
                                        contentDescription = "Edit task",
                                        tint = CareTextSecondary
                                    )
                                }
                                IconButton(onClick = { pendingDeleteTask = task }) {
                                    Icon(
                                        imageVector = Icons.Rounded.DeleteOutline,
                                        contentDescription = "Delete task",
                                        tint = CareError
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        if (filter == TasksAppointmentsFilter.ALL || filter == TasksAppointmentsFilter.APPOINTMENTS) {
            item {
                val upcomingCount = uiState.appointments.count { !it.isCompleted }
                SectionHeader(
                    title = "Doctor Appointments",
                    subtitle = "$upcomingCount upcoming visits",
                    actionLabel = "+ Visit",
                    onActionClick = { showAddAppointment = true }
                )
            }

            if (uiState.appointments.isEmpty()) {
                item {
                    EmptyStateCard(
                        icon = Icons.Rounded.CalendarMonth,
                        title = "No appointments scheduled",
                        message = "Keep track of upcoming specialist and primary care visits.",
                        actionLabel = "Add Appointment",
                        onActionClick = { showAddAppointment = true }
                    )
                }
            } else {
                items(uiState.appointments, key = { "appt_${it.id}" }) { appt ->
                    CareCard(
                        containerColor = if (appt.isCompleted) {
                            CareGreenSecondaryContainer.copy(alpha = 0.55f)
                        } else {
                            CareSurface
                        }
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                StatusPill(
                                    text = CareFormatters.formatAppointmentDate(appt.dateEpochDay),
                                    containerColor = if (appt.isCompleted) CareGreenSecondaryContainer else CareGreenContainer
                                )
                                StatusPill(
                                    text = appt.specialty,
                                    containerColor = CareGreenSecondaryContainer,
                                    contentColor = CareGreenOnContainer
                                )
                            }
                            Row {
                                IconButton(onClick = { editingAppointment = appt }) {
                                    Icon(
                                        imageVector = Icons.Rounded.Edit,
                                        contentDescription = "Edit appointment",
                                        tint = CareTextSecondary
                                    )
                                }
                                IconButton(onClick = { pendingDeleteAppointment = appt }) {
                                    Icon(
                                        imageVector = Icons.Rounded.DeleteOutline,
                                        contentDescription = "Delete appointment",
                                        tint = CareError
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = appt.doctorName,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            textDecoration = if (appt.isCompleted) TextDecoration.LineThrough else TextDecoration.None
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        InfoBadgeRow(
                            icon = Icons.Rounded.Schedule,
                            text = CareFormatters.formatTime(appt.hour, appt.minute)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        InfoBadgeRow(
                            icon = Icons.Rounded.LocationOn,
                            text = appt.location
                        )
                        if (appt.notes.isNotBlank()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = appt.notes,
                                style = MaterialTheme.typography.bodyMedium,
                                color = CareTextSecondary
                            )
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        if (appt.isCompleted) {
                            FilledTonalButton(
                                onClick = { onToggleAppointmentCompleted(appt) },
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.CheckCircle,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Visit Completed")
                            }
                        } else {
                            OutlinedButton(
                                onClick = { onToggleAppointmentCompleted(appt) },
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Mark Visit Completed")
                            }
                        }
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(12.dp)) }
    }
}
