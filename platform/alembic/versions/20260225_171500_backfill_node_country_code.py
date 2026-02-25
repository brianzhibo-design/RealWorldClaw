"""backfill node country_code from lat/lng

Revision ID: 20260225_171500
Revises: 20260224_191500
Create Date: 2026-02-25 17:15:00
"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "20260225_171500"
down_revision = "20260224_191500"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Coarse offline reverse-geocoding by country bounding boxes.
    # Only fill rows that are currently NULL.
    # Small/specific countries FIRST (SQL CASE is first-match-wins)
    op.execute(
        """
        UPDATE nodes
        SET country_code = CASE
            WHEN latitude BETWEEN 49.4 AND 50.2 AND longitude BETWEEN 5.7 AND 6.5 THEN 'LU'
            WHEN latitude BETWEEN 33.0 AND 39.5 AND longitude BETWEEN 124.0 AND 132.0 THEN 'KR'
            WHEN latitude BETWEEN 24.0 AND 46.0 AND longitude BETWEEN 123.0 AND 146.0 THEN 'JP'
            WHEN latitude BETWEEN 8.0 AND 24.0 AND longitude BETWEEN 102.0 AND 110.0 THEN 'VN'
            WHEN latitude BETWEEN 5.0 AND 21.0 AND longitude BETWEEN 97.0 AND 106.0 THEN 'TH'
            WHEN latitude BETWEEN 0.0 AND 8.0 AND longitude BETWEEN 99.0 AND 120.0 THEN 'MY'
            WHEN latitude BETWEEN 49.0 AND 55.0 AND longitude BETWEEN 14.0 AND 24.0 THEN 'PL'
            WHEN latitude BETWEEN 35.0 AND 47.5 AND longitude BETWEEN 6.0 AND 19.0 THEN 'IT'
            WHEN latitude BETWEEN 35.0 AND 43.0 AND longitude BETWEEN 25.0 AND 45.0 THEN 'TR'
            WHEN latitude BETWEEN 49.0 AND 61.0 AND longitude BETWEEN -8.0 AND 2.0 THEN 'GB'
            WHEN latitude BETWEEN 47.0 AND 55.0 AND longitude BETWEEN 5.0 AND 16.0 THEN 'DE'
            WHEN latitude BETWEEN 41.0 AND 51.5 AND longitude BETWEEN -5.0 AND 9.7 THEN 'FR'
            WHEN latitude BETWEEN 14.0 AND 33.0 AND longitude BETWEEN -118.0 AND -86.0 THEN 'MX'
            WHEN latitude BETWEEN 18.0 AND 54.0 AND longitude BETWEEN 73.0 AND 122.0 THEN 'CN'
            WHEN latitude BETWEEN 6.0 AND 37.0 AND longitude BETWEEN 68.0 AND 97.0 THEN 'IN'
            WHEN latitude BETWEEN -11.0 AND 6.0 AND longitude BETWEEN 95.0 AND 141.0 THEN 'ID'
            WHEN latitude BETWEEN 24.0 AND 50.0 AND longitude BETWEEN -125.0 AND -66.0 THEN 'US'
            WHEN latitude BETWEEN 41.0 AND 84.0 AND longitude BETWEEN -141.0 AND -52.0 THEN 'CA'
            WHEN latitude BETWEEN -34.0 AND 6.0 AND longitude BETWEEN -74.0 AND -34.0 THEN 'BR'
            WHEN latitude BETWEEN 41.0 AND 82.0 AND longitude BETWEEN 19.0 AND 180.0 THEN 'RU'
            ELSE country_code
        END
        WHERE country_code IS NULL
        """
    )


def downgrade() -> None:
    # This backfill is not safely reversible; keep existing values.
    pass
