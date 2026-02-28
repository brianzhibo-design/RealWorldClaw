"""Tests for feature_flags module."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from feature_flags import FeatureFlags


class TestFeatureFlags:
    def setup_method(self):
        self.ff = FeatureFlags()

    def test_defaults_enabled(self):
        assert self.ff.is_enabled("community_posts") is True
        assert self.ff.is_enabled("device_control") is True
        assert self.ff.is_enabled("agent_api") is True

    def test_defaults_disabled(self):
        assert self.ff.is_enabled("maker_network") is False
        assert self.ff.is_enabled("billing") is False

    def test_unknown_flag_returns_false(self):
        assert self.ff.is_enabled("nonexistent_flag") is False

    def test_env_override_enable(self, monkeypatch):
        monkeypatch.setenv("FF_BILLING", "1")
        assert self.ff.is_enabled("billing") is True

    def test_env_override_disable(self, monkeypatch):
        monkeypatch.setenv("FF_COMMUNITY_POSTS", "0")
        assert self.ff.is_enabled("community_posts") is False

    def test_env_true_string(self, monkeypatch):
        monkeypatch.setenv("FF_BILLING", "true")
        assert self.ff.is_enabled("billing") is True

    def test_env_yes_string(self, monkeypatch):
        monkeypatch.setenv("FF_BILLING", "yes")
        assert self.ff.is_enabled("billing") is True

    def test_env_false_string(self, monkeypatch):
        monkeypatch.setenv("FF_AGENT_API", "false")
        assert self.ff.is_enabled("agent_api") is False

    def test_all_flags(self):
        result = self.ff.all_flags()
        assert isinstance(result, dict)
        assert "community_posts" in result
        assert "billing" in result
        assert len(result) == len(FeatureFlags.DEFAULTS)
