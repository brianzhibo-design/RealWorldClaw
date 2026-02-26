"""Tests for nodes system - Manufacturing Capability World Map."""

from __future__ import annotations

import pytest
import uuid
from datetime import datetime, timezone, timedelta

from fastapi.testclient import TestClient
from api.main import app
from api.database import init_db, get_db

client = TestClient(app)

# Test data
MOCK_AGENT = {
    "id": "test-agent-123",
    "name": "TestAgent",
    "status": "active"
}

SAMPLE_NODE_DATA = {
    "name": "Test 3D Printer",
    "node_type": "3d_printer",
    "latitude": 39.9042,
    "longitude": 116.4074,
    "capabilities": ["printing", "multi_color"],
    "materials": ["pla", "abs"],
    "build_volume_x": 220.0,
    "build_volume_y": 220.0,
    "build_volume_z": 250.0,
    "description": "High quality 3D printer for prototyping"
}


@pytest.fixture(autouse=True)
def setup_db():
    """Initialize database before each test."""
    init_db()
    yield
    # Clean up after test - disable foreign key constraints temporarily
    with get_db() as db:
        db.execute("PRAGMA foreign_keys=OFF")
        db.execute("DELETE FROM nodes")
        db.execute("DELETE FROM agents")
        db.execute("PRAGMA foreign_keys=ON")


