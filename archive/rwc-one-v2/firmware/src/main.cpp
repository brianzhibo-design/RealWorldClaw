/**
 * Clawbie V2 — 固件 (M5StickC Plus2)
 * 美羊羊🎀 设计
 *
 * 功能：
 * - 彩色表情动画（TFT 135×240）
 * - 多页面UI：表情/温度/时钟
 * - IMU摇晃检测 → 切换表情
 * - 按钮A: 切换页面  按钮B: 切换模式
 * - WiFi + MQTT
 * - 蜂鸣器提示音
 * - 可选DHT22精确温湿度
 */

#include <M5StickCPlus2.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ========== 配置 ==========
#define WIFI_SSID       "your-wifi"
#define WIFI_PASS       "your-password"
#define MQTT_SERVER     "mqtt.local"
#define MQTT_PORT       1883
#define MQTT_TOPIC_PUB  "clawbie/status"
#define MQTT_TOPIC_SUB  "clawbie/cmd"

#define DHT_PIN         26
#define DHT_TYPE        DHT22
#define SHAKE_THRESHOLD 2.5f    // 摇晃灵敏度 (G)
#define SCREEN_W        135
#define SCREEN_H        240

// ========== 全局状态 ==========
enum Page { PAGE_FACE, PAGE_TEMP, PAGE_CLOCK, PAGE_COUNT };
enum Face { FACE_HAPPY, FACE_LOVE, FACE_COOL, FACE_SLEEP, FACE_ANGRY, FACE_COUNT };

Page currentPage = PAGE_FACE;
Face currentFace = FACE_HAPPY;
bool dhtAvailable = false;
float temperature = 0;
float humidity = 0;
unsigned long lastShakeTime = 0;
unsigned long lastMqttPublish = 0;
unsigned long lastSensorRead = 0;
bool wifiConnected = false;

WiFiClient espClient;
PubSubClient mqtt(espClient);
DHT dht(DHT_PIN, DHT_TYPE);

// ========== 颜色定义 ==========
#define CLR_BG        TFT_BLACK
#define CLR_FACE_BG   0x001F   // 深蓝
#define CLR_SKIN      0xFDD0   // 暖黄
#define CLR_EYE       TFT_WHITE
#define CLR_PUPIL     TFT_BLACK
#define CLR_MOUTH     0xF800   // 红
#define CLR_BLUSH     0xFB56   // 粉红
#define CLR_HEART     0xF81F   // 品红
#define CLR_COOL_LENS 0x39E7   // 深灰
#define CLR_TEXT       TFT_WHITE
#define CLR_ACCENT     0x07FF  // 青色
#define CLR_WARM       0xFDA0  // 暖橙
#define CLR_COLD       0x7DFF  // 冷蓝

// ========== 蜂鸣器音效 ==========
void beepShort() {
    M5.Beep.tone(1200, 50);
}

void beepDouble() {
    M5.Beep.tone(1000, 40);
    delay(60);
    M5.Beep.tone(1400, 40);
}

void beepLong() {
    M5.Beep.tone(800, 200);
}

// ========== 表情绘制 ==========
void drawFaceBase() {
    M5.Lcd.fillScreen(CLR_FACE_BG);
    // 脸部圆形底色
    M5.Lcd.fillCircle(67, 100, 55, CLR_SKIN);
}

void drawEyes(int lx, int ly, int rx, int ry, int pupilR = 4) {
    // 眼白
    M5.Lcd.fillCircle(lx, ly, 12, CLR_EYE);
    M5.Lcd.fillCircle(rx, ry, 12, CLR_EYE);
    // 瞳孔
    M5.Lcd.fillCircle(lx, ly, pupilR, CLR_PUPIL);
    M5.Lcd.fillCircle(rx, ry, pupilR, CLR_PUPIL);
}

void drawBlush() {
    M5.Lcd.fillCircle(40, 115, 8, CLR_BLUSH);
    M5.Lcd.fillCircle(94, 115, 8, CLR_BLUSH);
}

void drawFaceHappy() {
    drawFaceBase();
    drawEyes(50, 85, 84, 85);
    drawBlush();
    // 笑嘴 - 弧线
    for (int i = -15; i <= 15; i++) {
        int y = 125 + (i * i) / 12;
        M5.Lcd.fillCircle(67 + i, y, 2, CLR_MOUTH);
    }
    // 标签
    M5.Lcd.setTextColor(CLR_TEXT);
    M5.Lcd.setTextSize(2);
    M5.Lcd.setCursor(30, 210);
    M5.Lcd.print("(^ v ^)");
}

