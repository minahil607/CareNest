package com.carecircle.app.notifications

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.carecircle.app.MainActivity
import com.carecircle.app.R

object NotificationHelper {

    const val CHANNEL_ID_MEDICATION = "carecircle_medications"
    const val EXTRA_MEDICATION_ID = "extra_medication_id"
    const val EXTRA_MEDICATION_NAME = "extra_medication_name"
    const val EXTRA_MEDICATION_DOSAGE = "extra_medication_dosage"
    const val EXTRA_MEDICATION_INSTRUCTIONS = "extra_medication_instructions"
    const val EXTRA_MEDICATION_HOUR = "extra_medication_hour"
    const val EXTRA_MEDICATION_MINUTE = "extra_medication_minute"

    fun createNotificationChannels(context: Context) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel = NotificationChannel(
            CHANNEL_ID_MEDICATION,
            context.getString(R.string.notification_channel_name),
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = context.getString(R.string.notification_channel_description)
            enableVibration(true)
        }
        manager.createNotificationChannel(channel)
    }

    fun hasNotificationPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }

    fun showMedicationNotification(
        context: Context,
        medicationId: Long,
        name: String,
        dosage: String,
        instructions: String
    ) {
        if (!hasNotificationPermission(context)) return
        createNotificationChannels(context)

        val openAppIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val openPendingIntent = PendingIntent.getActivity(
            context,
            medicationId.toInt(),
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val markTakenIntent = Intent(context, NotificationActionReceiver::class.java).apply {
            action = NotificationActionReceiver.ACTION_MARK_TAKEN
            putExtra(EXTRA_MEDICATION_ID, medicationId)
        }
        val markTakenPendingIntent = PendingIntent.getBroadcast(
            context,
            (medicationId * 1000 + 1).toInt(),
            markTakenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val detailLine = buildString {
            append(dosage)
            if (instructions.isNotBlank()) {
                append(" • ")
                append(instructions)
            }
        }

        val notification = NotificationCompat.Builder(context, CHANNEL_ID_MEDICATION)
            .setSmallIcon(R.drawable.ic_medication_notification)
            .setContentTitle("Medication Reminder: $name")
            .setContentText(detailLine)
            .setStyle(NotificationCompat.BigTextStyle().bigText(detailLine))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setContentIntent(openPendingIntent)
            .addAction(
                R.drawable.ic_medication_notification,
                "Mark as Taken",
                markTakenPendingIntent
            )
            .build()

        try {
            NotificationManagerCompat.from(context).notify(medicationId.toInt(), notification)
        } catch (_: SecurityException) {
            // Permission may have been revoked between check and notify
        }
    }

    fun cancelNotification(context: Context, medicationId: Long) {
        NotificationManagerCompat.from(context).cancel(medicationId.toInt())
    }
}
