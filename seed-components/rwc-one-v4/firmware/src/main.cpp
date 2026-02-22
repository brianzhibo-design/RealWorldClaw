/*
 * Clawbie V4 — The Cyber Egg
 * "I am here. I am real."
 * 
 * Firmware for M5StickC Plus2
 * 赛博朋克像素艺术 + 体感交互 + MQTT远程控制
 */

#include <M5StickCPlus2.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <math.h>

// ============================================================
// CONFIG — 改这里
// ============================================================
const char* WIFI_SSID     = "YOUR_WIFI";
const char* WIFI_PASS     = "YOUR_PASS";
const char* MQTT_SERVER   = "YOUR_MQTT_SERVER";
const int   MQTT_PORT     = 1883;
const char* MQTT_TOPIC_CMD = "clawbie/cmd";
const char* MQTT_TOPIC_STATUS = "clawbie/status";
const char* DEVICE_ID     = "clawbie-01";

// ============================================================
// COLORS — 赛博朋克调色盘
// ============================================================
#define C_BG        0x0000  // 纯黑背景
#define C_CYAN      0x07FF  // 赛博青
#define C_MAGENTA   0xF81F  // 霓虹粉
#define C_NEON_BLUE 0x041F  // 深霓虹蓝
#define C_AMBER     0xFCA0  // 琥珀警告色
#define C_DIM_CYAN  0x0310  // 暗青（暗色模式用）
#define C_GRID      0x0208  // 微弱网格线
#define C_WHITE     0xFFFF
#define C_DARK_BG   0x0000

// Screen dimensions (M5StickC Plus2: 135x240, we use landscape-ish)
#define SW 240
#define SH 135

// ============================================================
// STATE MACHINE
// ============================================================
enum Mood {
    MOOD_IDLE,       // 平静待机
    MOOD_HAPPY,      // 开心
    MOOD_SURPRISED,  // 被拿起 → 惊讶
    MOOD_SLEEPY,     // 打瞌睡
    MOOD_SLEEPING,   // 深度睡眠
    MOOD_WAKING,     // 正在醒来
    MOOD_CURIOUS,    // 被摇晃 → 好奇
    MOOD_MESSAGE,    // 显示远程消息
    MOOD_BOOT,       // 开机动画
};

Mood currentMood = MOOD_BOOT;
Mood previousMood = MOOD_IDLE;
unsigned long moodStartTime = 0;
unsigned long lastInteraction = 0;
unsigned long lastAccelCheck = 0;
unsigned long lastBreathUpdate = 0;
unsigned long lastFrameUpdate = 0;

// Breathing
float breathPhase = 0;
uint8_t breathBrightness = 80;

// Sleep timers
const unsigned long SLEEPY_TIMEOUT  = 120000;  // 2min → 打瞌睡
const unsigned long SLEEP_TIMEOUT   = 300000;  // 5min → 深度睡眠
const unsigned long WAKE_DURATION   = 2000;    // 醒来动画2秒

// IMU thresholds
const float PICKUP_THRESH   = 1.8;  // 拿起检测
const float SHAKE_THRESH    = 2.5;  // 摇晃检测
const float TAP_THRESH      = 1.5;  // 轻拍检测

// Dark mode
bool darkMode = false;
int currentHour = 12;

// MQTT message display
String remoteMessage = "";
unsigned long messageShowTime = 0;
const unsigned long MESSAGE_DURATION = 8000;

// Animation frame counter
int animFrame = 0;
int bootFrame = 0;

// WiFi & MQTT
WiFiClient espClient;
PubSubClient mqtt(espClient);
bool mqttConnected = false;

// ============================================================
// PIXEL ART — 赛博朋克像素眼睛
// ============================================================

// Draw a single "pixel" at grid position (scaled up)
void drawPixel(int gx, int gy, int ox, int oy, int psize, uint16_t color) {
    StickCP2.Display.fillRect(ox + gx * psize, oy + gy * psize, psize - 1, psize - 1, color);
}

