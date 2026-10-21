# kulfi-time-retail-pricing

# Kulfi Time – Retail Pricing Management System

A full-stack application for managing retail product prices, tracking price changes, and maintaining historical pricing records.

## Project Overview

The Kulfi Time Retail Pricing Management System helps users manage product pricing across stores and maintain a history of price changes over time.

## Key Features

- **Price Management:** Manage product pricing records.
- **Price History:** Maintain multiple price records for the same product, including changes made on the same day.
- **Store-Based Pricing:** Track prices using store ID and product SKU.
- **Timestamp Tracking:** Record when each pricing entry becomes effective.
- **REST API:** Access pricing data through FastAPI endpoints.
- **Web Interface:** Manage pricing through a React frontend.
- **Database Integration:** Store pricing records in PostgreSQL.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, JavaScript |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| API Server | Uvicorn |
| ORM | SQLAlchemy |
| Version Control | Git, GitHub |

## Project Structure

```text
kulfi-time-retail-pricing/
├── app/
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   └── ai_service.py
├── frontend/
├── docs/
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Python
- Node.js and npm
- PostgreSQL

### 1. Clone the repository

```bash
git clone https://github.com/Arthiannadurai/kulfi-time-retail-pricing.git
cd kulfi-time-retail-pricing
```

### 2. Start the backend

Create and activate a Python virtual environment, install the project's Python dependencies, and configure your PostgreSQL connection.

Start the API server:

```bash
python -m uvicorn app.main:app --reload
```

API documentation:

`http://127.0.0.1:8000/docs`

### 3. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed in your terminal.

## Future Enhancements

- Pricing analytics and reporting
- Price-change audit history
- Role-based access control
- Automated testing and deployment

## Author

**Arthi Annadurai**

GitHub: [Arthiannadurai](https://github.com/Arthiannadurai)
