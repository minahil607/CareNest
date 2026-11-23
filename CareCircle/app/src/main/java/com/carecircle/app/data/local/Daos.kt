package com.carecircle.app.data.local

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface MedicationDao {
    @Query("SELECT * FROM medications ORDER BY hour ASC, minute ASC, id ASC")
    fun observeAll(): Flow<List<MedicationEntity>>

    @Query("SELECT * FROM medications ORDER BY hour ASC, minute ASC, id ASC")
    suspend fun getAllOnce(): List<MedicationEntity>

    @Query("SELECT * FROM medications WHERE id = :id LIMIT 1")
    suspend fun getById(id: Long): MedicationEntity?

    @Query("SELECT COUNT(*) FROM medications")
    suspend fun count(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(medication: MedicationEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(medications: List<MedicationEntity>): List<Long>

    @Update
    suspend fun update(medication: MedicationEntity)

    @Delete
    suspend fun delete(medication: MedicationEntity)
}

@Dao
interface CareTaskDao {
    @Query("SELECT * FROM care_tasks ORDER BY dueHour ASC, dueMinute ASC, id ASC")
    fun observeAll(): Flow<List<CareTaskEntity>>

    @Query("SELECT COUNT(*) FROM care_tasks")
    suspend fun count(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(task: CareTaskEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(tasks: List<CareTaskEntity>)

    @Update
    suspend fun update(task: CareTaskEntity)

    @Delete
    suspend fun delete(task: CareTaskEntity)
}

@Dao
interface AppointmentDao {
    @Query("SELECT * FROM appointments ORDER BY isCompleted ASC, dateEpochDay ASC, hour ASC, minute ASC")
    fun observeAll(): Flow<List<AppointmentEntity>>

    @Query("SELECT COUNT(*) FROM appointments")
    suspend fun count(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(appointment: AppointmentEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(appointments: List<AppointmentEntity>)

    @Update
    suspend fun update(appointment: AppointmentEntity)

    @Delete
    suspend fun delete(appointment: AppointmentEntity)
}

@Dao
interface CareProfileDao {
    @Query("SELECT * FROM care_profile WHERE id = 1 LIMIT 1")
    fun observeProfile(): Flow<CareProfileEntity?>

    @Query("SELECT * FROM care_profile WHERE id = 1 LIMIT 1")
    suspend fun getProfileOnce(): CareProfileEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(profile: CareProfileEntity)
}

@Dao
interface EmergencyContactDao {
    @Query("SELECT * FROM emergency_contacts ORDER BY isPrimary DESC, id ASC")
    fun observeAll(): Flow<List<EmergencyContactEntity>>

    @Query("SELECT COUNT(*) FROM emergency_contacts")
    suspend fun count(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(contact: EmergencyContactEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(contacts: List<EmergencyContactEntity>)

    @Update
    suspend fun update(contact: EmergencyContactEntity)

    @Delete
    suspend fun delete(contact: EmergencyContactEntity)
}

@Dao
interface FamilyMemberDao {
    @Query("SELECT * FROM family_members ORDER BY id ASC")
    fun observeAll(): Flow<List<FamilyMemberEntity>>

    @Query("SELECT COUNT(*) FROM family_members")
    suspend fun count(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(member: FamilyMemberEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(members: List<FamilyMemberEntity>)

    @Update
    suspend fun update(member: FamilyMemberEntity)

    @Delete
    suspend fun delete(member: FamilyMemberEntity)
}

@Dao
interface CareUpdateDao {
    @Query("SELECT * FROM care_updates ORDER BY createdAtMillis DESC")
    fun observeAll(): Flow<List<CareUpdateEntity>>

    @Query("SELECT COUNT(*) FROM care_updates")
    suspend fun count(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(update: CareUpdateEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(updates: List<CareUpdateEntity>)

    @Delete
    suspend fun delete(update: CareUpdateEntity)
}
