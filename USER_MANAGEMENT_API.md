# 👥 User Management API

## Übersicht

Die User Management API ermöglicht die vollständige Verwaltung von Benutzern im WAWI-System. Alle Endpunkte erfordern Authentifizierung.

---

## 🔐 Authentifizierung

Alle Endpunkte benötigen einen gültigen Token im Header:
```
Authorization: Token {your_token}
```

---

## 📋 API-Endpunkte

### 1. **Alle Benutzer abrufen**

```http
GET /api/users
```

**Response:**
```json
[
  {
    "id": "user-admin-001",
    "email": "admin@autoteile-mueller.de",
    "username": "admin",
    "full_name": "Admin Müller",
    "role": "admin",
    "merchant_id": "dealer-demo-001",
    "is_active": 1,
    "created_at": "2025-12-25T20:50:46.158Z",
    "updated_at": "2025-12-25T20:50:46.158Z",
    "last_login": "2025-12-25T21:00:00.000Z"
  }
]
```

---

### 2. **Einzelnen Benutzer abrufen**

```http
GET /api/users/:id
```

**Response:**
```json
{
  "id": "user-admin-001",
  "email": "admin@autoteile-mueller.de",
  "username": "admin",
  "full_name": "Admin Müller",
  "role": "admin",
  "merchant_id": "dealer-demo-001",
  "is_active": 1,
  "created_at": "2025-12-25T20:50:46.158Z",
  "updated_at": "2025-12-25T20:50:46.158Z",
  "last_login": "2025-12-25T21:00:00.000Z"
}
```

---

### 3. **Neuen Benutzer erstellen**

```http
POST /api/users
```

**Request Body:**
```json
{
  "email": "neuer.user@autoteile-mueller.de",
  "username": "neueruser",
  "password": "sicheres_passwort",
  "full_name": "Neuer Benutzer",
  "role": "staff",
  "merchant_id": "dealer-demo-001"
}
```

**Pflichtfelder:**
- `email` (muss gültige E-Mail sein)
- `username` (muss eindeutig sein)
- `password` (mindestens 6 Zeichen)

**Optionale Felder:**
- `full_name`
- `role` (Standard: "staff", Optionen: "admin", "dealer", "staff")
- `merchant_id` (Standard: "dealer-demo-001")

**Validierung:**
- ✅ E-Mail-Format wird geprüft
- ✅ E-Mail muss eindeutig sein
- ✅ Benutzername muss eindeutig sein
- ✅ Passwort muss mindestens 6 Zeichen haben

**Response (201 Created):**
```json
{
  "id": "user-abc123...",
  "email": "neuer.user@autoteile-mueller.de",
  "username": "neueruser",
  "full_name": "Neuer Benutzer",
  "role": "staff",
  "merchant_id": "dealer-demo-001",
  "is_active": 1,
  "created_at": "2025-12-25T22:00:00.000Z",
  "updated_at": "2025-12-25T22:00:00.000Z"
}
```

**Fehler-Responses:**
```json
// 400 - Fehlende Felder
{
  "error": "Email, username, and password are required"
}

// 400 - Ungültige E-Mail
{
  "error": "Invalid email format"
}

// 400 - Passwort zu kurz
{
  "error": "Password must be at least 6 characters long"
}

// 400 - E-Mail existiert bereits
{
  "error": "Email already exists"
}

// 400 - Benutzername existiert bereits
{
  "error": "Username already exists"
}
```

---

### 4. **Benutzer aktualisieren**

```http
PUT /api/users/:id
```

**Request Body (alle Felder optional):**
```json
{
  "email": "neue.email@autoteile-mueller.de",
  "username": "neuer_username",
  "full_name": "Aktualisierter Name",
  "role": "admin",
  "merchant_id": "dealer-demo-001",
  "is_active": true,
  "password": "neues_passwort"
}
```

**Hinweise:**
- Alle Felder sind optional
- Nur angegebene Felder werden aktualisiert
- E-Mail und Benutzername müssen eindeutig sein (außer für den aktuellen Benutzer)
- Passwort wird nur aktualisiert, wenn angegeben

**Response (200 OK):**
```json
{
  "id": "user-abc123...",
  "email": "neue.email@autoteile-mueller.de",
  "username": "neuer_username",
  "full_name": "Aktualisierter Name",
  "role": "admin",
  "merchant_id": "dealer-demo-001",
  "is_active": 1,
  "created_at": "2025-12-25T20:00:00.000Z",
  "updated_at": "2025-12-25T22:05:00.000Z",
  "last_login": "2025-12-25T21:00:00.000Z"
}
```

