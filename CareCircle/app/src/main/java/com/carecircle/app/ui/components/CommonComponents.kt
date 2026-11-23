package com.carecircle.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.carecircle.app.ui.theme.CareBorder
import com.carecircle.app.ui.theme.CareError
import com.carecircle.app.ui.theme.CareGreenContainer
import com.carecircle.app.ui.theme.CareGreenOnContainer
import com.carecircle.app.ui.theme.CareGreenPrimary
import com.carecircle.app.ui.theme.CareSurface
import com.carecircle.app.ui.theme.CareSurfaceVariant
import com.carecircle.app.ui.theme.CareTextSecondary
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

object CareFormatters {
    private val timeFormatter = DateTimeFormatter.ofPattern("h:mm a")
    private val fullDateFormatter = DateTimeFormatter.ofPattern("EEEE, MMM d")
    private val shortDateFormatter = DateTimeFormatter.ofPattern("EEE, MMM d")

    fun formatTime(hour: Int, minute: Int): String {
        return LocalTime.of(hour.coerceIn(0, 23), minute.coerceIn(0, 59)).format(timeFormatter)
    }

    fun formatFullDate(date: LocalDate): String = date.format(fullDateFormatter)

    fun formatAppointmentDate(epochDay: Long): String {
        val target = LocalDate.ofEpochDay(epochDay)
        val today = LocalDate.now()
        val diff = ChronoUnit.DAYS.between(today, target)
        return when (diff) {
            0L -> "Today • ${target.format(shortDateFormatter)}"
            1L -> "Tomorrow • ${target.format(shortDateFormatter)}"
            in 2L..6L -> "In $diff days • ${target.format(shortDateFormatter)}"
            else -> target.format(shortDateFormatter)
        }
    }

    fun formatRelativeMillis(createdAtMillis: Long): String {
        val diffMinutes = ((System.currentTimeMillis() - createdAtMillis) / 60_000L).coerceAtLeast(0L)
        return when {
            diffMinutes < 1L -> "Just now"
            diffMinutes < 60L -> "${diffMinutes}m ago"
            diffMinutes < 1_440L -> "${diffMinutes / 60L}h ago"
            else -> "${diffMinutes / 1_440L}d ago"
        }
    }

    fun greetingForHour(hour: Int): String = when (hour) {
        in 5..11 -> "Good morning"
        in 12..16 -> "Good afternoon"
        else -> "Good evening"
    }
}

@Composable
fun CareCard(
    modifier: Modifier = Modifier,
    containerColor: Color = CareSurface,
    borderColor: Color = CareBorder,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = containerColor),
        border = BorderStroke(1.dp, borderColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            content = content
        )
    }
}

@Composable
fun SectionHeader(
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    actionLabel: String? = null,
    onActionClick: (() -> Unit)? = null
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onBackground
            )
            if (!subtitle.isNullOrBlank()) {
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = CareTextSecondary
                )
            }
        }
        if (actionLabel != null && onActionClick != null) {
            TextButton(onClick = onActionClick) {
                Text(
                    text = actionLabel,
                    style = MaterialTheme.typography.labelLarge,
                    color = CareGreenPrimary
                )
            }
        }
    }
}

@Composable
fun StatusPill(
    text: String,
    containerColor: Color = CareGreenContainer,
    contentColor: Color = CareGreenOnContainer,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(50),
        color = containerColor
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold,
            color = contentColor,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp)
        )
    }
}

@Composable
fun EmptyStateCard(
    icon: ImageVector,
    title: String,
    message: String,
    actionLabel: String? = null,
    onActionClick: (() -> Unit)? = null
) {
    CareCard(containerColor = CareSurfaceVariant.copy(alpha = 0.65f)) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .clip(CircleShape)
                    .background(CareGreenContainer),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = CareGreenPrimary,
                    modifier = Modifier.size(28.dp)
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = CareTextSecondary
            )
            if (actionLabel != null && onActionClick != null) {
                Spacer(modifier = Modifier.height(14.dp))
                Button(
                    onClick = onActionClick,
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text(text = actionLabel)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CareTimePickerDialog(
    initialHour: Int,
    initialMinute: Int,
    onDismiss: () -> Unit,
    onConfirm: (hour: Int, minute: Int) -> Unit
) {
    val state = rememberTimePickerState(
        initialHour = initialHour.coerceIn(0, 23),
        initialMinute = initialMinute.coerceIn(0, 59),
        is24Hour = false
    )
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Choose Reminder Time",
                style = MaterialTheme.typography.titleMedium
            )
        },
        text = {
            Box(
                modifier = Modifier.fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                TimePicker(state = state)
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(state.hour, state.minute) },
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Set Time")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CareDatePickerDialog(
    initialEpochDay: Long,
    onDismiss: () -> Unit,
    onConfirm: (epochDay: Long) -> Unit
) {
    val initialMillis = LocalDate.ofEpochDay(initialEpochDay)
        .atStartOfDay(ZoneOffset.UTC)
        .toInstant()
        .toEpochMilli()
    val state = rememberDatePickerState(initialSelectedDateMillis = initialMillis)

    DatePickerDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(
                onClick = {
                    val selectedMillis = state.selectedDateMillis ?: initialMillis
                    val selectedDay = Instant.ofEpochMilli(selectedMillis)
                        .atZone(ZoneOffset.UTC)
                        .toLocalDate()
                        .toEpochDay()
                    onConfirm(selectedDay)
                },
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Select Date")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    ) {
        DatePicker(state = state)
    }
}

@Composable
fun DeleteConfirmationDialog(
    title: String,
    message: String,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(text = title, style = MaterialTheme.typography.titleMedium) },
        text = { Text(text = message, style = MaterialTheme.typography.bodyMedium) },
        confirmButton = {
            Button(
                onClick = onConfirm,
                colors = ButtonDefaults.buttonColors(containerColor = CareError),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Delete")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Keep")
            }
        }
    )
}

@Composable
fun InfoBadgeRow(
    icon: ImageVector,
    text: String,
    tint: Color = CareTextSecondary
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = tint,
            modifier = Modifier.size(18.dp)
        )
        Spacer(modifier = Modifier.width(6.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium,
            color = tint
        )
    }
}
