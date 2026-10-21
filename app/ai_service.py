
from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.models import PricingRecord


def answer_pricing_question(
    db: Session,
    question: str,
) -> dict:
    """
    Answer supported pricing questions using database queries.

    This function is read-only. It never inserts, edits, or deletes
    pricing records and never executes arbitrary SQL from user input.
    """
    q = question.strip().lower()

    if not q:
        return {
            "answer": "Please enter a pricing question.",
            "records": [],
            "source": "postgresql",
        }

    # 1. Find the most expensive pricing records.
    if any(word in q for word in ("expensive", "highest", "most costly")):
        records = (
            db.query(PricingRecord)
            .order_by(desc(PricingRecord.price))
            .limit(5)
            .all()
        )

        if not records:
            answer = "No pricing records are available yet."
        else:
            answer = "Here are the five highest-priced records currently available."

        return {
            "answer": answer,
            "records": [_record_to_dict(record) for record in records],
            "source": "postgresql",
        }

    # 2. Find the cheapest pricing records.
    if any(word in q for word in ("cheapest", "lowest", "least expensive")):
        records = (
            db.query(PricingRecord)
            .order_by(PricingRecord.price.asc())
            .limit(5)
            .all()
        )

        return {
            "answer": (
                "Here are the five lowest-priced records currently available."
                if records
                else "No pricing records are available yet."
            ),
            "records": [_record_to_dict(record) for record in records],
            "source": "postgresql",
        }

    # 3. Compare prices for a SKU across stores.
    if "sku" in q and any(
        word in q for word in ("compare", "across stores", "comparison")
    ):
        import re

        match = re.search(r"\bsku\s+([a-z0-9_-]+)", q)

        if not match:
            return {
                "answer": (
                    "Please include a SKU, for example: "
                    "'Compare prices for SKU MAN-KULFI across stores'."
                ),
                "records": [],
                "source": "postgresql",
            }

        sku = match.group(1).upper()

        records = (
            db.query(PricingRecord)
            .filter(func.upper(PricingRecord.sku) == sku)
            .order_by(PricingRecord.store_id.asc())
            .limit(100)
            .all()
        )

        return {
            "answer": (
                f"Found {len(records)} pricing records for SKU {sku}."
                if records
                else f"No pricing records were found for SKU {sku}."
            ),
            "records": [_record_to_dict(record) for record in records],
            "source": "postgresql",
        }

    # 4. Show pricing records for a specific store.
    if "store" in q and any(
        word in q for word in ("show", "price", "pricing", "records")
    ):
        import re

        match = re.search(r"\bstore\s+([a-z0-9_-]+)", q)

        if not match:
            return {
                "answer": (
                    "Please include a store ID, for example: "
                    "'Show pricing records for store S001'."
                ),
                "records": [],
                "source": "postgresql",
            }

        store_id = match.group(1).upper()

        records = (
            db.query(PricingRecord)
            .filter(func.upper(PricingRecord.store_id) == store_id)
            .order_by(desc(PricingRecord.price_date))
            .limit(100)
            .all()
        )

        return {
            "answer": (
                f"Found {len(records)} pricing records for store {store_id}."
                if records
                else f"No pricing records were found for store {store_id}."
            ),
            "records": [_record_to_dict(record) for record in records],
            "source": "postgresql",
        }

    # 5. Summarize the number of records and average price.
    if any(word in q for word in ("summary", "average price", "overall")):
        total_records = db.query(func.count(PricingRecord.id)).scalar() or 0
        average_price = db.query(func.avg(PricingRecord.price)).scalar()

        average_text = (
            f"{float(average_price):.2f}"
            if average_price is not None
            else "not available"
        )

        return {
            "answer": (
                f"There are {total_records} pricing records. "
                f"The average recorded price is ₹{average_text}."
            ),
            "records": [],
            "source": "postgresql",
        }

    return {
        "answer": (
            "I can currently answer questions about the most expensive "
            "or cheapest records, compare a SKU across stores, show records "
            "for a store, or summarize overall pricing. "
            "Try one of the suggested questions."
        ),
        "records": [],
        "source": "postgresql",
    }


def _record_to_dict(record: PricingRecord) -> dict:
    """Convert a database record to a JSON-friendly dictionary."""
    return {
        "id": record.id,
        "store_id": record.store_id,
        "sku": record.sku,
        "product_name": record.product_name,
        "price": float(record.price),
        "date": str(record.price_date),
    }