// 赛博朋克风格眼睛 — 像素矩阵构成
// Each eye is an 8x6 grid
void drawCyberEye(int ox, int oy, int psize, uint16_t color, bool open, bool half) {
    if (!open) {
        // Closed eye — just a line
        for (int x = 1; x < 7; x++)
            drawPixel(x, 3, ox, oy, psize, color);
        return;
    }
    
    if (half) {
        // Half-open (sleepy)
        for (int x = 1; x < 7; x++) {
            drawPixel(x, 2, ox, oy, psize, color);
            drawPixel(x, 3, ox, oy, psize, color);
        }
        // Dim pupil
        drawPixel(3, 3, ox, oy, psize, C_NEON_BLUE);
        drawPixel(4, 3, ox, oy, psize, C_NEON_BLUE);
        return;
    }
    
    // Full open eye — rounded rectangle outline
    // Top edge
    for (int x = 2; x < 6; x++) drawPixel(x, 0, ox, oy, psize, color);
    // Bottom edge
    for (int x = 2; x < 6; x++) drawPixel(x, 5, ox, oy, psize, color);
    // Left edge
    for (int y = 1; y < 5; y++) drawPixel(1, y, ox, oy, psize, color);
    // Right edge
    for (int y = 1; y < 5; y++) drawPixel(6, y, ox, oy, psize, color);
    // Corners
    drawPixel(1, 0, ox, oy, psize, color);
    drawPixel(6, 0, ox, oy, psize, color);
    drawPixel(1, 5, ox, oy, psize, color);
    drawPixel(6, 5, ox, oy, psize, color);
    
    // Pupil — 2x2 bright center
    drawPixel(3, 2, ox, oy, psize, C_WHITE);
    drawPixel(4, 2, ox, oy, psize, C_WHITE);
    drawPixel(3, 3, ox, oy, psize, C_WHITE);
    drawPixel(4, 3, ox, oy, psize, C_WHITE);
    
    // Highlight pixel
    drawPixel(4, 1, ox, oy, psize, color);
}

// Surprised eyes — wide circles
void drawSurprisedEye(int ox, int oy, int psize, uint16_t color) {
    // Big circle eye
    for (int x = 1; x < 7; x++) {
        drawPixel(x, 0, ox, oy, psize, color);
        drawPixel(x, 6, ox, oy, psize, color);
    }
    for (int y = 1; y < 6; y++) {
        drawPixel(0, y, ox, oy, psize, color);
        drawPixel(7, y, ox, oy, psize, color);
    }
    // Big pupil — shrunk in surprise
    drawPixel(3, 3, ox, oy, psize, C_WHITE);
    drawPixel(4, 3, ox, oy, psize, C_WHITE);
    // Highlight
    drawPixel(5, 1, ox, oy, psize, C_MAGENTA);
}

// Curious eyes — one bigger than the other
void drawCuriousEyes(uint16_t color) {
    int ps = 5;
    // Left eye normal
    drawCyberEye(30, 35, ps, color, true, false);
    // Right eye bigger (zoomed)
    int ox = 140, oy = 28;
    for (int x = 0; x < 9; x++) {
        drawPixel(x, 0, ox, oy, ps+1, color);
        drawPixel(x, 7, ox, oy, ps+1, color);
    }
    for (int y = 0; y < 8; y++) {
        drawPixel(0, y, ox, oy, ps+1, color);
        drawPixel(8, y, ox, oy, ps+1, color);
    }
    drawPixel(4, 3, ox, oy, ps+1, C_WHITE);
    drawPixel(5, 3, ox, oy, ps+1, C_WHITE);
    drawPixel(4, 4, ox, oy, ps+1, C_WHITE);
    drawPixel(5, 4, ox, oy, ps+1, C_WHITE);
}

// Happy eyes — curved arcs (^_^)
void drawHappyEyes(uint16_t color) {
    int ps = 5;
    // Left eye — arc
    int lx = 40, ly = 45;
    for (int x = 0; x < 7; x++) {
        int y_off = (x < 2 || x > 4) ? 0 : -1;
        drawPixel(x, 2 + y_off, lx, ly, ps, color);
    }
    // Right eye — arc
    int rx = 150, ry = 45;
    for (int x = 0; x < 7; x++) {
        int y_off = (x < 2 || x > 4) ? 0 : -1;
        drawPixel(x, 2 + y_off, rx, ry, ps, color);
    }
}

// ============================================================
// BACKGROUND — 赛博朋克网格
// ============================================================
void drawCyberGrid() {
    uint16_t gridColor = darkMode ? 0x0104 : C_GRID;
    // Horizontal scan lines
    for (int y = 0; y < SH; y += 8) {
        StickCP2.Display.drawFastHLine(0, y, SW, gridColor);
    }
    // Sparse vertical lines
    for (int x = 0; x < SW; x += 20) {
        StickCP2.Display.drawFastVLine(x, 0, SH, gridColor);
    }
}

