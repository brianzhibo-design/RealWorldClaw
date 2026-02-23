"""Authentication system tests - RealWorldClaw Team"""

from __future__ import annotations


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


def _register(email="test@example.com", username="testuser", password="securepass123"):
    return client.post("/api/v1/auth/register", json={
        "email": email, "username": username, "password": password,
    })


def _login(email="test@example.com", password="securepass123"):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})


def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ─── Registration ────────────────────────────────────────

class TestRegister:
    def test_register_success(self):
        r = _register()
        assert r.status_code == 201
        data = r.json()
        assert "access_token" in data
        assert "user" in data
        user = data["user"]
        assert user["email"] == "test@example.com"
        assert user["username"] == "testuser"
        assert user["role"] == "user"
        assert user["is_active"] is True

    def test_register_duplicate_email(self):
        _register()
        r = _register(username="other")
        assert r.status_code == 409

    def test_register_duplicate_username(self):
        _register()
        r = _register(email="other@example.com")
        assert r.status_code == 409

    def test_register_short_password(self):
        r = _register(password="short")
        assert r.status_code == 422

    def test_register_invalid_email(self):
        r = _register(email="notanemail")
        assert r.status_code == 422


# ─── Login ───────────────────────────────────────────────

class TestLogin:
    def test_login_success(self):
        _register()
        r = _login()
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self):
        _register()
        r = _login(password="wrongpassword")
        assert r.status_code == 401

    def test_login_nonexistent_user(self):
        r = _login()
        assert r.status_code == 401


# ─── Token & Me ──────────────────────────────────────────

class TestMe:
    def test_get_me(self):
        _register()
        tokens = _login().json()
        r = client.get("/api/v1/auth/me", headers=_auth_header(tokens["access_token"]))
        assert r.status_code == 200
        assert r.json()["email"] == "test@example.com"

    def test_update_me(self):
        _register()
        tokens = _login().json()
        r = client.put("/api/v1/auth/me",
                       headers=_auth_header(tokens["access_token"]),
                       json={"username": "newname"})
        assert r.status_code == 200
        assert r.json()["username"] == "newname"

    def test_no_token_401(self):
        r = client.get("/api/v1/auth/me")
        assert r.status_code in (401, 422)

    def test_invalid_token_401(self):
        r = client.get("/api/v1/auth/me", headers=_auth_header("garbage"))
        assert r.status_code == 401


# ─── Refresh ─────────────────────────────────────────────

class TestRefresh:
    def test_refresh_success(self):
        _register()
        tokens = _login().json()
        r = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
        assert r.status_code == 200
        new_tokens = r.json()
        assert "access_token" in new_tokens

    def test_refresh_with_access_token_fails(self):
        _register()
        tokens = _login().json()
        r = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["access_token"]})
        assert r.status_code == 401


# ─── Token Expiry ────────────────────────────────────────

class TestTokenExpiry:
    def test_expired_access_token(self, monkeypatch):
        """Access token with negative expiry should be rejected."""
        from datetime import timedelta
        import api.security as sec_mod
        import api.routers.auth as auth_mod
        original = sec_mod.create_access_token

        _register()

        def _short_lived(data, expires_delta=None):
            return original(data, expires_delta=timedelta(seconds=-1))

        # Patch in both the security module and the router module (which imported it)
        monkeypatch.setattr(sec_mod, "create_access_token", _short_lived)
        monkeypatch.setattr(auth_mod, "create_access_token", _short_lived)

        tokens = _login().json()
        r = client.get("/api/v1/auth/me", headers=_auth_header(tokens["access_token"]))
        assert r.status_code == 401


# ─── RBAC ────────────────────────────────────────────────

class TestRBAC:
    def test_require_role_denied(self):
        """Regular user (role=user) should be rejected by require_role('admin')."""
        from api.deps import get_current_user, require_role

        _register()
        tokens = _login().json()

        # Simulate the dependency chain manually
        from fastapi import HTTPException

        # Get the user via the real dependency
        user = get_current_user(f"Bearer {tokens['access_token']}")
        assert user["role"] == "user"

        checker = require_role("admin")
        with pytest.raises(HTTPException) as exc_info:
            checker(user)
        assert exc_info.value.status_code == 403

    def test_require_role_allowed(self):
        """Admin user passes require_role('admin')."""
        from api.database import get_db
        from api.deps import get_current_user, require_role

        _register()
        with get_db() as db:
            db.execute("UPDATE users SET role = 'admin' WHERE email = 'test@example.com'")

        tokens = _login().json()
        user = get_current_user(f"Bearer {tokens['access_token']}")
        assert user["role"] == "admin"

        checker = require_role("admin")
        result = checker(user)
        assert result["role"] == "admin"


# ─── Logout ──────────────────────────────────────────────

class TestLogout:
    def test_logout(self):
        r = client.post("/api/v1/auth/logout")
        assert r.status_code == 200
