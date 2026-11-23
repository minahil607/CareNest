package com.carecircle.app.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.carecircle.app.data.local.CareCircleDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter

class NotificationActionReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_MARK_TAKEN) return
        val medicationId = intent.getLongExtra(NotificationHelper.EXTRA_MEDICATION_ID, -1L)
        if (medicationId <= 0L) return

        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val db = CareCircleDatabase.getInstance(context)
                val medication = db.medicationDao().getById(medicationId)
                if (medication != null) {
                    val today = LocalDate.now().toEpochDay()
                    val nowLabel = LocalTime.now().format(DateTimeFormatter.ofPattern("h:mm a"))
                    db.medicationDao().update(
                        medication.copy(
                            lastTakenEpochDay = today,
                            lastTakenTimeLabel = nowLabel
                        )
                    )
                }
                NotificationHelper.cancelNotification(context, medicationId)
            } finally {
                pendingResult.finish()
            }
        }
    }

    companion object {
        const val ACTION_MARK_TAKEN = "com.carecircle.app.ACTION_MARK_MEDICATION_TAKEN"
    }
}
