package com.carecircle.app.ui.screens

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material.icons.rounded.Medication
import androidx.compose.material.icons.rounded.NotificationsActive
import androidx.compose.material.icons.rounded.NotificationsOff
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material3.Button
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.carecircle.app.data.local.MedicationEntity
import com.carecircle.app.ui.components.CareCard
import com.carecircle.app.ui.components.CareFormatters
import com.carecircle.app.ui.components.DeleteConfirmationDialog
import com.carecircle.app.ui.components.EmptyStateCard
import com.carecircle.app.ui.components.InfoBadgeRow
import com.carecircle.app.ui.components.MedicationFormDialog
import com.carecircle.app.ui.components.StatusPill
import com.carecircle.app.ui.theme.CareError
import com.carecircle.app.ui.theme.CareGreenContainer
import com.carecircle.app.ui.theme.CareGreenOnContainer
import com.carecircle.app.ui.theme.CareGreenPrimary
import com.carecircle.app.ui.theme.CareGreenSecondaryContainer
import com.carecircle.app.ui.theme.CareSurface
import com.carecircle.app.ui.theme.CareTextSecondary
import com.carecircle.app.ui.theme.CareWarning
import com.carecircle.app.ui.theme.CareWarningContainer
import com.carecircle.app.ui.viewmodel.CareCircleUiState

@Composable
fun MedicationsScreen(
    uiState: CareCircleUiState,
    hasNotificationPermission: Boolean,
    onRequestNotificationPermission: () -> Unit,
    onSaveMedication: (MedicationEntity) -> Unit,
    onDeleteMedication: (MedicationEntity) -> Unit,
    onToggleMedicationTaken: (MedicationEntity) -> Unit,
    onToggleMedicationReminder: (MedicationEntity) -> Unit,
    onSendTestReminder: (MedicationEntity) -> Unit,
    modifier: Modifier = Modifier
) {
    var editingMedication by remember { mutableStateOf<MedicationEntity?>(null) }
    var showAddDialog by remember { mutableStateOf(false) }
    var pendingDelete by remember { mutableStateOf<MedicationEntity?>(null) }

    val todayEpoch = uiState.todayEpochDay

    if (showAddDialog) {
        MedicationFormDialog(
            onDismiss = { showAddDialog = false },
            onSave = {
                onSaveMedication(it)
                showAddDialog = false
            }
        )
    }

    editingMedication?.let { med ->
        MedicationFormDialog(
            existing = med,
            onDismiss = { editingMedication = null },
            onSave = {
                onSaveMedication(it)
                editingMedication = null
            }
        )
    }

    pendingDelete?.let { med ->
        DeleteConfirmationDialog(
            title = "Remove Medication?",
            message = "Delete ${med.name} and cancel its daily reminder?",
            onDismiss = { pendingDelete = null },
            onConfirm = {
                onDeleteMedication(med)
                pendingDelete = null
            }
        )
    }

    Box(modifier = modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(
                start = 16.dp,
                end = 16.dp,
                top = 16.dp,
                bottom = 92.dp
            ),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = "Medications",
                        style = MaterialTheme.typography.headlineMedium
                    )
                    Text(
                        text = "Manage daily medicines, dosage, and reminder alerts",
                        style = MaterialTheme.typography.bodyMedium,
                        color = CareTextSecondary
                    )
                }
            }

            if (!hasNotificationPermission) {
                item {
                    CareCard(
                        containerColor = CareWarningContainer,
                        borderColor = CareWarning.copy(alpha = 0.35f)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.NotificationsOff,
                                contentDescription = null,
                                tint = CareWarning
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Notifications are turned off",
                                    style = MaterialTheme.typography.titleSmall,
                                    color = CareWarning
                                )
                                Text(
                                    text = "Allow notifications so scheduled pill reminders appear on time.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = CareWarning
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(10.dp))
                        Button(
                            onClick = onRequestNotificationPermission,
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Allow Notifications")
                        }
                    }
                }
            }

            if (uiState.medications.isEmpty()) {
                item {
                    EmptyStateCard(
                        icon = Icons.Rounded.Medication,
                        title = "No medicines scheduled",
                        message = "Tap Add Medicine to set up dosage and daily reminder times.",
                        actionLabel = "Add Medicine",
                        onActionClick = { showAddDialog = true }
                    )
                }
            } else {
                items(uiState.medications, key = { it.id }) { med ->
                    val isTaken = med.isTakenOn(todayEpoch)
                    CareCard(
                        containerColor = if (isTaken) {
                            CareGreenSecondaryContainer.copy(alpha = 0.65f)
                        } else {
                            CareSurface
                        }
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                StatusPill(
                                    text = CareFormatters.formatTime(med.hour, med.minute),
                                    containerColor = CareGreenContainer,
                                    contentColor = CareGreenOnContainer
                                )
                                if (isTaken) {
                                    StatusPill(
                                        text = med.lastTakenTimeLabel?.let { "Taken $it" } ?: "Taken",
                                        containerColor = CareGreenPrimary,
                                        contentColor = CareSurface
                                    )
                                }
                            }
                            Row {
                                IconButton(onClick = { onSendTestReminder(med) }) {
                                    Icon(
                                        imageVector = Icons.Rounded.NotificationsActive,
                                        contentDescription = "Send test notification",
                                        tint = CareGreenPrimary
                                    )
                                }
                                IconButton(onClick = { editingMedication = med }) {
                                    Icon(
                                        imageVector = Icons.Rounded.Edit,
                                        contentDescription = "Edit ${med.name}",
                                        tint = CareTextSecondary
                                    )
                                }
                                IconButton(onClick = { pendingDelete = med }) {
                                    Icon(
                                        imageVector = Icons.Rounded.DeleteOutline,
                                        contentDescription = "Delete ${med.name}",
                                        tint = CareError
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = med.name,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = med.dosage,
                            style = MaterialTheme.typography.titleSmall,
                            color = CareGreenPrimary
                        )
                        if (med.instructions.isNotBlank()) {
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = med.instructions,
                                style = MaterialTheme.typography.bodyMedium,
                                color = CareTextSecondary
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        HorizontalDivider(color = MaterialTheme.colorScheme.outline)
                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                InfoBadgeRow(
                                    icon = Icons.Rounded.Schedule,
                                    text = if (med.reminderEnabled) "Daily alert on" else "Alert paused"
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Switch(
                                    checked = med.reminderEnabled,
                                    onCheckedChange = { onToggleMedicationReminder(med) }
                                )
                            }

                            if (isTaken) {
                                FilledTonalButton(
                                    onClick = { onToggleMedicationTaken(med) },
                                    shape = RoundedCornerShape(14.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Rounded.CheckCircle,
                                        contentDescription = null,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Taken Today")
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
        }

        ExtendedFloatingActionButton(
            onClick = { showAddDialog = true },
            icon = { Icon(Icons.Rounded.Add, contentDescription = null) },
            text = { Text("Add Medicine") },
            containerColor = CareGreenPrimary,
            contentColor = CareSurface,
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(16.dp)
        )
    }
}
