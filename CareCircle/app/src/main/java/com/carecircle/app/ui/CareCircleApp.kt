package com.carecircle.app.ui

import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.FamilyRestroom
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Medication
import androidx.compose.material.icons.outlined.TaskAlt
import androidx.compose.material.icons.rounded.FamilyRestroom
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Medication
import androidx.compose.material.icons.rounded.TaskAlt
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.carecircle.app.ui.screens.FamilyCareScreen
import com.carecircle.app.ui.screens.HomeScreen
import com.carecircle.app.ui.screens.MedicationsScreen
import com.carecircle.app.ui.screens.TasksAppointmentsScreen
import com.carecircle.app.ui.theme.CareBorder
import com.carecircle.app.ui.theme.CareGreenContainer
import com.carecircle.app.ui.theme.CareGreenOnContainer
import com.carecircle.app.ui.theme.CareGreenPrimary
import com.carecircle.app.ui.theme.CareSurface
import com.carecircle.app.ui.theme.CareTextSecondary
import com.carecircle.app.ui.viewmodel.CareCircleViewModel

enum class CareDestination(
    val route: String,
    val label: String,
    val contentDescription: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
) {
    HOME(
        route = "home",
        label = "Home",
        contentDescription = "Home screen",
        selectedIcon = Icons.Rounded.Home,
        unselectedIcon = Icons.Outlined.Home
    ),
    MEDICATIONS(
        route = "medications",
        label = "Medications",
        contentDescription = "Medications screen",
        selectedIcon = Icons.Rounded.Medication,
        unselectedIcon = Icons.Outlined.Medication
    ),
    TASKS_APPOINTMENTS(
        route = "tasks_appointments",
        label = "Tasks",
        contentDescription = "Tasks and Appointments screen",
        selectedIcon = Icons.Rounded.TaskAlt,
        unselectedIcon = Icons.Outlined.TaskAlt
    ),
    FAMILY_CARE(
        route = "family_care",
        label = "Family",
        contentDescription = "Family and Care screen",
        selectedIcon = Icons.Rounded.FamilyRestroom,
        unselectedIcon = Icons.Outlined.FamilyRestroom
    )
}

@Composable
fun CareCircleApp(
    viewModel: CareCircleViewModel,
    hasNotificationPermission: Boolean,
    onRequestNotificationPermission: () -> Unit
) {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route ?: CareDestination.HOME.route
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(viewModel) {
        viewModel.events.collect { message ->
            snackbarHostState.showSnackbar(message)
        }
    }

    fun navigateTo(destination: CareDestination) {
        navController.navigate(destination.route) {
            popUpTo(navController.graph.findStartDestination().id) {
                saveState = true
            }
            launchSingleTop = true
            restoreState = true
        }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = MaterialTheme.colorScheme.background,
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
        bottomBar = {
            CareCircleBottomBar(
                currentRoute = currentRoute,
                onSelectDestination = ::navigateTo
            )
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = CareDestination.HOME.route,
            enterTransition = { fadeIn(animationSpec = tween(180)) },
            exitTransition = { fadeOut(animationSpec = tween(180)) },
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .consumeWindowInsets(innerPadding)
        ) {
            composable(CareDestination.HOME.route) {
                HomeScreen(
                    uiState = uiState,
                    onToggleMedicationTaken = viewModel::toggleMedicationTaken,
                    onToggleTaskCompleted = viewModel::toggleTaskCompleted,
                    onSaveMedication = viewModel::saveMedication,
                    onSaveTask = viewModel::saveTask,
                    onSaveAppointment = viewModel::saveAppointment,
                    onNavigateToMedications = { navigateTo(CareDestination.MEDICATIONS) },
                    onNavigateToTasksAppointments = { navigateTo(CareDestination.TASKS_APPOINTMENTS) }
                )
            }

            composable(CareDestination.MEDICATIONS.route) {
                MedicationsScreen(
                    uiState = uiState,
                    hasNotificationPermission = hasNotificationPermission,
                    onRequestNotificationPermission = onRequestNotificationPermission,
                    onSaveMedication = viewModel::saveMedication,
                    onDeleteMedication = viewModel::deleteMedication,
                    onToggleMedicationTaken = viewModel::toggleMedicationTaken,
                    onToggleMedicationReminder = viewModel::toggleMedicationReminder,
                    onSendTestReminder = viewModel::sendTestMedicationReminder
                )
            }

            composable(CareDestination.TASKS_APPOINTMENTS.route) {
                TasksAppointmentsScreen(
                    uiState = uiState,
                    onSaveTask = viewModel::saveTask,
                    onDeleteTask = viewModel::deleteTask,
                    onToggleTaskCompleted = viewModel::toggleTaskCompleted,
                    onSaveAppointment = viewModel::saveAppointment,
                    onDeleteAppointment = viewModel::deleteAppointment,
                    onToggleAppointmentCompleted = viewModel::toggleAppointmentCompleted
                )
            }

            composable(CareDestination.FAMILY_CARE.route) {
                FamilyCareScreen(
                    uiState = uiState,
                    onSaveProfile = viewModel::saveProfile,
                    onUpdatePhoto = viewModel::updateRecipientPhoto,
                    onSaveEmergencyContact = viewModel::saveEmergencyContact,
                    onDeleteEmergencyContact = viewModel::deleteEmergencyContact,
                    onSaveFamilyMember = viewModel::saveFamilyMember,
                    onDeleteFamilyMember = viewModel::deleteFamilyMember,
                    onAddCareUpdate = viewModel::addCareUpdate,
                    onDeleteCareUpdate = viewModel::deleteCareUpdate
                )
            }
        }
    }
}

@Composable
private fun CareCircleBottomBar(
    currentRoute: String,
    onSelectDestination: (CareDestination) -> Unit
) {
    Column {
        HorizontalDivider(thickness = 1.dp, color = CareBorder)
        NavigationBar(
            containerColor = CareSurface,
            tonalElevation = 0.dp
        ) {
            CareDestination.entries.forEach { destination ->
                val selected = currentRoute == destination.route
                NavigationBarItem(
                    selected = selected,
                    onClick = { onSelectDestination(destination) },
                    alwaysShowLabel = true,
                    icon = {
                        Icon(
                            imageVector = if (selected) destination.selectedIcon else destination.unselectedIcon,
                            contentDescription = destination.contentDescription
                        )
                    },
                    label = {
                        Text(
                            text = destination.label,
                            maxLines = 1,
                            softWrap = false,
                            overflow = TextOverflow.Ellipsis,
                            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium
                        )
                    },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = CareGreenOnContainer,
                        selectedTextColor = CareGreenPrimary,
                        indicatorColor = CareGreenContainer,
                        unselectedIconColor = CareTextSecondary,
                        unselectedTextColor = CareTextSecondary
                    )
                )
            }
        }
    }
}