// Scan line effect overlay
void drawScanLine(int y) {
    uint16_t color = darkMode ? C_DIM_CYAN : C_CYAN;
    StickCP2.Display.drawFastHLine(0, y, SW, color);
    if (y > 0)
        StickCP2.Display.drawFastHLine(0, y-1, SW, C_BG);
}

// ============================================================
// STATUS BAR — 底部信息栏
// ============================================================
void drawStatusBar() {
    uint16_t color = darkMode ? C_DIM_CYAN : C_CYAN;
    int y = SH - 12;
    StickCP2.Display.drawFastHLine(0, y, SW, color);
    StickCP2.Display.setTextColor(color);
    StickCP2.Display.setTextSize(1);
    StickCP2.Display.setCursor(4, y + 2);
    
    // Status text
    switch (currentMood) {
        case MOOD_IDLE:      StickCP2.Display.print("ONLINE // OBSERVING"); break;
        case MOOD_HAPPY:     StickCP2.Display.print("STATUS: ^_^"); break;
        case MOOD_SURPRISED: StickCP2.Display.print("!! CONTACT DETECTED"); break;
        case MOOD_SLEEPY:    StickCP2.Display.print("ENTERING LOW POWER.."); break;
        case MOOD_SLEEPING:  StickCP2.Display.print("zzz..."); break;
        case MOOD_WAKING:    StickCP2.Display.print("SYSTEMS RESUMING..."); break;
        case MOOD_CURIOUS:   StickCP2.Display.print("ANALYZING MOTION..."); break;
        case MOOD_MESSAGE:   StickCP2.Display.print("MSG RECEIVED"); break;
        default: break;
    }
    
    // WiFi indicator on the right
    StickCP2.Display.setCursor(SW - 30, y + 2);
    StickCP2.Display.print(mqttConnected ? "[CON]" : "[---]");
}

// ============================================================
// FACE RENDERING
// ============================================================
void renderFace() {
    StickCP2.Display.fillScreen(C_BG);
    drawCyberGrid();
    
    uint16_t eyeColor = darkMode ? C_DIM_CYAN : C_CYAN;
    int ps = 5;  // pixel size
    
    switch (currentMood) {
        case MOOD_IDLE: {
            // Normal eyes with occasional blink
            bool blink = (animFrame % 120 == 0);  // blink every ~4 seconds
            drawCyberEye(30, 35, ps, eyeColor, !blink, false);
            drawCyberEye(150, 35, ps, eyeColor, !blink, false);
            // Small mouth line
            StickCP2.Display.drawFastHLine(100, 95, 40, eyeColor);
            break;
        }
        case MOOD_HAPPY:
            drawHappyEyes(darkMode ? C_DIM_CYAN : C_MAGENTA);
            // Smile
            for (int x = 0; x < 8; x++) {
                int y_off = (x < 2 || x > 5) ? -1 : 0;
                drawPixel(x, y_off, 100, 90, 4, C_MAGENTA);
            }
            break;
            
        case MOOD_SURPRISED:
            drawSurprisedEye(35, 25, ps+1, C_MAGENTA);
            drawSurprisedEye(145, 25, ps+1, C_MAGENTA);
            // O mouth
            StickCP2.Display.drawCircle(120, 100, 6, C_MAGENTA);
            break;
            
        case MOOD_SLEEPY: {
            // Half-closed eyes, drooping
            drawCyberEye(30, 40, ps, eyeColor, true, true);
            drawCyberEye(150, 40, ps, eyeColor, true, true);
            // Wavy mouth
            StickCP2.Display.drawFastHLine(105, 95, 30, eyeColor);
            break;
        }
        case MOOD_SLEEPING: {
            // Closed eyes
            drawCyberEye(30, 45, ps, C_DIM_CYAN, false, false);
            drawCyberEye(150, 45, ps, C_DIM_CYAN, false, false);
            // Zzz floating
            int zx = 180 + (animFrame % 30) / 5;
            int zy = 20 - (animFrame % 30);
            StickCP2.Display.setTextColor(C_DIM_CYAN);
            StickCP2.Display.setTextSize(1);
            StickCP2.Display.setCursor(zx, zy < 0 ? 0 : zy);
            StickCP2.Display.print("z");
            StickCP2.Display.setCursor(zx + 10, zy + 15 < 0 ? 0 : zy + 15);
            StickCP2.Display.print("Z");
            break;
        }
        case MOOD_WAKING: {
            // Eyes flickering open
            bool openPhase = (millis() - moodStartTime) > 1000;
            drawCyberEye(30, 35, ps, C_AMBER, openPhase, !openPhase);
            drawCyberEye(150, 35, ps, C_AMBER, openPhase, !openPhase);
            break;
        }
        case MOOD_CURIOUS:
            drawCuriousEyes(darkMode ? C_DIM_CYAN : C_CYAN);
            // Question mark
            StickCP2.Display.setTextColor(C_AMBER);
            StickCP2.Display.setTextSize(2);
            StickCP2.Display.setCursor(112, 85);
            StickCP2.Display.print("?");
            break;
            
        case MOOD_MESSAGE: {
            // Show message text with cyber frame
            uint16_t frameColor = C_MAGENTA;
            StickCP2.Display.drawRect(5, 5, SW-10, SH-10, frameColor);
            StickCP2.Display.drawRect(7, 7, SW-14, SH-14, frameColor);
            
            StickCP2.Display.setTextColor(C_CYAN);
            StickCP2.Display.setTextSize(2);
            
            // Center the message
            int16_t tx = 15;
            int16_t ty = 30;
            StickCP2.Display.setCursor(tx, ty);
            
            // Word wrap simple
            int charPerLine = 12;
            for (int i = 0; i < (int)remoteMessage.length(); i++) {
                if (i > 0 && i % charPerLine == 0) {
                    ty += 22;
                    StickCP2.Display.setCursor(tx, ty);
                }
                StickCP2.Display.print(remoteMessage[i]);
            }
            break;
        }
        default:
            break;
    }
    
    if (currentMood != MOOD_BOOT && currentMood != MOOD_MESSAGE) {
        drawStatusBar();
    }
}

