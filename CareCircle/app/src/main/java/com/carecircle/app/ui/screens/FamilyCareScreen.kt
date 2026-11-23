package com.carecircle.app.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Call
import androidx.compose.material.icons.rounded.CameraAlt
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.Group
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.LocalHospital
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Send
import androidx.compose.material.icons.rounded.WarningAmber
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.carecircle.app.data.local.CareProfileEntity
import com.carecircle.app.data.local.CareUpdateEntity
import com.carecircle.app.data.local.EmergencyContactEntity
import com.carecircle.app.data.local.FamilyMemberEntity
import com.carecircle.app.ui.components.CareCard
import com.carecircle.app.ui.components.CareFormatters
import com.carecircle.app.ui.components.DeleteConfirmationDialog
import com.carecircle.app.ui.components.EmptyStateCard
import com.carecircle.app.ui.components.InfoBadgeRow
import com.carecircle.app.ui.components.SectionHeader
import com.carecircle.app.ui.components.StatusPill
import com.carecircle.app.ui.theme.CareError
import com.carecircle.app.ui.theme.CareErrorContainer
import com.carecircle.app.ui.theme.CareGreenContainer
import com.carecircle.app.ui.theme.CareGreenOnContainer
import com.carecircle.app.ui.theme.CareGreenPrimary
import com.carecircle.app.ui.theme.CareGreenSecondaryContainer
import com.carecircle.app.ui.theme.CareOnErrorContainer
import com.carecircle.app.ui.theme.CareSurface
import com.carecircle.app.ui.theme.CareTextSecondary
import com.carecircle.app.ui.viewmodel.CareCircleUiState

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun FamilyCareScreen(
    uiState: CareCircleUiState,
    onSaveProfile: (CareProfileEntity) -> Unit,
    onUpdatePhoto: (String?) -> Unit,
    onSaveEmergencyContact: (EmergencyContactEntity) -> Unit,
    onDeleteEmergencyContact: (EmergencyContactEntity) -> Unit,
    onSaveFamilyMember: (FamilyMemberEntity) -> Unit,
    onDeleteFamilyMember: (FamilyMemberEntity) -> Unit,
    onAddCareUpdate: (authorName: String, message: String) -> Unit,
    onDeleteCareUpdate: (CareUpdateEntity) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val profile = uiState.profile

    var showEditProfile by remember { mutableStateOf(false) }
    var showContactDialog by remember { mutableStateOf(false) }
    var editingContact by remember { mutableStateOf<EmergencyContactEntity?>(null) }
    var pendingDeleteContact by remember { mutableStateOf<EmergencyContactEntity?>(null) }

    var showMemberDialog by remember { mutableStateOf(false) }
    var editingMember by remember { mutableStateOf<FamilyMemberEntity?>(null) }
    var pendingDeleteMember by remember { mutableStateOf<FamilyMemberEntity?>(null) }

    var showUpdateDialog by remember { mutableStateOf(false) }
    var pendingDeleteUpdate by remember { mutableStateOf<CareUpdateEntity?>(null) }

    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            try {
                context.contentResolver.takePersistableUriPermission(
                    uri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION
                )
            } catch (_: SecurityException) {
                // Non-persistable URI still works for current session
            }
            onUpdatePhoto(uri.toString())
        }
    }

    fun dialPhoneNumber(phone: String) {
        val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${phone.trim()}"))
        context.startActivity(dialIntent)
    }

    if (showEditProfile && profile != null) {
        ProfileFormDialog(
            existing = profile,
            onDismiss = { showEditProfile = false },
            onSave = {
                onSaveProfile(it)
                showEditProfile = false
            }
        )
    }

    if (showContactDialog || editingContact != null) {
        EmergencyContactDialog(
            existing = editingContact,
            onDismiss = {
                showContactDialog = false
                editingContact = null
            },
            onSave = {
                onSaveEmergencyContact(it)
                showContactDialog = false
                editingContact = null
            }
        )
    }

    pendingDeleteContact?.let { contact ->
        DeleteConfirmationDialog(
            title = "Remove Emergency Contact?",
            message = "Remove ${contact.name} from emergency contacts?",
            onDismiss = { pendingDeleteContact = null },
            onConfirm = {
                onDeleteEmergencyContact(contact)
                pendingDeleteContact = null
            }
        )
    }

    if (showMemberDialog || editingMember != null) {
        FamilyMemberDialog(
            existing = editingMember,
            onDismiss = {
                showMemberDialog = false
                editingMember = null
            },
            onSave = {
                onSaveFamilyMember(it)
                showMemberDialog = false
                editingMember = null
            }
        )
    }

    pendingDeleteMember?.let { member ->
        DeleteConfirmationDialog(
            title = "Remove Family Member?",
            message = "Remove ${member.name} from the care circle?",
            onDismiss = { pendingDeleteMember = null },
            onConfirm = {
                onDeleteFamilyMember(member)
                pendingDeleteMember = null
            }
        )
    }

    if (showUpdateDialog) {
        CareUpdateDialog(
            defaultAuthors = uiState.familyMembers.map { it.name },
            onDismiss = { showUpdateDialog = false },
            onPost = { author, message ->
                onAddCareUpdate(author, message)
                showUpdateDialog = false
            }
        )
    }

    pendingDeleteUpdate?.let { update ->
        DeleteConfirmationDialog(
            title = "Delete Care Update?",
            message = "Remove this care note from the shared log?",
            onDismiss = { pendingDeleteUpdate = null },
            onConfirm = {
                onDeleteCareUpdate(update)
                pendingDeleteUpdate = null
            }
        )
    }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Family & Care",
                style = MaterialTheme.typography.headlineMedium
            )
        }

        if (profile != null) {
            item {
                CareCard(containerColor = CareGreenContainer.copy(alpha = 0.7f)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(76.dp)
                                .clip(CircleShape)
                                .background(CareGreenPrimary)
                                .clickable {
                                    photoPickerLauncher.launch(
                                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                    )
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            if (!profile.photoUri.isNullOrBlank()) {
                                AsyncImage(
                                    model = Uri.parse(profile.photoUri),
                                    contentDescription = "${profile.recipientName} photo",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            } else {
                                Text(
                                    text = profile.recipientName
                                        .split(" ")
                                        .take(2)
                                        .mapNotNull { it.firstOrNull()?.uppercaseChar() }
                                        .joinToString(""),
                                    style = MaterialTheme.typography.headlineMedium,
                                    color = CareSurface
                                )
                            }
                        }

                        Spacer(modifier = Modifier.width(16.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = profile.recipientName,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                StatusPill(
                                    text = "Age ${profile.age}",
                                    containerColor = CareSurface,
                                    contentColor = CareGreenOnContainer
                                )
                                StatusPill(
                                    text = "Blood ${profile.bloodType}",
                                    containerColor = CareSurface,
                                    contentColor = CareGreenOnContainer
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "DOB: ${profile.dateOfBirth}",
                                style = MaterialTheme.typography.bodySmall,
                                color = CareTextSecondary
                            )
                        }

                        IconButton(onClick = { showEditProfile = true }) {
                            Icon(
                                imageVector = Icons.Rounded.Edit,
                                contentDescription = "Edit care profile",
                                tint = CareGreenPrimary
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    InfoBadgeRow(
                        icon = Icons.Rounded.LocalHospital,
                        text = "Primary Doctor: ${profile.primaryDoctor}"
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    InfoBadgeRow(
                        icon = Icons.Rounded.Home,
                        text = profile.address
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    TextButton(
                        onClick = {
                            photoPickerLauncher.launch(
                                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                            )
                        },
                        contentPadding = PaddingValues(horizontal = 4.dp, vertical = 0.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.CameraAlt,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Change Photo")
                    }
                }
            }

            item {
                CareCard {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.WarningAmber,
                                contentDescription = null,
                                tint = CareError
                            )
                            Text(
                                text = "Allergies & Care Notes",
                                style = MaterialTheme.typography.titleMedium
                            )
                        }
                        TextButton(onClick = { showEditProfile = true }) {
                            Text("Edit")
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    val allergyItems = profile.allergies
                        .split(",")
                        .map { it.trim() }
                        .filter { it.isNotEmpty() }

                    if (allergyItems.isNotEmpty()) {
                        FlowRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            allergyItems.forEach { allergy ->
                                StatusPill(
                                    text = allergy,
                                    containerColor = CareErrorContainer,
                                    contentColor = CareOnErrorContainer
                                )
                            }
                        }
                    } else {
                        Text(
                            text = "No known allergies recorded",
                            style = MaterialTheme.typography.bodyMedium,
                            color = CareTextSecondary
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Care Notes",
                        style = MaterialTheme.typography.titleSmall,
                        color = CareGreenPrimary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = profile.careNotes.ifBlank { "No special care notes yet." },
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }

        item {
            SectionHeader(
                title = "Emergency Contacts",
                subtitle = "Tap Call to dial immediately",
                actionLabel = "+ Add",
                onActionClick = { showContactDialog = true }
            )
        }

        if (uiState.emergencyContacts.isEmpty()) {
            item {
                EmptyStateCard(
                    icon = Icons.Rounded.Call,
                    title = "No emergency contacts",
                    message = "Add family or doctor numbers for quick tap-to-call.",
                    actionLabel = "Add Contact",
                    onActionClick = { showContactDialog = true }
                )
            }
        } else {
            items(uiState.emergencyContacts, key = { "contact_${it.id}" }) { contact ->
                CareCard {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = contact.name,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                if (contact.isPrimary) {
                                    StatusPill(
                                        text = "Primary",
                                        containerColor = CareGreenContainer,
                                        contentColor = CareGreenOnContainer
                                    )
                                }
                            }
                            Text(
                                text = contact.relationship,
                                style = MaterialTheme.typography.bodyMedium,
                                color = CareTextSecondary
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = contact.phoneNumber,
                                style = MaterialTheme.typography.bodyLarge,
                                color = CareGreenPrimary,
                                fontWeight = FontWeight.SemiBold
                            )
                        }

                        Row {
                            IconButton(onClick = { editingContact = contact }) {
                                Icon(
                                    imageVector = Icons.Rounded.Edit,
                                    contentDescription = "Edit ${contact.name}",
                                    tint = CareTextSecondary
                                )
                            }
                            IconButton(onClick = { pendingDeleteContact = contact }) {
                                Icon(
                                    imageVector = Icons.Rounded.DeleteOutline,
                                    contentDescription = "Delete ${contact.name}",
                                    tint = CareError
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Button(
                        onClick = { dialPhoneNumber(contact.phoneNumber) },
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = CareGreenPrimary),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Call,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Call ${contact.name}")
                    }
                }
            }
        }

        item {
            SectionHeader(
                title = "Family Care Circle",
                subtitle = "People sharing care responsibilities",
                actionLabel = "+ Add",
                onActionClick = { showMemberDialog = true }
            )
        }

        if (uiState.familyMembers.isEmpty()) {
            item {
                EmptyStateCard(
                    icon = Icons.Rounded.Group,
                    title = "No family members added",
                    message = "Add relatives or caregivers involved in daily support.",
                    actionLabel = "Add Member",
                    onActionClick = { showMemberDialog = true }
                )
            }
        } else {
            items(uiState.familyMembers, key = { "member_${it.id}" }) { member ->
                CareCard {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(CareGreenSecondaryContainer),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Person,
                                contentDescription = null,
                                tint = CareGreenPrimary
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "${member.name} • ${member.relationship}",
                                style = MaterialTheme.typography.titleMedium
                            )
                            Text(
                                text = member.role,
                                style = MaterialTheme.typography.bodyMedium,
                                color = CareTextSecondary
                            )
                        }
                        if (member.phoneNumber.isNotBlank()) {
                            IconButton(onClick = { dialPhoneNumber(member.phoneNumber) }) {
                                Icon(
                                    imageVector = Icons.Rounded.Call,
                                    contentDescription = "Call ${member.name}",
                                    tint = CareGreenPrimary
                                )
                            }
                        }
                        IconButton(onClick = { editingMember = member }) {
                            Icon(
                                imageVector = Icons.Rounded.Edit,
                                contentDescription = "Edit ${member.name}",
                                tint = CareTextSecondary
                            )
                        }
                        IconButton(onClick = { pendingDeleteMember = member }) {
                            Icon(
                                imageVector = Icons.Rounded.DeleteOutline,
                                contentDescription = "Remove ${member.name}",
                                tint = CareError
                            )
                        }
                    }
                }
            }
        }

        item {
            SectionHeader(
                title = "Shared Care Updates",
                subtitle = "Family notes and daily check-ins",
                actionLabel = "+ Post Note",
                onActionClick = { showUpdateDialog = true }
            )
        }

        if (uiState.careUpdates.isEmpty()) {
            item {
                EmptyStateCard(
                    icon = Icons.Rounded.Favorite,
                    title = "No shared updates yet",
                    message = "Post a quick update so everyone in the family stays informed.",
                    actionLabel = "Post Update",
                    onActionClick = { showUpdateDialog = true }
                )
            }
        } else {
            items(uiState.careUpdates, key = { "update_${it.id}" }) { update ->
                CareCard {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            StatusPill(
                                text = update.authorName,
                                containerColor = CareGreenContainer,
                                contentColor = CareGreenOnContainer
                            )
                            Text(
                                text = CareFormatters.formatRelativeMillis(update.createdAtMillis),
                                style = MaterialTheme.typography.bodySmall,
                                color = CareTextSecondary
                            )
                        }
                        IconButton(onClick = { pendingDeleteUpdate = update }) {
                            Icon(
                                imageVector = Icons.Rounded.DeleteOutline,
                                contentDescription = "Delete update",
                                tint = CareTextSecondary
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = update.message,
                        style = MaterialTheme.typography.bodyLarge
                    )
                }
            }
        }

        item { Spacer(modifier = Modifier.height(12.dp)) }
    }
}

@Composable
private fun ProfileFormDialog(
    existing: CareProfileEntity,
    onDismiss: () -> Unit,
    onSave: (CareProfileEntity) -> Unit
) {
    var name by remember { mutableStateOf(existing.recipientName) }
    var ageText by remember { mutableStateOf(existing.age.toString()) }
    var dob by remember { mutableStateOf(existing.dateOfBirth) }
    var bloodType by remember { mutableStateOf(existing.bloodType) }
    var primaryDoctor by remember { mutableStateOf(existing.primaryDoctor) }
    var address by remember { mutableStateOf(existing.address) }
    var allergies by remember { mutableStateOf(existing.allergies) }
    var careNotes by remember { mutableStateOf(existing.careNotes) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Care Profile", style = MaterialTheme.typography.titleLarge) },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Care Recipient Name *") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = ageText,
                        onValueChange = { ageText = it.filter { ch -> ch.isDigit() } },
                        label = { Text("Age") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = bloodType,
                        onValueChange = { bloodType = it },
                        label = { Text("Blood Type") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                }
                OutlinedTextField(
                    value = dob,
                    onValueChange = { dob = it },
                    label = { Text("Date of Birth") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = primaryDoctor,
                    onValueChange = { primaryDoctor = it },
                    label = { Text("Primary Doctor") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text("Home Address") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = allergies,
                    onValueChange = { allergies = it },
                    label = { Text("Allergies (comma separated)") },
                    maxLines = 2,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = careNotes,
                    onValueChange = { careNotes = it },
                    label = { Text("Care Notes") },
                    maxLines = 4,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onSave(
                        existing.copy(
                            recipientName = name.trim(),
                            age = ageText.toIntOrNull() ?: existing.age,
                            dateOfBirth = dob.trim(),
                            bloodType = bloodType.trim(),
                            primaryDoctor = primaryDoctor.trim(),
                            address = address.trim(),
                            allergies = allergies.trim(),
                            careNotes = careNotes.trim()
                        )
                    )
                },
                enabled = name.isNotBlank(),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Save Profile")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}

@Composable
private fun EmergencyContactDialog(
    existing: EmergencyContactEntity?,
    onDismiss: () -> Unit,
    onSave: (EmergencyContactEntity) -> Unit
) {
    var name by remember { mutableStateOf(existing?.name ?: "") }
    var relationship by remember { mutableStateOf(existing?.relationship ?: "") }
    var phone by remember { mutableStateOf(existing?.phoneNumber ?: "") }
    var isPrimary by remember { mutableStateOf(existing?.isPrimary ?: false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = if (existing == null) "Add Emergency Contact" else "Edit Contact",
                style = MaterialTheme.typography.titleLarge
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name *") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = relationship,
                    onValueChange = { relationship = it },
                    label = { Text("Relationship / Title") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Phone Number *") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.clickable { isPrimary = !isPrimary }
                ) {
                    Checkbox(checked = isPrimary, onCheckedChange = { isPrimary = it })
                    Text("Mark as primary emergency contact")
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onSave(
                        EmergencyContactEntity(
                            id = existing?.id ?: 0L,
                            name = name.trim(),
                            relationship = relationship.trim().ifBlank { "Emergency Contact" },
                            phoneNumber = phone.trim(),
                            isPrimary = isPrimary
                        )
                    )
                },
                enabled = name.isNotBlank() && phone.isNotBlank(),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Save Contact")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}

@Composable
private fun FamilyMemberDialog(
    existing: FamilyMemberEntity?,
    onDismiss: () -> Unit,
    onSave: (FamilyMemberEntity) -> Unit
) {
    var name by remember { mutableStateOf(existing?.name ?: "") }
    var relationship by remember { mutableStateOf(existing?.relationship ?: "") }
    var role by remember { mutableStateOf(existing?.role ?: "") }
    var phone by remember { mutableStateOf(existing?.phoneNumber ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = if (existing == null) "Add Family Member" else "Edit Family Member",
                style = MaterialTheme.typography.titleLarge
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name *") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = relationship,
                    onValueChange = { relationship = it },
                    label = { Text("Relationship *") },
                    placeholder = { Text("e.g. Daughter, Son, Nurse") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = role,
                    onValueChange = { role = it },
                    label = { Text("Care Role") },
                    placeholder = { Text("e.g. Evening check-ins") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Phone Number") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onSave(
                        FamilyMemberEntity(
                            id = existing?.id ?: 0L,
                            name = name.trim(),
                            relationship = relationship.trim().ifBlank { "Family" },
                            role = role.trim().ifBlank { "Caregiver" },
                            phoneNumber = phone.trim()
                        )
                    )
                },
                enabled = name.isNotBlank(),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Save Member")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun CareUpdateDialog(
    defaultAuthors: List<String>,
    onDismiss: () -> Unit,
    onPost: (authorName: String, message: String) -> Unit
) {
    var author by remember { mutableStateOf(defaultAuthors.firstOrNull() ?: "Sarah Miller") }
    var message by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Share Care Update", style = MaterialTheme.typography.titleLarge) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                if (defaultAuthors.isNotEmpty()) {
                    Text(
                        text = "Posted by",
                        style = MaterialTheme.typography.labelMedium,
                        color = CareTextSecondary
                    )
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        defaultAuthors.forEach { memberName ->
                            FilterChip(
                                selected = author == memberName,
                                onClick = { author = memberName },
                                label = { Text(memberName) }
                            )
                        }
                    }
                }
                OutlinedTextField(
                    value = author,
                    onValueChange = { author = it },
                    label = { Text("Your Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = message,
                    onValueChange = { message = it },
                    label = { Text("Care Update *") },
                    placeholder = { Text("Share how she's doing, vitals, meals, or refills...") },
                    minLines = 3,
                    maxLines = 5,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onPost(author, message) },
                enabled = message.isNotBlank(),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Rounded.Send, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Post Update")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
