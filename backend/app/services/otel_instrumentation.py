"""OpenTelemetry Instrumentation for DAC.

Provides distributed tracing for production observability.
"""
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
import os

# Initialize tracer
tracer_provider = TracerProvider(
    resource=Resource.create({
        "service.name": "dac-backend",
        "service.version": "1.0.0",
    })
)

# Add console exporter (for development)
console_exporter = ConsoleSpanExporter()
tracer_provider.add_span_processor(BatchSpanProcessor(console_exporter))

# Add OTLP exporter if OTLP endpoint configured (for production)
otlp_endpoint = os.getenv("OTLP_ENDPOINT")
if otlp_endpoint:
    otlp_exporter = OTLPSpanExporter(endpoint=otlp_endpoint)
    tracer_provider.add_span_processor(BatchSpanProcessor(otlp_exporter))

trace.set_tracer_provider(tracer_provider)

# Get tracer
tracer = trace.get_tracer(__name__)


def instrument_fastapi_app(app):
    """Instrument FastAPI app with OpenTelemetry."""
    FastAPIInstrumentor.instrument_app(app)
    HTTPXClientInstrumentor().instrument()
    return app


def get_tracer():
    """Get the tracer instance."""
    return tracer

