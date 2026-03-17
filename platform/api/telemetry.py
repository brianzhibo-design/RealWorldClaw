"""OpenTelemetry setup for RealWorldClaw API."""

from __future__ import annotations

import logging
import os

from fastapi import FastAPI
from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

logger = logging.getLogger(__name__)

_PROVIDER_INITIALIZED = False


def init_telemetry(app: FastAPI) -> None:
    """Initialize tracing and instrument FastAPI.

    If OTEL_EXPORTER_OTLP_ENDPOINT is unset, tracing remains local no-op/exportless
    but app instrumentation still works without raising runtime errors.
    """
    global _PROVIDER_INITIALIZED

    service_name = os.environ.get("OTEL_SERVICE_NAME", "realworldclaw-platform-api")

    provider: TracerProvider | None = None
    if not _PROVIDER_INITIALIZED:
        provider = TracerProvider(resource=Resource.create({"service.name": service_name}))
        trace.set_tracer_provider(provider)
        _PROVIDER_INITIALIZED = True

        endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "").strip()
        if endpoint:
            from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

            exporter = OTLPSpanExporter(endpoint=endpoint)
            provider.add_span_processor(BatchSpanProcessor(exporter))
            logger.info("OpenTelemetry OTLP exporter enabled: endpoint=%s", endpoint)
        else:
            logger.info("OpenTelemetry OTLP endpoint not configured; running without exporter")
    else:
        current_provider = trace.get_tracer_provider()
        if isinstance(current_provider, TracerProvider):
            provider = current_provider

    if getattr(app.state, "otel_instrumented", False):
        return

    if provider:
        FastAPIInstrumentor.instrument_app(app, tracer_provider=provider)
    else:
        FastAPIInstrumentor.instrument_app(app)

    app.state.otel_instrumented = True


def get_tracer(name: str):
    return trace.get_tracer(name)
