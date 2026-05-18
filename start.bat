@echo off
echo ========================================
echo   Event Management System - Full Stack
echo ========================================
echo.

REM Check if node_modules exists in frontend
IF NOT EXIST "frontend\node_modules" (
    echo [1/3] Installing frontend dependencies...
    cd frontend
    npm install
    cd ..
) ELSE (
    echo [1/3] Frontend dependencies already installed.
)

REM Check if backend packages are installed
echo [2/3] Installing backend dependencies...
cd backend
pip install -r requirements.txt

REM Init DB if not exists
IF NOT EXIST "event_db.db" (
    echo [3/3] Setting up database...
    python init_db.py
    python seed_db.py
) ELSE (
    echo [3/3] Database already exists, skipping setup.
)
cd ..

echo.
echo ========================================
echo  Starting Backend  -> http://localhost:8000
echo  Starting Frontend -> http://localhost:5173
echo ========================================
echo.

REM Start backend in a new window
start "Backend - FastAPI" cmd /k "cd backend && python run.py"

REM Wait 3 seconds for backend to start
timeout /t 3 /nobreak > NUL

REM Start frontend in a new window
start "Frontend - React" cmd /k "cd frontend && npm run dev"

REM Open browser
timeout /t 4 /nobreak > NUL
start http://localhost:5173

echo Both servers are running!
echo Close the two terminal windows to stop.
pause
