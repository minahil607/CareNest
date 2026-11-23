package com.carecircle.app.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.carecircle.app.data.local.CareCircleDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MedicationAlarmReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val medicationId = intent.getLongExtra(NotificationHelper.EXTRA_MEDICATION_ID, -1L)
        if (medicationId <= 0L) return

        val fallbackName = intent.getStringExtra(NotificationHelper.EXTRA_MEDICATION_NAME) ?: "Medication"
        val fallbackDosage = intent.getStringExtra(NotificationHelper.EXTRA_MEDICATION_DOSAGE) ?: ""
        val fallbackInstructions =
            intent.getStringExtra(NotificationHelper.EXTRA_MEDICATION_INSTRUCTIONS) ?: ""

        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val db = CareCircleDatabase.getInstance(context)
                val medication = db.medicationDao().getById(medicationId)

                if (medication != null) {
                    if (medication.reminderEnabled) {
                        NotificationHelper.showMedicationNotification(
                            context = context,
                            medicationId = medication.id,
                            name = medication.name,
                            dosage = medication.dosage,
                            instructions = medication.instructions
                        )
                        // Schedule tomorrow's daily reminder
                        MedicationAlarmScheduler(context)
                            .scheduleMedication(medication, forceNextDay = true)
                    }
                } else {
                    NotificationHelper.showMedicationNotification(
                        context = context,
                        medicationId = medicationId,
                        name = fallbackName,
                        dosage = fallbackDosage,
                        instructions = fallbackInstructions
                    )
                }
            } finally {
                pendingResult.finish()
            }
        }
    }
}
