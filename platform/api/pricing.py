"""Pricing engine for manufacturing orders."""

def estimate_price(
    material: str,
    quantity: int,
    maker_hourly_rate: float = 30.0,  # 默认30元/小时
    estimated_hours_per_unit: float = 2.0,
    urgency: str = "normal"
) -> dict:
    """Calculate estimated order price."""
    urgency_multiplier = 1.5 if urgency == "express" else 1.0
    base_cost = maker_hourly_rate * estimated_hours_per_unit * quantity
    total = round(base_cost * urgency_multiplier, 2)
    platform_fee = 0.0  # 零抽佣
    
    return {
        "estimated_price_cny": total,
        "platform_fee_cny": platform_fee,
        "maker_income_cny": total,
        "breakdown": {
            "maker_rate_per_hour": maker_hourly_rate,
            "hours_per_unit": estimated_hours_per_unit,
            "quantity": quantity,
            "urgency_multiplier": urgency_multiplier,
            "base_cost": round(base_cost, 2),
        }
    }