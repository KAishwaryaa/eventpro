# FastAPI Backend for Event Management System

## Prerequisites
1.  Python 3.8+
2.  MySQL Server installed and running.
3.  MySQL Workbench (optional, for management).

## Setup
1.  Create a database in MySQL Workbench named `event_db`.
2.  Update `backend/.env` with your MySQL credentials:
    ```
    DATABASE_URL=mysql+pymysql://<user>:<password>@localhost:3306/event_db
    ```
3.  Install dependencies:
    ```bash
    cd backend
    pip install -r requirements.txt
    ```
4.  Initialize the database (create tables):
    ```bash
    python init_db.py
    ```
5.  Run the backend:
    ```bash
    uvicorn app.main:app --reload
    ```

## API Documentation
Once the server is running, visit:
-   Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
-   ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