@pytest.fixture
def mock_agent():
    """Create a mock agent for testing."""
    # Generate unique API key for each test
    api_key = f"test-api-key-{uuid.uuid4()}"
    
    with get_db() as db:
        now = datetime.now(timezone.utc).isoformat()
        db.execute("""
            INSERT OR REPLACE INTO agents (
                id, name, description, type, status, api_key, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            MOCK_AGENT["id"], MOCK_AGENT["name"], "Test agent", 
            "openclaw", "active", api_key, now, now
        ))
    
    # Return agent with API key for test to use
    agent_with_key = MOCK_AGENT.copy()
    agent_with_key["api_key"] = api_key
    yield agent_with_key


class TestNodeRegistration:
    """Test node registration functionality."""

    def test_register_node_success(self, mock_agent):
        """Test successful node registration."""
        headers = {"Authorization": f"Bearer {mock_agent['api_key']}"}
        response = client.post("/api/v1/nodes/register", json=SAMPLE_NODE_DATA, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == SAMPLE_NODE_DATA["name"]
        assert data["node_type"] == SAMPLE_NODE_DATA["node_type"]
        # Public endpoint returns fuzzy location only (not precise)
        assert "fuzzy_latitude" in data
        assert abs(data["fuzzy_latitude"] - SAMPLE_NODE_DATA["latitude"]) <= 0.01
        assert abs(data["fuzzy_longitude"] - SAMPLE_NODE_DATA["longitude"]) <= 0.01
        assert data["capabilities"] == SAMPLE_NODE_DATA["capabilities"]
        assert data["materials"] == SAMPLE_NODE_DATA["materials"]
        assert data["status"] == "offline"  # Default status
        assert data["queue_length"] == 0
        assert data["total_jobs"] == 0
        assert data["success_rate"] == 0.0

        with get_db() as db:
            row = db.execute("SELECT country_code FROM nodes WHERE id = ?", (data["id"],)).fetchone()
            assert row["country_code"] == "CN"
    
    @pytest.mark.parametrize("node_type", ["injection_molder", "assembly", "other"])
    def test_register_node_with_extended_node_types(self, mock_agent, node_type):
        """Extended node_type enums should be accepted by backend."""
        headers = {"Authorization": f"Bearer {mock_agent['api_key']}"}
        extended_data = SAMPLE_NODE_DATA.copy()
        extended_data.update({"name": f"Extended {node_type}", "node_type": node_type})

        response = client.post("/api/v1/nodes/register", json=extended_data, headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["node_type"] == node_type

    def test_register_node_with_extended_materials(self, mock_agent):
        """Extended materials enums should be accepted with exact frontend casing."""
        headers = {"Authorization": f"Bearer {mock_agent['api_key']}"}
        extended_data = SAMPLE_NODE_DATA.copy()
        extended_data.update(
            {
                "name": "Acrylic Nylon Node",
                "materials": ["Nylon", "Acrylic"],
            }
        )

        response = client.post("/api/v1/nodes/register", json=extended_data, headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["materials"] == ["Nylon", "Acrylic"]

    def test_register_node_duplicate_name(self, mock_agent):
        """Test registration with duplicate name fails."""
        headers = {"Authorization": f"Bearer {mock_agent['api_key']}"}
        # Register first node
        client.post("/api/v1/nodes/register", json=SAMPLE_NODE_DATA, headers=headers)
        
        # Try to register with same name
        response = client.post("/api/v1/nodes/register", json=SAMPLE_NODE_DATA, headers=headers)
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]
    
    def test_register_node_invalid_coordinates(self, mock_agent):
        """Test registration with invalid coordinates fails."""
        invalid_data = SAMPLE_NODE_DATA.copy()
        invalid_data["latitude"] = 95.0  # Invalid latitude
        
        response = client.post("/api/v1/nodes/register", json=invalid_data)
        assert response.status_code == 422
        
        invalid_data["latitude"] = 39.9042
        invalid_data["longitude"] = 185.0  # Invalid longitude
        
        response = client.post("/api/v1/nodes/register", json=invalid_data)
        assert response.status_code == 422
    
    def test_register_node_without_auth(self):
        """Test that registration requires authentication."""
        response = client.post("/api/v1/nodes/register", json=SAMPLE_NODE_DATA)
        assert response.status_code == 422  # FastAPI returns 422 for missing required fields
        assert "authorization" in str(response.json()["detail"]).lower()


class TestNodeMap:
    """Test public map functionality."""

    def test_get_map_empty(self):
        """Test getting map with no nodes."""
        response = client.get("/api/v1/nodes/map")
        
        assert response.status_code == 200
        assert response.json() == []
    
    def test_get_map_with_nodes(self, mock_agent):
        """Test getting map with registered nodes."""
        headers = {"Authorization": f"Bearer {mock_agent['api_key']}"}
        # Register a node
        client.post("/api/v1/nodes/register", json=SAMPLE_NODE_DATA, headers=headers)
        
        response = client.get("/api/v1/nodes/map")
        
        assert response.status_code == 200
        nodes = response.json()
        assert len(nodes) == 1
        
        node = nodes[0]
        assert "latitude" not in node  # Precise location should not be exposed
        assert "longitude" not in node
        assert "fuzzy_latitude" in node  # Only fuzzy location
        assert "fuzzy_longitude" in node
        assert "online_duration_hours" in node
        assert "health_score" in node
        assert node["health_score"] >= 0
        assert "owner_id" not in node  # Owner should not be exposed

    def test_get_map_backfills_country_code_for_legacy_nodes(self, mock_agent):
        """Test map response backfills missing country_code for legacy rows."""
        headers = {"Authorization": f"Bearer {mock_agent['api_key']}"}
        register_response = client.post("/api/v1/nodes/register", json=SAMPLE_NODE_DATA, headers=headers)
        node_id = register_response.json()["id"]

        with get_db() as db:
            db.execute("UPDATE nodes SET country_code = NULL WHERE id = ?", (node_id,))

        response = client.get("/api/v1/nodes/map")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["country_code"] == "CN"

        with get_db() as db:
            row = db.execute("SELECT country_code FROM nodes WHERE id = ?", (node_id,)).fetchone()
            assert row["country_code"] == "CN"
    
    def test_map_health_metrics_computed(self, mock_agent):
        """Test online_duration_hours and health_score in map response."""
        headers = {"Authorization": f"Bearer {mock_agent['api_key']}"}
        register_response = client.post("/api/v1/nodes/register", json=SAMPLE_NODE_DATA, headers=headers)
        node_id = register_response.json()["id"]

        with get_db() as db:
            created_at = (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat()
            last_heartbeat = datetime.now(timezone.utc).isoformat()
            db.execute(
                "UPDATE nodes SET created_at = ?, last_heartbeat = ?, status = 'online' WHERE id = ?",
                (created_at, last_heartbeat, node_id),
            )

        response = client.get("/api/v1/nodes/map")
        assert response.status_code == 200
        node = response.json()[0]
        assert node["online_duration_hours"] >= 11.9
        assert 49 <= node["health_score"] <= 51

    def test_map_excludes_offline_nodes(self, mock_agent):
        """Test that map excludes nodes that haven't sent heartbeat."""
        headers = {"Authorization": f"Bearer {mock_agent['api_key']}"}
        # Register node
        register_response = client.post("/api/v1/nodes/register", json=SAMPLE_NODE_DATA, headers=headers)
        node_id = register_response.json()["id"]
        
        # Set last heartbeat to old timestamp
        with get_db() as db:
            old_time = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()
            db.execute(
                "UPDATE nodes SET last_heartbeat = ? WHERE id = ?",
                (old_time, node_id)
            )
        
        response = client.get("/api/v1/nodes/map")
        
        assert response.status_code == 200
        nodes = response.json()
        # Node should be marked offline or excluded
        assert all(node["status"] == "offline" for node in nodes)


class TestNodeHeartbeat:
    """Test heartbeat functionality."""

    def test_heartbeat_success(self, mock_agent):
        """Test successful heartbeat update."""
        headers = {"Authorization": f"Bearer {mock_agent['api_key']}"}
        # Register node first
        register_response = client.post("/api/v1/nodes/register", json=SAMPLE_NODE_DATA, headers=headers)
        node_id = register_response.json()["id"]
        
        heartbeat_data = {
            "status": "online",
            "current_job_id": "job-123",
            "queue_length": 3
        }

        response = client.post(f"/api/v1/nodes/{node_id}/heartbeat", json=heartbeat_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "timestamp" in data
        assert "message" in data
    
    def test_heartbeat_without_node(self, mock_agent):
        """Test heartbeat fails when agent has no nodes."""
        headers = {"Authorization": f"Bearer {mock_agent['api_key']}"}
        heartbeat_data = {
            "status": "online",
            "queue_length": 0
        }
        
        response = client.post("/api/v1/nodes/nonexistent-node/heartbeat", json=heartbeat_data, headers=headers)

        assert response.status_code == 403
        assert "access denied" in response.json()["detail"].lower()
    
    def test_heartbeat_without_auth(self):
        """Test that heartbeat requires authentication."""
        heartbeat_data = {"status": "online", "queue_length": 0}
        response = client.post("/api/v1/nodes/some-node/heartbeat", json=heartbeat_data)
        assert response.status_code == 422  # FastAPI returns 422 for missing required fields
        assert "authorization" in str(response.json()["detail"]).lower()


class TestNearbyNodes:
    """Test nearby nodes search functionality."""

    def test_nearby_nodes_empty(self):
        """Test nearby search with no nodes."""
        response = client.get("/api/v1/nodes/nearby?lat=39.9042&lng=116.4074&radius=50")
        
        assert response.status_code == 200
        data = response.json()
        assert data["nodes"] == []
        assert data["total_count"] == 0
        assert data["search_radius_km"] == 50.0
    
    def test_nearby_nodes_found(self, mock_agent):
        """Test nearby search finds nodes."""
        headers = {"Authorization": f"Bearer {mock_agent['api_key']}"}
        # Register node and send heartbeat
        register_response = client.post("/api/v1/nodes/register", json=SAMPLE_NODE_DATA, headers=headers)
        node_id = register_response.json()["id"]
        client.post(f"/api/v1/nodes/{node_id}/heartbeat", json={"status": "online", "queue_length": 0}, headers=headers)
        
        # Search near the node location
        response = client.get("/api/v1/nodes/nearby?lat=39.9&lng=116.4&radius=50")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["nodes"]) == 1
        assert data["total_count"] == 1
    
    def test_nearby_nodes_distance_filter(self, mock_agent):
        """Test that distance filtering works."""
        headers = {"Authorization": f"Bearer {mock_agent['api_key']}"}
        # Register node in Beijing
        register_response = client.post("/api/v1/nodes/register", json=SAMPLE_NODE_DATA, headers=headers)
        node_id = register_response.json()["id"]
        client.post(f"/api/v1/nodes/{node_id}/heartbeat", json={"status": "online", "queue_length": 0}, headers=headers)
        
        # Search in Shanghai (much farther away)
        response = client.get("/api/v1/nodes/nearby?lat=31.2304&lng=121.4737&radius=50")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["nodes"]) == 0  # Too far away
    
    def test_nearby_nodes_invalid_params(self):
        """Test nearby search with invalid parameters."""
        # Invalid latitude
        response = client.get("/api/v1/nodes/nearby?lat=95.0&lng=116.4074&radius=50")
        assert response.status_code == 422
        
        # Invalid radius
        response = client.get("/api/v1/nodes/nearby?lat=39.9042&lng=116.4074&radius=0")
        assert response.status_code == 422


