"""Community API tests - RealWorldClaw Team"""

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


@pytest.fixture
def sample_file_id(authenticated_user):
    """Create a sample file and return its ID."""
    file_content = b"test stl content"
    file_obj = io.BytesIO(file_content)
    
    r = client.post(
        "/api/v1/files/upload",
        headers=authenticated_user,
        files={"file": ("test.stl", file_obj, "model/stl")}
    )
    
    return r.json()["file_id"]


class TestCreatePost:
    def test_create_design_share_post(self, authenticated_user):
        """Test creating a design share post."""
        post_data = {
            "title": "My Awesome 3D Model",
            "content": "Check out this cool design I made!",
            "post_type": "design_share"
        }
        
        r = client.post(
            "/api/v1/community/posts",
            headers=authenticated_user,
            json=post_data
        )
        
        assert r.status_code == 200
        data = r.json()
        assert "id" in data
        assert data["title"] == post_data["title"]
        assert data["content"] == post_data["content"]
        assert data["post_type"] == post_data["post_type"]
        assert data["comment_count"] == 0
        assert data["likes_count"] == 0
    
    def test_create_post_with_file(self, authenticated_user, sample_file_id):
        """Test creating a post with attached file."""
        post_data = {
            "title": "My 3D Model with File",
            "content": "Here's my model file",
            "post_type": "showcase",
            "file_id": sample_file_id
        }
        
        r = client.post(
            "/api/v1/community/posts",
            headers=authenticated_user,
            json=post_data
        )
        
        assert r.status_code == 200
        data = r.json()
        assert data["file_id"] == sample_file_id
    
    def test_create_post_with_images(self, authenticated_user):
        """Test creating a post with image URLs."""
        post_data = {
            "title": "Post with Images",
            "content": "Check out these images",
            "post_type": "showcase",
            "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
        }
        
        r = client.post(
            "/api/v1/community/posts",
            headers=authenticated_user,
            json=post_data
        )
        
        assert r.status_code == 200
        data = r.json()
        assert data["images"] == post_data["images"]
    
    def test_create_post_invalid_file_id(self, authenticated_user):
        """Test creating a post with invalid file ID."""
        post_data = {
            "title": "Post with Invalid File",
            "content": "This should fail",
            "post_type": "design_share",
            "file_id": "nonexistent-file-id"
        }
        
        r = client.post(
            "/api/v1/community/posts",
            headers=authenticated_user,
            json=post_data
        )
        
        assert r.status_code == 400
        assert "File not found" in r.json()["detail"]
    
    def test_create_post_without_auth(self):
        """Test creating a post without authentication."""
        post_data = {
            "title": "Unauthorized Post",
            "content": "This should fail",
            "post_type": "discussion"
        }
        
        r = client.post("/api/v1/community/posts", json=post_data)
        
        assert r.status_code == 422  # Missing header
    
    def test_create_post_invalid_data(self, authenticated_user):
        """Test creating a post with invalid data."""
        post_data = {
            "title": "",  # Empty title should fail
            "content": "Valid content",
            "post_type": "discussion"
        }
        
        r = client.post(
            "/api/v1/community/posts",
            headers=authenticated_user,
            json=post_data
        )
        
        assert r.status_code == 422  # Validation error


