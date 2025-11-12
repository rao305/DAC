#!/usr/bin/env python3
"""
DAC soak test: sustained load testing with configurable concurrency and duration.

Default: 3 concurrent workers for 15 minutes (900 seconds)
Measures: availability, 5xx rate, TTFT, latency
Outputs: JSON summary with percentile statistics

Requirements:
  - Python 3.10+
  - httpx (pip install httpx)

Usage:
  python3 soak_test.py
  python3 soak_test.py --url http://localhost:8000/api/threads/THREAD_ID/messages --concurrency 5 --duration 300
  python3 soak_test.py --help
"""
import argparse
import asyncio
import json
import os
import statistics
import sys
import time
from typing import Any, Dict, List

try:
    import httpx
except ImportError:
    print("ERROR: httpx is required. Install with: pip install httpx", file=sys.stderr)
    sys.exit(1)


async def one_chat(client: httpx.AsyncClient, url: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute a single chat request, measuring TTFT and total latency.

    Returns:
      {
        "ok": bool,
        "status": int,
        "ttft": float (ms),
        "latency": float (ms)
      }
    """
    t0 = time.perf_counter()
    ttft = None
    content = []

    try:
        headers = {
            "Accept": "text/event-stream",
            "Content-Type": "application/json",
            "x-org-id": os.getenv("ORG_ID", "org_demo")
        }

        async with client.stream("POST", url, headers=headers, json=payload, timeout=60.0) as resp:
            status = resp.status_code

            # Any 5xx is a failure
            if status >= 500:
                return {"ok": False, "status": status, "ttft": None, "latency": None}

            # Read SSE stream
            async for chunk in resp.aiter_bytes():
                if not chunk:
                    continue

                s = chunk.decode("utf-8", errors="ignore")

                # SSE frames are delimited by \n\n
                for frame in s.split("\n\n"):
                    for line in frame.split("\n"):
                        if line.startswith("data:"):
                            # First data line = first token
                            if ttft is None:
                                ttft = (time.perf_counter() - t0) * 1000.0
                            content.append(line[5:].strip())

        t1 = time.perf_counter()
        latency = (t1 - t0) * 1000.0

        # If we never got a token, use total latency as TTFT
        if ttft is None:
            ttft = latency

        return {
            "ok": True,
            "status": status,
            "ttft": ttft,
            "latency": latency
        }

    except Exception as e:
        # Network errors, timeouts, etc
        return {
            "ok": False,
            "status": 0,
            "ttft": None,
            "latency": None,
            "error": str(e)
        }


async def worker(
    worker_id: int,
    url: str,
    until: float,
    payload: Dict[str, Any],
    stats: List[Dict[str, Any]]
):
    """
    Worker that continuously sends requests until time expires.
    """
    async with httpx.AsyncClient(http2=False) as client:
        request_count = 0
        while time.time() < until:
            result = await one_chat(client, url, payload)
            stats.append(result)
            request_count += 1

            # Small delay to avoid overwhelming the system
            await asyncio.sleep(0.1)

    print(f"Worker {worker_id} completed {request_count} requests")


def calculate_percentile(values: List[float], percentile: float) -> float:
    """Calculate percentile (0-1 range)."""
    if not values:
        return 0.0
    sorted_values = sorted(values)
    k = (len(sorted_values) - 1) * percentile
    f = int(k)
    c = f + 1
    if c >= len(sorted_values):
        return sorted_values[-1]
    return sorted_values[f] + (k - f) * (sorted_values[c] - sorted_values[f])


def generate_summary(stats: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate summary statistics from raw results."""
    total = len(stats) or 1

    # Separate successful and failed requests
    ok_requests = [s for s in stats if s.get('ok')]
    failed_requests = [s for s in stats if not s.get('ok')]

    # Count 5xx errors
    error_5xx = [s for s in failed_requests if s.get('status', 0) >= 500]

    # Extract metrics from successful requests
    ttfts = [s['ttft'] for s in ok_requests if s.get('ttft') is not None]
    latencies = [s['latency'] for s in ok_requests if s.get('latency') is not None]

    def safe_percentile(values: List[float], p: float) -> float:
        return round(calculate_percentile(values, p), 1) if values else 0.0

    summary = {
        "test_config": {
            "total_requests": total,
            "successful_requests": len(ok_requests),
            "failed_requests": len(failed_requests)
        },
        "availability": {
            "percent": round(100.0 * len(ok_requests) / total, 2),
            "target": 99.5
        },
        "error_5xx": {
            "count": len(error_5xx),
            "percent": round(100.0 * len(error_5xx) / total, 2),
            "target_percent": 1.0
        },
        "ttft_ms": {
            "p50": safe_percentile(ttfts, 0.50),
            "p95": safe_percentile(ttfts, 0.95),
            "p99": safe_percentile(ttfts, 0.99),
            "min": round(min(ttfts), 1) if ttfts else 0.0,
            "max": round(max(ttfts), 1) if ttfts else 0.0,
            "avg": round(statistics.mean(ttfts), 1) if ttfts else 0.0
        },
        "latency_ms": {
            "p50": safe_percentile(latencies, 0.50),
            "p95": safe_percentile(latencies, 0.95),
            "p99": safe_percentile(latencies, 0.99),
            "min": round(min(latencies), 1) if latencies else 0.0,
            "max": round(max(latencies), 1) if latencies else 0.0,
            "avg": round(statistics.mean(latencies), 1) if latencies else 0.0
        }
    }

    return summary


async def main():
    parser = argparse.ArgumentParser(
        description="DAC soak test - sustained load testing",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument(
        '--url',
        default=os.getenv('DAC_API_URL', 'http://localhost:8000/api/chat'),
        help='API endpoint URL (default: http://localhost:8000/api/chat)'
    )
    parser.add_argument(
        '--concurrency',
        type=int,
        default=int(os.getenv('CONCURRENCY', '3')),
        help='Number of concurrent workers (default: 3)'
    )
    parser.add_argument(
        '--duration',
        type=int,
        default=int(os.getenv('DURATION_SECS', '900')),
        help='Test duration in seconds (default: 900 = 15 minutes)'
    )
    parser.add_argument(
        '--prompt',
        default=os.getenv('PROMPT', 'Say hello and list 5 colors.'),
        help='Test prompt to send'
    )

    args = parser.parse_args()

    # Calculate end time
    start_time = time.time()
    until = start_time + args.duration

    # Prepare payload (adjust based on your API)
    payload = {
        "messages": [
            {"role": "user", "content": args.prompt}
        ]
    }

    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("DAC Soak Test")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"URL:         {args.url}")
    print(f"Concurrency: {args.concurrency}")
    print(f"Duration:    {args.duration}s ({args.duration // 60}m {args.duration % 60}s)")
    print(f"Prompt:      {args.prompt[:50]}...")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("")
    print("Starting workers...")

    # Shared stats list
    stats: List[Dict[str, Any]] = []

    # Launch workers
    tasks = [
        asyncio.create_task(worker(i, args.url, until, payload, stats))
        for i in range(args.concurrency)
    ]

    # Wait for all workers to complete
    await asyncio.gather(*tasks)

    elapsed = time.time() - start_time

    print("")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"Test completed in {elapsed:.1f}s")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("")

    # Generate and print summary
    summary = generate_summary(stats)
    print(json.dumps(summary, indent=2))

    # Save to file
    output_file = f"soak_test_results_{int(start_time)}.json"
    with open(output_file, 'w') as f:
        json.dump(summary, f, indent=2)

    print("")
    print(f"Results saved to: {output_file}")

    # Exit with error if availability or 5xx rate targets not met
    if summary['availability']['percent'] < summary['availability']['target']:
        print(f"❌ FAILED: Availability {summary['availability']['percent']}% < {summary['availability']['target']}%")
        sys.exit(1)

    if summary['error_5xx']['percent'] >= summary['error_5xx']['target_percent']:
        print(f"❌ FAILED: 5xx error rate {summary['error_5xx']['percent']}% >= {summary['error_5xx']['target_percent']}%")
        sys.exit(1)

    print("✅ PASSED: All targets met")
    sys.exit(0)


if __name__ == '__main__':
    asyncio.run(main())