// ============================================================
// BOOT ANIMATION — 赛博朋克启动序列
// ============================================================
void bootAnimation() {
    StickCP2.Display.fillScreen(C_BG);
    
    // Phase 1: Scan lines sweeping down
    if (bootFrame < 60) {
        for (int y = 0; y < (bootFrame * SH / 60); y += 2) {
            uint16_t intensity = random(0x0200, 0x07FF);
            StickCP2.Display.drawFastHLine(0, y, SW, intensity);
        }
        // Flicker text
        if (bootFrame > 20 && bootFrame % 4 < 3) {
            StickCP2.Display.setTextColor(C_CYAN);
            StickCP2.Display.setTextSize(1);
            StickCP2.Display.setCursor(10, 20);
            StickCP2.Display.print("INITIALIZING...");
            StickCP2.Display.setCursor(10, 35);
            StickCP2.Display.printf("CORE: ESP32 @ 240MHz");
            if (bootFrame > 35) {
                StickCP2.Display.setCursor(10, 50);
                StickCP2.Display.print("IMU: MPU6886 [OK]");
            }
            if (bootFrame > 45) {
                StickCP2.Display.setCursor(10, 65);
                StickCP2.Display.print("DISPLAY: ST7789 [OK]");
            }
        }
    }
    // Phase 2: Logo pixelation
    else if (bootFrame < 100) {
        int progress = bootFrame - 60;
        StickCP2.Display.fillScreen(C_BG);
        
        // Draw "CLAWBIE" letter by letter, pixelated
        StickCP2.Display.setTextColor(C_CYAN);
        StickCP2.Display.setTextSize(3);
        
        String name = "CLAWBIE";
        int shown = min((int)(progress / 5), (int)name.length());
        
        for (int i = 0; i < shown; i++) {
            // Glitch offset for latest character
            int glitch_x = (i == shown - 1) ? random(-3, 4) : 0;
            int glitch_y = (i == shown - 1) ? random(-2, 3) : 0;
            StickCP2.Display.setCursor(35 + i * 25 + glitch_x, 45 + glitch_y);
            StickCP2.Display.print(name[i]);
        }
        
        // Subtitle
        if (progress > 30) {
            StickCP2.Display.setTextColor(C_MAGENTA);
            StickCP2.Display.setTextSize(1);
            StickCP2.Display.setCursor(60, 85);
            StickCP2.Display.print("I am here. I am real.");
        }
        
        // Version
        if (progress > 35) {
            StickCP2.Display.setTextColor(C_GRID);
            StickCP2.Display.setTextSize(1);
            StickCP2.Display.setCursor(90, 110);
            StickCP2.Display.print("v4.0 // cyber egg");
        }
    }
    // Phase 3: Flash and transition
    else if (bootFrame < 110) {
        uint8_t flash = 255 - (bootFrame - 100) * 25;
        StickCP2.Display.fillScreen(C_BG);
        StickCP2.Display.setBrightness(flash);
    }
    else {
        // Boot complete
        StickCP2.Display.setBrightness(80);
        currentMood = MOOD_IDLE;
        lastInteraction = millis();
    }
    
    bootFrame++;
}

