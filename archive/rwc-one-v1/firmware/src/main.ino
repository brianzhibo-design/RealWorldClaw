// ============================================================
// RWC-ONE Firmware — Clawbie 🦀 Desktop AI Companion
// ESP32-C3 | OLED Face | DHT22 | NeoPixel | MQTT
//
// RealWorldClaw Team | MIT License | RealWorldClaw Community
// ============================================================

#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_NeoPixel.h>
#include <DHT.h>

// ============================================================
// 引脚定义
// ============================================================
#define PIN_SDA       4
#define PIN_SCL       5
#define PIN_DHT       6
#define PIN_LED       7
#define PIN_BUZZER    8
#define PIN_BUTTON    9

// ============================================================
// 硬件参数
// ============================================================
#define SCREEN_W      128
#define SCREEN_H      64
#define OLED_ADDR     0x3C
#define NUM_LEDS      8
#define DHT_TYPE      DHT22

// ============================================================
// WiFi + MQTT 配置（用户需修改）
// ============================================================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASS     = "YOUR_WIFI_PASSWORD";
const char* MQTT_SERVER   = "YOUR_MQTT_SERVER";
const int   MQTT_PORT     = 1883;
const char* MQTT_USER     = "";       // 留空=无认证
const char* MQTT_PASS     = "";
const char* DEVICE_ID     = "clawbie-001";

// MQTT Topics
String TOPIC_TEMP;
String TOPIC_HUMI;
String TOPIC_STATUS;
String TOPIC_CMD_FACE;
String TOPIC_CMD_LED;
String TOPIC_CMD_BUZZER;

// ============================================================
// 全局对象
// ============================================================
Adafruit_SSD1306 display(SCREEN_W, SCREEN_H, &Wire, -1);
Adafruit_NeoPixel leds(NUM_LEDS, PIN_LED, NEO_GRB + NEO_KHZ800);
DHT dht(PIN_DHT, DHT_TYPE);
WiFiClient espClient;
PubSubClient mqtt(espClient);

// ============================================================
// 状态变量
// ============================================================
enum DisplayMode { MODE_FACE, MODE_TEMP, MODE_HUMI, MODE_COUNT };
enum FaceType { FACE_HAPPY, FACE_SLEEP, FACE_THINK, FACE_SURPRISE, FACE_LOVE, FACE_COUNT };

DisplayMode currentMode = MODE_FACE;
FaceType currentFace = FACE_HAPPY;
float temperature = 0;
float humidity = 0;
unsigned long lastSensorRead = 0;
unsigned long lastMqttPublish = 0;
unsigned long lastFaceChange = 0;
unsigned long lastButtonPress = 0;
bool buttonPressed = false;

#define SENSOR_INTERVAL   5000    // 5秒读一次传感器
#define MQTT_INTERVAL     30000   // 30秒发一次MQTT
#define FACE_INTERVAL     10000   // 10秒换一次表情
#define DEBOUNCE_MS       200

// ============================================================
// 表情绘制 — 像素艺术风格
// ============================================================

// 😊 开心
void drawFaceHappy() {
    display.clearDisplay();
    // 眼睛 — 两个实心圆
    display.fillCircle(44, 22, 6, SSD1306_WHITE);
    display.fillCircle(84, 22, 6, SSD1306_WHITE);
    // 瞳孔
    display.fillCircle(44, 22, 2, SSD1306_BLACK);
    display.fillCircle(84, 22, 2, SSD1306_BLACK);
    // 嘴巴 — 微笑弧线
    for (int i = -15; i <= 15; i++) {
        int y = 42 + (i * i) / 30;
        display.drawPixel(64 + i, y, SSD1306_WHITE);
        display.drawPixel(64 + i, y + 1, SSD1306_WHITE);
    }
    // 腮红
    display.drawCircle(32, 35, 4, SSD1306_WHITE);
    display.drawCircle(96, 35, 4, SSD1306_WHITE);
    display.display();
}

// 😴 睡觉
void drawFaceSleep() {
    display.clearDisplay();
    // 闭眼 — 横线
    display.drawLine(38, 24, 50, 24, SSD1306_WHITE);
    display.drawLine(78, 24, 90, 24, SSD1306_WHITE);
    // 眼睫毛
    display.drawLine(38, 24, 40, 20, SSD1306_WHITE);
    display.drawLine(78, 24, 80, 20, SSD1306_WHITE);
    // 嘴巴 — 小圆（打哈欠）
    display.drawCircle(64, 44, 5, SSD1306_WHITE);
    // ZZZ
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(95, 5);
    display.print("Z");
    display.setCursor(100, 0);
    display.print("z");
    display.display();
}

// 🤔 思考
void drawFaceThink() {
    display.clearDisplay();
    // 眼睛 — 一大一小（挑眉）
    display.fillCircle(44, 24, 6, SSD1306_WHITE);
    display.fillCircle(44, 24, 2, SSD1306_BLACK);
    display.fillCircle(84, 20, 7, SSD1306_WHITE);
    display.fillCircle(84, 20, 3, SSD1306_BLACK);
    // 挑眉
    display.drawLine(78, 10, 92, 8, SSD1306_WHITE);
    display.drawLine(78, 11, 92, 9, SSD1306_WHITE);
    // 嘴巴 — 歪嘴
    display.drawLine(55, 45, 70, 42, SSD1306_WHITE);
    display.drawLine(55, 46, 70, 43, SSD1306_WHITE);
    // 思考泡泡
    display.fillCircle(100, 10, 3, SSD1306_WHITE);
    display.fillCircle(108, 5, 2, SSD1306_WHITE);
    display.display();
}

// 😮 惊讶
void drawFaceSurprise() {
    display.clearDisplay();
    // 大眼睛
    display.fillCircle(44, 22, 10, SSD1306_WHITE);
    display.fillCircle(44, 22, 4, SSD1306_BLACK);
    display.fillCircle(84, 22, 10, SSD1306_WHITE);
    display.fillCircle(84, 22, 4, SSD1306_BLACK);
    // 高光
    display.fillCircle(48, 18, 2, SSD1306_WHITE);
    display.fillCircle(88, 18, 2, SSD1306_WHITE);
    // 嘴巴 — O形
    display.drawCircle(64, 46, 8, SSD1306_WHITE);
    display.drawCircle(64, 46, 7, SSD1306_WHITE);
    display.display();
}

// ❤️ 爱心
void drawFaceLove() {
    display.clearDisplay();
    // 爱心眼 — 左
    drawHeart(44, 22, 8);
    // 爱心眼 — 右
    drawHeart(84, 22, 8);
    // 嘴巴 — 大笑
    for (int i = -18; i <= 18; i++) {
        int y = 42 + (i * i) / 40;
        display.drawPixel(64 + i, y, SSD1306_WHITE);
        display.drawPixel(64 + i, y + 1, SSD1306_WHITE);
    }
    display.display();
}

void drawHeart(int cx, int cy, int size) {
    // 简单爱心：两个圆 + 三角形
    int r = size / 2;
    display.fillCircle(cx - r/2, cy - r/2, r, SSD1306_WHITE);
    display.fillCircle(cx + r/2, cy - r/2, r, SSD1306_WHITE);
    display.fillTriangle(
        cx - size, cy,
        cx + size, cy,
        cx, cy + size,
        SSD1306_WHITE
    );
}

void drawCurrentFace() {
    switch (currentFace) {
        case FACE_HAPPY:    drawFaceHappy();    break;
        case FACE_SLEEP:    drawFaceSleep();    break;
        case FACE_THINK:    drawFaceThink();    break;
        case FACE_SURPRISE: drawFaceSurprise(); break;
        case FACE_LOVE:     drawFaceLove();     break;
        default:            drawFaceHappy();    break;
    }
}

// ============================================================
// 温度/湿度显示
// ============================================================
void drawTemperature() {
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);

    // 温度计图标
    display.drawRect(58, 5, 12, 35, SSD1306_WHITE);
    display.fillCircle(64, 45, 8, SSD1306_WHITE);
    int barH = map(constrain(temperature, 0, 40), 0, 40, 0, 30);
    display.fillRect(60, 35 - barH, 8, barH + 5, SSD1306_WHITE);

    display.setTextSize(2);
    display.setCursor(10, 50);
    display.print(temperature, 1);
    display.print((char)247); // °
    display.print("C");
    display.display();
}

void drawHumidity() {
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);

    // 水滴图标
    display.fillCircle(64, 30, 12, SSD1306_WHITE);
    display.fillTriangle(52, 30, 76, 30, 64, 8, SSD1306_WHITE);

    display.setTextSize(2);
    display.setCursor(15, 50);
    display.print(humidity, 1);
    display.print("%");
    display.display();
}

// ============================================================
// LED 灯环 — 温度映射颜色
// ============================================================
void updateLEDs() {
    uint32_t color;

    if (temperature < 18) {
        // 冷 — 蓝色
        int blue = map(constrain(temperature, 0, 18), 0, 18, 255, 100);
        color = leds.Color(0, 0, blue);
    } else if (temperature < 28) {
        // 适中 — 绿色
        int green = 200;
        int shift = map(constrain(temperature, 18, 28), 18, 28, 0, 100);
        color = leds.Color(shift, green, 0);
    } else {
        // 热 — 红色
        int red = map(constrain(temperature, 28, 40), 28, 40, 180, 255);
        color = leds.Color(red, 0, 0);
    }

    // 呼吸效果
    float breath = (sin(millis() / 1000.0 * PI) + 1) / 2.0; // 0-1
    uint8_t r = ((color >> 16) & 0xFF) * breath;
    uint8_t g = ((color >> 8) & 0xFF) * breath;
    uint8_t b = (color & 0xFF) * breath;

    for (int i = 0; i < NUM_LEDS; i++) {
        leds.setPixelColor(i, leds.Color(r, g, b));
    }
    leds.show();
}

// 彩虹启动动画
void ledRainbow(int duration_ms) {
    unsigned long start = millis();
    while (millis() - start < duration_ms) {
        int offset = (millis() - start) / 10;
        for (int i = 0; i < NUM_LEDS; i++) {
            int hue = (i * 65536 / NUM_LEDS + offset * 256) % 65536;
            leds.setPixelColor(i, leds.gamma32(leds.ColorHSV(hue)));
        }
        leds.show();
        delay(10);
    }
}

// ============================================================
// 蜂鸣器
// ============================================================
void beepStartup() {
    tone(PIN_BUZZER, 880, 100);
    delay(120);
    tone(PIN_BUZZER, 1100, 100);
    delay(120);
    tone(PIN_BUZZER, 1320, 200);
    delay(220);
    noTone(PIN_BUZZER);
}

void beepClick() {
    tone(PIN_BUZZER, 1000, 30);
    delay(30);
    noTone(PIN_BUZZER);
}

void beepAlert() {
    for (int i = 0; i < 3; i++) {
        tone(PIN_BUZZER, 2000, 100);
        delay(200);
    }
    noTone(PIN_BUZZER);
}

// ============================================================
// WiFi 连接
// ============================================================
void setupWiFi() {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(10, 20);
    display.print("Connecting WiFi...");
    display.setCursor(10, 35);
    display.print(WIFI_SSID);
    display.display();

    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASS);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi connected: " + WiFi.localIP().toString());
        display.clearDisplay();
        display.setCursor(10, 20);
        display.print("WiFi OK!");
        display.setCursor(10, 35);
        display.print(WiFi.localIP().toString());
        display.display();
        delay(1000);
    } else {
        Serial.println("\nWiFi failed — running offline");
        display.clearDisplay();
        display.setCursor(10, 25);
        display.print("WiFi failed");
        display.setCursor(10, 40);
        display.print("Offline mode");
        display.display();
        delay(2000);
    }
}

// ============================================================
// MQTT
// ============================================================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
    String msg;
    for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
    String t = String(topic);

    Serial.println("MQTT [" + t + "]: " + msg);

    if (t == TOPIC_CMD_FACE) {
        int f = msg.toInt();
        if (f >= 0 && f < FACE_COUNT) {
            currentFace = (FaceType)f;
            currentMode = MODE_FACE;
            drawCurrentFace();
        }
    } else if (t == TOPIC_CMD_LED) {
        // 格式: "R,G,B" 例如 "255,0,128"
        int c1 = msg.indexOf(',');
        int c2 = msg.lastIndexOf(',');
        if (c1 > 0 && c2 > c1) {
            int r = msg.substring(0, c1).toInt();
            int g = msg.substring(c1+1, c2).toInt();
            int b = msg.substring(c2+1).toInt();
            for (int i = 0; i < NUM_LEDS; i++)
                leds.setPixelColor(i, leds.Color(r, g, b));
            leds.show();
        }
    } else if (t == TOPIC_CMD_BUZZER) {
        if (msg == "click") beepClick();
        else if (msg == "alert") beepAlert();
        else {
            int freq = msg.toInt();
            if (freq > 0) { tone(PIN_BUZZER, freq, 200); delay(200); noTone(PIN_BUZZER); }
        }
    }
}

void setupMQTT() {
    TOPIC_TEMP      = "rwc-one/" + String(DEVICE_ID) + "/sensor/temperature";
    TOPIC_HUMI      = "rwc-one/" + String(DEVICE_ID) + "/sensor/humidity";
    TOPIC_STATUS    = "rwc-one/" + String(DEVICE_ID) + "/status";
    TOPIC_CMD_FACE  = "rwc-one/" + String(DEVICE_ID) + "/command/face";
    TOPIC_CMD_LED   = "rwc-one/" + String(DEVICE_ID) + "/command/led";
    TOPIC_CMD_BUZZER= "rwc-one/" + String(DEVICE_ID) + "/command/buzzer";

    mqtt.setServer(MQTT_SERVER, MQTT_PORT);
    mqtt.setCallback(mqttCallback);
}

void mqttReconnect() {
    if (WiFi.status() != WL_CONNECTED) return;
    if (mqtt.connected()) return;

    String clientId = "rwc-one-" + String(DEVICE_ID);
    if (mqtt.connect(clientId.c_str(), MQTT_USER, MQTT_PASS,
                     TOPIC_STATUS.c_str(), 1, true, "offline")) {
        Serial.println("MQTT connected");
        mqtt.publish(TOPIC_STATUS.c_str(), "online", true);
        mqtt.subscribe(TOPIC_CMD_FACE.c_str());
        mqtt.subscribe(TOPIC_CMD_LED.c_str());
        mqtt.subscribe(TOPIC_CMD_BUZZER.c_str());
    }
}

void mqttPublishSensors() {
    if (!mqtt.connected()) return;
    mqtt.publish(TOPIC_TEMP.c_str(), String(temperature, 1).c_str());
    mqtt.publish(TOPIC_HUMI.c_str(), String(humidity, 1).c_str());
}

// ============================================================
// 按钮处理
// ============================================================
void handleButton() {
    if (digitalRead(PIN_BUTTON) == LOW) {
        if (!buttonPressed && (millis() - lastButtonPress > DEBOUNCE_MS)) {
            buttonPressed = true;
            lastButtonPress = millis();
            beepClick();

            // 切换模式
            currentMode = (DisplayMode)((currentMode + 1) % MODE_COUNT);
            Serial.println("Mode: " + String(currentMode));
        }
    } else {
        buttonPressed = false;
    }
}

// ============================================================
// Setup
// ============================================================
void setup() {
    Serial.begin(115200);
    Serial.println("\n🦀 RWC-ONE Clawbie starting...");

    // I2C
    Wire.begin(PIN_SDA, PIN_SCL);

    // OLED
    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
        Serial.println("OLED init failed!");
        while (1) delay(100);
    }
    display.clearDisplay();
    display.setTextSize(2);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(15, 10);
    display.print("CLAWBIE");
    display.setTextSize(1);
    display.setCursor(30, 40);
    display.print("RWC-ONE v1.0");
    display.display();

    // LEDs
    leds.begin();
    leds.setBrightness(50);
    ledRainbow(2000);

    // DHT
    dht.begin();

    // Buzzer
    pinMode(PIN_BUZZER, OUTPUT);
    beepStartup();

    // Button
    pinMode(PIN_BUTTON, INPUT_PULLUP);

    // WiFi
    setupWiFi();

    // MQTT
    setupMQTT();

    // 初始表情
    drawFaceHappy();

    Serial.println("🦀 Clawbie ready!");
}

// ============================================================
// Loop
// ============================================================
void loop() {
    unsigned long now = millis();

    // MQTT
    if (!mqtt.connected()) mqttReconnect();
    mqtt.loop();

    // 传感器读取
    if (now - lastSensorRead >= SENSOR_INTERVAL) {
        lastSensorRead = now;
        float t = dht.readTemperature();
        float h = dht.readHumidity();
        if (!isnan(t) && !isnan(h)) {
            temperature = t;
            humidity = h;
            Serial.printf("T=%.1f°C  H=%.1f%%\n", temperature, humidity);
        }
        updateLEDs();
    }

    // MQTT 发布
    if (now - lastMqttPublish >= MQTT_INTERVAL) {
        lastMqttPublish = now;
        mqttPublishSensors();
    }

    // 自动换表情（仅在表情模式）
    if (currentMode == MODE_FACE && now - lastFaceChange >= FACE_INTERVAL) {
        lastFaceChange = now;
        currentFace = (FaceType)random(FACE_COUNT);
    }

    // 按钮
    handleButton();

    // 刷新显示
    switch (currentMode) {
        case MODE_FACE: drawCurrentFace(); break;
        case MODE_TEMP: drawTemperature(); break;
        case MODE_HUMI: drawHumidity(); break;
        default: break;
    }

    delay(50); // 节省CPU
}
