# Context Diagram — Retail Store Pricing Management System

## 1. Overview

The Retail Store Pricing Management System is a single-page web application designed to manage pricing data from approximately 3,000 retail stores across multiple countries. It allows authorised users to upload pricing feeds, search pricing records, and edit and save pricing information.

## 2. System Context

- **System Name:** Retail Store Pricing Management System
- **Frontend:** React Single Page Application (SPA)
- **Backend:** FastAPI
- **Database:** PostgreSQL
- **Primary Purpose:** Centralise retail pricing records and provide reliable pricing data management.

## 3. External Actors and Systems

### 3.1 Retail Users / Pricing Administrators

- Upload pricing feeds in CSV format.
- Search and filter pricing records.
- Edit and save pricing changes.
- View pricing information and reports.

### 3.2 Retail Stores

- Generate pricing data for their products.
- Provide CSV files containing Store ID, SKU, Product Name, Price, and Date.
- Receive upload status and validation feedback through the application workflow.

### 3.3 System Administrators

- Manage application configuration and user access.
- Monitor system health.
- Investigate operational and data issues.

### 3.4 PostgreSQL Database

- Persist uploaded pricing records.
- Support pricing-record searches and updates.
- Return stored pricing data to the application.
- Support data-change history if audit requirements are implemented.

## 4. Information Exchange

### 4.1 Retail Users to Pricing Application

Retail users submit CSV pricing files, search requests, and pricing-record edit requests through the web application.

### 4.2 Pricing Application to Retail Users

The application returns pricing records, search results, upload status, and validation feedback.

### 4.3 Retail Stores to Pricing Application

Retail stores provide pricing CSV files containing Store ID, SKU, Product Name, Price, and Date through the upload workflow.

### 4.4 System Administrators to Pricing Application

System administrators submit application configuration and user-management requests, where these capabilities are implemented.

### 4.5 Pricing Application to System Administrators

The application may provide operational status, logs, and alerts to support system monitoring, depending on the implemented scope.

### 4.6 Pricing Application to PostgreSQL Database

The application sends database operations to insert, retrieve, and update pricing records.

### 4.7 PostgreSQL Database to Pricing Application

The database returns persisted pricing records and query results to the application.

## 5. Assumptions and Scope

- The application is a single-page web application.
- React is used for the frontend, FastAPI for the backend, and PostgreSQL for persistent storage.
- Pricing feeds are uploaded manually through CSV files unless automated integration is agreed separately.
- The target scale is approximately 3,000 stores across multiple countries.
- Performance, availability, security, and scalability must be validated through appropriate testing.
- Reporting, user management, monitoring, alerting, and audit history must be confirmed against the implemented scope before being treated as delivered features.
