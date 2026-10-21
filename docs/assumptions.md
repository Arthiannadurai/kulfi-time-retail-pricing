# Assumptions

**Project:** Kulfi Time Retail Pricing Management  
**Purpose:** Document the assumptions used while designing the solution for a retail chain operating 3,000 stores across multiple countries.

## 1. Business Assumptions

- The retail chain operates approximately 3,000 stores across multiple countries.
- Each store submits pricing information through CSV files.
- Pricing feeds contain five mandatory columns: Store ID, SKU, Product Name, Price and Date.
- The application is used by retail operations and administrative teams to manage pricing information.
- The initial implementation focuses on pricing-feed ingestion, validation, persistence, search and reporting.

## 2. Data Assumptions

- Each Store ID identifies a store within the agreed store master-data system.
- Each SKU identifies a product according to the agreed product catalogue.
- Prices must be numeric and cannot be negative.
- Dates in CSV files use the `YYYY-MM-DD` format.
- The combination of Store ID, SKU and Date identifies a pricing record for duplicate detection.
- Country and currency information will be obtained from store master data or an agreed configuration.
- Sample CSV data is synthetic and is intended for development and demonstration purposes.

## 3. Technical Assumptions

- The frontend is implemented using React.
- The backend API is implemented using FastAPI and Python.
- PostgreSQL is used for persistent data storage.
- The application communicates with the backend through HTTP APIs.
- CSV uploads are validated by the backend before database insertion.
- Database transactions are used to maintain data consistency during imports.
- Existing application features should be preserved when implementing enhancements.

## 4. Scale and Performance Assumptions

- The solution must support 3,000 stores across multiple countries.
- Pricing-record volume will grow as stores submit new pricing feeds over time.
- Pagination, database indexes and efficient bulk inserts will help manage increasing data volumes.
- Final targets for concurrent users, upload size, response times and availability will be agreed with stakeholders and verified through testing.

## 5. Security and Operations Assumptions

- Production deployment will use appropriate authentication and access controls.
- Database credentials will be stored securely outside source code.
- Production traffic will use encrypted connections.
- Backup frequency, data-retention policies and recovery objectives will be agreed with the business.
- Application monitoring and audit requirements will be finalised before production deployment.

## 6. Dependencies and Constraints

- PostgreSQL must be available and accessible to the backend.
- Required Python and frontend dependencies must be installed.
- Uploaded CSV files must follow the agreed file format.
- Store and product reference data must be available if referential validation is required.
- Production readiness depends on completing security, performance, reliability and recovery testing.

## 7. Items Requiring Confirmation

The following items require confirmation from business or technical stakeholders:

- Whether each upload adds new pricing records, updates existing records or supports both behaviours.
- Whether a pricing record is unique by Store ID, SKU and Date.
- Whether partial imports are permitted when some CSV rows are invalid.
- The supported CSV file-size and row-count limits.
- Required availability, performance and disaster-recovery targets.
- Country-specific currency handling and historical pricing-retention requirements.