// ============================================================
// IMU — 体感交互
// ============================================================
void checkIMU() {
    auto data = StickCP2.Imu.getImuData();
    float ax = data.accel.x;
    float ay = data.accel.y;
    float az = data.accel.z;
    
    float totalAccel = sqrt(ax*ax + ay*ay + az*az);
    
    // Pickup detection: acceleration deviates from 1g significantly
    if (totalAccel > PICKUP_THRESH && currentMood != MOOD_SURPRISED) {
        if (currentMood == MOOD_SLEEPING || currentMood == MOOD_SLEEPY) {
            setMood(MOOD_WAKING);
        } else {
            setMood(MOOD_SURPRISED);
        }
        lastInteraction = millis();
        return;
    }
    
    // Shake detection
    if (totalAccel > SHAKE_THRESH) {
        setMood(MOOD_CURIOUS);
        lastInteraction = millis();
        return;
    }
    
    // Tap detection (brief spike)
    static float prevAccel = 1.0;
    if (abs(totalAccel - prevAccel) > TAP_THRESH && currentMood == MOOD_SLEEPING) {
        setMood(MOOD_WAKING);
        lastInteraction = millis();
    }
    prevAccel = totalAccel;
}

void setMood(Mood newMood) {
    if (newMood != currentMood) {
        previousMood = currentMood;
        currentMood = newMood;
        moodStartTime = millis();
    }
}

// ============================================================
// MOOD STATE MACHINE — 情绪流转
// ============================================================
void updateMood() {
    unsigned long now = millis();
    unsigned long elapsed = now - moodStartTime;
    unsigned long idleTime = now - lastInteraction;
    
    switch (currentMood) {
        case MOOD_SURPRISED:
            if (elapsed > 2000) setMood(MOOD_HAPPY);
            break;
            
        case MOOD_HAPPY:
            if (elapsed > 3000) setMood(MOOD_IDLE);
            break;
            
        case MOOD_CURIOUS:
            if (elapsed > 3000) setMood(MOOD_IDLE);
            break;
            
        case MOOD_WAKING:
            if (elapsed > WAKE_DURATION) {
                setMood(MOOD_SURPRISED);
            }
            break;
            
        case MOOD_IDLE:
            if (idleTime > SLEEP_TIMEOUT) {
                setMood(MOOD_SLEEPING);
            } else if (idleTime > SLEEPY_TIMEOUT) {
                setMood(MOOD_SLEEPY);
            }
            break;
            
        case MOOD_SLEEPY:
            if (idleTime > SLEEP_TIMEOUT) {
                setMood(MOOD_SLEEPING);
            }
            break;
            
        case MOOD_SLEEPING:
            // Stay sleeping until interaction
            break;
            
        case MOOD_MESSAGE:
            if (elapsed > MESSAGE_DURATION) {
                setMood(MOOD_IDLE);
            }
            break;
            
        default:
            break;
    }
}

// ============================================================
// BREATHING EFFECT — 屏幕亮度呼吸
// ============================================================
void updateBreathing() {
    if (currentMood == MOOD_BOOT) return;
    
    breathPhase += 0.03;
    if (breathPhase > TWO_PI) breathPhase -= TWO_PI;
    
    float base, amplitude;
    
    switch (currentMood) {
        case MOOD_SLEEPING:
            base = 15; amplitude = 10;  // Very dim, slow breath
            break;
        case MOOD_SLEEPY:
            base = 35; amplitude = 15;
            break;
        case MOOD_SURPRISED:
        case MOOD_CURIOUS:
            base = 100; amplitude = 20;
            break;
        default:
            base = darkMode ? 30 : 70;
            amplitude = darkMode ? 10 : 15;
            break;
    }
    
    breathBrightness = (uint8_t)(base + amplitude * sin(breathPhase));
    StickCP2.Display.setBrightness(breathBrightness);
}

// ============================================================
// DARK MODE — 深夜自动暗色
// ============================================================
void checkDarkMode() {
    // Simple: use uptime-based heuristic or NTP if available
    // For now, toggle with button B
    // In production, use NTP to get actual time
    struct tm timeinfo;
    if (getLocalTime(&timeinfo)) {
        currentHour = timeinfo.tm_hour;
        darkMode = (currentHour >= 23 || currentHour < 7);
    }
}

