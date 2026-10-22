# Kulfi Time – Retail Pricing Management System

A full-stack retail pricing management application designed to manage product prices across stores, maintain historical pricing records, and track price changes over time.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Business Problem](#business-problem)
- [Project Objectives](#project-objectives)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Application Workflow](#application-workflow)
- [Database Design](#database-design)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Installation and Setup](#installation-and-setup)
- [Running the Application](#running-the-application)
- [Security and Configuration](#security-and-configuration)
- [Testing](#testing)
- [Future Enhancements](#future-enhancements)
- [Author](#author)

---

## Project Overview

The Kulfi Time Retail Pricing Management System is a web-based application for managing retail product pricing information and maintaining a history of price changes.

The application combines a React-based user interface with a Python FastAPI backend and a PostgreSQL database.

It is designed to support store-level pricing records, product identification using SKU, effective timestamps, and historical price tracking.

Unlike a system that only retains the latest price, the application is designed to preserve multiple pricing records so that price changes can be reviewed over time.

## Business Problem

Retail pricing information can change frequently because of business decisions, promotional activities, regional pricing requirements, and product updates.

Managing these changes without a structured system can lead to several challenges:

- Difficulty tracking historical prices.
- Limited visibility into when a price was recorded.
- Challenges managing pricing across multiple stores.
- Risk of losing earlier pricing information when a price is updated.
- Difficulty retrieving and reviewing pricing records.

## Project Objectives

The main objectives of this project are to:

1. Provide a centralized interface for retail pricing management.
2. Store product pricing information in a structured relational database.
3. Maintain historical records of pricing changes.
4. Support store-level and SKU-level identification.
5. Record the effective timestamp for each pricing entry.
6. Provide REST APIs for communication between the frontend and backend.
7. Establish a maintainable architecture that can be extended with reporting and analytics.

## Key Features

### 1. Retail Price Management

Manage pricing information associated with individual products and stores.

Pricing records include:

- Store ID
- Product SKU
- Product name
- Price
- Price date
- Country
- Price effective timestamp

### 2. Historical Price Tracking

The system is designed to retain earlier pricing records when a product's price changes.

For example, a product could have different prices recorded at different times on the same day. Each price change can be stored as a separate historical entry.

This supports historical review without relying exclusively on the latest price.

### 3. Store-Level Pricing

Pricing records include a store identifier, allowing records to be associated with individual stores.

This data structure supports future extensions for comparing prices across different stores and locations.

### 4. SKU-Based Product Identification

Each product pricing record contains a Stock Keeping Unit (SKU).

The SKU helps identify the product associated with a pricing record.

### 5. Effective Timestamp Tracking

Each pricing entry includes a `price_effective_at` timestamp.

This field supports chronological ordering of pricing records and helps distinguish multiple changes that occur on the same date.

### 6. RESTful Backend APIs

The backend uses FastAPI to expose HTTP endpoints for pricing-related operations.

FastAPI also provides interactive API documentation for inspecting and testing available endpoints.

### 7. Relational Database Storage

PostgreSQL stores pricing records in a structured table.

SQLAlchemy provides the Python ORM layer for mapping application models to database tables and executing database operations.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React | User interface |
| Frontend Tooling | Vite | Frontend development server and build tooling |
| Backend | Python | Application logic |
| API Framework | FastAPI | REST API development |
| API Server | Uvicorn | Runs the FastAPI application |
| Database | PostgreSQL | Persistent data storage |
| ORM | SQLAlchemy | Database models and queries |
| Version Control | Git | Source code versioning |
| Code Hosting | GitHub | Repository hosting and collaboration |

---

## System Architecture

The application follows a frontend–backend–database architecture.

```text
+-----------------------------+
|         User                |
+-----------------------------+
              |
              v
+-----------------------------+
|     React Frontend          |
|     Built with Vite         |
+-----------------------------+
              |
              | HTTP / REST API
              v
+-----------------------------+
|     FastAPI Backend         |
|                             |
| - Request handling          |
| - Input validation          |
| - Pricing business logic    |
| - Database operations       |
+-----------------------------+
              |
              v
+-----------------------------+
|       SQLAlchemy ORM        |
+-----------------------------+
              |
              v
+-----------------------------+
|       PostgreSQL            |
|                             |
| - Pricing records           |
| - Price history              |
| - Effective timestamps      |
+-----------------------------+
```

### Architecture Explanation

**Frontend:** React provides the web interface through which users interact with pricing information.

**Backend:** FastAPI receives HTTP requests, validates incoming data, executes application logic, and returns responses.

**ORM:** SQLAlchemy maps Python model objects to PostgreSQL records and manages database queries.

**Database:** PostgreSQL persists pricing information, including historical entries and effective timestamps.

---

## Application Workflow

A typical pricing workflow follows these steps:

1. The user interacts with the React frontend.
2. The frontend sends an HTTP request to the FastAPI backend.
3. The backend validates the request and processes the pricing operation.
4. SQLAlchemy performs the required database operations.
5. PostgreSQL stores or retrieves the relevant pricing records.
6. The backend returns a response to the frontend.
7. The frontend displays the resulting pricing information.

### Price History Workflow

When a new price needs to be recorded, the system can create a new pricing entry with its effective timestamp.

Historical entries can then be ordered chronologically to review the sequence of recorded prices.

---

## Database Design

### Table: `pricing_records`

The primary pricing table stores product and pricing information.

| Column | Data Type | Description |
|---|---|---|
| `id` | BIGINT | Primary key |
| `store_id` | VARCHAR(20) | Store identifier |
| `sku` | VARCHAR(50) | Product SKU |
| `product_name` | VARCHAR(150) | Product name |
| `price` | NUMERIC(10,2) | Price amount |
| `price_date` | DATE | Pricing date |
| `country` | VARCHAR(50) | Country associated with the record |
| `price_effective_at` | TIMESTAMPTZ | Effective timestamp of the pricing entry |
| `created_at` | TIMESTAMP WITH TIME ZONE | Record creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Record update timestamp |

### Data Management Approach

- The `id` column uniquely identifies each record.
- The `store_id` and `sku` fields associate pricing information with a store and product.
- The `price` field stores the monetary amount with two decimal places.
- The `price_date` field identifies the pricing date.
- The `price_effective_at` field supports ordering records by effective time.
- The `created_at` and `updated_at` fields support record lifecycle tracking.

The database schema is designed to support multiple historical entries for the same store, SKU, and pricing date.

---

## API Documentation

The backend uses FastAPI to provide REST API functionality.

When the backend is running locally, interactive API documentation is available at:

**Swagger UI:** `http://127.0.0.1:8000/docs`

**ReDoc:** `http://127.0.0.1:8000/redoc`

These pages allow developers to inspect the API endpoints, view request and response schemas, and test supported operations.

The exact endpoint list and request formats should be verified against the current backend implementation.

---

## Project Structure

```text
kulfi-time-retail-pricing/
│
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   └── ai_service.py
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── index.html
│   └── package.json
│
├── docs/
│   ├── assumptions.md
│   ├── context-diagram.md
│   ├── design-decisions.md
│   ├── nfr-requirements.md
│   └── solution-architecture.md
│
├── .gitignore
└── README.md
```

The structure above represents the intended organization. Adjust it to match the actual files in your repository.

---

## Installation and Setup

### Prerequisites

Install or configure the following:

- Python
- PostgreSQL
- Node.js and npm for the Vite development tooling
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Arthiannadurai/kulfi-time-retail-pricing.git
cd kulfi-time-retail-pricing
```

### 2. Set Up the Python Environment

On Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install the dependencies using the dependency file available in your project. For example, if you have a `requirements.txt` file:

```powershell
pip install -r requirements.txt
```

### 3. Configure PostgreSQL

Create a PostgreSQL database for the application and configure the database connection using your local environment settings.

Ensure the database schema and required tables have been created before starting the application.

Do not commit database passwords or other secrets to GitHub.

### 4. Start the Backend

From the project root, run:

```powershell
python -m uvicorn app.main:app --reload
```

The local API server should be available at:

`http://127.0.0.1:8000`

### 5. Start the Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local development URL printed by Vite in the terminal.

---

## Security and Configuration

Follow these practices when configuring and maintaining the application:

- Keep database credentials in environment variables or a local `.env` file.
- Do not commit `.env` files, passwords, API keys, or private configuration.
- Keep virtual environments and generated build files out of version control.
- Validate incoming API requests before processing them.
- Configure database access with appropriate permissions.
- Use HTTPS and production-safe configuration when deploying the application.

---

## Testing

Testing can help verify the reliability of pricing operations.

Suggested test scenarios include:

- Creating a pricing record with valid data.
- Rejecting invalid pricing input.
- Retrieving stored pricing records.
- Recording multiple price changes for the same product on the same day.
- Verifying effective timestamp ordering.
- Confirming that historical records remain available after a new price is recorded.
- Handling database connection or validation errors.

Document automated tests here once they are implemented and verified.

---

## Future Enhancements

Potential enhancements include:

- Pricing trend dashboards and visual analytics.
- Search and filtering by store, SKU, country, and date.
- Price comparison across stores.
- Historical price charts.
- Import and export of pricing data.
- User authentication and role-based access control.
- Automated backend and frontend tests.
- CI/CD pipelines and production deployment.
- Audit reporting for pricing changes.

These are potential future improvements, not claims that every feature is already implemented.

---

## Author

**Arthi Annadurai**

GitHub: [Arthiannadurai](https://github.com/Arthiannadurai)

Repository: [Kulfi Time Retail Pricing Management System](https://github.com/Arthiannadurai/kulfi-time-retail-pricing)

---

*This project is being developed to demonstrate full-stack application development, REST API design, relational database integration, and historical retail pricing management.*
