from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0001_create_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "stations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("state", sa.String(length=10), nullable=False),
        sa.Column("station_name", sa.String(length=255), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
    )
    op.create_index("ix_station_state", "stations", ["state"])
    op.create_index("ix_station_name", "stations", ["station_name"])

    op.create_table(
        "weather_data",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("station_id", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("evapotranspiration_mm", sa.Float()),
        sa.Column("rainfall_mm", sa.Float()),
        sa.Column("temp_max_c", sa.Float()),
        sa.Column("temp_min_c", sa.Float()),
        sa.Column("humidity_max_percent", sa.Float()),
        sa.Column("humidity_min_percent", sa.Float()),
        sa.Column("wind_speed_ms", sa.Float()),
        sa.ForeignKeyConstraint(["station_id"], ["stations.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("station_id", "date", name="uq_weather_station_date"),
    )
    op.create_index(
        "ix_weather_station_date", "weather_data", ["station_id", "date"]
    )


def downgrade() -> None:
    op.drop_index("ix_weather_station_date", table_name="weather_data")
    op.drop_table("weather_data")
    op.drop_index("ix_station_name", table_name="stations")
    op.drop_index("ix_station_state", table_name="stations")
    op.drop_table("stations")