class TestNodeMatching:
    """Test node matching functionality."""

    def test_match_nodes_basic(self, mock_agent):
        """Test basic node matching."""
        headers = {"Authorization": f"Bearer {mock_agent['api_key']}"}
        # Register node
        register_response = client.post("/api/v1/nodes/register", json=SAMPLE_NODE_DATA, headers=headers)
        node_id = register_response.json()["id"]
        client.post(f"/api/v1/nodes/{node_id}/heartbeat", json={"status": "online", "queue_length": 0}, headers=headers)
        
        match_request = {
            "required_materials": ["pla"],
            "required_capabilities": ["printing"]
        }
        
        response = client.post("/api/v1/nodes/match", json=match_request)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["matches"]) == 1
        assert data["total_count"] == 1
    
    def test_match_nodes_material_filter(self, mock_agent):
        """Test matching with material requirements."""
        headers = {"Authorization": f"Bearer {mock_agent['api_key']}"}
        # Register node
        register_response = client.post("/api/v1/nodes/register", json=SAMPLE_NODE_DATA, headers=headers)
        node_id = register_response.json()["id"]
        client.post(f"/api/v1/nodes/{node_id}/heartbeat", json={"status": "online", "queue_length": 0}, headers=headers)
        
        # Request material not supported
        match_request = {"required_materials": ["carbon_fiber"]}
        
        response = client.post("/api/v1/nodes/match", json=match_request)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["matches"]) == 0  # No match
    
    def test_match_nodes_build_volume(self, mock_agent):
        """Test matching with build volume requirements."""
        headers = {"Authorization": f"Bearer {mock_agent['api_key']}"}
        # Register node
        register_response = client.post("/api/v1/nodes/register", json=SAMPLE_NODE_DATA, headers=headers)
        node_id = register_response.json()["id"]
        client.post(f"/api/v1/nodes/{node_id}/heartbeat", json={"status": "online", "queue_length": 0}, headers=headers)
        
        # Request larger build volume
        match_request = {
            "min_build_volume_x": 300.0,  # Larger than node's 220mm
            "min_build_volume_y": 300.0,
            "min_build_volume_z": 300.0
        }
        
        response = client.post("/api/v1/nodes/match", json=match_request)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["matches"]) == 0  # No match
        
        # Request smaller build volume
        match_request = {
            "min_build_volume_x": 200.0,  # Smaller than node's 220mm
            "min_build_volume_y": 200.0,
            "min_build_volume_z": 200.0
        }
        
        response = client.post("/api/v1/nodes/match", json=match_request)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["matches"]) == 1  # Match found


