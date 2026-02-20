/**
 * Hexapod Walker — Tripod Gait Controller
 * RealWorldClaw Reference Design #2
 *
 * 三角步态实现：6条腿分2组交替运动
 * 通过MQTT接收移动指令
 */

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <math.h>

// ===== Configuration =====
#define NUM_LEGS        6
#define SERVO_MIN_US    544
#define SERVO_MAX_US    2400
#define SERVO_CENTER    90      // 中位角度
#define SWING_AMPLITUDE 30      // 最大摆幅(度)
#define GAIT_PERIOD_MS  600     // 步态周期(ms)

// Servo channels on PCA9685
static const uint8_t LEG_CHANNEL[NUM_LEGS] = {0, 1, 2, 3, 4, 5};

// 腿组定义 (tripod gait)
// A组: 右前(0), 左中(3), 右后(4) — 相位0
// B组: 左前(1), 右中(2), 左后(5) — 相位π
static const float LEG_PHASE[NUM_LEGS] = {
    0,      // leg 0: 右前 (A)
    M_PI,   // leg 1: 左前 (B)
    M_PI,   // leg 2: 右中 (B)
    0,      // leg 3: 左中 (A)
    0,      // leg 4: 右后 (A)
    M_PI    // leg 5: 左后 (B)
};

// 腿侧面系数 (+1=右侧, -1=左侧)
static const float LEG_SIDE[NUM_LEGS] = {
    1, -1, 1, -1, 1, -1
};

// 腿纵向位置 (前=1, 中=0, 后=-1)，用于转弯
static const float LEG_LONGITUDINAL[NUM_LEGS] = {
    1, 1, 0, 0, -1, -1
};

// ===== Globals =====
Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver(0x40);
WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

float cmd_vx = 0;      // 前进速度 [-1, 1]
float cmd_omega = 0;    // 旋转速度 [-1, 1]
float gait_phase = 0;   // 当前步态相位 [0, 2π)
uint32_t last_tick = 0;

// ===== Servo Helpers =====
void setServoAngle(uint8_t channel, float angle) {
    angle = constrain(angle, 0, 180);
    uint16_t us = map(angle * 100, 0, 18000, SERVO_MIN_US, SERVO_MAX_US);
    uint16_t tick = (uint16_t)((us * 4096.0) / 20000.0);
    pwm.setPWM(channel, 0, tick);
}

// ===== Tripod Gait =====
/**
 * 计算单条腿的目标角度
 *
 * phase: 当前步态相位
 * leg_phase: 该腿的相位偏移 (0 或 π)
 * amplitude: 摆幅(度)
 * side: 侧面系数 (±1)
 */
float computeLegAngle(float phase, float leg_phase, float amplitude, float side) {
    float theta = phase + leg_phase;
    // 正弦波驱动，side翻转左右腿方向
    float swing = amplitude * sin(theta) * side;
    return SERVO_CENTER + swing;
}

/**
 * 更新所有腿的角度
 *
 * vx: 前进指令 → 控制摆幅
 * omega: 旋转指令 → 左右差速
 */
void updateGait(float vx, float omega) {
    for (int i = 0; i < NUM_LEGS; i++) {
        // 混合前进和转弯
        // 前进：所有腿同幅摆动
        // 转弯：左右侧差速，中腿贡献最大
        float forward_amp = vx * SWING_AMPLITUDE;
        float turn_amp = omega * SWING_AMPLITUDE * LEG_SIDE[i] * 0.5;

        float total_amp = forward_amp + turn_amp;
        total_amp = constrain(total_amp, -SWING_AMPLITUDE, SWING_AMPLITUDE);

        float angle = computeLegAngle(
            gait_phase,
            LEG_PHASE[i],
            fabs(total_amp),
            (total_amp >= 0) ? LEG_SIDE[i] : -LEG_SIDE[i]
        );

        setServoAngle(LEG_CHANNEL[i], angle);
    }
}

// ===== MQTT =====
void onMqttMessage(char* topic, byte* payload, unsigned int length) {
    StaticJsonDocument<128> doc;
    if (deserializeJson(doc, payload, length) != DeserializationError::Ok) return;

    cmd_vx    = constrain(doc["vx"]    | 0.0f, -1.0f, 1.0f);
    cmd_omega = constrain(doc["omega"] | 0.0f, -1.0f, 1.0f);
}

void mqttReconnect() {
    if (mqtt.connected()) return;
    String clientId = "hexapod-" + String(ESP.getEfuseMac(), HEX);
    if (mqtt.connect(clientId.c_str())) {
        String topic = "rwc/" + clientId + "/move";
        mqtt.subscribe(topic.c_str());
    }
}

// ===== Setup & Loop =====
void setup() {
    Serial.begin(115200);
    Serial.println("Hexapod Walker starting...");

    Wire.begin(8, 9);   // SDA=8, SCL=9 (ESP32-S3)
    pwm.begin();
    pwm.setPWMFreq(50);  // 50Hz for servos

    // 所有舵机归中
    for (int i = 0; i < NUM_LEGS; i++) {
        setServoAngle(LEG_CHANNEL[i], SERVO_CENTER);
    }

    // WiFi (从NVS读取或硬编码)
    // WiFi.begin(ssid, password);
    // mqtt.setServer(broker, 1883);
    // mqtt.setCallback(onMqttMessage);

    last_tick = millis();
    Serial.println("Ready. Send MQTT {vx, omega} to move.");
}

void loop() {
    // MQTT
    if (!mqtt.connected()) mqttReconnect();
    mqtt.loop();

    // 步态更新
    uint32_t now = millis();
    uint32_t dt = now - last_tick;
    last_tick = now;

    // 有移动指令时才运行步态
    if (fabs(cmd_vx) > 0.05 || fabs(cmd_omega) > 0.05) {
        float speed = max(fabs(cmd_vx), fabs(cmd_omega));
        float period = GAIT_PERIOD_MS / speed;  // 速度越快周期越短
        gait_phase += (2.0 * M_PI * dt) / period;
        if (gait_phase > 2.0 * M_PI) gait_phase -= 2.0 * M_PI;

        updateGait(cmd_vx, cmd_omega);
    } else {
        // 停止时归中
        gait_phase = 0;
        for (int i = 0; i < NUM_LEGS; i++) {
            setServoAngle(LEG_CHANNEL[i], SERVO_CENTER);
        }
    }

    delay(20);  // ~50Hz更新率
}
