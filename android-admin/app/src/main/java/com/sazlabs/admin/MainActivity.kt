package com.sazlabs.admin

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Email
import androidx.compose.material.icons.rounded.Logout
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.Firebase
import com.google.firebase.FirebaseApp
import com.google.firebase.Timestamp
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.auth
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.firestore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.text.DateFormat

private val Ink = Color(0xFF101828)
private val Blue = Color(0xFF1D4ED8)
private val Canvas = Color(0xFFF7F8FC)
private val Gold = Color(0xFFD4AF37)

data class ContactRequest(
    val id: String,
    val name: String,
    val email: String,
    val service: String,
    val message: String,
    val status: String,
    val source: String,
    val createdAt: Timestamp?
)

sealed interface RequestsState {
    data object Loading : RequestsState
    data class Ready(val requests: List<ContactRequest>) : RequestsState
    data class Error(val message: String) : RequestsState
}

class RequestsViewModel : ViewModel() {
    private val mutableState = MutableStateFlow<RequestsState>(RequestsState.Loading)
    val state = mutableState.asStateFlow()
    private var registration: ListenerRegistration? = null

    fun start() {
        if (registration != null) return
        mutableState.value = RequestsState.Loading
        registration = Firebase.firestore.collection("contactRequests")
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    mutableState.value = RequestsState.Error(
                        if (error.code.name == "PERMISSION_DENIED")
                            "This account is not authorized as the owner."
                        else error.localizedMessage ?: "Unable to load requests."
                    )
                    return@addSnapshotListener
                }
                mutableState.value = RequestsState.Ready(
                    snapshot?.documents.orEmpty().map { doc ->
                        ContactRequest(
                            doc.id,
                            doc.getString("name").orEmpty(),
                            doc.getString("email").orEmpty(),
                            doc.getString("service").orEmpty(),
                            doc.getString("message").orEmpty(),
                            doc.getString("status").orEmpty(),
                            doc.getString("source").orEmpty(),
                            doc.getTimestamp("createdAt")
                        )
                    }
                )
            }
    }

    fun retry() { stop(); start() }
    fun stop() { registration?.remove(); registration = null }
    override fun onCleared() { stop() }
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(Modifier.fillMaxSize(), color = Canvas) {
                    if (FirebaseApp.getApps(this).isEmpty()) SetupRequired()
                    else AdminApp(this)
                }
            }
        }
    }
}

@Composable
private fun AdminApp(context: Context) {
    var user by remember { mutableStateOf(Firebase.auth.currentUser) }
    DisposableEffect(Unit) {
        val listener = com.google.firebase.auth.FirebaseAuth.AuthStateListener { user = it.currentUser }
        Firebase.auth.addAuthStateListener(listener)
        onDispose { Firebase.auth.removeAuthStateListener(listener) }
    }
    if (user == null) {
        val serverClientId = remember(context) { googleWebClientId(context) }
        if (serverClientId == null) {
            GoogleAuthSetupRequired()
        } else {
            SignInScreen(context, serverClientId)
        }
    } else {
        RequestsScreen(context)
    }
}

@Composable
private fun SetupRequired() = CenteredState(
    "Firebase setup required",
    "Add google-services.json from the Firebase Android app. No credentials are embedded."
)

@Composable
private fun GoogleAuthSetupRequired() = CenteredState(
    "Google Sign-In setup required",
    "The Firebase Android app is connected. Enable the Google provider in Firebase Authentication, download the refreshed google-services.json, then rebuild and reinstall this app."
)