class TestNodeManagement:
    """Test node management functionality."""

    def test_get_my_nodes(self, mock_agent):
        """Test getting nodes owned by current agent."""
        headers = {"Authorization": f"Bearer {mock_agent['api_key']}"}
        # Register node
        client.post("/api/v1/nodes/register", json=SAMPLE_NODE_DATA, headers=headers)
        
        response = client.get("/api/v1/nodes/my-nodes", headers=headers)
        
        assert response.status_code == 200
        nodes = response.json()
        assert len(nodes) == 1
        
        node = nodes[0]
        assert node["name"] == SAMPLE_NODE_DATA["name"]
        assert "fuzzy_latitude" in node  # Location is always fuzzed
        assert "longitude" in node
    
    def test_get_node_detail(self, mock_agent):
        """Test getting detailed node information."""
        headers = {"Authorization": f"Bearer {mock_agent['api_key']}"}
        # Register node
        register_response = client.post("/api/v1/nodes/register", json=SAMPLE_NODE_DATA, headers=headers)
        node_id = register_response.json()["id"]
        
        response = client.get(f"/api/v1/nodes/{node_id}", headers=headers)
        
        assert response.status_code == 200
        node = response.json()
        assert node["id"] == node_id
        assert "fuzzy_latitude" in node  # Location is always fuzzed
    
    def test_update_node(self, mock_agent):
        """Test updating node configuration."""
        headers = {"Authorization": f"Bearer {mock_agent['api_key']}"}
        # Register node
        register_response = client.post("/api/v1/nodes/register", json=SAMPLE_NODE_DATA, headers=headers)
        node_id = register_response.json()["id"]
        
        update_data = {
            "name": "Updated 3D Printer",
            "description": "Updated description"
        }
        
        response = client.put(f"/api/v1/nodes/{node_id}", json=update_data, headers=headers)
        
        assert response.status_code == 200
        node = response.json()
        assert node["name"] == "Updated 3D Printer"
        assert node["description"] == "Updated description"
    
    def test_delete_node(self, mock_agent):
        """Test deleting a node."""
        headers = {"Authorization": f"Bearer {mock_agent['api_key']}"}
        # Register node
        register_response = client.post("/api/v1/nodes/register", json=SAMPLE_NODE_DATA, headers=headers)
        node_id = register_response.json()["id"]
        
        response = client.delete(f"/api/v1/nodes/{node_id}", headers=headers)
        
        assert response.status_code == 200
        assert node_id in response.json()["node_id"]
        
        # Verify node is deleted
        response = client.get(f"/api/v1/nodes/{node_id}", headers=headers)
        assert response.status_code == 404


