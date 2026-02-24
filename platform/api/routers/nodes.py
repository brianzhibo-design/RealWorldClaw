"""Nodes router for Manufacturing Capability World Map system."""

from __future__ import annotations
import logging
logger = logging.getLogger(__name__)



import json
import math
import random
import uuid
from datetime import datetime, timezone, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query

from ..database import get_db
from ..models.nodes import (
    NodeRegisterRequest,
    NodeHeartbeatRequest,
    NodeMatchRequest,
    NodeUpdateRequest,
    NodeResponse,
    NodeDetailResponse,
    NearbyNodesResponse,
    NodeMatchResponse,
    NodeStatus,
    NodeType,
    MaterialSupport,
    NodeHeartbeatStatusResponse,
)
from ..deps import get_authenticated_identity

router = APIRouter(prefix="/nodes", tags=["nodes"])

# Constants for location fuzzing and heartbeat timeout
LOCATION_FUZZ_DEGREES = 0.01  # ~1km radius
HEARTBEAT_TIMEOUT_MINUTES = 5
EARTH_RADIUS_KM = 6371.0


def _fuzz_location(latitude: float, longitude: float) -> tuple[float, float]:
    """Add random noise to coordinates for privacy"""
    fuzzy_lat = latitude + random.uniform(-LOCATION_FUZZ_DEGREES, LOCATION_FUZZ_DEGREES)
    fuzzy_lng = longitude + random.uniform(-LOCATION_FUZZ_DEGREES, LOCATION_FUZZ_DEGREES)
    
    # Clamp to valid ranges
    fuzzy_lat = max(-90.0, min(90.0, fuzzy_lat))
    fuzzy_lng = max(-180.0, min(180.0, fuzzy_lng))
    
    return fuzzy_lat, fuzzy_lng


def _haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points using Haversine formula (in km)"""
    # Convert to radians
    lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return EARTH_RADIUS_KM * c


def _compute_online_status(last_heartbeat: str | None) -> str:
    if not last_heartbeat:
        return "offline"
    heartbeat_at = datetime.fromisoformat(last_heartbeat.replace('Z', '+00:00'))
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=HEARTBEAT_TIMEOUT_MINUTES)
    return "online" if heartbeat_at >= cutoff else "offline"


def _row_to_node_response(row: dict) -> NodeResponse:
    """Convert DB row to public NodeResponse"""
    materials = json.loads(row["materials"]) if isinstance(row["materials"], str) else row["materials"]
    capabilities = json.loads(row["capabilities"]) if isinstance(row["capabilities"], str) else row["capabilities"]

    return NodeResponse(
        id=row["id"],
        name=row["name"],
        node_type=NodeType(row["node_type"]),
        fuzzy_latitude=row["fuzzy_latitude"],
        fuzzy_longitude=row["fuzzy_longitude"],
        capabilities=capabilities,
        materials=[MaterialSupport(m) for m in materials],
        build_volume_x=row["build_volume_x"],
        build_volume_y=row["build_volume_y"],
        build_volume_z=row["build_volume_z"],
        description=row["description"],
        status=NodeStatus(row["status"]),
        online_status=_compute_online_status(row.get("last_heartbeat")),
        last_heartbeat=row["last_heartbeat"],
        created_at=row["created_at"],
    )


def _row_to_node_detail(row: dict) -> NodeDetailResponse:
    """Convert DB row to detailed NodeDetailResponse (owner only)"""
    materials = json.loads(row["materials"]) if isinstance(row["materials"], str) else row["materials"]
    capabilities = json.loads(row["capabilities"]) if isinstance(row["capabilities"], str) else row["capabilities"]
    
    return NodeDetailResponse(
        id=row["id"],
        name=row["name"],
        node_type=NodeType(row["node_type"]),
        latitude=row["latitude"],
        longitude=row["longitude"],
        fuzzy_latitude=row["fuzzy_latitude"],
        fuzzy_longitude=row["fuzzy_longitude"],
        capabilities=capabilities,
        materials=[MaterialSupport(m) for m in materials],
        build_volume_x=row["build_volume_x"],
        build_volume_y=row["build_volume_y"],
        build_volume_z=row["build_volume_z"],
        description=row["description"],
        status=NodeStatus(row["status"]),
        current_job_id=row["current_job_id"],
        queue_length=row["queue_length"] or 0,
        last_heartbeat=row["last_heartbeat"],
        total_jobs=row["total_jobs"] or 0,
        success_rate=row["success_rate"] or 0.0,
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.post("/register", response_model=NodeDetailResponse)
def register_node(request: NodeRegisterRequest, identity: dict = Depends(get_authenticated_identity)):
    """Register a new manufacturing node (requires authentication)"""
    node_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Generate fuzzy location for public display
    fuzzy_lat, fuzzy_lng = _fuzz_location(request.latitude, request.longitude)
    
    with get_db() as db:
        # Check if agent already has a node with this name
        existing = db.execute(
            "SELECT id FROM nodes WHERE owner_id = ? AND name = ?",
            (identity["identity_id"], request.name)
        ).fetchone()
        
        if existing:
            raise HTTPException(status_code=400, detail="Node name already exists for this owner")
        
        # Insert new node
        db.execute("""
            INSERT INTO nodes (
                id, owner_id, name, node_type, latitude, longitude,
                fuzzy_latitude, fuzzy_longitude, capabilities, materials,
                build_volume_x, build_volume_y, build_volume_z, description,
                status, queue_length, total_jobs, success_rate,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            node_id, identity["identity_id"], request.name, request.node_type.value,
            request.latitude, request.longitude, fuzzy_lat, fuzzy_lng,
            json.dumps(request.capabilities), json.dumps([m.value for m in request.materials]),
            request.build_volume_x, request.build_volume_y, request.build_volume_z,
            request.description, NodeStatus.offline.value, 0, 0, 0.0, now, now
        ))
        
        # Fetch and return the created node
        row = db.execute("SELECT * FROM nodes WHERE id = ?", (node_id,)).fetchone()
        
    logger.info("Node registered: id=%s by=%s", node_id, identity["identity_id"])
    return _row_to_node_detail(dict(row))


