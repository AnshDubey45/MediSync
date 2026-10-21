# MediSync 🏥

> **Intelligent Clinical Decision-Support, Emergency Triage & Configuration Control Platform**  
> *Initial triage suggestion — clinician review required.*

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Backend-Express%204-lightgrey?style=flat-square&logo=express)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20(node:sqlite)-blue?style=flat-square&logo=sqlite)](https://nodejs.org/)
[![Sapling SCM](https://img.shields.io/badge/SCM-Meta%20Sapling-purple?style=flat-square)](https://sapling-scm.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20v4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

---

## 📌 What is MediSync?

**MediSync** is an intelligent emergency triage and patient intake ecosystem designed for modern hospitals and emergency departments (EDs).

In busy emergency rooms, doctors and nurses face extreme cognitive overload. Patients arrive simultaneously with complex symptoms, paper intake causes delays, and triage rules can easily fall out of sync between check-in kiosks and doctor tablets.

**MediSync solves this in two ways:**
1. **For Patients & Nurses:** Provides a lightning-fast, multi-modal intake kiosk where patients can **speak their symptoms aloud** (hands-free voice recognition) or **upload photos of injuries/rashes**, receiving instant, deterministic risk classification.
2. **For Clinicians & Administrators:** Provides a live, priority-sorted **Doctor Command Center** backed by **Meta's Sapling SCM**, guaranteeing that hospital clinical scoring guidelines are strictly version-controlled, auditable, and protected against configuration drift.

---

## 🏗️ System Architecture

MediSync is cleanly structured into independent, modular **frontend** and **backend** applications connected via local REST APIs:

```
MediSync/
├── frontend/                     # Next.js 16 App Router (Port 3000)
│   ├── src/app/
│   │   ├── page.tsx              # Public Landing Page & Hospital Workflow
│   │   ├── intake/               # Patient Intake (Voice dictation + Image upload)
│   │   └── dashboard/            # Clinician & Admin Portal
│   │       ├── page.tsx          # Real-Time Doctor Queue (Priority-sorted)
│   │       ├── patients/         # Patient Directory & medical history charts
│   │       ├── settings/         # Triage thresholds, audio chimes & DB reseed
│   │       ├── admin/            # Administrator Gateway (Locked SCM access)
│   │       ├── scm/              # Meta Sapling SCM Console (Diffs, CLI, Smartlog)
│   │       └── layout.tsx        # Operations sidebar & Clinical Alerts popover
│   ├── next.config.ts            # Reverse proxy: /api/* -> http://127.0.0.1:5001/api/*
│   └── package.json
│
├── backend/                      # Express REST API Server (Port 5001)
│   ├── src/
│   │   ├── db/index.js           # Native node:sqlite with WAL mode & seed cases
│   │   ├── triage/engine.js      # Deterministic triage evaluation rule engine
│   │   └── scm/routes.js         # Sapling (`sl`) & Git execution routes
│   ├── data/medisync.db          # Local SQLite database file (WAL mode)
│   ├── server.js                 # Main server: Auth, Cases, Intake & Health
│   └── package.json
│
├── config/triage/                # Clinical Configuration Items (JSON weights & rules)
│   └── ai_scoring_rules.json     # Symptom keywords, duration & age multipliers
├── package.json                  # Root orchestration script (runs both concurrently)
└── README.md
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js**: `v20.x` or `v24.x` (Node 24 recommended for built-in `node:sqlite`)
- **Meta Sapling** (`sl.exe`) or **Git** installed on your system

### 1. Clone & Install
```bash
git clone https://github.com/AnshDubey45/MediSync.git
cd MediSync

# Install dependencies across root, backend, and frontend
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. Start MediSync
Start both the backend API and frontend client with a single command:
```bash
npm run dev
```

Both services will spin up concurrently:
- 🌐 **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- 🔌 **Backend REST API**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

---

## 🔐 Demo Accounts & Credentials

To test the **Administrator Portal** and **Source Control Center** (`/dashboard/admin`):

| Name | Role | Email / Username | Password | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Ansh Dubey** | Administrator (Core) | `ansh@medisync.health` *(or `ansh`)* | `ansh123` | One-click Auto-fill available on login screen |
| **Neeraj Maurya** | Administrator (Lead) | `neeraj@medisync.health` *(or `neeraj`)* | `neeraj123` | One-click Auto-fill available on login screen |
| **System Admin** | Administrator | `admin@medisync.health` *(or `admin`)* | `admin123` | Full system access |

---

## 🌟 Key Features & User Journeys

### 1. 🎙️ Voice-Enabled Patient Intake (`/intake`)
- **Speech-to-Text Dictation:** Patients can click the microphone icon and describe their symptoms aloud in natural language using the Web Speech API.
- **Medical Image Attachment:** Drag-and-drop support for injury photos, rashes, or scans with instant client-side thumbnail previews (supports up to 15MB payloads).
- **Instant Risk Breakdown:** Once submitted, the intake engine calculates an immediate, explainable triage score and displays the priority band with actionable wait-time guidance.

### 2. 🩺 Real-Time Doctor Command Center (`/dashboard`)
- **Urgency-Sorted Queue:** Patient cases are automatically sorted by priority:
  - 🔴 **CRITICAL (Score 80–100):** Immediate resuscitation / ICU triage.
  - 🟠 **HIGH (Score 60–79):** Emergent evaluation requested.
  - 🟡 **MEDIUM (Score 30–59):** Urgent care, bed assignment needed.
  - 🟢 **LOW (Score 0–29):** Standard outpatient / non-emergent care.
- **Explainability Drawer:** Clicking on any patient opens a side drawer revealing their exact symptom keywords, duration penalty multipliers, age factors, and attached photo preview.
- **Case Progression:** One-click status transitions (`Waiting` ➔ `Reviewing` ➔ `Resolved`).
- **Clinical Alerts Popover:** Header notification bell with unread count badges and audio chime triggers on critical arrivals.

### 3. 👥 Patient Directory (`/dashboard/patients`)
- Searchable patient registry filtered by name, MRN (Medical Record Number), or primary condition.
- Slide-out patient chart showing historical visits, chronic conditions, and past triage scores.

### 4. ⚙️ Station Settings & Database Reseed (`/dashboard/settings`)
- Numerical threshold adjustments for triage score cutoffs.
- Sound effect toggles for incoming critical alerts.
- One-click **Database Reseed** button to restore sample patients and clinical cases into SQLite instantly.

### 5. 🛡️ Meta Sapling Source Control Center (`/dashboard/scm` & `/dashboard/admin`)
- **Admin Gateway:** Protected by authentication with session persistence.
- **Live Repository Telemetry:** Displays the active Sapling version, repository path, active bookmark (`main`), current commit hash, and pending change counters.
- **Working Copy Changes Tab:** Visual file status badges (`MODIFIED`, `ADDED`, `UNTRACKED`, `MISSING`).
- **Visual Diff Inspector:** Click "Diff" on any file to open a syntax-highlighted modal displaying green additions (`+`), red deletions (`-`), and blue chunk headers (`@`).
- **Interactive Sapling CLI Runner:** Embedded terminal with 1-click preset buttons (`sl status`, `sl whereami`, `sl log -l 5`, `sl book`, `sl diff --stat`) that executes commands and prints live green monospace output.
- **Remote Synchronization:** Dual-engine Git and Sapling synchronization with GitHub on Pull and Push.

---

## 🛠️ REST API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Server health check & SQLite database connection status |
| `GET` | `/api/cases` | Retrieves priority-sorted triage cases |
| `POST` | `/api/intake` | Submits a new patient intake case with voice/image payload |
| `PATCH` | `/api/cases/:id` | Updates case status (`Waiting`, `Reviewing`, `Resolved`) |
| `GET` | `/api/patients` | Retrieves registered patient directory |
| `POST` | `/api/settings/reseed` | Reseeds local SQLite database with initial test cases |
| `POST` | `/api/admin/login` | Authenticates administrator accounts and issues session token |
| `GET` | `/api/scm/info` | Fetches active Sapling version, bookmark, and commit hash |
| `GET` | `/api/scm/status` | Retrieves categorized file modifications and uncommitted counts |
| `GET` | `/api/scm/diff` | Returns unified line-by-line diffs for modified files |
| `POST` | `/api/scm/commit` | Stages and commits changes in both Sapling and Git |
| `POST` | `/api/scm/sync` | Pushes or pulls repository updates to/from GitHub |
| `POST` | `/api/scm/exec` | Executes arbitrary safe `sl` commands from the web console |

---

## 💻 Working with Sapling & Git

MediSync is fully compatible with both **Meta Sapling** and standard **Git**:

### Using Sapling (`sl`)
```powershell
# Check repository status
sl status

# View the clean Smartlog commit DAG
sl log -l 5

# Inspect current location
sl whereami

# Make a commit
sl commit -m "feat(triage): update acute asthma duration multiplier"

# Safely undo a mistake (first-class undo!)
sl undo

# Launch Meta's native Interactive Smartlog web GUI
sl web
```

### Using Git (`git`)
```powershell
# Stage and commit
git add .
git commit -m "your commit message"

# Push to GitHub
git push origin main
```

---

## ⚠️ Medical & Clinical Disclaimer

> **IMPORTANT:**  
> MediSync is engineered strictly as an **initial triage recommendation and workflow optimization system**. It is **not** a certified diagnostic medical device. All triage priority bands, risk scores, and clinical recommendations generated by this software must be reviewed, confirmed, and authorized by a licensed healthcare professional or attending triage physician before clinical care is delivered.

---

## 📄 License & Attribution

Developed for **Software Configuration Management (ISWE403L)** at the **School of Computer Science Engineering and Information Systems, Vellore Institute of Technology (VIT)**.  
Built with [Next.js](https://nextjs.org), [Express.js](https://expressjs.com), [SQLite](https://sqlite.org), and [Meta Sapling SCM](https://sapling-scm.com).
