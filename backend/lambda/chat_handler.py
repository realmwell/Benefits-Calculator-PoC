"""
DC Benefits Finder — Lambda Chat Handler

API Gateway POST /chat -> this handler -> RAG answer

Includes belt-and-suspenders budget check via AWS Cost Explorer.
"""

import json
import os
import traceback
from datetime import datetime

import boto3

from rag_engine import answer_question

# Budget check threshold
BUDGET_WARNING_THRESHOLD = float(os.environ.get("BUDGET_WARNING", "9"))
BUDGET_HARD_STOP = float(os.environ.get("BUDGET_HARD_STOP", "10"))

CORS_HEADERS = {
    "Access-Control-Allow-Origin": os.environ.get("CORS_ORIGIN", "*"),
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
}


def check_budget() -> dict:
    """
    Check current month AWS spend.
    Returns {"ok": True/False, "spend": float, "warning": bool}

    AWS Budgets action auto-restricts IAM if $10 threshold hit.
    This is a belt-and-suspenders check.
    """
    try:
        ce = boto3.client("ce")
        now = datetime.utcnow()
        start = now.strftime("%Y-%m-01")
        end = now.strftime("%Y-%m-%d")

        result = ce.get_cost_and_usage(
            TimePeriod={"Start": start, "End": end},
            Granularity="MONTHLY",
            Metrics=["UnblendedCost"],
        )

        amount = float(
            result["ResultsByTime"][0]["Total"]["UnblendedCost"]["Amount"]
        )

        return {
            "ok": amount < BUDGET_HARD_STOP,
            "spend": amount,
            "warning": amount >= BUDGET_WARNING_THRESHOLD,
        }
    except Exception:
        # If we can't check budget, proceed but log it
        print("WARNING: Could not check budget via Cost Explorer")
        return {"ok": True, "spend": 0, "warning": False}


def handler(event, context):
    """Lambda handler for POST /chat."""

    # Handle CORS preflight
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": "",
        }

    try:
        # Budget check
        budget = check_budget()
        if not budget["ok"]:
            return {
                "statusCode": 503,
                "headers": CORS_HEADERS,
                "body": json.dumps(
                    {
                        "error": "Monthly budget exceeded. Service temporarily unavailable.",
                        "budget_exceeded": True,
                    }
                ),
            }

        # Parse request
        body = json.loads(event.get("body", "{}"))
        question = body.get("question", "").strip()

        if not question:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "No question provided"}),
            }

        if len(question) > 1000:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Question too long (max 1000 characters)"}),
            }

        # Run RAG pipeline
        result = answer_question(question)

        # Add budget warning if approaching limit
        if budget["warning"]:
            result["budget_warning"] = True

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps(result),
        }

    except Exception as e:
        print(f"ERROR: {traceback.format_exc()}")
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Internal server error"}),
        }