void drawFaceLove() {
    drawFaceBase();
    // 爱心眼
    for (int e = 0; e < 2; e++) {
        int cx = (e == 0) ? 50 : 84;
        int cy = 85;
        M5.Lcd.fillCircle(cx - 5, cy - 3, 6, CLR_HEART);
        M5.Lcd.fillCircle(cx + 5, cy - 3, 6, CLR_HEART);
        M5.Lcd.fillTriangle(cx - 11, cy, cx + 11, cy, cx, cy + 12, CLR_HEART);
    }
    drawBlush();
    // 小嘴
    M5.Lcd.fillCircle(67, 125, 5, CLR_MOUTH);
    M5.Lcd.setTextColor(CLR_TEXT);
    M5.Lcd.setTextSize(2);
    M5.Lcd.setCursor(25, 210);
    M5.Lcd.print("<3 <3 <3");
}

void drawFaceCool() {
    drawFaceBase();
    // 墨镜
    M5.Lcd.fillRoundRect(35, 78, 25, 16, 3, CLR_COOL_LENS);
    M5.Lcd.fillRoundRect(72, 78, 25, 16, 3, CLR_COOL_LENS);
    M5.Lcd.drawLine(60, 86, 72, 86, CLR_PUPIL);
    // 酷笑
    M5.Lcd.drawLine(52, 125, 82, 125, CLR_MOUTH);
    M5.Lcd.drawLine(82, 125, 78, 120, CLR_MOUTH);
    M5.Lcd.setTextColor(CLR_TEXT);
    M5.Lcd.setTextSize(2);
    M5.Lcd.setCursor(30, 210);
    M5.Lcd.print("B-)  ");
}

void drawFaceSleep() {
    drawFaceBase();
    // 闭眼 - 弧线
    for (int i = -10; i <= 10; i++) {
        int y = 88 - abs(i) / 3;
        M5.Lcd.fillCircle(50 + i, y, 1, CLR_PUPIL);
        M5.Lcd.fillCircle(84 + i, y, 1, CLR_PUPIL);
    }
    // 睡嘴
    M5.Lcd.fillCircle(67, 123, 4, CLR_MOUTH);
    // ZZZ
    M5.Lcd.setTextColor(CLR_ACCENT);
    M5.Lcd.setTextSize(2);
    M5.Lcd.setCursor(90, 60);
    M5.Lcd.print("Z");
    M5.Lcd.setTextSize(3);
    M5.Lcd.setCursor(100, 40);
    M5.Lcd.print("Z");
    M5.Lcd.setTextColor(CLR_TEXT);
    M5.Lcd.setTextSize(2);
    M5.Lcd.setCursor(30, 210);
    M5.Lcd.print("- _ -  ");
}

void drawFaceAngry() {
    drawFaceBase();
    // 怒色
    M5.Lcd.fillCircle(67, 100, 55, 0xFB00); // 偏红底色
    drawEyes(50, 88, 84, 88, 5);
    // 怒眉
    M5.Lcd.drawLine(38, 72, 58, 78, CLR_PUPIL);
    M5.Lcd.drawLine(96, 72, 76, 78, CLR_PUPIL);
    M5.Lcd.drawLine(38, 73, 58, 79, CLR_PUPIL);
    M5.Lcd.drawLine(96, 73, 76, 79, CLR_PUPIL);
    // 怒嘴
    for (int i = -12; i <= 12; i++) {
        int y = 128 - (i * i) / 18;
        M5.Lcd.fillCircle(67 + i, y, 1, CLR_MOUTH);
    }
    M5.Lcd.setTextColor(CLR_TEXT);
    M5.Lcd.setTextSize(2);
    M5.Lcd.setCursor(30, 210);
    M5.Lcd.print(">:(   ");
}

void drawCurrentFace() {
    switch (currentFace) {
        case FACE_HAPPY: drawFaceHappy(); break;
        case FACE_LOVE:  drawFaceLove();  break;
        case FACE_COOL:  drawFaceCool();  break;
        case FACE_SLEEP: drawFaceSleep(); break;
        case FACE_ANGRY: drawFaceAngry(); break;
        default: drawFaceHappy();
    }
}

