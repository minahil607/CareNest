package com.carecircle.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AddTask
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.EventAvailable
import androidx.compose.material.icons.rounded.LocationOn
import androidx.compose.material.icons.rounded.Medication
import androidx.compose.material.icons.rounded.RadioButtonUnchecked
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material.icons.rounded.TaskAlt
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.carecircle.app.data.local.AppointmentEntity
import com.carecircle.app.data.local.CareTaskEntity
import com.carecircle.app.data.local.MedicationEntity
import com.carecircle.app.ui.components.AppointmentFormDialog
import com.carecircle.app.ui.components.CareCard
import com.carecircle.app.ui.components.CareFormatters
import com.carecircle.app.ui.components.EmptyStateCard
import com.carecircle.app.ui.components.InfoBadgeRow
import com.carecircle.app.ui.components.MedicationFormDialog
import com.carecircle.app.ui.components.SectionHeader
import com.carecircle.app.ui.components.StatusPill
import com.carecircle.app.ui.components.TaskFormDialog
import com.carecircle.app.ui.theme.CareGreenContainer
import com.carecircle.app.ui.theme.CareGreenOnContainer
import com.carecircle.app.ui.theme.CareGreenPrimary
import com.carecircle.app.ui.theme.CareGreenSecondaryContainer
import com.carecircle.app.ui.theme.CareSurface
import com.carecircle.app.ui.theme.CareTextSecondary
import com.carecircle.app.ui.viewmodel.CareCircleUiState
import java.time.LocalDate
import java.time.LocalTime

