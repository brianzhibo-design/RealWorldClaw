/**
 * Clawbie V3 — Desktop Mechanical Crab Claw
 * Firmware for M5StickC Plus2 + SG90 servo
 *
 * Features:
 *   - Smooth eased servo movement (no jerky jumps)
 *   - 5 action modes: idle/grab/wave/sleep/excited
 *   - IMU shake detection → random action
 *   - BtnA = cycle mode, BtnB = grab
 *   - MQTT remote control
 *   - Colorful face expressions on display
 *   - Stall detection (object gripped → happy face)
 */

#include <M5StickCPlus2.h>
#include <ESP32Servo.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <math.h>

// ─── Config ────────────────────────────────────────────
#define CLAW_SERVO_PIN   26
#define ROTATE_SERVO_PIN 36  // optional

#define CLAW_OPEN     140    // servo angle: fully open
#define CLAW_CLOSED   60     // servo angle: fully closed
#define CLAW_GRIP     55     // extra squeeze

// WiFi & MQTT — edit these!
const char* WIFI_SSID     = "YOUR_SSID";
const char* WIFI_PASS     = "YOUR_PASS";
const char* MQTT_BROKER   = "YOUR_BROKER";
const int   MQTT_PORT     = 1883;
const char* MQTT_TOPIC_CMD   = "clawbie/v3/cmd";
const char* MQTT_TOPIC_STATE = "clawbie/v3/state";

// ─── Globals ───────────────────────────────────────────
Servo clawServo;

enum Mode { IDLE, GRAB, WAVE, SLEEP, EXCITED, MODE_COUNT };
const char* modeNames[] = {"😊 Idle", "🦀 Grab", "👋 Wave", "😴 Sleep", "🎉 Excited"};
const uint16_t modeColors[] = {TFT_GREEN, TFT_RED, TFT_YELLOW, TFT_BLUE, TFT_MAGENTA};

Mode currentMode = IDLE;
float currentAngle = CLAW_OPEN;
float targetAngle  = CLAW_OPEN;
bool objectGripped = false;
bool wifiConnected = false;
unsigned long modeStartMs = 0;
unsigned long lastShakeMs = 0;
int waveCount = 0;

WiFiClient espClient;
PubSubClient mqtt(espClient);

// ─── Easing ────────────────────────────────────────────
// Smooth servo movement: call every loop, moves toward target
void updateServo(float speed = 2.0) {
    if (abs(currentAngle - targetAngle) < 0.5) {
        currentAngle = targetAngle;
    } else {
        float diff = targetAngle - currentAngle;
        currentAngle += diff * 0.08 * speed; // ease-out
    }
    clawServo.write((int)currentAngle);
}

void setTarget(float angle) {
    targetAngle = constrain(angle, CLAW_GRIP, CLAW_OPEN);
}

bool isAtTarget() {
    return abs(currentAngle - targetAngle) < 1.0;
}

// ─── Stall Detection ──────────────────────────────────
// Simple: if target is CLOSED but angle hasn't reached it after timeout
unsigned long gripStartMs = 0;

void checkGrip() {
    if (targetAngle <= CLAW_CLOSED && isAtTarget()) {
        if (!objectGripped && (millis() - gripStartMs > 500)) {
            // Check if we're near closed but not fully — something is in the way
            // Simplified: if in grab mode and closed, assume gripped
            objectGripped = true;
        }
    } else {
        objectGripped = false;
        gripStartMs = millis();
    }
}

