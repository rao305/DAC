"""Metrics API endpoints."""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from app.observability import metrics_collector
from app.services.memory_guard import memory_guard
from app.services.performance import performance_monitor

router = APIRouter()


@router.get("/metrics")
async def get_metrics() -> Dict[str, Any]:
    """
    Get system-wide metrics summary.

    Returns request counts, latency stats, and error breakdown.
    """
    summary = metrics_collector.get_summary()
    memory_status = memory_guard.status()
    summary["memory_status"] = {
        "enabled": memory_status.enabled,
        "message": memory_status.message,
        "last_checked": memory_status.last_checked,
    }
    return summary


@router.get("/metrics/org/{org_id}")
async def get_org_metrics(org_id: str) -> Dict[str, Any]:
    """
    Get metrics for a specific organization.

    Useful for per-org dashboards and usage monitoring.
    """
    data = metrics_collector.get_org_metrics(org_id)
    memory_status = memory_guard.status()
    data["memory_status"] = {
        "enabled": memory_status.enabled,
        "message": memory_status.message,
        "last_checked": memory_status.last_checked,
    }
    return data


@router.get("/metrics/performance")
async def get_performance_metrics(last_n: int = 100) -> Dict[str, Any]:
    """
    Get Phase 1 performance metrics.
    
    Tracks:
    - TTFT (Time to First Token): Target ≤1.5s P95
    - End-to-end latency: Target ≤6s P95, ≤3.5s P50
    - Token usage for cost monitoring
    - Error rates: Target <1%
    
    Args:
        last_n: Number of recent requests to analyze (default: 100)
    """
    stats = await performance_monitor.get_stats(last_n=last_n)

    # Add target compliance summary (only if we have data)
    if "ttft" in stats and "latency" in stats and "errors" in stats:
        stats["phase1_compliance"] = {
            "ttft_target_met": stats["ttft"]["meets_target"],
            "latency_p50_target_met": stats["latency"]["meets_p50_target"],
            "latency_p95_target_met": stats["latency"]["meets_p95_target"],
            "error_target_met": stats["errors"]["meets_target"],
            "overall_passing": (
                stats["ttft"]["meets_target"] and
                stats["latency"]["meets_p50_target"] and
                stats["latency"]["meets_p95_target"] and
                stats["errors"]["meets_target"]
            ),
        }
    else:
        stats["phase1_compliance"] = {
            "ttft_target_met": False,
            "latency_p50_target_met": False,
            "latency_p95_target_met": False,
            "error_target_met": False,
            "overall_passing": False,
        }

    return stats