class TestSecurityAndPrivacy:
    """Test security and privacy features."""

    def test_location_fuzzing(self, mock_agent):
        """Test that public APIs return fuzzy locations."""
        headers = {"Authorization": f"Bearer {mock_agent['api_key']}"}
        # Register node
        client.post("/api/v1/nodes/register", json=SAMPLE_NODE_DATA, headers=headers)
        
        # Get map data (public)
        response = client.get("/api/v1/nodes/map")
        public_node = response.json()[0]
        
        # Check that fuzzy location is different but close
        assert abs(public_node["fuzzy_latitude"] - SAMPLE_NODE_DATA["latitude"]) > 0
        assert abs(public_node["fuzzy_latitude"] - SAMPLE_NODE_DATA["latitude"]) <= 0.01
        
        # Owner should see precise location
        response = client.get("/api/v1/nodes/my-nodes", headers=headers)
        owner_node = response.json()[0]
        
        assert owner_node["latitude"] == SAMPLE_NODE_DATA["latitude"]
        assert owner_node["longitude"] == SAMPLE_NODE_DATA["longitude"]
    
    def test_owner_privacy(self, mock_agent):
        """Test that public APIs don't expose owner information."""
        headers = {"Authorization": f"Bearer {mock_agent['api_key']}"}
        client.post("/api/v1/nodes/register", json=SAMPLE_NODE_DATA, headers=headers)
        
        response = client.get("/api/v1/nodes/map")
        public_node = response.json()[0]
        
        assert "owner_id" not in public_node
        assert "owner_name" not in public_node
        
        # Nearby search should also not expose owner
        response = client.get("/api/v1/nodes/nearby?lat=39.9&lng=116.4&radius=50")
        nearby_nodes = response.json()["nodes"]
        
        assert all("owner_id" not in node for node in nearby_nodes)


if __name__ == "__main__":
    pytest.main([__file__])