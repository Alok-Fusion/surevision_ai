from __future__ import annotations

from io import StringIO

import pandas as pd


def detect_workflow_friction(records: list[dict], csv_text: str | None = None) -> dict:
    if csv_text:
        frame = pd.read_csv(StringIO(csv_text))
    else:
        frame = pd.DataFrame(records)

    if frame.empty:
        return {
            "rowsAnalyzed": 0,
            "columnsAnalyzed": 0,
            "frictionSignals": ["No tabular data was supplied for analysis."],
            "silentPatterns": [],
            "dataQualityScore": 0,
        }

    missing_ratio = float(frame.isna().mean().mean())
    duplicate_count = int(frame.duplicated().sum())
    numeric_columns = frame.select_dtypes(include="number")
    high_variance_columns = [
        column
        for column in numeric_columns.columns
        if numeric_columns[column].mean() and numeric_columns[column].std() / abs(numeric_columns[column].mean()) > 1.2
    ]

    friction_signals = []
    if missing_ratio > 0.08:
        friction_signals.append("High missing-data ratio suggests inconsistent handoffs or incomplete source capture.")
    if duplicate_count:
        friction_signals.append(f"{duplicate_count} duplicate rows suggest rework or repeated queue submissions.")
    if high_variance_columns:
        friction_signals.append(f"High variance detected in {', '.join(high_variance_columns[:3])}, which may indicate leakage or exception volatility.")

    if not friction_signals:
        friction_signals.append("No severe structural friction found; monitor aging, ownership, and exception reason columns.")

    silent_patterns = []
    for column in frame.columns:
        lowered = str(column).lower()
        if "age" in lowered or "days" in lowered:
            silent_patterns.append(f"{column} can expose hidden queue aging and SLA slippage.")
        if "vendor" in lowered:
            silent_patterns.append(f"{column} can expose vendor concentration and repeated exception ownership.")
        if "exception" in lowered or "reason" in lowered:
            silent_patterns.append(f"{column} can reveal recurring root causes that are normalized by teams.")

    quality_score = max(10, min(98, round(100 - missing_ratio * 80 - min(duplicate_count, 20))))

    return {
        "rowsAnalyzed": int(frame.shape[0]),
        "columnsAnalyzed": int(frame.shape[1]),
        "frictionSignals": friction_signals,
        "silentPatterns": silent_patterns[:6],
        "dataQualityScore": quality_score,
    }