@Composable
fun HomeScreen(
    uiState: CareCircleUiState,
    onToggleMedicationTaken: (MedicationEntity) -> Unit,
    onToggleTaskCompleted: (CareTaskEntity) -> Unit,
    onSaveMedication: (MedicationEntity) -> Unit,
    onSaveTask: (CareTaskEntity) -> Unit,
    onSaveAppointment: (AppointmentEntity) -> Unit,
    onNavigateToMedications: () -> Unit,
    onNavigateToTasksAppointments: () -> Unit,
    modifier: Modifier = Modifier
) {
    var showAddMedication by remember { mutableStateOf(false) }
    var showAddTask by remember { mutableStateOf(false) }
    var showAddAppointment by remember { mutableStateOf(false) }

    val today = remember { LocalDate.now() }
    val currentHour = remember { LocalTime.now().hour }
    val todayEpoch = uiState.todayEpochDay
    val medsTakenCount = uiState.medications.count { it.isTakenOn(todayEpoch) }
    val tasksDoneCount = uiState.tasks.count { it.isCompletedOn(todayEpoch) }
    val nextAppointment = remember(uiState.appointments, todayEpoch) {
        uiState.appointments
            .filter { !it.isCompleted && it.dateEpochDay >= todayEpoch }
            .minWithOrNull(compareBy({ it.dateEpochDay }, { it.hour }, { it.minute }))
    }

    if (showAddMedication) {
        MedicationFormDialog(
            onDismiss = { showAddMedication = false },
            onSave = {
                onSaveMedication(it)
                showAddMedication = false
            }
        )
    }

    if (showAddTask) {
        TaskFormDialog(
            onDismiss = { showAddTask = false },
            onSave = {
                onSaveTask(it)
                showAddTask = false
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

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        item {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = CareFormatters.formatFullDate(today),
                    style = MaterialTheme.typography.labelLarge,
                    color = CareGreenPrimary
                )
                Text(
                    text = "${CareFormatters.greetingForHour(currentHour)}!",
                    style = MaterialTheme.typography.headlineLarge
                )
                Text(
                    text = "Caring for ${uiState.profile?.recipientName ?: "your loved one"}",
                    style = MaterialTheme.typography.bodyLarge,
                    color = CareTextSecondary
                )
            }
        }

        item {
            CareCard(containerColor = CareGreenContainer, borderColor = CareGreenContainer) {
                Text(
                    text = "Today's Care Overview",
                    style = MaterialTheme.typography.titleMedium,
                    color = CareGreenOnContainer
                )
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    SummaryStatTile(
                        label = "Medicines Taken",
                        value = "$medsTakenCount / ${uiState.medications.size}",
                        modifier = Modifier.weight(1f)
                    )
                    SummaryStatTile(
                        label = "Tasks Completed",
                        value = "$tasksDoneCount / ${uiState.tasks.size}",
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "Quick Actions",
                    style = MaterialTheme.typography.titleMedium
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    QuickActionButton(
                        icon = Icons.Rounded.Medication,
                        label = "Add Medicine",
                        onClick = { showAddMedication = true },
                        modifier = Modifier.weight(1f)
                    )
                    QuickActionButton(
                        icon = Icons.Rounded.AddTask,
                        label = "Add Task",
                        onClick = { showAddTask = true },
                        modifier = Modifier.weight(1f)
                    )
                    QuickActionButton(
                        icon = Icons.Rounded.EventAvailable,
                        label = "Add Visit",
                        onClick = { showAddAppointment = true },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        item {
            SectionHeader(
                title = "Today's Medications",
                subtitle = "$medsTakenCount of ${uiState.medications.size} taken today",
                actionLabel = "View All",
                onActionClick = onNavigateToMedications
            )
        }

        if (uiState.medications.isEmpty()) {
            item {
                EmptyStateCard(
                    icon = Icons.Rounded.Medication,
                    title = "No medications yet",
                    message = "Add daily medicines to schedule reminders.",
                    actionLabel = "Add Medicine",
                    onActionClick = { showAddMedication = true }
                )
            }
        } else {
            items(uiState.medications, key = { "home_med_${it.id}" }) { med ->
                val isTaken = med.isTakenOn(todayEpoch)
                CareCard(
                    containerColor = if (isTaken) CareGreenSecondaryContainer.copy(alpha = 0.7f) else CareSurface
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                StatusPill(text = CareFormatters.formatTime(med.hour, med.minute))
                                if (isTaken) {
                                    StatusPill(
                                        text = "Taken",
                                        containerColor = CareGreenPrimary,
                                        contentColor = CareSurface
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = med.name,
                                style = MaterialTheme.typography.titleMedium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = med.dosage,
                                style = MaterialTheme.typography.bodyMedium,
                                color = CareTextSecondary
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        if (isTaken) {
                            FilledTonalButton(
                                onClick = { onToggleMedicationTaken(med) },
                                shape = RoundedCornerShape(14.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.CheckCircle,
                                    contentDescription = "Taken",
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Done")
                            }
                        } else {
                            Button(
                                onClick = { onToggleMedicationTaken(med) },
                                shape = RoundedCornerShape(14.dp)
                            ) {
                                Text("Mark Taken")
                            }
                        }
                    }
                }
            }
        }

        item {
            SectionHeader(
                title = "Today's Care Tasks",
                subtitle = "$tasksDoneCount of ${uiState.tasks.size} completed",
                actionLabel = "View All",
                onActionClick = onNavigateToTasksAppointments
            )
        }

        if (uiState.tasks.isEmpty()) {
            item {
                EmptyStateCard(
                    icon = Icons.Rounded.TaskAlt,
                    title = "No daily tasks",
                    message = "Add check-ins, walks, or blood pressure checks.",
                    actionLabel = "Add Task",
                    onActionClick = { showAddTask = true }
                )
            }
        } else {
            items(uiState.tasks, key = { "home_task_${it.id}" }) { task ->
                val isDone = task.isCompletedOn(todayEpoch)
                CareCard(
                    modifier = Modifier.clickable { onToggleTaskCompleted(task) },
                    containerColor = if (isDone) CareGreenSecondaryContainer.copy(alpha = 0.65f) else CareSurface
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = if (isDone) Icons.Rounded.CheckCircle else Icons.Rounded.RadioButtonUnchecked,
                            contentDescription = if (isDone) "Completed" else "Mark completed",
                            tint = if (isDone) CareGreenPrimary else CareTextSecondary,
                            modifier = Modifier.size(30.dp)
                        )
                        Spacer(modifier = Modifier.width(14.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = task.title,
                                style = MaterialTheme.typography.titleMedium,
                                textDecoration = if (isDone) TextDecoration.LineThrough else TextDecoration.None,
                                color = if (isDone) CareTextSecondary else MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            InfoBadgeRow(
                                icon = Icons.Rounded.Schedule,
                                text = "Due ${CareFormatters.formatTime(task.dueHour, task.dueMinute)}"
                            )
                        }
                    }
                }
            }
        }

        item {
            SectionHeader(
                title = "Upcoming Appointment",
                actionLabel = "Manage",
                onActionClick = onNavigateToTasksAppointments
            )
        }

        item {
            if (nextAppointment == null) {
                EmptyStateCard(
                    icon = Icons.Rounded.CalendarMonth,
                    title = "No upcoming visits",
                    message = "Schedule a doctor appointment when needed.",
                    actionLabel = "Add Appointment",
                    onActionClick = { showAddAppointment = true }
                )
            } else {
                CareCard {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        StatusPill(text = CareFormatters.formatAppointmentDate(nextAppointment.dateEpochDay))
                        StatusPill(
                            text = nextAppointment.specialty,
                            containerColor = CareGreenSecondaryContainer,
                            contentColor = CareGreenOnContainer
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = nextAppointment.doctorName,
                        style = MaterialTheme.typography.titleLarge
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    InfoBadgeRow(
                        icon = Icons.Rounded.Schedule,
                        text = CareFormatters.formatTime(nextAppointment.hour, nextAppointment.minute)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    InfoBadgeRow(
                        icon = Icons.Rounded.LocationOn,
                        text = nextAppointment.location
                    )
                    if (nextAppointment.notes.isNotBlank()) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = nextAppointment.notes,
                            style = MaterialTheme.typography.bodyMedium,
                            color = CareTextSecondary
                        )
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}

@Composable
private fun SummaryStatTile(
    label: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        color = CareSurface.copy(alpha = 0.85f)
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp)
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium,
                color = CareGreenPrimary,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = CareTextSecondary
            )
        }
    }
}

@Composable
private fun QuickActionButton(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.clip(RoundedCornerShape(18.dp)),
        shape = RoundedCornerShape(18.dp),
        color = CareSurface,
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
        onClick = onClick
    ) {
        Column(
            modifier = Modifier.padding(vertical = 14.dp, horizontal = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(CareGreenContainer),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = CareGreenPrimary,
                    modifier = Modifier.size(22.dp)
                )
            }
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}