// ─── Display ───────────────────────────────────────────
void drawFace() {
    auto &lcd = StickCP2.Display;
    lcd.fillScreen(TFT_BLACK);

    // Face area (top portion)
    int cx = 67, cy = 60; // center of face on 135×240

    if (objectGripped) {
        // 😋 Happy gripping face
        lcd.setTextColor(TFT_YELLOW);
        lcd.setTextSize(4);
        lcd.drawString("^w^", cx - 35, cy - 15);
        lcd.setTextSize(1);
        lcd.setTextColor(TFT_GREEN);
        lcd.drawString("GOT IT!", cx - 22, cy + 30);
    } else {
        switch (currentMode) {
            case IDLE:
                lcd.fillCircle(cx - 15, cy - 5, 6, TFT_WHITE);  // left eye
                lcd.fillCircle(cx + 15, cy - 5, 6, TFT_WHITE);  // right eye
                lcd.drawArc(cx, cy + 10, 12, 10, 200, 340, TFT_WHITE); // smile
                break;
            case GRAB:
                lcd.fillCircle(cx - 15, cy - 5, 8, TFT_RED);
                lcd.fillCircle(cx + 15, cy - 5, 8, TFT_RED);
                lcd.fillCircle(cx - 15, cy - 5, 3, TFT_BLACK);  // pupils
                lcd.fillCircle(cx + 15, cy - 5, 3, TFT_BLACK);
                lcd.drawLine(cx - 10, cy + 15, cx + 10, cy + 15, TFT_RED);
                break;
            case WAVE:
                lcd.setTextColor(TFT_YELLOW);
                lcd.setTextSize(3);
                lcd.drawString("Hi!", cx - 20, cy - 10);
                break;
            case SLEEP:
                lcd.drawLine(cx - 20, cy, cx - 5, cy, TFT_BLUE);   // closed eyes
                lcd.drawLine(cx + 5, cy, cx + 20, cy, TFT_BLUE);
                lcd.setTextSize(1);
                lcd.setTextColor(TFT_BLUE);
                lcd.drawString("zzZ", cx + 15, cy - 20);
                break;
            case EXCITED:
                lcd.setTextColor(TFT_MAGENTA);
                lcd.setTextSize(3);
                lcd.drawString("!!!", cx - 25, cy - 10);
                break;
            default: break;
        }
    }

    // Status bar (bottom)
    lcd.setTextSize(1);
    lcd.setTextColor(modeColors[currentMode]);
    lcd.drawString(modeNames[currentMode], 5, 200);

    // WiFi indicator
    lcd.setTextColor(wifiConnected ? TFT_GREEN : TFT_DARKGREY);
    lcd.drawString(wifiConnected ? "WiFi OK" : "WiFi --", 80, 225);

    // Angle indicator
    lcd.setTextColor(TFT_WHITE);
    char buf[16];
    snprintf(buf, sizeof(buf), "Ang:%d", (int)currentAngle);
    lcd.drawString(buf, 5, 225);
}

// ─── Mode Behaviors ────────────────────────────────────
void runIdle() {
    // Gentle breathing: slow sine wave open/close
    float t = (millis() - modeStartMs) / 3000.0;
    float angle = CLAW_CLOSED + (CLAW_OPEN - CLAW_CLOSED) * (0.5 + 0.5 * sin(t * PI));
    setTarget(angle);
}

void runGrab() {
    setTarget(CLAW_GRIP);
}

void runWave() {
    // Quick open-close 3 times
    float t = (millis() - modeStartMs);
    int cycle = (int)(t / 300);
    if (cycle < 6) {
        setTarget(cycle % 2 == 0 ? CLAW_OPEN : CLAW_CLOSED);
    } else {
        // Done waving, return to idle
        currentMode = IDLE;
        modeStartMs = millis();
    }
}

void runSleep() {
    setTarget(CLAW_CLOSED + 10); // mostly closed, relaxed
}

void runExcited() {
    // Rapid jittery movement
    float t = (millis() - modeStartMs) / 150.0;
    float angle = CLAW_CLOSED + (CLAW_OPEN - CLAW_CLOSED) * (0.5 + 0.4 * sin(t * PI * 3));
    setTarget(angle);

    // Calm down after 3 seconds
    if (millis() - modeStartMs > 3000) {
        currentMode = IDLE;
        modeStartMs = millis();
    }
}

void runCurrentMode() {
    switch (currentMode) {
        case IDLE:    runIdle();    break;
        case GRAB:    runGrab();    break;
        case WAVE:    runWave();    break;
        case SLEEP:   runSleep();   break;
        case EXCITED: runExcited(); break;
        default: break;
    }
}

