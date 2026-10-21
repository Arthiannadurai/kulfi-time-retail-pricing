# Kulfi Time Retail Pricing Management

## 1. Project Overview

A retail pricing management application that allows users to upload pricing data from CSV files, search and filter records, edit prices, view reports, and display prices using country-based currency formatting.

## 2. Technology Stack

- **Frontend:** React, JavaScript, CSS
- **Backend:** Python, FastAPI
- **Database:** PostgreSQL
- **Data Import:** CSV
- **API Communication:** REST API

## 3. Prerequisites

Install the following software before running the application:

- Python 3.10 or later
- Node.js and npm
- PostgreSQL
- Visual Studio Code or another code editor
- Git (optional, for version control)

## 4. Project Structure

```text
kulfi-time-retail-pricing/
├── app/
│   ├── main.py
│   ├── models.py
│   └── database.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── AIAssistant.jsx
│   ├── package.json
│   └── ...
├── .venv/
├── requirements.txt
└── README.md
```

The exact structure may vary depending on your local project files.

## 5. Configure PostgreSQL

1. Install and start PostgreSQL.
2. Create a database for the application, for example `kulfi_time_pricing`.
3. Configure the database connection in your backend configuration or environment variables.
4. Ensure the database username, password, host, port, and database name are correct.

Do not commit database passwords or other secrets to GitHub.

## 6. Set Up the Python Backend

Open PowerShell in the project root directory.

Create a virtual environment if one does not already exist:

```powershell
python -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```powershell
python -m pip install -r requirements.txt
```

Start the FastAPI server:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

The backend should be available at:

- API base: `http://127.0.0.1:8000`
- API documentation: `http://127.0.0.1:8000/docs`

## 7. Set Up the React Frontend

Open a second PowerShell terminal.

Navigate to the frontend directory:

```powershell
cd frontend
```

Install frontend dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

Open the local URL printed by Vite in the terminal, commonly `http://localhost:5173`.

## 8. Upload Pricing Data

1. Open the application in your browser.
2. Navigate to **CSV Upload**.
3. Select your pricing CSV file.
4. Confirm that the file contains the required columns:

```text
Store ID, SKU, Product Name, Price, Date, Country
```

5. Upload the file and review the results.
6. Navigate to **Pricing Records** to verify the imported records.

The backend validates records and skips duplicate Store ID + SKU + Date combinations.

## 9. Verify the Application

Test these features after starting the application:

- CSV upload and validation
- Search and filtering
- Pagination and selected-page highlighting
- Editing and saving prices
- Country-based currency formatting
- Store-wise and product-wise reports
- CSV report export
- Table scrolling and responsive layout

## 10. Troubleshooting

**Backend connection error**
- Check that FastAPI is running.
- Confirm the frontend API URL matches the backend URL.

**Database connection error**
- Confirm PostgreSQL is running.
- Check the database connection settings.

**Missing Python dependencies**
- Run `python -m pip install -r requirements.txt` using your project's virtual environment.

**Frontend dependency error**
- Run `npm install` from the `frontend` directory.

**CSV upload failure**
- Verify the required column names, supported date format, country values, and price values.

## 11. Security Notes

- Never publish `.env`, database credentials, or API keys.
- Add `.venv/`, `node_modules/`, and other generated files to `.gitignore`.
- Use environment variables for sensitive configuration.
- Validate and test data before using the application in production.

## 12. Current Scope

This project provides retail pricing record management, CSV import, search and filtering, price editing, grouped reports, and country-based currency display.

Currency formatting changes how prices are displayed; it does not perform foreign-exchange conversion.
