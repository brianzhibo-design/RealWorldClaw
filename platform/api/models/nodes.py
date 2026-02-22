"""Node model for Manufacturing Capability World Map system."""

from __future__ import annotations

import enum
from typing import Optional, List

from pydantic import BaseModel, Field, field_validator


class NodeType(str, enum.Enum):
    """Manufacturing equipment types"""
    printer_3d = "3d_printer"
    cnc_mill = "cnc_mill"
    laser_cutter = "laser_cutter"
    drill_press = "drill_press"
    assembly_line = "assembly_line"


class NodeStatus(str, enum.Enum):
    """Node online status"""
    online = "online"
    idle = "idle"  # alias for online (node is available)
    offline = "offline"
    busy = "busy"
    maintenance = "maintenance"


class MaterialSupport(str, enum.Enum):
    """Supported materials"""
    pla = "pla"
    abs = "abs"
    petg = "petg"
    tpu = "tpu"
    wood = "wood"
    metal = "metal"
    resin = "resin"
    carbon_fiber = "carbon_fiber"


# ─── Request / Response schemas ──────────────────────────

class NodeRegisterRequest(BaseModel):
    """Request to register a new manufacturing node"""
    name: str = Field(..., min_length=1, max_length=100)
    node_type: NodeType
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    capabilities: List[str] = Field(default_factory=list)
    materials: List[MaterialSupport] = Field(default_factory=list)
    build_volume_x: Optional[float] = Field(None, gt=0)
    build_volume_y: Optional[float] = Field(None, gt=0)
    build_volume_z: Optional[float] = Field(None, gt=0)
    description: Optional[str] = Field(None, max_length=500)

    @field_validator("capabilities")
    @classmethod
    def validate_capabilities(cls, v: List[str]) -> List[str]:
        """Ensure capabilities are non-empty strings"""
        return [cap.strip() for cap in v if cap.strip()]


class NodeHeartbeatRequest(BaseModel):
    """Node heartbeat status update"""
    status: NodeStatus
    current_job_id: Optional[str] = None
    queue_length: int = Field(default=0, ge=0)


class NodeMatchRequest(BaseModel):
    """Request to find nodes matching design requirements"""
    required_materials: List[MaterialSupport] = Field(default_factory=list)
    required_capabilities: List[str] = Field(default_factory=list)
    min_build_volume_x: Optional[float] = Field(None, gt=0)
    min_build_volume_y: Optional[float] = Field(None, gt=0)
    min_build_volume_z: Optional[float] = Field(None, gt=0)
    max_distance_km: Optional[float] = Field(None, gt=0)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)


class NodeUpdateRequest(BaseModel):
    """Update node configuration (owner only)"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    capabilities: Optional[List[str]] = None
    materials: Optional[List[MaterialSupport]] = None
    build_volume_x: Optional[float] = Field(None, gt=0)
    build_volume_y: Optional[float] = Field(None, gt=0)
    build_volume_z: Optional[float] = Field(None, gt=0)
    description: Optional[str] = Field(None, max_length=500)


class NodeResponse(BaseModel):
    """Public node information (with fuzzy location)"""
    id: str
    name: str
    node_type: NodeType
    fuzzy_latitude: float
    fuzzy_longitude: float
    capabilities: List[str]
    materials: List[MaterialSupport]
    build_volume_x: Optional[float]
    build_volume_y: Optional[float]
    build_volume_z: Optional[float]
    description: Optional[str]
    status: NodeStatus
    last_heartbeat: Optional[str]
    created_at: str


class NodeDetailResponse(BaseModel):
    """Detailed node information (owner only)"""
    id: str
    name: str
    node_type: NodeType
    latitude: float
    longitude: float
    fuzzy_latitude: float
    fuzzy_longitude: float
    capabilities: List[str]
    materials: List[MaterialSupport]
    build_volume_x: Optional[float]
    build_volume_y: Optional[float]
    build_volume_z: Optional[float]
    description: Optional[str]
    status: NodeStatus
    current_job_id: Optional[str]
    queue_length: int
    last_heartbeat: Optional[str]
    total_jobs: int
    success_rate: float
    created_at: str
    updated_at: str


class NearbyNodesResponse(BaseModel):
    """Response for nearby nodes query"""
    nodes: List[NodeResponse]
    total_count: int
    search_radius_km: float
    center_latitude: float
    center_longitude: float


class NodeMatchResponse(BaseModel):
    """Response for node matching query"""
    matches: List[NodeResponse]
    total_count: int
    criteria: NodeMatchRequest