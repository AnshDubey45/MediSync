# MediSync 🏥

> **Intelligent Clinical Decision-Support & Emergency Triage Platform**  
> *Initial triage suggestion — clinician review required.*

---

## 📌 Overview

**MediSync** is a clinical triage and patient intake management platform designed to streamline emergency room and outpatient prioritization. It provides patient self-service intake (with real-time speech-to-text and medical image attachment) and gives clinicians an explainable, priority-sorted triage queue.

---

## 🏗️ Architecture

The repository is modularly structured into separate **frontend** and **backend** applications:

```
MediSync/
├── frontend/                     # Next.js 15 Client Application
│   ├── src/app/
│   │   ├── intake/               # Patient Intake (Voice dictation + Image upload)
│   │   ├── dashboard/            # Doctor Dashboard (Priority queue + explainability)
│   │   │   ├── patients/         # Patient Directory & medical history charts
│   │   │   └── settings/         # Threshold configurations, sound toggles, DB reseed
│   │   └── layout.tsx            # Navigation layout with clinical alert popover
│   ├── next.config.ts            # API rewrites proxying /api/* -> backend port 5000
│   └── package.json
│
├── backend/                      # Express REST API & SQLite DB
│   ├── src/
│   │   ├── db/index.js           # Native node:sqlite with WAL mode & seed cases
│   │   └── triage/engine.js      # Deterministic triage evaluation rule engine
│   ├── data/medisync.db          # Local SQLite database file
│   ├── server.js                 # Express server on port 5000 (15MB body limit)
│   └── package.json
│
├── config/triage/                # AI scoring rules & weights
├── package.json                  # Root orchestration script
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20 or higher (v24 recommended for native `node:sqlite` support)
- **npm** or compatible package manager

### Installation

Clone the repository and install dependencies:
```bash
git clone https://github.com/AnshDubey45/MediSync.git
cd MediSync

# Install root, backend, and frontend dependencies
npm run install:all
```

### Running Locally

Start both the backend API and frontend dev server with a single command:
```bash
npm run dev
```

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## ✨ Features

- **Voice-Enabled Patient Intake**: Built-in speech-to-text using Web Speech API for hands-free symptom dictation.
- **Medical Image Attachment**: Drag-and-drop support for symptom photos/scans with instant client-side preview.
- **Deterministic Triage Engine**: Rules-based risk stratification (`Red: Immediate`, `Orange: Very Urgent`, `Yellow: Urgent`, `Green: Standard`).
- **Clinician Dashboard**: Real-time queue polling, priority filtering, and symptom explainability drawers.
- **Patient Directory**: Searchable history with patient medical charts.
- **Clinical Alerts Popover**: Interactive header bell notification with unread count badges.
- **Local SQLite Persistence**: Zero cloud database requirement; automatic WAL mode and seed cases.

---

## ⚠️ Medical Disclaimer

MediSync is designed solely as a workflow optimization and initial triage suggestion tool. It is **not** a diagnostic device. All recommendations, risk tiers, and priority assignments must be reviewed and confirmed by a qualified, licensed clinician.