// ========== 温度页面 ==========
void drawTempPage() {
    M5.Lcd.fillScreen(CLR_BG);

    // 标题
    M5.Lcd.setTextColor(CLR_ACCENT);
    M5.Lcd.setTextSize(2);
    M5.Lcd.setCursor(15, 10);
    M5.Lcd.print("Environment");

    // 温度
    uint16_t tempColor = (temperature > 28) ? CLR_WARM : (temperature < 18) ? CLR_COLD : CLR_TEXT;
    M5.Lcd.setTextColor(tempColor);
    M5.Lcd.setTextSize(4);
    M5.Lcd.setCursor(15, 60);
    M5.Lcd.printf("%.1f", temperature);
    M5.Lcd.setTextSize(2);
    M5.Lcd.print(" C");

    // 温度来源标注
    M5.Lcd.setTextColor(0x7BEF); // 灰色
    M5.Lcd.setTextSize(1);
    M5.Lcd.setCursor(15, 100);
    M5.Lcd.print(dhtAvailable ? "DHT22 sensor" : "IMU (approx)");

    // 湿度
    M5.Lcd.setTextColor(CLR_ACCENT);
    M5.Lcd.setTextSize(2);
    M5.Lcd.setCursor(15, 130);
    M5.Lcd.print("Humidity");
    M5.Lcd.setTextSize(3);
    M5.Lcd.setCursor(15, 160);
    if (dhtAvailable) {
        M5.Lcd.setTextColor(CLR_TEXT);
        M5.Lcd.printf("%.0f%%", humidity);
    } else {
        M5.Lcd.setTextColor(0x7BEF);
        M5.Lcd.print("N/A");
    }

    // 电池
    M5.Lcd.setTextColor(0x7BEF);
    M5.Lcd.setTextSize(1);
    M5.Lcd.setCursor(15, 220);
    int batV = M5.Power.getBatteryVoltage();
    int batPct = map(constrain(batV, 3300, 4200), 3300, 4200, 0, 100);
    M5.Lcd.printf("BAT: %d%%  %dmV", batPct, batV);
}

// ========== 时钟页面 ==========
void drawClockPage() {
    M5.Lcd.fillScreen(CLR_BG);

    // 获取RTC时间
    auto dt = M5.Rtc.getDateTime();

    // 大时钟
    M5.Lcd.setTextColor(CLR_ACCENT);
    M5.Lcd.setTextSize(5);
    M5.Lcd.setCursor(5, 60);
    M5.Lcd.printf("%02d:%02d", dt.time.hours, dt.time.minutes);

    // 秒数
    M5.Lcd.setTextSize(3);
    M5.Lcd.setCursor(45, 115);
    M5.Lcd.printf(":%02d", dt.time.seconds);

    // 日期
    M5.Lcd.setTextColor(CLR_TEXT);
    M5.Lcd.setTextSize(2);
    M5.Lcd.setCursor(10, 170);
    M5.Lcd.printf("%04d-%02d-%02d", dt.date.year, dt.date.month, dt.date.date);

    // WiFi状态
    M5.Lcd.setTextColor(wifiConnected ? CLR_ACCENT : CLR_WARM);
    M5.Lcd.setTextSize(1);
    M5.Lcd.setCursor(15, 220);
    M5.Lcd.print(wifiConnected ? "WiFi: Connected" : "WiFi: Offline");
}

// ========== 页面渲染 ==========
void renderPage() {
    switch (currentPage) {
        case PAGE_FACE:  drawCurrentFace(); break;
        case PAGE_TEMP:  drawTempPage();    break;
        case PAGE_CLOCK: drawClockPage();   break;
        default: drawCurrentFace();
    }
}

// ========== IMU 摇晃检测 ==========
bool detectShake() {
    float ax, ay, az;
    M5.Imu.getAccel(&ax, &ay, &az);
    float magnitude = sqrt(ax * ax + ay * ay + az * az);
    return (magnitude > SHAKE_THRESHOLD);
}

// ========== 传感器读取 ==========
void readSensors() {
    if (dhtAvailable) {
        float t = dht.readTemperature();
        float h = dht.readHumidity();
        if (!isnan(t)) temperature = t;
        if (!isnan(h)) humidity = h;
    } else {
        // 使用IMU内置温度（精度较低）
        float imuTemp;
        M5.Imu.getTemp(&imuTemp);
        temperature = imuTemp;
        humidity = 0;
    }
}

// ========== WiFi ==========
void connectWiFi() {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASS);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        attempts++;
    }
    wifiConnected = (WiFi.status() == WL_CONNECTED);
}

