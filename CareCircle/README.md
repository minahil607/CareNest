# CareCircle — Family Care & Reminder App (Android)

A native Android application built with **Kotlin**, **Jetpack Compose**, **Material 3**, **Room Database**, **AlarmManager**, and **MVVM** architecture.

## Screens
1. **Home** — Time-aware greeting, current date, daily progress summary, quick actions to add medicines/tasks/appointments, today's medication reminders, today's tasks, and upcoming appointment.
2. **Medications** — Full medicine list with dosage & instructions, reminder times, add/edit/delete dialogs, "Mark Taken" status, daily notification toggles scheduled via `AlarmManager`, and `POST_NOTIFICATIONS` permission handling.
3. **Tasks & Appointments** — Daily care checklist with due times and completion tracking, plus upcoming doctor appointments with DatePicker/TimePicker and visit notes.
4. **Family & Care** — Care recipient profile with photo picker, basic medical details, high-visibility allergies & care notes, emergency contacts with one-tap `ACTION_DIAL` calling, family care circle members, and shared care updates log.

## Opening in Android Studio
1. Open **Android Studio** (Ladybug 2024.2 or newer recommended).
2. Select **File → Open** and choose the `CareCircle` folder.
3. Wait for Gradle Sync to finish (uses `compileSdk = 35`, `minSdk = 26`, Kotlin `2.0.21`, KSP, and Compose BOM `2024.10.01`).
4. Run on an Android phone or emulator (API 26+).
