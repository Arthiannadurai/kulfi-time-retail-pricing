
import csv
import io
import logging
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path

from fastapi import FastAPI, Body, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import SQLAlchemyError

from app.database import SessionLocal, test_db_connection
from app.models import PricingRecord
from app.ai_service import answer_pricing_question

SUPPORTED_COUNTRIES = [
    "India",
    "Singapore",
    "UAE",
    "UK",
    "USA",
    "Australia",
    "Malaysia",
    "Germany",
    "Saudi Arabia",
    "Canada",
]
COUNTRY_LOOKUP = {country.casefold(): country for country in SUPPORTED_COUNTRIES}


logger = logging.getLogger(__name__)

app = FastAPI(
    title="Kulfi Time Retail Pricing API",
    description="API for managing retail pricing records.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SAMPLE_CSV = PROJECT_ROOT / "sample-data" / "pricing_feed.csv"

REQUIRED_COLUMNS = [
    "Store ID",
    "SKU",
    "Product Name",
    "Price",
    "Date",
    "Country",
]


class AIQuestionRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)


def serialize_record(record):
    return {
        "id": record.id,
        "store_id": record.store_id,
        "sku": record.sku,
        "product_name": record.product_name,
        "price": str(record.price),
        "price_date": record.price_date.isoformat(),
        "price_effective_at": (
            record.price_effective_at.isoformat()
            if record.price_effective_at else None
        ),
        "country": record.country,
    }


@app.get("/")
def root():
    return {
        "message": "Kulfi Time Retail Pricing API",
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}


@app.get("/api/db-health")
def database_health():
    try:
        result = test_db_connection()
        return {
            "status": "connected",
            "database_check": result,
        }
    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Database connection failed.",
        )


@app.get("/api/prices/initial-feed")
def get_initial_feed():
    """Read the illustrative CSV file for reference."""
    if not SAMPLE_CSV.exists():
        raise HTTPException(
            status_code=404,
            detail="Sample pricing CSV was not found.",
        )

    try:
        with SAMPLE_CSV.open(
            "r",
            encoding="utf-8-sig",
            newline="",
        ) as file:
            reader = csv.DictReader(file)
            return [
                {
                    "id": index,
                    "store_id": row["Store ID"].strip(),
                    "sku": row["SKU"].strip(),
                    "product_name": row["Product Name"].strip(),
                    "price": row["Price"].strip(),
                    "date": row["Date"].strip(),
                }
                for index, row in enumerate(reader, start=1)
            ]
    except (OSError, KeyError, csv.Error) as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to read sample CSV: {exc}",
        )


@app.get("/api/prices")
def get_prices():
    """Return pricing records saved in PostgreSQL."""
    db = SessionLocal()

    try:
        records = db.scalars(
            select(PricingRecord).order_by(
                PricingRecord.price_effective_at.desc(),
                PricingRecord.id.desc()
            )
        ).all();

        return {
            "total": len(records),
            "records": [serialize_record(record) for record in records],
        }
    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve pricing records.",
        )
    finally:
        db.close()


@app.post("/api/ai/ask")
def ask_ai_question(payload: AIQuestionRequest):
    """Answer supported pricing questions using database queries."""
    question = payload.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Please enter a pricing question.",
        )

    db = SessionLocal()

    try:
        return answer_pricing_question(db, question)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to query pricing data. Please try again.",
        )
    finally:
        db.close()


@app.put("/api/prices/{record_id}")
def update_price(record_id: int, payload: dict = Body(...)):
    """Create a new price event based on an existing pricing record.

    The existing record is retained as historical data. A new row is inserted
    with the edited price and a fresh effective timestamp.
    """
    db = SessionLocal()

    try:
        original = db.get(PricingRecord, record_id)

        if original is None:
            raise HTTPException(
                status_code=404,
                detail="Pricing record not found.",
            )

        store_id = str(payload.get("storeId", original.store_id)).strip()
        sku = str(payload.get("sku", original.sku)).strip()
        product_name = str(
            payload.get("productName", original.product_name)
        ).strip()
        country_input = str(
            payload.get("country", original.country)
        ).strip()
        canonical_country = COUNTRY_LOOKUP.get(country_input.casefold())

        try:
            price = Decimal(str(payload.get("price", original.price)))
            price_date = date.fromisoformat(
                str(payload.get("date", original.price_date))
            )
        except (InvalidOperation, ValueError):
            raise HTTPException(
                status_code=400,
                detail="Invalid price or date format.",
            )

        if not store_id or not sku or not product_name:
            raise HTTPException(
                status_code=400,
                detail="Store ID, SKU and product name are required.",
            )

        if len(store_id) > 20 or len(sku) > 50 or len(product_name) > 150:
            raise HTTPException(
                status_code=400,
                detail="One or more fields exceed the allowed length.",
            )

        if not canonical_country:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Unsupported country. Supported countries: "
                    + ", ".join(SUPPORTED_COUNTRIES)
                ),
            )

        if (
            not price.is_finite()
            or price < 0
            or price > Decimal("99999999.99")
        ):
            raise HTTPException(
                status_code=400,
                detail="Price must be between 0 and 99999999.99.",
            )

        if price.as_tuple().exponent < -2:
            raise HTTPException(
                status_code=400,
                detail="Price must have no more than 2 decimal places.",
            )

        now = datetime.now(timezone.utc)
        new_record = PricingRecord(
            store_id=store_id,
            sku=sku,
            product_name=product_name,
            price=price,
            price_date=price_date,
            country=canonical_country,
            price_effective_at=now,
            updated_at=func.now(),
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)

        return {
            "message": "New price event created. Previous record retained.",
            "record": serialize_record(new_record),
        }

    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Failed to create a new price event")
        raise HTTPException(
            status_code=500,
            detail="Unable to save the new price event.",
        )
    finally:
        db.close()


