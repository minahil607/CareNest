package com.carecircle.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        MedicationEntity::class,
        CareTaskEntity::class,
        AppointmentEntity::class,
        CareProfileEntity::class,
        EmergencyContactEntity::class,
        FamilyMemberEntity::class,
        CareUpdateEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class CareCircleDatabase : RoomDatabase() {
    abstract fun medicationDao(): MedicationDao
    abstract fun careTaskDao(): CareTaskDao
    abstract fun appointmentDao(): AppointmentDao
    abstract fun careProfileDao(): CareProfileDao
    abstract fun emergencyContactDao(): EmergencyContactDao
    abstract fun familyMemberDao(): FamilyMemberDao
    abstract fun careUpdateDao(): CareUpdateDao

    companion object {
        @Volatile
        private var INSTANCE: CareCircleDatabase? = null

        fun getInstance(context: Context): CareCircleDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    CareCircleDatabase::class.java,
                    "care_circle_database"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                    .also { INSTANCE = it }
            }
        }
    }
}