@Composable
private fun SignInScreen(context: Context, serverClientId: String) {
    val scope = rememberCoroutineScope()
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    Column(
        Modifier.fillMaxSize().padding(32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(Icons.Rounded.Email, null, tint = Blue)
        Spacer(Modifier.height(16.dp))
        Text("SAZ Labs Admin", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text("Private access to contact requests", color = Color.Gray)
        Spacer(Modifier.height(28.dp))
        Button(enabled = !busy, onClick = {
            busy = true
            error = null
            scope.launch {
                try {
                    val option = GetGoogleIdOption.Builder()
                        .setServerClientId(serverClientId)
                        .setFilterByAuthorizedAccounts(false)
                        .build()
                    val result = CredentialManager.create(context).getCredential(
                        context,
                        GetCredentialRequest.Builder().addCredentialOption(option).build()
                    )
                    val token = GoogleIdTokenCredential.createFrom(result.credential.data).idToken
                    Firebase.auth.signInWithCredential(GoogleAuthProvider.getCredential(token, null)).await()
                } catch (exception: Exception) {
                    error = exception.localizedMessage ?: "Unable to sign in."
                } finally {
                    busy = false
                }
            }
        }) { Text(if (busy) "Signing in…" else "Continue with Google") }
        error?.let { Spacer(Modifier.height(16.dp)); Text(it, color = MaterialTheme.colorScheme.error) }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RequestsScreen(context: Context, model: RequestsViewModel = viewModel()) {
    val scope = rememberCoroutineScope()
    val state by model.state.collectAsStateWithLifecycle()
    var selected by remember { mutableStateOf<ContactRequest?>(null) }
    DisposableEffect(Unit) { model.start(); onDispose { model.stop() } }
    selected?.let { DetailScreen(it) { selected = null }; return }

    Scaffold(
        containerColor = Canvas,
        topBar = {
            TopAppBar(
                title = { Text("Contact requests", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Canvas),
                actions = {
                    IconButton(model::retry) { Icon(Icons.Rounded.Refresh, "Refresh") }
                    IconButton(onClick = {
                        scope.launch {
                            Firebase.auth.signOut()
                            CredentialManager.create(context).clearCredentialState(ClearCredentialStateRequest())
                        }
                    }) { Icon(Icons.Rounded.Logout, "Sign out") }
                }
            )
        }
    ) { padding ->
        when (val value = state) {
            RequestsState.Loading -> Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Blue)
            }
            is RequestsState.Error -> CenteredState("Couldn’t load requests", value.message, Modifier.padding(padding))
            is RequestsState.Ready -> if (value.requests.isEmpty()) {
                CenteredState("No requests yet", "New inquiries appear here while the app is open.", Modifier.padding(padding))
            } else {
                LazyColumn(
                    Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(value.requests, key = { it.id }) { request ->
                        RequestCard(request) { selected = request }
                    }
                }
            }
        }
    }
}

@Composable
private fun RequestCard(request: ContactRequest, onClick: () -> Unit) {
    Card(
        Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(Modifier.padding(18.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(request.name, fontWeight = FontWeight.Bold, color = Ink)
                StatusBadge(request.status)
            }
            Spacer(Modifier.height(6.dp))
            Text(request.service, color = Blue)
            Spacer(Modifier.height(10.dp))
            Text(formatTime(request.createdAt), color = Color.Gray, style = MaterialTheme.typography.labelMedium)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DetailScreen(request: ContactRequest, onBack: () -> Unit) {
    Scaffold(
        containerColor = Canvas,
        topBar = {
            TopAppBar(
                title = { Text("Request details", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Rounded.ArrowBack, "Back") }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Canvas)
            )
        }
    ) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding), contentPadding = PaddingValues(20.dp)) {
            item {
                Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Column(Modifier.padding(20.dp)) {
                        Text(request.name, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(8.dp)); StatusBadge(request.status)
                        HorizontalDivider(Modifier.padding(vertical = 18.dp))
                        DetailRow("Email", request.email)
                        DetailRow("Service", request.service)
                        DetailRow("Received", formatTime(request.createdAt))
                        DetailRow("Source", request.source)
                        HorizontalDivider(Modifier.padding(vertical = 18.dp))
                        Text("Message", color = Color.Gray, style = MaterialTheme.typography.labelMedium)
                        Spacer(Modifier.height(8.dp)); Text(request.message, color = Ink)
                    }
                }
            }
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Text(label, color = Color.Gray, style = MaterialTheme.typography.labelMedium)
    Text(value.ifBlank { "—" }, color = Ink)
    Spacer(Modifier.height(12.dp))
}

@Composable
private fun StatusBadge(status: String) {
    Box(Modifier.background(Gold.copy(alpha = .16f), RoundedCornerShape(50)).padding(horizontal = 10.dp, vertical = 4.dp)) {
        Text(status.ifBlank { "new" }.uppercase(), color = Color(0xFF7A5B00), style = MaterialTheme.typography.labelSmall)
    }
}

@Composable
private fun CenteredState(title: String, body: String, modifier: Modifier = Modifier) {
    Column(
        modifier.fillMaxSize().padding(32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = Ink)
        Spacer(Modifier.height(8.dp)); Text(body, color = Color.Gray)
    }
}

private fun formatTime(timestamp: Timestamp?) =
    timestamp?.toDate()?.let { DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT).format(it) }
        ?: "Pending timestamp"

private fun googleWebClientId(context: Context): String? {
    val resourceId = context.resources.getIdentifier(
        "default_web_client_id",
        "string",
        context.packageName
    )
    if (resourceId == 0) return null
    return context.getString(resourceId).takeIf { it.isNotBlank() }
}
