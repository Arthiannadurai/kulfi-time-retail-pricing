from sqlalchemy import (
    BigInteger,
    Column,
    Date,
    Numeric,
    String,
    TIMESTAMP,
    text,
)
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class PricingRecord(Base):
    __tablename__ = "pricing_records"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    store_id = Column(String(20), nullable=False)
    sku = Column(String(50), nullable=False)
    product_name = Column(String(150), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    price_date = Column(Date, nullable=False)
    country = Column(String(50), nullable=False)

    price_effective_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    created_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )
    updated_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )
