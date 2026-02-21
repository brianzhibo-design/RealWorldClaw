"""Printer simulation endpoints for frontend development and demos."""

from __future__ import annotations

from pydantic import BaseModel, Field
from fastapi import APIRouter

from ..events import Event, event_bus

router = APIRouter(prefix="/sim", tags=["simulation"])


class PrintStartRequest(BaseModel):
    printer_id: str
    order_id: str = "sim-order-001"
    file_name: str = "demo-part.gcode"


class PrintProgressRequest(BaseModel):
    printer_id: str
    progress: float = Field(ge=0, le=100)
    order_id: str = "sim-order-001"


class PrintCompleteRequest(BaseModel):
    printer_id: str
    order_id: str = "sim-order-001"


@router.post("/print-start")
async def sim_print_start(req: PrintStartRequest):
    event = Event(
        type="printer_status_changed",
        data={
            "printer_id": req.printer_id,
            "status": "printing",
            "order_id": req.order_id,
            "file_name": req.file_name,
        },
    )
    await event_bus.publish(event)
    return {"ok": True, "event": event.to_dict()}


@router.post("/print-progress")
async def sim_print_progress(req: PrintProgressRequest):
    event = Event(
        type="print_progress",
        data={
            "printer_id": req.printer_id,
            "progress": req.progress,
            "order_id": req.order_id,
        },
    )
    await event_bus.publish(event)
    return {"ok": True, "event": event.to_dict()}


@router.post("/print-complete")
async def sim_print_complete(req: PrintCompleteRequest):
    event = Event(
        type="printer_status_changed",
        data={
            "printer_id": req.printer_id,
            "status": "idle",
            "order_id": req.order_id,
        },
    )
    await event_bus.publish(event)
    return {"ok": True, "event": event.to_dict()}