@router.get("/map", response_model=List[NodeResponse])
def get_map_nodes():
    """Get all nodes for world map display (public, anonymized)"""
    with get_db() as db:
        # Only return nodes that have sent heartbeat within timeout period
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=HEARTBEAT_TIMEOUT_MINUTES)
        
        rows = db.execute("""
            SELECT * FROM nodes 
            WHERE last_heartbeat IS NULL OR last_heartbeat > ?
            ORDER BY created_at DESC
        """, (cutoff_time.isoformat(),)).fetchall()
        
        # Update offline status for nodes that haven't sent heartbeat
        nodes_to_mark_offline = []
        result = []
        
        for row in rows:
            row_dict = dict(row)
            if row_dict["last_heartbeat"]:
                last_heartbeat = datetime.fromisoformat(row_dict["last_heartbeat"].replace('Z', '+00:00'))
                if last_heartbeat < cutoff_time:
                    nodes_to_mark_offline.append(row_dict["id"])
                    row_dict["status"] = NodeStatus.offline.value
            
            result.append(_row_to_node_response(row_dict))
        
        # Mark timed-out nodes as offline
        if nodes_to_mark_offline:
            placeholders = ",".join(["?" for _ in nodes_to_mark_offline])
            db.execute(f"UPDATE nodes SET status = 'offline' WHERE id IN ({placeholders})", nodes_to_mark_offline)
        
        return result


