@echo off
cd /d "%~dp0"
echo ========================================================
echo Starting CareerPrep Application
echo ========================================================

echo.
echo [1/2] Installing and starting Backend...
cd backend

if not exist ".venv" (
    echo Creating Python virtual environment...
    python -m venv .venv
)

echo Installing python requirements...
call .\.venv\Scripts\pip.exe install -r requirements.txt

echo Starting backend server in a new window...
start "CareerPrep Backend" cmd /k ".\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

cd ..\frontend

echo.
echo [2/2] Installing and starting Frontend...
if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install
)

echo Starting frontend server in a new window...
start "CareerPrep Frontend" cmd /k "npm run dev"

echo.
echo Both servers are starting up!
echo Opening browser...
timeout /t 3 /nobreak > nul
start http://localhost:5173

echo.
pause