---

### 5. **Benutzer löschen**

```http
DELETE /api/users/:id
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Hinweise:**
- Löscht auch alle Sessions des Benutzers
- Benutzer wird permanent gelöscht

---

## 🎯 Verwendung im Dashboard

### **Benutzer-Liste anzeigen**

```typescript
import { apiFetch } from './api/client';

const users = await apiFetch('/api/users');
```

### **Neuen Benutzer erstellen**

```typescript
const newUser = await apiFetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({
    email: 'neuer@example.com',
    username: 'neueruser',
    password: 'sicheres_passwort',
    full_name: 'Neuer Benutzer',
    role: 'staff'
  })
});
```

### **Benutzer aktualisieren**

```typescript
const updatedUser = await apiFetch(`/api/users/${userId}`, {
  method: 'PUT',
  body: JSON.stringify({
    full_name: 'Neuer Name',
    role: 'admin'
  })
});
```

### **Benutzer löschen**

```typescript
await apiFetch(`/api/users/${userId}`, {
  method: 'DELETE'
});
```

---

## 🔒 Rollen-System

### **Verfügbare Rollen:**

1. **admin**
   - Vollzugriff auf alle Funktionen
   - Kann Benutzer verwalten
   - Kann Einstellungen ändern

2. **dealer**
   - Zugriff auf Bestellungen und Dashboard
   - Kann Angebote verwalten
   - Eingeschränkter Admin-Zugriff

3. **staff**
   - Zugriff auf Bestellungen
   - Kann Angebote ansehen
   - Kein Admin-Zugriff

---

## 📊 Beispiel: Vollständiger User-Management-Workflow

```typescript
// 1. Alle Benutzer abrufen
const users = await apiFetch('/api/users');
console.log(`${users.length} Benutzer gefunden`);

// 2. Neuen Mitarbeiter erstellen
const newStaff = await apiFetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({
    email: 'mitarbeiter@autoteile-mueller.de',
    username: 'mitarbeiter',
    password: 'staff123',
    full_name: 'Maria Schmidt',
    role: 'staff'
  })
});

// 3. Benutzer zum Admin befördern
const promoted = await apiFetch(`/api/users/${newStaff.id}`, {
  method: 'PUT',
  body: JSON.stringify({
    role: 'admin'
  })
});

// 4. Benutzer deaktivieren (statt löschen)
await apiFetch(`/api/users/${newStaff.id}`, {
  method: 'PUT',
  body: JSON.stringify({
    is_active: false
  })
});

// 5. Benutzer löschen
await apiFetch(`/api/users/${newStaff.id}`, {
  method: 'DELETE'
});
```

---

## ✅ Sicherheitsfeatures

1. ✅ **Passwort-Hashing** - SHA-256
2. ✅ **E-Mail-Validierung** - Regex-basiert
3. ✅ **Eindeutigkeits-Prüfung** - E-Mail und Benutzername
4. ✅ **Passwort-Mindestlänge** - 6 Zeichen
5. ✅ **Authentifizierung** - Alle Endpunkte geschützt
6. ✅ **Session-Cleanup** - Beim Löschen werden Sessions entfernt

---

## 🧪 Test-Befehle

```bash
# Alle Benutzer abrufen
curl -H "Authorization: Token api_dev_secret" \
  http://localhost:3000/api/users | jq .

# Neuen Benutzer erstellen
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Token api_dev_secret" \
  -d '{"email":"test@example.com","username":"testuser","password":"test123","full_name":"Test User","role":"staff"}' \
  http://localhost:3000/api/users | jq .

# Benutzer aktualisieren
curl -X PUT -H "Content-Type: application/json" \
  -H "Authorization: Token api_dev_secret" \
  -d '{"role":"admin"}' \
  http://localhost:3000/api/users/USER_ID | jq .

# Benutzer löschen
curl -X DELETE -H "Authorization: Token api_dev_secret" \
  http://localhost:3000/api/users/USER_ID | jq .
```

---

**Erstellt:** 2025-12-25 22:06 CET  
**Version:** 1.0.0  
**Status:** ✅ PRODUKTIONSBEREIT
