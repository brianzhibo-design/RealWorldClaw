/**
 * Expression System - Animated face expressions on round LCD
 *
 * Supports smooth transitions between expressions via linear interpolation.
 * Each expression defines eye and mouth geometry that gets lerped during transitions.
 */

#pragma once
#include <Arduino.h>

/// Available expressions
enum class Expression : uint8_t {
    IDLE = 0,
    HAPPY,
    SAD,
    THINKING,
    EXCITED,
    SLEEPY,
    ANGRY,
    LOVE,
    OFFLINE,
    COUNT
};

/// Geometry for one eye
struct EyeParams {
    float x, y;          // center position (relative to screen center)
    float width, height;  // ellipse radii
    float openness;       // 0.0 = closed, 1.0 = fully open
};

/// Geometry for mouth
struct MouthParams {
    float y;              // vertical position (relative to center)
    float width;          // half-width
    float curve;          // positive = smile, negative = frown, 0 = neutral
    float openness;       // 0.0 = line, 1.0 = fully open
};

/// Complete face definition
struct FaceParams {
    EyeParams leftEye;
    EyeParams rightEye;
    MouthParams mouth;
    uint16_t color;       // primary drawing color
};

namespace Expressions {
    /// Initialize the expression system
    void init();

    /// Set target expression (will animate transition)
    void setExpression(Expression expr);

    /// Get the current target expression
    Expression getCurrentExpression();

    /// Update animation frame (call at ~30fps)
    void update();

    /// Set transition speed (0.0-1.0, default 0.1)
    void setTransitionSpeed(float speed);
}
