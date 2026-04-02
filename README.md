# Privacy-Preserving Student Attendance System

A production-ready secure attendance management system using **face recognition**, **AES-256-GCM encryption**, and **LSB steganography** to protect attendance data privacy. Built with **FastAPI** (Python) and **React** (Vite + Tailwind CSS).

---

## Table of Contents

1. [System Overview](#system-overview)
2. [How It Works](#how-it-works)
3. [Features](#features)
4. [Installation Guide (Step by Step)](#installation-guide)
   - [Option A: Without Docker (Manual)](#option-a-without-docker-manual-setup)
   - [Option B: With Docker (Automated)](#option-b-with-docker-automated)
5. [Default Credentials](#default-credentials)
6. [Project Structure](#project-structure)
7. [API Reference](#api-reference)
8. [Technology Stack](#technology-stack)
9. [Database Schema](#database-schema)
10. [Security Architecture](#security-architecture)
11. [Troubleshooting](#troubleshooting)

---

## System Overview

```
                         ┌──────────────────────────────────────────┐
                         │            React Frontend (Vite)         │
                         │                                          │
                         │  Dashboard ─ Attendance ─ Students       │
                         │  Courses ─ Records ─ Verification        │
                         │  Security ─ Profile                      │
                         └──────────────┬───────────────────────────┘
                                        │ REST API (Axios)
                         ┌──────────────▼───────────────────────────┐
                         │          FastAPI Backend                  │
                         │                                          │
                         │  ┌─────────────┐  ┌──────────────────┐  │
                         │  │ MTCNN +     │  │ AES-256-GCM      │  │
                         │  │ FaceNet     │  │ (DB-stored keys) │  │
                         │  │ (512-d)     │  │                  │  │
                         │  └─────────────┘  └──────────────────┘  │
                         │  ┌─────────────┐  ┌──────────────────┐  │
                         │  │ LSB Stego-  │  │ SQLite / Postgres│  │
                         │  │ graphy      │  │ + JWT Auth       │  │
                         │  └─────────────┘  └──────────────────┘  │
                         └─────────────────────────────────────────┘
```

---

## How It Works

### The Attendance Pipeline (What happens when a student clicks "Submit")

```
📷 STEP 1 — CAPTURE
   Student looks at webcam → photo is captured

🔍 STEP 2 — FACE RECOGNITION
   MTCNN AI model detects the face in the photo
   → FaceNet deep learning model converts the face into 512 numbers (embedding)
   → System compares these numbers against all stored student embeddings
   → Finds the best match using cosine similarity
   → "This is Ahmed Ali with 95% confidence"

🔐 STEP 3 — ENCRYPTION
   Attendance data: {name: "Ahmed", time: "2026-04-03 10:30", status: "present"}
   → Encrypted with AES-256-GCM using the active database key
   → Becomes unreadable: "EG2DIWdFBrx2NLx7OdV2fvq58..."
   → Even if someone intercepts it, they cannot read it without the key

🖼️ STEP 4 — STEGANOGRAPHY
   The encrypted text is hidden inside the original photo
   → Each character is converted to binary (0s and 1s)
   → Each bit replaces the least significant bit of a pixel's color
   → The image looks IDENTICAL to the human eye
   → But secretly contains the encrypted attendance proof

💾 STEP 5 — SAVE
   The stego-image (photo with hidden data) is saved to disk
   The attendance record + key ID is saved to the database
```

### Verification (Proving the hidden data exists)

```
🖼️ Upload the stego-image
   → 🔬 LSB Extract (read hidden bits from pixels)
   → 🔓 AES Decrypt (convert gibberish back to readable data)
   → ✅ Original attendance data recovered!

⚠️ KEY RULE: Decryption ONLY works with the same key that encrypted the record.
   If the active key has been changed, admin must switch back to the correct key
   in Security settings before verification will work.
```

---

## Features

### Roles & Access Control

| Feature | Admin | Student |
|---------|-------|---------|
| Dashboard (stats overview) | Full access | Full access |
| Capture Attendance (webcam) | Yes | Yes |
| Student Management | Create, view, manage | Hidden |
| Course Management | Full CRUD + enrollment | View only |
| Attendance Records | View all, filter, download | Hidden |
| Stego Verification | Extract & decrypt images | Hidden |
| AES Key Management | Generate, rotate, manage | Hidden |
| Profile / Password | Edit profile, change password | Edit profile, change password |

### All Features

- **Face Recognition** — MTCNN + FaceNet 512-d embeddings + cosine similarity
- **AES-256-GCM Encryption** — DB-stored keys, rotation, per-record key tracking
- **LSB Steganography** — Hide encrypted data in image pixels, extract and verify
- **Course Management** — Code, instructor, schedule (time + days), student enrollment
- **Student Register** — Register with face capture, view stats (attendance, embeddings, courses)
- **Attendance Records** — Paginated table, date/user filters, stego-image modal with download
- **User Profiles** — Edit name/email, change password
- **Dark/Light Theme** — Toggle in header
- **Role-Based Auth** — JWT tokens, admin/student separation

---

## Installation Guide

### Requirements Summary

| Tool | Why | Where to get it |
|------|-----|-----------------|
| **Python 3.11+** | Backend server | https://www.python.org/downloads/ |
| **Node.js 18+** | Frontend build | https://nodejs.org/ |
| **Git** (optional) | Clone the repo | https://git-scm.com/ |
| **Docker** (optional) | Run everything in containers | https://www.docker.com/products/docker-desktop/ |

---

### Option A: Without Docker (Manual Setup)

This is for a **completely fresh computer** that has nothing installed.

#### Step 1: Install Python

1. Go to https://www.python.org/downloads/
2. Download **Python 3.11** or newer
3. Run the installer
   - **IMPORTANT (Windows)**: Check the box **"Add Python to PATH"** at the bottom of the installer
4. Verify installation — open a terminal/command prompt:

```bash
python --version
# Should show: Python 3.11.x or newer
```

If `python` doesn't work, try `python3` or `py` (Windows).

#### Step 2: Install Node.js

1. Go to https://nodejs.org/
2. Download the **LTS** version (18 or newer)
3. Run the installer (default settings are fine)
4. Verify installation:

```bash
node --version
# Should show: v18.x.x or newer

npm --version
# Should show: 9.x.x or newer
```

#### Step 3: Download the Project

**Option 1 — With Git:**
```bash
git clone <repository-url>
cd attendance
```

**Option 2 — Without Git:**
- Download the ZIP file from the repository
- Extract it to a folder (e.g. `C:\attendance` or `~/attendance`)
- Open a terminal and navigate to that folder:
```bash
cd C:\attendance          # Windows
cd ~/attendance           # Mac/Linux
```

#### Step 4: Start the Backend

Open a terminal and run these commands **one by one**:

```bash
# Navigate to the backend folder
cd backend

# Create a virtual environment (isolated Python packages)
python -m venv venv

# Activate the virtual environment
# On Windows (Command Prompt):
venv\Scripts\activate
# On Windows (Git Bash):
source venv/Scripts/activate
# On Mac/Linux:
source venv/bin/activate

# You should see (venv) at the start of your terminal prompt

# Install all Python packages (this may take 5-10 minutes on first run)
pip install -r requirements.txt

# Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**What happens on first startup:**
- Database tables are created automatically (SQLite file: `attendance.db`)
- A default **admin account** is created: `admin@attendance.com` / `admin123`
- A default **AES-256 encryption key** is generated
- FaceNet AI model is downloaded (~107 MB, only on first run)

You should see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Leave this terminal open** — it's your backend server.

#### Step 5: Start the Frontend

Open a **new/second terminal** (keep the backend running in the first one):

```bash
# Navigate to the frontend folder
cd frontend

# Install all JavaScript packages
npm install

# Start the frontend dev server
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

#### Step 6: Open the App

1. Open your web browser (Chrome, Firefox, Edge)
2. Go to: **http://localhost:5173**
3. Login with:
   - **Email**: `admin@attendance.com`
   - **Password**: `admin123`

You're in! The system is fully running.

#### Stopping the App

- Press `Ctrl + C` in each terminal to stop the servers
- To restart, just run `uvicorn main:app --reload --host 0.0.0.0 --port 8000` (backend) and `npm run dev` (frontend) again

---

### Option B: With Docker (Automated)

Docker runs everything in containers — you don't need to install Python or Node.js separately.

#### Step 1: Install Docker

1. Go to https://www.docker.com/products/docker-desktop/
2. Download **Docker Desktop** for your OS (Windows/Mac/Linux)
3. Install and **restart your computer** if prompted
4. Open Docker Desktop and wait for it to start (the whale icon in your system tray should be steady)
5. Verify:

```bash
docker --version
# Should show: Docker version 20.x or newer

docker-compose --version
# Should show: Docker Compose version v2.x
```

#### Step 2: Start Everything

Open a terminal in the project root folder and run:

```bash
docker-compose up --build
```

**First run will take 10-15 minutes** (downloading Python, Node.js, AI models, etc.)

When you see:
```
backend_1   | INFO:     Uvicorn running on http://0.0.0.0:8000
frontend_1  | ready
```

The system is running!

#### Step 3: Open the App

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Login**: `admin@attendance.com` / `admin123`

#### Stopping

```bash
# Press Ctrl+C to stop, or:
docker-compose down

# To remove all data and start fresh:
docker-compose down -v
```

#### Restarting

```bash
# Normal restart (keeps data):
docker-compose up

# Full rebuild (if code changed):
docker-compose up --build
```

---

### After Installation: First Steps

1. **Login** as admin (`admin@attendance.com` / `admin123`)
2. **Change the admin password** — go to Profile (click avatar → My Profile)
3. **Register a student** — go to Students → Add Student → capture their face via webcam
4. **Create a course** — go to Courses → New Course
5. **Enroll the student** in the course
6. **Test attendance** — go to Attendance → the student looks at the camera → Submit
7. **Check records** — go to Records → click "View" to see the stego-image
8. **Test verification** — download the stego-image, go to Verification → upload it → Extract
9. **Check Security** — go to Security to see the AES key that encrypted the record

---

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@attendance.com` | `admin123` |

Students are registered by the admin via the Students page with face images.

**Important**: Change the admin password after first login!

---

## Project Structure

```
attendance/
├── backend/
│   ├── core/
│   │   ├── config.py              # Environment settings (pydantic-settings)
│   │   ├── database.py            # Async SQLAlchemy (SQLite/PostgreSQL)
│   │   ├── security.py            # JWT, bcrypt, get_current_user, get_admin_user
│   │   └── exceptions.py          # Custom exceptions + global handlers
│   ├── models/
│   │   ├── user.py                # User (with role: admin/student)
│   │   ├── embedding.py           # Face embeddings (pickled numpy arrays)
│   │   ├── attendance.py          # AttendanceImage (with key_id)
│   │   ├── course.py              # Course + CourseEnrollment
│   │   ├── encryption_key.py      # AES-256 keys stored in DB
│   │   └── schemas.py             # Pydantic request/response DTOs
│   ├── services/
│   │   ├── face_recognition.py    # MTCNN + FaceNet (lazy-loaded)
│   │   ├── encryption.py          # AES-256-GCM with DB keys
│   │   ├── steganography.py       # LSB embed/extract
│   │   └── attendance.py          # Full pipeline orchestration
│   ├── routers/
│   │   ├── auth.py                # Login, /me, profile, password change
│   │   ├── users.py               # Register, list (with stats)
│   │   ├── recognition.py         # Face recognition endpoint
│   │   ├── attendance.py          # Capture + records + dashboard
│   │   ├── extraction.py          # Stego extraction + decryption
│   │   ├── courses.py             # CRUD + enrollment
│   │   └── security.py            # AES key management
│   ├── utils/
│   │   └── logging_config.py
│   ├── static/stego_images/       # Generated stego-images stored here
│   ├── main.py                    # App entry + auto-setup on startup
│   ├── requirements.txt           # Python dependencies
│   ├── Dockerfile                 # Docker image for backend
│   └── .env                       # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/            # Layout, PageHero, FilterBar, StatCard, etc.
│   │   ├── pages/                 # 10 pages (Login, Dashboard, Students, etc.)
│   │   ├── services/api.js        # Axios client with JWT interceptor
│   │   ├── hooks/useAuth.jsx      # Auth context (token + role)
│   │   ├── App.jsx                # Routes + role-based guards
│   │   └── main.jsx               # Entry point
│   ├── package.json               # Node.js dependencies
│   ├── vite.config.js             # Vite config with API proxy
│   ├── tailwind.config.js         # Tailwind theme (gold colors, dark mode)
│   ├── Dockerfile                 # Docker image for frontend
│   └── nginx.conf                 # Nginx config for production
├── docker-compose.yml             # Run everything with one command
└── README.md                      # This file
```

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login, returns JWT + role |
| GET | `/api/auth/me` | Yes | Get current user profile |
| PUT | `/api/auth/profile` | Yes | Update name/email |
| PUT | `/api/auth/change-password` | Yes | Change password |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/register-user` | No | Register with face images + role |
| GET | `/api/users` | Admin | List all users with stats |
| GET | `/api/users/{id}` | Yes | Get single user |

### Face Recognition & Attendance

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/recognize` | No | Identify face only (no record) |
| POST | `/api/attendance` | No | Full pipeline: recognize + encrypt + stego + save |
| GET | `/api/attendance-records` | Yes | Paginated with date/user filters |
| GET | `/api/dashboard` | Yes | Stats: users, courses, today, all-time |

### Verification

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/extract-data` | Admin | Extract + decrypt from stego-image |

### Courses

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/courses` | Yes | List courses with enrollment counts |
| POST | `/api/courses` | Admin | Create course (name, code, instructor, time, days) |
| PUT | `/api/courses/{id}` | Admin | Update course |
| DELETE | `/api/courses/{id}` | Admin | Delete course |
| POST | `/api/courses/{id}/enroll` | Admin | Enroll students |
| GET | `/api/courses/{id}/students` | Yes | List enrolled students |
| DELETE | `/api/courses/{id}/students/{uid}` | Admin | Unenroll student |

### Security / Encryption Keys

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/security/keys` | Admin | List all AES keys with usage counts |
| POST | `/api/security/keys` | Admin | Generate new key (deactivates previous) |
| PUT | `/api/security/keys/{id}/activate` | Admin | Activate a specific key |
| DELETE | `/api/security/keys/{id}` | Admin | Delete unused key |

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend Framework** | FastAPI + Uvicorn | Async Python web server |
| **Face Detection** | MTCNN (facenet-pytorch) | Locate faces in images |
| **Face Embeddings** | InceptionResnetV1 (VGGFace2) | Convert face to 512-d vector |
| **Similarity Matching** | Cosine similarity (scipy) | Compare face vectors |
| **Encryption** | AES-256-GCM (PyCryptodome) | Authenticated encryption |
| **Steganography** | LSB (Pillow + NumPy) | Hide data in image pixels |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Data storage |
| **ORM** | SQLAlchemy (async) | Database abstraction |
| **Auth** | JWT (python-jose) + bcrypt | Token auth + password hashing |
| **Frontend** | React 18 + Vite 5 | UI framework |
| **Styling** | Tailwind CSS 3 + custom CSS vars | Dark/light theme |
| **Icons** | Lucide React | Icon library |
| **Webcam** | react-webcam | Camera capture |
| **HTTP Client** | Axios | API communication |
| **Deployment** | Docker + Docker Compose + nginx | Containerized deployment |

---

## Database Schema

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│     users         │     │   embeddings      │     │ encryption_keys  │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)          │◄───┐│ id (PK)          │     │ id (PK)          │
│ full_name        │    ││ user_id (FK)  ───┘     │ name             │
│ email (unique)   │    │├──────────────────┤     │ key_hex (64 ch)  │
│ hashed_password  │    ││ embedding_data   │     │ is_active        │
│ role             │    │└──────────────────┘     │ created_at       │
│ created_at       │    │                          └────────┬─────────┘
└──────┬───────────┘    │                                   │
       │                │  ┌──────────────────┐             │
       │                └──│ attendance_images │             │
       │                   ├──────────────────┤             │
       └──────────────────►│ id (PK)          │             │
                           │ user_id (FK)     │             │
                           │ key_id (FK)  ────┘─────────────┘
                           │ timestamp        │
                           │ stego_image_path │
                           │ encrypted_payload│
                           │ status           │
                           └──────────────────┘

┌──────────────────┐     ┌──────────────────────┐
│    courses        │     │ course_enrollments    │
├──────────────────┤     ├──────────────────────┤
│ id (PK)          │◄────│ id (PK)              │
│ name             │     │ course_id (FK)       │
│ code (unique)    │     │ user_id (FK) ────────┘──► users
│ description      │     │ enrolled_at          │
│ instructor       │     │ UNIQUE(course, user) │
│ start_time       │     └──────────────────────┘
│ end_time         │
│ days             │
│ created_at       │
└──────────────────┘
```

---

## Security Architecture

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| **Authentication** | JWT (HS256) + bcrypt | Verify user identity |
| **Authorization** | Role-based (admin/student) | Restrict feature access |
| **Encryption** | AES-256-GCM (AEAD) | Encrypt attendance payload |
| **Key Management** | DB-stored, rotatable, per-record key_id | Key lifecycle + audit |
| **Steganography** | LSB pixel embedding | Hide ciphertext in images |
| **Data Integrity** | GCM authentication tag | Detect data tampering |
| **Key Binding** | Active key must match record's key | Wrong key = verification fails |
| **Password Storage** | bcrypt salted hashing | Irreversible password protection |
| **Input Validation** | Pydantic schemas on all endpoints | Prevent injection attacks |
| **Error Isolation** | Global exception handlers | No stack trace leakage |

---

## Troubleshooting

### Backend won't start

| Problem | Solution |
|---------|----------|
| `python: command not found` | Use `python3` or `py` instead. On Windows, ensure Python is added to PATH |
| `pip: command not found` | Use `python -m pip` or `py -m pip` instead |
| `ModuleNotFoundError` | Make sure virtual environment is activated: `source venv/bin/activate` |
| `error while attempting to bind on address` | Port 8000 is in use. Kill the old process or use `--port 8001` |
| FaceNet model download fails | Check internet connection. Model (~107MB) downloads on first run |
| `No active encryption key found` | Database was reset. Restart the server — it auto-creates a default key |

### Frontend won't start

| Problem | Solution |
|---------|----------|
| `node: command not found` | Install Node.js from https://nodejs.org/ |
| `npm install` fails | Delete `node_modules` folder and `package-lock.json`, then try again |
| Blank page at localhost:5173 | Check browser console for errors. Make sure backend is running on port 8000 |
| API calls fail (network error) | Backend must be running. Check http://localhost:8000/api/health |

### Docker issues

| Problem | Solution |
|---------|----------|
| `docker: command not found` | Install Docker Desktop and restart terminal |
| `docker daemon is not running` | Open Docker Desktop and wait for it to fully start |
| Build fails on first run | Run `docker-compose down -v` then `docker-compose up --build` again |
| Port already in use | Stop any existing services on ports 5173, 8000, or 5432 |

### Face recognition issues

| Problem | Solution |
|---------|----------|
| "No face detected" | Ensure good lighting, face clearly visible, no obstructions |
| "Face does not match" | Register more face images (different angles). Lower threshold in `.env` |
| Recognition is slow | First request loads models. Subsequent requests are faster |

### Encryption / Verification issues

| Problem | Solution |
|---------|----------|
| "Active key does not match" | The record was encrypted with a different key. Go to Security → activate the correct key |
| "Extraction failed" | The image may be corrupted or not a stego-image from this system |
| "No active encryption key" | Restart the backend — it auto-creates a default key |

---

## License

This project was built as part of a thesis on **"Privacy-Preserving Student Attendance System Based on Face Recognition with Encrypted Data Embedding in Images Using Steganography"**.