@app.post("/api/prices/upload")
async def upload_prices(file: UploadFile = File(...)):
    """Validate a CSV file and insert new pricing records.

    Each row is a price event. Multiple prices per day are allowed when
    their effective timestamps differ. Duplicate Store ID + SKU + exact
    effective timestamp combinations within the same CSV are rejected.
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV file.",
        )

    try:
        content = await file.read()

        if not content:
            raise HTTPException(
                status_code=400,
                detail="The uploaded CSV file is empty.",
            )

        try:
            text_content = content.decode("utf-8-sig")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=400,
                detail="The CSV file must use UTF-8 encoding.",
            )

        reader = csv.DictReader(io.StringIO(text_content))

        if not reader.fieldnames:
            raise HTTPException(
                status_code=400,
                detail="The CSV file has no header row.",
            )

        headers = [header.strip() for header in reader.fieldnames]

        if len(headers) != len(set(headers)):
            raise HTTPException(
                status_code=400,
                detail="The CSV contains duplicate column names.",
            )

        missing_columns = [
            column for column in REQUIRED_COLUMNS
            if column not in headers
        ]

        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Required CSV columns are missing.",
                    "missing_columns": missing_columns,
                    "required_columns": REQUIRED_COLUMNS,
                },
            )

        reader.fieldnames = headers
        valid_records = []
        errors = []
        total_rows = 0
        seen_keys = set()

        for row_number, row in enumerate(reader, start=2):
            if not row or all(
                value is None or not str(value).strip()
                for value in row.values()
            ):
                continue

            total_rows += 1
            issues = []

            store_id = (row.get("Store ID") or "").strip()
            sku = (row.get("SKU") or "").strip()
            product_name = (row.get("Product Name") or "").strip()
            price_text = (row.get("Price") or "").strip()
            date_text = (row.get("Date") or "").strip()
            country_text = (row.get("Country") or "").strip()
            canonical_country = COUNTRY_LOOKUP.get(country_text.casefold())
            if not country_text:
                issues.append("Country is required.")
            elif not canonical_country:
                issues.append(
                    f"Unsupported Country '{country_text}'. Supported countries: {', '.join(SUPPORTED_COUNTRIES)}."
                )

            if not store_id:
                issues.append("Store ID is required.")
            elif len(store_id) > 20:
                issues.append("Store ID must be at most 20 characters.")

            if not sku:
                issues.append("SKU is required.")
            elif len(sku) > 50:
                issues.append("SKU must be at most 50 characters.")

            if not product_name:
                issues.append("Product Name is required.")
            elif len(product_name) > 150:
                issues.append(
                    "Product Name must be at most 150 characters."
                )

            price = None
            try:
                price = Decimal(price_text)
                if not price.is_finite():
                    issues.append("Price must be a finite number.")
                elif price < 0 or price > Decimal("99999999.99"):
                    issues.append(
                        "Price must be between 0 and 99999999.99."
                    )
                elif price.as_tuple().exponent < -2:
                    issues.append(
                        "Price must have no more than 2 decimal places."
                    )
            except (InvalidOperation, ValueError):
                issues.append("Price must be a valid number.")

            price_date = None
            try:
                price_date = date.fromisoformat(date_text)
            except ValueError:
                issues.append("Date must use YYYY-MM-DD format.")

            # Generate the event timestamp automatically on the server.
            # Store it in UTC; PostgreSQL TIMESTAMPTZ preserves timezone awareness.
            price_effective_at = datetime.now(timezone.utc)

            if issues:
                errors.append({
                    "row": row_number,
                    "issues": issues,
                })
                continue
            key = (store_id, sku, price_effective_at)
            if key in seen_keys:
                errors.append({
                    "row": row_number,
                    "issues": [
                        "Duplicate Store ID + SKU + Price Effective At "
                        "combination found in this CSV."
                    ],
                })
                continue

            seen_keys.add(key)

            valid_records.append({
               "store_id": store_id,
                "sku": sku,
                "product_name": product_name,
                "price": price,
                "price_date": price_date,
                "price_effective_at": price_effective_at,
                "country": canonical_country,
            })

        # Reject the whole file if any row fails validation.
        if errors:
            return {
                "message": "CSV validation failed. No records were saved.",
                "total_rows": total_rows,
                "valid_rows": len(valid_records),
                "invalid_rows": len(errors),
                "inserted_rows": 0,
                "skipped_duplicates": 0,
                "errors": errors,
            }

        if not valid_records:
            raise HTTPException(
                status_code=400,
                detail="The CSV contains no pricing records.",
            )

        db = SessionLocal()

        try:
                # Each CSV row becomes a price event with a server-generated timestamp.
            statement = insert(PricingRecord).values(valid_records)
            statement = statement.returning(PricingRecord.id)
            inserted_ids = db.execute(statement).scalars().all()
            inserted_rows = len(inserted_ids)
            skipped_duplicates = 0

            db.commit()

            return {
                "message": "CSV validated and processed successfully.",
                "total_rows": total_rows,
                "valid_rows": len(valid_records),
                "invalid_rows": 0,
                "inserted_rows": inserted_rows,
                "skipped_duplicates": skipped_duplicates,
            }

        except SQLAlchemyError as exc:
            db.rollback()
            logger.exception("CSV upload failed while saving records to PostgreSQL")
            raise HTTPException(
                status_code=500,
                detail="Unable to save CSV records to PostgreSQL. Check the backend terminal for details.",
            )
        finally:
            db.close()

    except HTTPException:
        raise
    except (csv.Error, UnicodeError) as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to parse CSV file: {exc}",
        )
    finally:
        await file.close()