class TestGetPosts:
    def test_get_posts_empty(self):
        """Test getting posts when none exist."""
        r = client.get("/api/v1/community/posts")
        
        assert r.status_code == 200
        data = r.json()
        assert data["posts"] == []
        assert data["total"] == 0
        assert data["page"] == 1
        assert data["limit"] == 20
        assert data["has_next"] is False
    
    def test_get_posts_with_data(self, authenticated_user):
        """Test getting posts when some exist."""
        # Create a few posts
        for i in range(3):
            post_data = {
                "title": f"Test Post {i}",
                "content": f"Content for post {i}",
                "post_type": "discussion"
            }
            client.post("/api/v1/community/posts", headers=authenticated_user, json=post_data)
        
        r = client.get("/api/v1/community/posts")
        
        assert r.status_code == 200
        data = r.json()
        assert len(data["posts"]) == 3
        assert data["total"] == 3
        assert data["has_next"] is False
        
        # Posts should be ordered by creation time (newest first)
        assert data["posts"][0]["title"] == "Test Post 2"
        assert data["posts"][1]["title"] == "Test Post 1"
        assert data["posts"][2]["title"] == "Test Post 0"
    
    def test_get_posts_pagination(self, authenticated_user):
        """Test pagination of posts."""
        # Create 25 posts
        for i in range(25):
            post_data = {
                "title": f"Post {i:02d}",
                "content": f"Content {i}",
                "post_type": "discussion"
            }
            client.post("/api/v1/community/posts", headers=authenticated_user, json=post_data)
        
        # First page
        r = client.get("/api/v1/community/posts?page=1&limit=10")
        data = r.json()
        assert len(data["posts"]) == 10
        assert data["total"] == 25
        assert data["page"] == 1
        assert data["has_next"] is True
        
        # Second page
        r = client.get("/api/v1/community/posts?page=2&limit=10")
        data = r.json()
        assert len(data["posts"]) == 10
        assert data["page"] == 2
        assert data["has_next"] is True
        
        # Third page (partial)
        r = client.get("/api/v1/community/posts?page=3&limit=10")
        data = r.json()
        assert len(data["posts"]) == 5
        assert data["page"] == 3
        assert data["has_next"] is False
    
    def test_get_posts_filter_by_type(self, authenticated_user):
        """Test filtering posts by type."""
        # Create posts of different types
        for post_type in ["design_share", "showcase", "discussion"]:
            for i in range(2):
                post_data = {
                    "title": f"{post_type} Post {i}",
                    "content": f"Content for {post_type}",
                    "post_type": post_type
                }
                client.post("/api/v1/community/posts", headers=authenticated_user, json=post_data)
        
        # Filter by design_share
        r = client.get("/api/v1/community/posts?type=design_share")
        data = r.json()
        assert len(data["posts"]) == 2
        assert all(post["post_type"] == "design_share" for post in data["posts"])
        
        # Filter by showcase
        r = client.get("/api/v1/community/posts?type=showcase")
        data = r.json()
        assert len(data["posts"]) == 2
        assert all(post["post_type"] == "showcase" for post in data["posts"])
    
    def test_get_posts_sort_popular(self, authenticated_user):
        """Test sorting posts by popularity."""
        # Note: Since we can't easily test likes_count without implementing likes,
        # this test just verifies the sort parameter is accepted
        post_data = {
            "title": "Test Post",
            "content": "Test content",
            "post_type": "discussion"
        }
        client.post("/api/v1/community/posts", headers=authenticated_user, json=post_data)

        r = client.get("/api/v1/community/posts?sort=popular")

        assert r.status_code == 200
        data = r.json()
        assert len(data["posts"]) == 1

    def test_get_posts_filter_by_author_id(self, authenticated_user):
        """Test filtering posts by author_id."""
        # user A post
        client.post(
            "/api/v1/community/posts",
            headers=authenticated_user,
            json={"title": "A1", "content": "c", "post_type": "discussion"},
        )

        # user B register/login and post
        client.post("/api/v1/auth/register", json={
            "email": "other@example.com", "username": "otheruser", "password": "securepass123",
        })
        login_r = client.post("/api/v1/auth/login", json={"email": "other@example.com", "password": "securepass123"})
        other_headers = {"Authorization": f"Bearer {login_r.json()['access_token']}"}
        post_r = client.post(
            "/api/v1/community/posts",
            headers=other_headers,
            json={"title": "B1", "content": "c", "post_type": "discussion"},
        )
        other_user_id = post_r.json()["author_id"]

        r = client.get(f"/api/v1/community/posts?author_id={other_user_id}")
        assert r.status_code == 200
        data = r.json()
        assert data["total"] == 1
        assert data["posts"][0]["author_id"] == other_user_id

    def test_get_posts_sort_following_requires_auth(self):
        """Following feed requires authentication."""
        r = client.get("/api/v1/community/posts?sort=following")
        assert r.status_code == 401

    def test_get_posts_sort_following(self, authenticated_user):
        """Following feed should return only followed authors with server-side filtering."""
        # Create followed user and a post
        client.post("/api/v1/auth/register", json={
            "email": "followed@example.com", "username": "followed", "password": "securepass123",
        })
        followed_login = client.post("/api/v1/auth/login", json={"email": "followed@example.com", "password": "securepass123"})
        followed_headers = {"Authorization": f"Bearer {followed_login.json()['access_token']}"}
        followed_post = client.post(
            "/api/v1/community/posts",
            headers=followed_headers,
            json={"title": "followed post", "content": "c", "post_type": "discussion"},
        )
        followed_user_id = followed_post.json()["author_id"]

        # Create unfollowed user and a post
        client.post("/api/v1/auth/register", json={
            "email": "unfollowed@example.com", "username": "unfollowed", "password": "securepass123",
        })
        unfollowed_login = client.post("/api/v1/auth/login", json={"email": "unfollowed@example.com", "password": "securepass123"})
        unfollowed_headers = {"Authorization": f"Bearer {unfollowed_login.json()['access_token']}"}
        client.post(
            "/api/v1/community/posts",
            headers=unfollowed_headers,
            json={"title": "unfollowed post", "content": "c", "post_type": "discussion"},
        )

        # auth user follows followed_user_id
        follow_r = client.post(f"/api/v1/social/follow/{followed_user_id}", headers=authenticated_user)
        assert follow_r.status_code == 200

        r = client.get("/api/v1/community/posts?sort=following", headers=authenticated_user)
        assert r.status_code == 200
        data = r.json()
        assert data["total"] == 1
        assert data["posts"][0]["author_id"] == followed_user_id


