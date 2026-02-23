"""File upload API tests - RealWorldClaw Team"""

from __future__ import annotations

import io

import pytest
from fastapi.testclient import TestClient

from api.database import init_db
from api.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def _setup_db(tmp_path, monkeypatch):
    import api.database as db_mod
    monkeypatch.setattr(db_mod, "DB_PATH", tmp_path / "test.db")
    init_db()
    yield


@pytest.fixture
def authenticated_user():
    """Register and login a user for testing."""
    # Register user
    client.post("/api/v1/auth/register", json={
        "email": "test@example.com", "username": "testuser", "password": "securepass123",
    })
    
    # Login
    r = client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "securepass123"})
    token = r.json()["access_token"]
    
    return {"Authorization": f"Bearer {token}"}


def _create_test_file(content: bytes, filename: str = "test.stl"):
    """Create a test file for upload."""
    return io.BytesIO(content), filename


class TestFileUpload:
    def test_upload_stl_file(self, authenticated_user):
        """Test uploading an STL file."""
        file_content = b"solid test\nfacet normal 0 0 1\n  outer loop\n    vertex 0 0 0\n    vertex 1 0 0\n    vertex 0 1 0\n  endloop\nendfacet\nendsolid"
        file_obj, filename = _create_test_file(file_content, "test.stl")
        
        r = client.post(
            "/api/v1/files/upload",
            headers=authenticated_user,
            files={"file": (filename, file_obj, "model/stl")}
        )
        
        assert r.status_code == 200
        data = r.json()
        assert "file_id" in data
        assert data["filename"] == filename
        assert data["size"] == len(file_content)
        assert data["file_type"] == ".stl"
    
    def test_upload_obj_file(self, authenticated_user):
        """Test uploading an OBJ file."""
        file_content = b"# Test OBJ file\nv 0.0 0.0 0.0\nv 1.0 0.0 0.0\nv 0.0 1.0 0.0\nf 1 2 3"
        file_obj, filename = _create_test_file(file_content, "test.obj")
        
        r = client.post(
            "/api/v1/files/upload",
            headers=authenticated_user,
            files={"file": (filename, file_obj, "model/obj")}
        )
        
        assert r.status_code == 200
        data = r.json()
        assert data["file_type"] == ".obj"
    
    def test_upload_without_auth(self):
        """Test uploading without authentication."""
        file_content = b"test content"
        file_obj, filename = _create_test_file(file_content)
        
        r = client.post(
            "/api/v1/files/upload",
            files={"file": (filename, file_obj, "model/stl")}
        )
        
        assert r.status_code == 422  # Missing header
    
    def test_upload_invalid_file_type(self, authenticated_user):
        """Test uploading unsupported file type."""
        file_content = b"test content"
        file_obj, filename = _create_test_file(file_content, "test.txt")
        
        r = client.post(
            "/api/v1/files/upload",
            headers=authenticated_user,
            files={"file": (filename, file_obj, "text/plain")}
        )
        
        assert r.status_code == 400
        assert "File type not allowed" in r.json()["detail"]
    
    def test_upload_large_file(self, authenticated_user):
        """Test uploading file larger than 50MB."""
        # Create a file larger than 50MB
        large_content = b"x" * (51 * 1024 * 1024)  # 51MB
        file_obj, filename = _create_test_file(large_content)
        
        r = client.post(
            "/api/v1/files/upload",
            headers=authenticated_user,
            files={"file": (filename, file_obj, "model/stl")}
        )
        
        assert r.status_code == 413
        assert "File too large" in r.json()["detail"]
    
    def test_upload_no_file(self, authenticated_user):
        """Test uploading without file."""
        r = client.post(
            "/api/v1/files/upload",
            headers=authenticated_user
        )
        
        assert r.status_code == 422  # Missing file field


class TestFileInfo:
    def test_get_file_info(self, authenticated_user):
        """Test getting file information."""
        # First upload a file
        file_content = b"test content"
        file_obj, filename = _create_test_file(file_content)
        
        upload_r = client.post(
            "/api/v1/files/upload",
            headers=authenticated_user,
            files={"file": (filename, file_obj, "model/stl")}
        )
        file_id = upload_r.json()["file_id"]
        
        # Get file info
        r = client.get(f"/api/v1/files/{file_id}")
        
        assert r.status_code == 200
        data = r.json()
        assert data["file_id"] == file_id
        assert data["filename"] == filename
        assert data["size"] == len(file_content)
    
    def test_get_nonexistent_file_info(self):
        """Test getting info for non-existent file."""
        r = client.get("/api/v1/files/nonexistent-id")
        
        assert r.status_code == 404
        assert "File not found" in r.json()["detail"]


class TestFileDownload:
    def test_download_file(self, authenticated_user):
        """Test downloading a file."""
        # First upload a file
        file_content = b"test content for download"
        file_obj, filename = _create_test_file(file_content)
        
        upload_r = client.post(
            "/api/v1/files/upload",
            headers=authenticated_user,
            files={"file": (filename, file_obj, "model/stl")}
        )
        file_id = upload_r.json()["file_id"]
        
        # Download the file
        r = client.get(f"/api/v1/files/{file_id}/download")
        
        assert r.status_code == 200
        assert r.content == file_content
        assert r.headers["content-disposition"] == f'attachment; filename="{filename}"'
    
    def test_download_nonexistent_file(self):
        """Test downloading non-existent file."""
        r = client.get("/api/v1/files/nonexistent-id/download")
        
        assert r.status_code == 404


class TestMyFiles:
    def test_get_my_files_empty(self, authenticated_user):
        """Test getting files when user has uploaded none."""
        r = client.get("/api/v1/files/my", headers=authenticated_user)
        
        assert r.status_code == 200
        data = r.json()
        assert data["files"] == []
        assert data["total"] == 0
    
    def test_get_my_files_with_uploads(self, authenticated_user):
        """Test getting files after uploading some."""
        # Upload multiple files
        for i in range(3):
            file_content = f"test content {i}".encode()
            file_obj, filename = _create_test_file(file_content, f"test{i}.stl")
            
            client.post(
                "/api/v1/files/upload",
                headers=authenticated_user,
                files={"file": (filename, file_obj, "model/stl")}
            )
        
        # Get my files
        r = client.get("/api/v1/files/my", headers=authenticated_user)
        
        assert r.status_code == 200
        data = r.json()
        assert len(data["files"]) == 3
        assert data["total"] == 3
        
        # Files should be ordered by upload time (newest first)
        for i, file_info in enumerate(data["files"]):
            assert "file_id" in file_info
            assert file_info["filename"] == f"test{2-i}.stl"  # Reverse order
    
    def test_get_my_files_without_auth(self):
        """Test getting files without authentication."""
        r = client.get("/api/v1/files/my")
        
        assert r.status_code == 422  # Missing header