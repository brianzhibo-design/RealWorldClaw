/**
 * Expression System - Animated face on round LCD
 *
 * Uses linear interpolation (lerp) between face parameter sets
 * to create smooth transitions. Drawn on a TFT_eSprite canvas
 * then pushed to display for flicker-free animation.
 */

#include "expressions.h"
#include "display.h"
#include <math.h>

// --- Expression Definitions ---
// Coordinates are relative offsets from screen center.

static const FaceParams EXPR_IDLE = {
    .leftEye  = { .x = -35, .y = -20, .width = 18, .height = 22, .openness = 1.0f },
    .rightEye = { .x =  35, .y = -20, .width = 18, .height = 22, .openness = 1.0f },
    .mouth    = { .y = 35, .width = 25, .curve = 0.05f, .openness = 0.0f },
    .color = TFT_WHITE
};

static const FaceParams EXPR_HAPPY = {
    .leftEye  = { .x = -35, .y = -20, .width = 20, .height = 14, .openness = 0.6f },
    .rightEye = { .x =  35, .y = -20, .width = 20, .height = 14, .openness = 0.6f },
    .mouth    = { .y = 35, .width = 35, .curve = 0.6f, .openness = 0.3f },
    .color = TFT_WHITE
};

static const FaceParams EXPR_SAD = {
    .leftEye  = { .x = -35, .y = -15, .width = 16, .height = 24, .openness = 0.9f },
    .rightEye = { .x =  35, .y = -15, .width = 16, .height = 24, .openness = 0.9f },
    .mouth    = { .y = 40, .width = 20, .curve = -0.5f, .openness = 0.0f },
    .color = TFT_CYAN
};

static const FaceParams EXPR_THINKING = {
    .leftEye  = { .x = -35, .y = -20, .width = 18, .height = 22, .openness = 1.0f },
    .rightEye = { .x =  40, .y = -25, .width = 14, .height = 10, .openness = 0.5f },
    .mouth    = { .y = 38, .width = 15, .curve = -0.1f, .openness = 0.0f },
    .color = TFT_YELLOW
};

static const FaceParams EXPR_EXCITED = {
    .leftEye  = { .x = -38, .y = -22, .width = 24, .height = 26, .openness = 1.0f },
    .rightEye = { .x =  38, .y = -22, .width = 24, .height = 26, .openness = 1.0f },
    .mouth    = { .y = 32, .width = 40, .curve = 0.8f, .openness = 0.7f },
    .color = TFT_GREEN
};

static const FaceParams EXPR_SLEEPY = {
    .leftEye  = { .x = -35, .y = -18, .width = 18, .height = 6, .openness = 0.15f },
    .rightEye = { .x =  35, .y = -18, .width = 18, .height = 6, .openness = 0.15f },
    .mouth    = { .y = 38, .width = 12, .curve = 0.0f, .openness = 0.5f },
    .color = TFT_DARKGREY
};

static const FaceParams EXPR_ANGRY = {
    .leftEye  = { .x = -33, .y = -22, .width = 20, .height = 16, .openness = 0.7f },
    .rightEye = { .x =  33, .y = -22, .width = 20, .height = 16, .openness = 0.7f },
    .mouth    = { .y = 38, .width = 30, .curve = -0.4f, .openness = 0.1f },
    .color = TFT_RED
};

static const FaceParams EXPR_LOVE = {
    .leftEye  = { .x = -35, .y = -20, .width = 22, .height = 20, .openness = 1.0f },
    .rightEye = { .x =  35, .y = -20, .width = 22, .height = 20, .openness = 1.0f },
    .mouth    = { .y = 35, .width = 30, .curve = 0.5f, .openness = 0.2f },
    .color = TFT_MAGENTA
};

static const FaceParams EXPR_OFFLINE = {
    .leftEye  = { .x = -35, .y = -20, .width = 18, .height = 4, .openness = 0.1f },
    .rightEye = { .x =  35, .y = -20, .width = 18, .height = 4, .openness = 0.1f },
    .mouth    = { .y = 38, .width = 25, .curve = -0.3f, .openness = 0.0f },
    .color = 0x4208 // dim grey
};

// Lookup table
static const FaceParams* EXPRESSIONS[] = {
    &EXPR_IDLE, &EXPR_HAPPY, &EXPR_SAD, &EXPR_THINKING,
    &EXPR_EXCITED, &EXPR_SLEEPY, &EXPR_ANGRY, &EXPR_LOVE,
    &EXPR_OFFLINE
};

// --- Animation State ---
static FaceParams currentFace;
static Expression targetExpr = Expression::IDLE;
static float transitionSpeed = 0.1f;
static float breathPhase = 0.0f; // subtle idle breathing animation

// --- Helpers ---

static float lerpf(float a, float b, float t) {
    return a + (b - a) * t;
}

static EyeParams lerpEye(const EyeParams& a, const EyeParams& b, float t) {
    return {
        lerpf(a.x, b.x, t), lerpf(a.y, b.y, t),
        lerpf(a.width, b.width, t), lerpf(a.height, b.height, t),
        lerpf(a.openness, b.openness, t)
    };
}

static MouthParams lerpMouth(const MouthParams& a, const MouthParams& b, float t) {
    return {
        lerpf(a.y, b.y, t), lerpf(a.width, b.width, t),
        lerpf(a.curve, b.curve, t), lerpf(a.openness, b.openness, t)
    };
}

