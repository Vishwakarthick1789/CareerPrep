# CareerPrep — ATS resume checker & interview practice

A professional two-pane web app: **match your resume to a job description** with ATS-style heuristics, then **practice role-based interview questions** with structured or AI-powered feedback.

## Features

- **ATS check**: Paste text or upload **PDF / DOCX**. Scores structure (sections, bullets, action verbs, length) and, when you paste a **job description**, keyword overlap and gaps.
- **Interview practice**: Pick a role preset or enter a custom title. Get tailored questions, then feedback. With `OPENAI_API_KEY`, feedback uses OpenAI; otherwise you get strong offline STAR-style tips.

## Prerequisites

- **Python 3.11+**
- **Node.js 20+** (for the frontend)

## Quick start

The **easiest and officially supported way** to run the app on Windows is to simply double-click the `start.bat` file located in the project folder. 

`start.bat` handles everything for you automatically:
- Creates a Python virtual environment (`.venv`) and installs backend dependencies.
- Installs all frontend node modules.
- Starts both the frontend and backend servers asynchronously.
- **Automatically opens your browser to http://localhost:5173** once the servers are launching.

Alternatively, you can run the services manually from the terminal:

### 1. Backend

```powershell
# From the project root directory
cd backend
python -m venv .venv

# If using Command Prompt:
.\.venv\Scripts\activate.bat
# If using PowerShell (requires ExecutionPolicy to allow scripts):
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
copy .env.example .env
# Optional: set OPENAI_API_KEY in .env

uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Frontend

```powershell
# From the project root directory
cd frontend
npm install
npm run dev
```

Open **http://127.0.0.1:5173**. The dev server proxies `/api` requests automatically to the local backend on port **8000**.

### Production build (frontend)

```powershell
cd frontend
npm run build
npm run preview
```

Set `VITE_API_BASE` if the API is on another origin (e.g. `https://api.example.com`).

## Notes

- ATS tools vary by employer; this app gives **consistent, explainable signals**, not a vendor-specific guarantee.
- Resume text extraction depends on PDF encoding; scanned PDFs may need OCR outside this project.

## License

MIT — use freely for your job search.
