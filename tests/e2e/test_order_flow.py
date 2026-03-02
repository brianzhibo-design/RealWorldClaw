#!/usr/bin/env python3
"""E2E test for order creation flow: create -> verify -> assign -> complete -> verify."""

import os
import uuid

import pytest
import requests

BASE = os.getenv("RWC_API_BASE", "http://localhost:8000/api/v1")
TIMEOUT = 15


def _url(path: str) -> str:
    return f"{BASE}{path}"


def _unique(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


def _register_and_login(prefix: str):
    username = _unique(prefix)
    email = f"{username}@e2etest.dev"
    password = "TestPass123!"

    r = requests.post(
        _url("/auth/register"),
        json={"username": username, "email": email, "password": password},
        timeout=TIMEOUT,
    )
    assert r.status_code == 201, f"register failed: {r.status_code} {r.text}"

    r = requests.post(
        _url("/auth/login"),
        json={"email": email, "password": password},
        timeout=TIMEOUT,
    )
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def api_ready():
    try:
        r = requests.get(_url("/health"), timeout=TIMEOUT)
        if r.status_code != 200:
            pytest.skip(f"API not ready: {r.status_code}")
    except requests.RequestException as exc:
        pytest.skip(f"API unavailable: {exc}")


@pytest.fixture
def customer_auth(api_ready):
    return _register_and_login("order_customer")


@pytest.fixture
def maker_auth(api_ready):
    return _register_and_login("order_maker")


@pytest.fixture
def maker_profile_id(maker_auth):
    payload = {
        "maker_type": "maker",
        "printer_brand": "Prusa",
        "printer_model": "MK4",
        "build_volume_x": 250,
        "build_volume_y": 210,
        "build_volume_z": 210,
        "materials": ["PLA", "PETG"],
        "capabilities": ["printing"],
        "location_province": "Guangdong",
        "location_city": "Shenzhen",
        "location_district": "Nanshan",
        "availability": "open",
        "pricing_per_hour_cny": 35,
        "description": "E2E maker",
    }
    r = requests.post(_url("/makers/register"), json=payload, headers=maker_auth, timeout=TIMEOUT)
    if r.status_code >= 500:
        pytest.skip(f"maker register unavailable in current backend profile: {r.status_code}")
    assert r.status_code in (200, 201), f"maker register failed: {r.status_code} {r.text}"
    return r.json()["id"]


def test_order_creation_flow(customer_auth, maker_auth, maker_profile_id):
    create_payload = {
        "order_type": "print_only",
        "quantity": 1,
        "material": "PLA",
        "delivery_province": "Guangdong",
        "delivery_city": "Shenzhen",
        "delivery_district": "Nanshan",
        "delivery_address": "Tech Park Road 1",
        "urgency": "normal",
        "notes": "e2e order flow",
        "auto_match": True,
    }

    # 1) create order
    r = requests.post(_url("/orders"), json=create_payload, headers=customer_auth, timeout=TIMEOUT)
    assert r.status_code == 201, f"create order failed: {r.status_code} {r.text}"
    created = r.json()
    order_id = created["order_id"]
    assert created["status"] == "pending"

    # 2) verify created order
    r = requests.get(_url(f"/orders/{order_id}"), headers=customer_auth, timeout=TIMEOUT)
    assert r.status_code == 200, f"get order failed: {r.status_code} {r.text}"
    customer_view = r.json()["order"]
    assert customer_view["id"] == order_id
    assert customer_view["status"] == "pending"

    # 3) assign to maker (accept)
    r = requests.put(
        _url(f"/orders/{order_id}/accept"),
        json={"estimated_hours": 6},
        headers=maker_auth,
        timeout=TIMEOUT,
    )
    assert r.status_code == 200, f"accept order failed: {r.status_code} {r.text}"
    assert r.json()["status"] == "accepted"

    # 4) complete order via valid transition path
    r = requests.put(
        _url(f"/orders/{order_id}/status"),
        json={"status": "printing"},
        headers=maker_auth,
        timeout=TIMEOUT,
    )
    assert r.status_code == 200, f"set printing failed: {r.status_code} {r.text}"

    r = requests.put(
        _url(f"/orders/{order_id}/status"),
        json={"status": "completed"},
        headers=maker_auth,
        timeout=TIMEOUT,
    )
    assert r.status_code == 200, f"set completed failed: {r.status_code} {r.text}"

    # 5) verify final status
    r = requests.get(_url(f"/orders/{order_id}"), headers=customer_auth, timeout=TIMEOUT)
    assert r.status_code == 200, f"get final order failed: {r.status_code} {r.text}"
    final_view = r.json()["order"]
    assert final_view["status"] == "completed"
