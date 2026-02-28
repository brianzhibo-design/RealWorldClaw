"""Feature Flags - 环境变量驱动的功能开关"""

import os


class FeatureFlags:
    """Simple feature flag system driven by environment variables.

    Usage:
        from platform.feature_flags import flags
        if flags.is_enabled("community_posts"):
            # show community posts

    Environment variable format: FF_<FLAG_NAME>=1|0|true|false
    """

    DEFAULTS = {
        "community_posts": True,
        "device_control": True,
        "agent_api": True,
        "websocket_realtime": True,
        "maker_network": False,  # not yet ready
        "billing": False,  # not yet ready
    }

    def is_enabled(self, flag: str) -> bool:
        env_key = f"FF_{flag.upper()}"
        env_val = os.environ.get(env_key)
        if env_val is not None:
            return env_val.lower() in ("1", "true", "yes")
        return self.DEFAULTS.get(flag, False)

    def all_flags(self) -> dict:
        return {k: self.is_enabled(k) for k in self.DEFAULTS}


flags = FeatureFlags()
