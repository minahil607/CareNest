package com.carecircle.app

import android.app.Application
import com.carecircle.app.data.local.CareCircleDatabase
import com.carecircle.app.data.repository.CareRepository
import com.carecircle.app.notifications.MedicationAlarmScheduler
import com.carecircle.app.notifications.NotificationHelper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class AppContainer(application: Application) {
    val database: CareCircleDatabase by lazy {
        CareCircleDatabase.getInstance(application)
    }
    val alarmScheduler: MedicationAlarmScheduler by lazy {
        MedicationAlarmScheduler(application)
    }
    val repository: CareRepository by lazy {
        CareRepository(
            context = application,
            database = database,
            alarmScheduler = alarmScheduler
        )
    }
}

class CareCircleApplication : Application() {
    lateinit var container: AppContainer
        private set

    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
        NotificationHelper.createNotificationChannels(this)
        applicationScope.launch {
            container.repository.ensureSeedData()
        }
    }
}