class TestGetPostDetail:
    def test_get_post_detail(self, authenticated_user):
        """Test getting detailed post information."""
        # Create a post
        post_data = {
            "title": "Detailed Post",
            "content": "This is a detailed post",
            "post_type": "showcase"
        }
        
        r = client.post("/api/v1/community/posts", headers=authenticated_user, json=post_data)
        post_id = r.json()["id"]
        
        # Get post detail
        r = client.get(f"/api/v1/community/posts/{post_id}")
        
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == post_id
        assert data["title"] == post_data["title"]
        assert data["content"] == post_data["content"]
    
    def test_get_nonexistent_post_detail(self):
        """Test getting detail for non-existent post."""
        r = client.get("/api/v1/community/posts/nonexistent-id")
        
        assert r.status_code == 404
        assert "Post not found" in r.json()["detail"]


class TestComments:
    def test_create_comment(self, authenticated_user):
        """Test creating a comment on a post."""
        # Create a post first
        post_data = {
            "title": "Post for Comments",
            "content": "This post will have comments",
            "post_type": "discussion"
        }
        
        r = client.post("/api/v1/community/posts", headers=authenticated_user, json=post_data)
        post_id = r.json()["id"]
        
        # Create a comment
        comment_data = {"content": "This is a great post!"}
        
        r = client.post(
            f"/api/v1/community/posts/{post_id}/comments",
            headers=authenticated_user,
            json=comment_data
        )
        
        assert r.status_code == 200
        data = r.json()
        assert "id" in data
        assert data["post_id"] == post_id
        assert data["content"] == comment_data["content"]
    
    def test_create_comment_on_nonexistent_post(self, authenticated_user):
        """Test creating a comment on non-existent post."""
        comment_data = {"content": "This should fail"}
        
        r = client.post(
            "/api/v1/community/posts/nonexistent-id/comments",
            headers=authenticated_user,
            json=comment_data
        )
        
        assert r.status_code == 404
        assert "Post not found" in r.json()["detail"]
    
    def test_get_post_comments(self, authenticated_user):
        """Test getting comments for a post."""
        # Create a post
        post_data = {
            "title": "Post with Comments",
            "content": "This will have comments",
            "post_type": "discussion"
        }
        
        r = client.post("/api/v1/community/posts", headers=authenticated_user, json=post_data)
        post_id = r.json()["id"]
        
        # Create multiple comments
        for i in range(3):
            comment_data = {"content": f"Comment {i}"}
            client.post(
                f"/api/v1/community/posts/{post_id}/comments",
                headers=authenticated_user,
                json=comment_data
            )
        
        # Get comments
        r = client.get(f"/api/v1/community/posts/{post_id}/comments")
        
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 3
        
        # Comments should be ordered by creation time (oldest first)
        for i, comment in enumerate(data):
            assert comment["content"] == f"Comment {i}"
    
    def test_get_comments_for_nonexistent_post(self):
        """Test getting comments for non-existent post."""
        r = client.get("/api/v1/community/posts/nonexistent-id/comments")
        
        assert r.status_code == 404
        assert "Post not found" in r.json()["detail"]
    
    def test_comment_count_updates(self, authenticated_user):
        """Test that post comment count updates when comments are added."""
        # Create a post
        post_data = {
            "title": "Post Comment Count Test",
            "content": "Testing comment count",
            "post_type": "discussion"
        }
        
        r = client.post("/api/v1/community/posts", headers=authenticated_user, json=post_data)
        post_id = r.json()["id"]
        
        # Initially should have 0 comments
        r = client.get(f"/api/v1/community/posts/{post_id}")
        assert r.json()["comment_count"] == 0
        
        # Add a comment
        comment_data = {"content": "First comment"}
        client.post(
            f"/api/v1/community/posts/{post_id}/comments",
            headers=authenticated_user,
            json=comment_data
        )
        
        # Comment count should be updated
        r = client.get(f"/api/v1/community/posts/{post_id}")
        assert r.json()["comment_count"] == 1
        
        # Add another comment
        comment_data = {"content": "Second comment"}
        client.post(
            f"/api/v1/community/posts/{post_id}/comments",
            headers=authenticated_user,
            json=comment_data
        )
        
        # Comment count should be 2
        r = client.get(f"/api/v1/community/posts/{post_id}")
        assert r.json()["comment_count"] == 2