// ========== MQTT ==========
void mqttCallback(char* topic, byte* payload, unsigned int length) {
    JsonDocument doc;
    if (deserializeJson(doc, payload, length) == DeserializationError::Ok) {
        if (doc.containsKey("face")) {
            int f = doc["face"].as<int>();
            if (f >= 0 && f < FACE_COUNT) {
                currentFace = (Face)f;
                currentPage = PAGE_FACE;
                beepDouble();
                renderPage();
            }
        }
        if (doc.containsKey("page")) {
            int p = doc["page"].as<int>();
            if (p >= 0 && p < PAGE_COUNT) {
                currentPage = (Page)p;
                renderPage();
            }
        }
        if (doc.containsKey("beep")) {
            beepLong();
        }
    }
}

void reconnectMqtt() {
    if (!wifiConnected) return;
    if (mqtt.connected()) return;

    if (mqtt.connect("clawbie-v2")) {
        mqtt.subscribe(MQTT_TOPIC_SUB);
    }
}

void publishStatus() {
    if (!mqtt.connected()) return;

    JsonDocument doc;
    doc["temp"] = round(temperature * 10) / 10.0;
    doc["humidity"] = round(humidity);
    doc["face"] = (int)currentFace;
    doc["page"] = (int)currentPage;
    doc["bat_mv"] = M5.Power.getBatteryVoltage();
    doc["dht"] = dhtAvailable;

    char buf[200];
    serializeJson(doc, buf);
    mqtt.publish(MQTT_TOPIC_PUB, buf);
}

// ========== SETUP ==========
void setup() {
    auto cfg = M5.config();
    M5.begin(cfg);

    M5.Lcd.setRotation(0);  // 竖屏
    M5.Lcd.fillScreen(CLR_BG);
    M5.Lcd.setTextColor(CLR_ACCENT);
    M5.Lcd.setTextSize(2);
    M5.Lcd.setCursor(10, 60);
    M5.Lcd.println("Clawbie V2");
    M5.Lcd.setTextSize(1);
    M5.Lcd.setCursor(10, 90);
    M5.Lcd.println("Starting up...");

    // DHT22检测
    dht.begin();
    delay(500);
    float testTemp = dht.readTemperature();
    dhtAvailable = !isnan(testTemp);

    M5.Lcd.setCursor(10, 110);
    M5.Lcd.printf("DHT22: %s", dhtAvailable ? "OK" : "N/A (using IMU)");

    // WiFi
    M5.Lcd.setCursor(10, 130);
    M5.Lcd.print("WiFi...");
    connectWiFi();
    M5.Lcd.printf(" %s", wifiConnected ? "OK" : "Skip");

    // MQTT
    mqtt.setServer(MQTT_SERVER, MQTT_PORT);
    mqtt.setCallback(mqttCallback);
    if (wifiConnected) reconnectMqtt();

    // IMU
    M5.Imu.begin();

    // 初始传感器读取
    readSensors();

    delay(800);
    beepDouble();
    renderPage();
}

// ========== LOOP ==========
void loop() {
    M5.update();
    unsigned long now = millis();

    // 按钮A — 切换页面
    if (M5.BtnA.wasPressed()) {
        currentPage = (Page)((currentPage + 1) % PAGE_COUNT);
        beepShort();
        renderPage();
    }

    // 按钮B — 在表情页切换表情，其他页面无操作
    if (M5.BtnB.wasPressed()) {
        if (currentPage == PAGE_FACE) {
            currentFace = (Face)((currentFace + 1) % FACE_COUNT);
            beepShort();
            renderPage();
        }
    }

    // 摇晃检测 — 随机换表情
    if (now - lastShakeTime > 500) {
        if (detectShake()) {
            lastShakeTime = now;
            currentFace = (Face)(random(FACE_COUNT));
            currentPage = PAGE_FACE;
            beepDouble();
            renderPage();
        }
    }

    // 传感器定期读取 (5秒)
    if (now - lastSensorRead > 5000) {
        lastSensorRead = now;
        readSensors();
        // 温度页面自动刷新
        if (currentPage == PAGE_TEMP) renderPage();
    }

    // 时钟页面每秒刷新
    if (currentPage == PAGE_CLOCK && now % 1000 < 50) {
        renderPage();
    }

    // MQTT
    if (wifiConnected) {
        if (!mqtt.connected()) reconnectMqtt();
        mqtt.loop();

        // 每30秒发布状态
        if (now - lastMqttPublish > 30000) {
            lastMqttPublish = now;
            publishStatus();
        }
    }

    delay(20);
}