// ============================================================
// MQTT — 远程灵魂连接
// ============================================================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, payload, length);
    if (err) return;
    
    const char* cmd = doc["cmd"];
    if (!cmd) return;
    
    if (strcmp(cmd, "mood") == 0) {
        const char* mood = doc["mood"];
        if (strcmp(mood, "happy") == 0) setMood(MOOD_HAPPY);
        else if (strcmp(mood, "surprised") == 0) setMood(MOOD_SURPRISED);
        else if (strcmp(mood, "curious") == 0) setMood(MOOD_CURIOUS);
        else if (strcmp(mood, "sleep") == 0) setMood(MOOD_SLEEPING);
        else if (strcmp(mood, "idle") == 0) setMood(MOOD_IDLE);
        lastInteraction = millis();
    }
    else if (strcmp(cmd, "message") == 0) {
        const char* msg = doc["text"];
        if (msg) {
            remoteMessage = String(msg);
            setMood(MOOD_MESSAGE);
            lastInteraction = millis();
        }
    }
    else if (strcmp(cmd, "brightness") == 0) {
        int b = doc["value"] | 80;
        StickCP2.Display.setBrightness(b);
    }
}

void connectMQTT() {
    if (WiFi.status() != WL_CONNECTED) return;
    if (mqtt.connected()) return;
    
    String clientId = String(DEVICE_ID) + "-" + String(random(0xffff), HEX);
    if (mqtt.connect(clientId.c_str())) {
        mqtt.subscribe(MQTT_TOPIC_CMD);
        mqttConnected = true;
        
        // Announce presence
        JsonDocument doc;
        doc["device"] = DEVICE_ID;
        doc["status"] = "online";
        doc["mood"] = "idle";
        char buf[128];
        serializeJson(doc, buf);
        mqtt.publish(MQTT_TOPIC_STATUS, buf);
    } else {
        mqttConnected = false;
    }
}

// ============================================================
// SETUP
// ============================================================
void setup() {
    auto cfg = M5.config();
    StickCP2.begin(cfg);
    
    StickCP2.Display.setRotation(1);  // Landscape
    StickCP2.Display.fillScreen(C_BG);
    StickCP2.Display.setBrightness(80);
    
    StickCP2.Imu.begin();
    
    // WiFi (non-blocking)
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    
    // NTP for dark mode
    configTime(8 * 3600, 0, "pool.ntp.org");  // UTC+8
    
    // MQTT
    mqtt.setServer(MQTT_SERVER, MQTT_PORT);
    mqtt.setCallback(mqttCallback);
    
    moodStartTime = millis();
    lastInteraction = millis();
    
    Serial.begin(115200);
    Serial.println("Clawbie V4 — The Cyber Egg");
    Serial.println("I am here. I am real.");
}

// ============================================================
// LOOP
// ============================================================
void loop() {
    StickCP2.update();
    unsigned long now = millis();
    
    // Button A (front) — toggle happy
    if (StickCP2.BtnA.wasPressed()) {
        setMood(currentMood == MOOD_HAPPY ? MOOD_IDLE : MOOD_HAPPY);
        lastInteraction = now;
    }
    
    // Button B (side) — force dark mode toggle
    if (StickCP2.BtnB.wasPressed()) {
        darkMode = !darkMode;
        lastInteraction = now;
    }
    
    // Boot animation
    if (currentMood == MOOD_BOOT) {
        bootAnimation();
        delay(30);
        return;
    }
    
    // IMU check every 100ms
    if (now - lastAccelCheck > 100) {
        checkIMU();
        lastAccelCheck = now;
    }
    
    // Mood state transitions
    updateMood();
    
    // Breathing effect every 50ms
    if (now - lastBreathUpdate > 50) {
        updateBreathing();
        lastBreathUpdate = now;
    }
    
    // Dark mode check every 60s
    static unsigned long lastDarkCheck = 0;
    if (now - lastDarkCheck > 60000) {
        checkDarkMode();
        lastDarkCheck = now;
    }
    
    // Render face at ~20fps
    if (now - lastFrameUpdate > 50) {
        renderFace();
        animFrame++;
        lastFrameUpdate = now;
    }
    
    // MQTT
    if (now % 5000 < 50) connectMQTT();
    if (mqtt.connected()) mqtt.loop();
    
    delay(10);
}