static uint16_t lerpColor(uint16_t c1, uint16_t c2, float t) {
    uint8_t r1 = (c1 >> 11) & 0x1F, g1 = (c1 >> 5) & 0x3F, b1 = c1 & 0x1F;
    uint8_t r2 = (c2 >> 11) & 0x1F, g2 = (c2 >> 5) & 0x3F, b2 = c2 & 0x1F;
    uint8_t r = (uint8_t)lerpf(r1, r2, t);
    uint8_t g = (uint8_t)lerpf(g1, g2, t);
    uint8_t b = (uint8_t)lerpf(b1, b2, t);
    return (r << 11) | (g << 5) | b;
}

/// Draw a single eye on the canvas
static void drawEye(TFT_eSprite& canvas, const EyeParams& eye, uint16_t color, bool isLoveEye) {
    int cx = SCREEN_CENTER_X + (int)eye.x;
    int cy = SCREEN_CENTER_Y + (int)eye.y;
    int w = (int)eye.width;
    int h = (int)(eye.height * eye.openness);

    if (h < 2) {
        // Nearly closed - draw a line
        canvas.drawWideLine(cx - w, cy, cx + w, cy, 3, color);
        return;
    }

    if (isLoveEye) {
        // Draw heart shape for love expression
        int s = w; // heart size
        // Simple heart: two circles + triangle
        canvas.fillCircle(cx - s/3, cy - s/4, s/3, color);
        canvas.fillCircle(cx + s/3, cy - s/4, s/3, color);
        canvas.fillTriangle(cx - s + 2, cy - 2, cx + s - 2, cy - 2, cx, cy + s/2 + 4, color);
    } else {
        // Standard elliptical eye
        canvas.fillEllipse(cx, cy, w, h, color);
        // Pupil (smaller, dark center)
        if (h > 6) {
            canvas.fillEllipse(cx, cy + 2, w / 3, h / 3, TFT_BLACK);
            // Highlight
            canvas.fillCircle(cx + w/4, cy - h/4, 3, TFT_WHITE);
        }
    }
}

/// Draw the mouth on the canvas
static void drawMouth(TFT_eSprite& canvas, const MouthParams& mouth, uint16_t color) {
    int cx = SCREEN_CENTER_X;
    int cy = SCREEN_CENTER_Y + (int)mouth.y;
    int hw = (int)mouth.width; // half width

    if (mouth.openness < 0.05f) {
        // Closed mouth - curved line
        int curvePixels = (int)(mouth.curve * 20);
        // Draw as bezier approximation: 3-segment polyline
        int midY = cy + curvePixels;
        int qx = hw / 2;
        int qy = cy + curvePixels / 2;
        // Left segment
        canvas.drawWideLine(cx - hw, cy, cx - qx, qy, 3, color);
        // Middle segment
        canvas.drawWideLine(cx - qx, qy, cx + qx, qy, 3, color);
        // Right segment
        canvas.drawWideLine(cx + qx, qy, cx + hw, cy, 3, color);
    } else {
        // Open mouth
        int openH = (int)(mouth.openness * 15);
        int curveOff = (int)(mouth.curve * 10);
        // Draw as filled ellipse offset by curve
        canvas.fillEllipse(cx, cy + curveOff, hw, openH, color);
        // Inner dark
        if (openH > 4) {
            canvas.fillEllipse(cx, cy + curveOff, hw - 3, openH - 3, TFT_BLACK);
        }
    }
}

// --- Public API ---

namespace Expressions {

void init() {
    currentFace = EXPR_IDLE;
    targetExpr = Expression::IDLE;
}

void setExpression(Expression expr) {
    if ((uint8_t)expr < (uint8_t)Expression::COUNT) {
        targetExpr = expr;
    }
}

Expression getCurrentExpression() {
    return targetExpr;
}

void setTransitionSpeed(float speed) {
    transitionSpeed = constrain(speed, 0.01f, 1.0f);
}

void update() {
    const FaceParams& target = *EXPRESSIONS[(uint8_t)targetExpr];

    // Lerp current face toward target
    currentFace.leftEye  = lerpEye(currentFace.leftEye, target.leftEye, transitionSpeed);
    currentFace.rightEye = lerpEye(currentFace.rightEye, target.rightEye, transitionSpeed);
    currentFace.mouth    = lerpMouth(currentFace.mouth, target.mouth, transitionSpeed);
    currentFace.color    = lerpColor(currentFace.color, target.color, transitionSpeed);

    // Subtle breathing animation (slight vertical oscillation)
    breathPhase += 0.05f;
    float breathOffset = sinf(breathPhase) * 1.5f;

    // Draw frame
    TFT_eSprite& canvas = Display::getCanvas();
    Display::clear();

    // Draw circular border (subtle)
    canvas.drawCircle(SCREEN_CENTER_X, SCREEN_CENTER_Y, 118, currentFace.color & 0x4208);

    // Apply breath offset to eye positions
    EyeParams leftEye = currentFace.leftEye;
    EyeParams rightEye = currentFace.rightEye;
    leftEye.y += breathOffset;
    rightEye.y += breathOffset;

    MouthParams mouth = currentFace.mouth;
    mouth.y += breathOffset;

    // Determine if we should draw heart eyes
    bool isLove = (targetExpr == Expression::LOVE);

    drawEye(canvas, leftEye, currentFace.color, isLove);
    drawEye(canvas, rightEye, currentFace.color, isLove);
    drawMouth(canvas, mouth, currentFace.color);

    // Push to display
    Display::flush();
}

} // namespace Expressions
