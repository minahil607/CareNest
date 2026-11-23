package com.carecircle.app.notifications

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.carecircle.app.data.local.MedicationEntity
import java.time.ZonedDateTime

class MedicationAlarmScheduler(private val context: Context) {

    private val alarmManager: AlarmManager =
        context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    fun canScheduleExactAlarms(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            alarmManager.canScheduleExactAlarms()
        } else {
            true
        }
    }

    fun scheduleMedication(medication: MedicationEntity, forceNextDay: Boolean = false) {
        if (!medication.reminderEnabled) {
            cancelMedication(medication.id)
            return
        }

        val triggerAtMillis = computeNextTriggerMillis(
            hour = medication.hour,
            minute = medication.minute,
            forceNextDay = forceNextDay
        )

        val pendingIntent = buildPendingIntent(medication)
        scheduleTrigger(triggerAtMillis, pendingIntent)
    }

    fun cancelMedication(medicationId: Long) {
        val intent = Intent(context, MedicationAlarmReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            medicationId.toInt(),
            intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent)
            pendingIntent.cancel()
        }
    }

    fun rescheduleAll(medications: List<MedicationEntity>) {
        medications.forEach { medication ->
            if (medication.reminderEnabled) {
                scheduleMedication(medication)
            } else {
                cancelMedication(medication.id)
            }
        }
    }

    private fun buildPendingIntent(medication: MedicationEntity): PendingIntent {
        val intent = Intent(context, MedicationAlarmReceiver::class.java).apply {
            putExtra(NotificationHelper.EXTRA_MEDICATION_ID, medication.id)
            putExtra(NotificationHelper.EXTRA_MEDICATION_NAME, medication.name)
            putExtra(NotificationHelper.EXTRA_MEDICATION_DOSAGE, medication.dosage)
            putExtra(NotificationHelper.EXTRA_MEDICATION_INSTRUCTIONS, medication.instructions)
            putExtra(NotificationHelper.EXTRA_MEDICATION_HOUR, medication.hour)
            putExtra(NotificationHelper.EXTRA_MEDICATION_MINUTE, medication.minute)
        }
        return PendingIntent.getBroadcast(
            context,
            medication.id.toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private fun scheduleTrigger(triggerAtMillis: Long, pendingIntent: PendingIntent) {
        try {
            if (canScheduleExactAlarms()) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerAtMillis,
                    pendingIntent
                )
            } else {
                alarmManager.setAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerAtMillis,
                    pendingIntent
                )
            }
        } catch (_: SecurityException) {
            alarmManager.setAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerAtMillis,
                pendingIntent
            )
        }
    }

    private fun computeNextTriggerMillis(
        hour: Int,
        minute: Int,
        forceNextDay: Boolean
    ): Long {
        val now = ZonedDateTime.now()
        var candidate = now
            .withHour(hour.coerceIn(0, 23))
            .withMinute(minute.coerceIn(0, 59))
            .withSecond(0)
            .withNano(0)

        if (forceNextDay || !candidate.isAfter(now.plusSeconds(3))) {
            candidate = candidate.plusDays(1)
        }
        return candidate.toInstant().toEpochMilli()
    }
}
