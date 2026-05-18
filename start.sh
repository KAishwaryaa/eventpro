#!/bin/bash

echo "========================================"
echo "  Event Management System - Full Stack  "
echo "========================================"
echo ""

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "[1/3] Installing frontend dependencies..."
    cd frontend && npm install && cd ..
else
    echo "[1/3] Frontend dependencies already installed."
fi

# Install backend dependencies
echo "[2/3] Installing backend dependencies..."
cd backend
pip install -r requirements.txt

# Init DB if not exists
if [ ! -f "event_db.db" ]; then
    echo "[3/3] Setting up database..."
    python init_db.py
    python seed_db.py
else
    echo "[3/3] Database already exists, skipping setup."
fi
cd ..

echo ""
echo "========================================"
echo " Starting Backend  -> http://localhost:8000"
echo " Starting Frontend -> http://localhost:5173"
echo "========================================"
echo ""

# Run both with trap to kill both on Ctrl+C
trap 'kill $(jobs -p)' EXIT

cd backend && python run.py &
sleep 3
cd frontend && npm run dev &

wait