@router.post("/{node_id}/heartbeat")
def node_heartbeat(node_id: str, request: NodeHeartbeatRequest, identity: dict = Depends(get_authenticated_identity)):
    """Update node heartbeat and status for a specific node owned by current identity."""
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        node = db.execute(
            "SELECT id FROM nodes WHERE id = ? AND owner_id = ?",
            (node_id, identity["identity_id"]),
        ).fetchone()

        if not node:
            raise HTTPException(status_code=403, detail="Node not found or access denied")

        db.execute(
            """
            UPDATE nodes
            SET status = ?, current_job_id = ?, queue_length = ?,
                last_heartbeat = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                request.status.value,
                request.current_job_id,
                request.queue_length,
                now,
                now,
                node_id,
            ),
        )

        logger.info("Node heartbeat: id=%s by=%s status=%s", node_id, identity["identity_id"], request.status.value)

        return {"message": "Heartbeat updated", "timestamp": now}


@router.get("/nearby", response_model=NearbyNodesResponse)
def get_nearby_nodes(
    lat: float = Query(..., description="Latitude (also accepts 'latitude')", ge=-90.0, le=90.0),
    lng: float = Query(..., description="Longitude (also accepts 'longitude')", ge=-180.0, le=180.0),
    radius: float = Query(50.0, description="Search radius in kilometers", gt=0.0, le=1000.0)
):
    """Find nodes within specified radius of given coordinates"""
    with get_db() as db:
        # Get all active nodes
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=HEARTBEAT_TIMEOUT_MINUTES)
        
        rows = db.execute("""
            SELECT * FROM nodes 
            WHERE status != 'offline'
            AND (last_heartbeat IS NULL OR last_heartbeat > ?)
        """, (cutoff_time.isoformat(),)).fetchall()
        
        # Filter by distance using Haversine formula
        nearby_nodes = []
        for row in rows:
            row_dict = dict(row)
            # Use fuzzy coordinates for distance calculation to maintain privacy
            distance = _haversine_distance(
                lat, lng, 
                row_dict["fuzzy_latitude"], row_dict["fuzzy_longitude"]
            )
            
            if distance <= radius:
                nearby_nodes.append(_row_to_node_response(row_dict))
        
        return NearbyNodesResponse(
            nodes=nearby_nodes,
            total_count=len(nearby_nodes),
            search_radius_km=radius,
            center_latitude=lat,
            center_longitude=lng
        )


@router.get("")
def list_nodes(
    node_type: str = None,
    material: str = None,
    status: str = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """List all nodes with optional filtering and pagination."""
    with get_db() as db:
        query = "SELECT * FROM nodes WHERE 1=1"
        params = []

        if node_type:
            query += " AND node_type = ?"
            params.append(node_type)

        if status:
            query += " AND status = ?"
            params.append(status)

        if material:
            # material is stored as JSON array, use LIKE for simple filtering
            query += " AND materials LIKE ?"
            params.append(f'%"{material}"%')

        # Count total
        count_query = query.replace("SELECT * FROM", "SELECT COUNT(*) as cnt FROM")
        total = db.execute(count_query, params).fetchone()["cnt"]

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, (page - 1) * limit])

        rows = db.execute(query, params).fetchall()

        nodes = []
        for r in rows:
            row_dict = dict(r)
            online_status = _compute_online_status(row_dict.get("last_heartbeat"))
            if online_status == "offline" and row_dict["status"] != NodeStatus.offline.value:
                db.execute("UPDATE nodes SET status = ? WHERE id = ?", (NodeStatus.offline.value, row_dict["id"]))
                row_dict["status"] = NodeStatus.offline.value
            nodes.append(_row_to_node_response(row_dict))

        return {
            "nodes": nodes,
            "total": total,
            "page": page,
            "limit": limit,
        }


@router.get("/match")
def match_nodes_get(
    material: str = None,
    node_type: str = None,
    lat: float = Query(None, ge=-90.0, le=90.0),
    lng: float = Query(None, ge=-180.0, le=180.0),
    radius: float = Query(100.0, gt=0, le=5000),
):
    """GET version of node matching — find nodes by material, type, and location."""
    with get_db() as db:
        query = "SELECT * FROM nodes WHERE 1=1"
        params = []

        if node_type:
            query += " AND node_type = ?"
            params.append(node_type)

        if material:
            query += " AND materials LIKE ?"
            params.append(f'%"{material}"%')

        rows = db.execute(query, params).fetchall()

        results = []
        for row in rows:
            row_dict = dict(row)
            distance = None
            if lat is not None and lng is not None:
                distance = _haversine_distance(lat, lng, row_dict["fuzzy_latitude"], row_dict["fuzzy_longitude"])
                if distance > radius:
                    continue
            node_resp = _row_to_node_response(row_dict)
            results.append({"node": node_resp, "distance_km": round(distance, 2) if distance is not None else None})

        # Sort by distance if location provided
        if lat is not None and lng is not None:
            results.sort(key=lambda x: x["distance_km"] or 0)

        return {"matches": results, "total": len(results)}


@router.post("/match", response_model=NodeMatchResponse)
def match_nodes(request: NodeMatchRequest):
    """Find nodes matching design requirements"""
    with get_db() as db:
        # Base query for active nodes
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=HEARTBEAT_TIMEOUT_MINUTES)
        
        query = """
            SELECT * FROM nodes 
            WHERE status = 'online'
            AND (last_heartbeat IS NULL OR last_heartbeat > ?)
        """
        params = [cutoff_time.isoformat()]
        
        # Add build volume constraints
        if request.min_build_volume_x is not None:
            query += " AND (build_volume_x IS NULL OR build_volume_x >= ?)"
            params.append(request.min_build_volume_x)
        
        if request.min_build_volume_y is not None:
            query += " AND (build_volume_y IS NULL OR build_volume_y >= ?)"
            params.append(request.min_build_volume_y)
        
        if request.min_build_volume_z is not None:
            query += " AND (build_volume_z IS NULL OR build_volume_z >= ?)"
            params.append(request.min_build_volume_z)
        
        rows = db.execute(query, params).fetchall()
        
        # Filter by materials, capabilities, and distance in Python
        matching_nodes = []
        
        for row in rows:
            row_dict = dict(row)
            
            # Check material support
            if request.required_materials:
                node_materials = json.loads(row_dict["materials"]) if row_dict["materials"] else []
                required_materials = [m.value for m in request.required_materials]
                if not all(mat in node_materials for mat in required_materials):
                    continue
            
            # Check capabilities
            if request.required_capabilities:
                node_capabilities = json.loads(row_dict["capabilities"]) if row_dict["capabilities"] else []
                if not all(cap in node_capabilities for cap in request.required_capabilities):
                    continue
            
            # Check distance if location provided
            if (request.latitude is not None and request.longitude is not None 
                and request.max_distance_km is not None):
                distance = _haversine_distance(
                    request.latitude, request.longitude,
                    row_dict["fuzzy_latitude"], row_dict["fuzzy_longitude"]
                )
                if distance > request.max_distance_km:
                    continue
            
            matching_nodes.append(_row_to_node_response(row_dict))
        
        return NodeMatchResponse(
            matches=matching_nodes,
            total_count=len(matching_nodes),
            criteria=request
        )


@router.get("/my-nodes", response_model=List[NodeDetailResponse])
def get_my_nodes(identity: dict = Depends(get_authenticated_identity)):
    """Get all nodes owned by current agent with full details"""
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM nodes WHERE owner_id = ? ORDER BY created_at DESC",
            (identity["identity_id"],)
        ).fetchall()
        
        return [_row_to_node_detail(dict(row)) for row in rows]


@router.get("/{node_id}/heartbeat", response_model=NodeHeartbeatStatusResponse)
def get_node_heartbeat(node_id: str):
    """Get node heartbeat with computed online status."""
    with get_db() as db:
        row = db.execute(
            "SELECT id, status, last_heartbeat FROM nodes WHERE id = ?",
            (node_id,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Node not found")

        row_dict = dict(row)
        online_status = _compute_online_status(row_dict.get("last_heartbeat"))
        effective_status = row_dict["status"]

        if online_status == "offline" and row_dict["status"] != NodeStatus.offline.value:
            db.execute("UPDATE nodes SET status = ? WHERE id = ?", (NodeStatus.offline.value, node_id))
            effective_status = NodeStatus.offline.value

    return NodeHeartbeatStatusResponse(
        node_id=node_id,
        last_heartbeat=row_dict.get("last_heartbeat"),
        online_status=online_status,
        status=NodeStatus(effective_status),
    )


@router.get("/{node_id}")
def get_node_detail(node_id: str):
    """Get node information. Returns public info (fuzzy location)."""
    with get_db() as db:
        row = db.execute("SELECT * FROM nodes WHERE id = ?", (node_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Node not found")
        return _row_to_node_response(dict(row))


@router.put("/{node_id}", response_model=NodeDetailResponse)
def update_node(
    node_id: str, 
    request: NodeUpdateRequest, 
    identity: dict = Depends(get_authenticated_identity)
):
    """Update node configuration (owner only)"""
    now = datetime.now(timezone.utc).isoformat()
    
    with get_db() as db:
        # Check ownership
        row = db.execute(
            "SELECT * FROM nodes WHERE id = ? AND owner_id = ?",
            (node_id, identity["identity_id"])
        ).fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Node not found")
        
        # Build update query dynamically
        updates = []
        params = []
        
        if request.name is not None:
            updates.append("name = ?")
            params.append(request.name)
        
        if request.capabilities is not None:
            updates.append("capabilities = ?")
            params.append(json.dumps(request.capabilities))
        
        if request.materials is not None:
            updates.append("materials = ?")
            params.append(json.dumps([m.value for m in request.materials]))
        
        if request.build_volume_x is not None:
            updates.append("build_volume_x = ?")
            params.append(request.build_volume_x)
        
        if request.build_volume_y is not None:
            updates.append("build_volume_y = ?")
            params.append(request.build_volume_y)
        
        if request.build_volume_z is not None:
            updates.append("build_volume_z = ?")
            params.append(request.build_volume_z)
        
        if request.description is not None:
            updates.append("description = ?")
            params.append(request.description)
        
        if not updates:
            # No updates requested, just return current state
            return _row_to_node_detail(dict(row))
        
        # Add updated_at
        updates.append("updated_at = ?")
        params.append(now)
        params.append(node_id)
        
        # Execute update
        query = f"UPDATE nodes SET {', '.join(updates)} WHERE id = ?"
        db.execute(query, params)
        
        # Fetch and return updated node
        updated_row = db.execute("SELECT * FROM nodes WHERE id = ?", (node_id,)).fetchone()
        return _row_to_node_detail(dict(updated_row))


@router.delete("/{node_id}")
def delete_node(node_id: str, identity: dict = Depends(get_authenticated_identity)):
    """Delete a node (owner only)"""
    with get_db() as db:
        # Check ownership and delete
        result = db.execute(
            "DELETE FROM nodes WHERE id = ? AND owner_id = ?",
            (node_id, identity["identity_id"])
        )
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Node not found")
        
        return {"message": "Node deleted successfully", "node_id": node_id}