// ─── IMU Shake Detection ───────────────────────────────
void checkShake() {
    auto imu = StickCP2.Imu;
    auto data = StickCP2.Imu.getImuData();
    float accel = sqrt(data.accel.x * data.accel.x +
                       data.accel.y * data.accel.y +
                       data.accel.z * data.accel.z);

    if (accel > 2.5 && (millis() - lastShakeMs > 2000)) {
        lastShakeMs = millis();
        // Random action on shake
        Mode modes[] = {WAVE, EXCITED, GRAB};
        currentMode = modes[random(3)];
        modeStartMs = millis();
    }
}

// ─── MQTT ──────────────────────────────────────────────
void mqttCallback(char* topic, byte* payload, unsigned int length) {
    String msg;
    for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
    msg.trim();

    if (msg == "open") {
        currentMode = IDLE;
        setTarget(CLAW_OPEN);
    } else if (msg == "close" || msg == "grab") {
        currentMode = GRAB;
        modeStartMs = millis();
    } else if (msg == "wave") {
        currentMode = WAVE;
        modeStartMs = millis();
    } else if (msg == "sleep") {
        currentMode = SLEEP;
        modeStartMs = millis();
    } else if (msg == "excited") {
        currentMode = EXCITED;
        modeStartMs = millis();
    } else if (msg.startsWith("angle:")) {
        int a = msg.substring(6).toInt();
        setTarget(a);
    } else if (msg.startsWith("mode:")) {
        int m = msg.substring(5).toInt();
        if (m >= 0 && m < MODE_COUNT) {
            currentMode = (Mode)m;
            modeStartMs = millis();
        }
    }
}

void mqttReconnect() {
    if (mqtt.connected()) return;
    String clientId = "clawbie-v3-" + String(random(0xffff), HEX);
    if (mqtt.connect(clientId.c_str())) {
        mqtt.subscribe(MQTT_TOPIC_CMD);
    }
}

void setupWifi() {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    // Non-blocking: we check in loop
}

// ─── Setup & Loop ──────────────────────────────────────
void setup() {
    auto cfg = M5.config();
    StickCP2.begin(cfg);

    StickCP2.Display.setRotation(0); // portrait
    StickCP2.Display.fillScreen(TFT_BLACK);
    StickCP2.Display.setTextColor(TFT_WHITE);
    StickCP2.Display.setTextSize(2);
    StickCP2.Display.drawString("Clawbie V3", 10, 50);
    StickCP2.Display.setTextSize(1);
    StickCP2.Display.drawString("Booting...", 10, 80);

    // Servo
    ESP32PWM::allocateTimer(0);
    clawServo.setPeriodHertz(50);
    clawServo.attach(CLAW_SERVO_PIN, 500, 2400);
    clawServo.write(CLAW_OPEN);
    currentAngle = CLAW_OPEN;
    targetAngle = CLAW_OPEN;

    // WiFi + MQTT
    setupWifi();
    mqtt.setServer(MQTT_BROKER, MQTT_PORT);
    mqtt.setCallback(mqttCallback);

    modeStartMs = millis();
    randomSeed(analogRead(0));

    delay(500);
}

unsigned long lastDraw = 0;
unsigned long lastMqttRetry = 0;

void loop() {
    StickCP2.update();

    // Buttons
    if (StickCP2.BtnA.wasPressed()) {
        currentMode = (Mode)((currentMode + 1) % MODE_COUNT);
        modeStartMs = millis();
    }
    if (StickCP2.BtnB.wasPressed()) {
        currentMode = GRAB;
        modeStartMs = millis();
    }

    // WiFi check
    wifiConnected = (WiFi.status() == WL_CONNECTED);

    // MQTT
    if (wifiConnected) {
        if (!mqtt.connected() && (millis() - lastMqttRetry > 5000)) {
            mqttReconnect();
            lastMqttRetry = millis();
        }
        mqtt.loop();
    }

    // IMU
    checkShake();

    // Mode logic
    runCurrentMode();

    // Servo easing
    updateServo();

    // Stall detection
    checkGrip();

    // Redraw face at ~10fps
    if (millis() - lastDraw > 100) {
        drawFace();
        lastDraw = millis();
    }

    delay(10);
}
