/**
 * Audio System - I2S output
 *
 * Uses ESP32 I2S peripheral for audio output to an external DAC/amplifier.
 * Generates simple tones procedurally for boot/notification sounds.
 * Provides a PCM playback interface for TTS audio from the cloud.
 */

#include "audio.h"
#include <driver/i2s.h>
#include <math.h>

static const i2s_port_t I2S_PORT = I2S_NUM_0;
static const uint32_t SAMPLE_RATE = 16000;
static uint8_t volume = 80; // 0-100
static bool playing = false;

namespace Audio {

void init() {
    i2s_config_t config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = 256,
        .use_apll = false,
        .tx_desc_auto_clear = true,
        .fixed_mclk = 0,
    };

    i2s_pin_config_t pins = {
        .bck_io_num = I2S_BCLK,
        .ws_io_num = I2S_LRCK,
        .data_out_num = I2S_DOUT,
        .data_in_num = I2S_DIN,
    };

    i2s_driver_install(I2S_PORT, &config, 0, nullptr);
    i2s_set_pin(I2S_PORT, &pins);
    i2s_zero_dma_buffer(I2S_PORT);

    Serial.println("[Audio] I2S initialized");
}

void playTone(uint16_t freqHz, uint16_t durationMs) {
    playing = true;
    uint32_t totalSamples = (SAMPLE_RATE * durationMs) / 1000;
    float volScale = volume / 100.0f;
    int16_t buf[256];
    uint32_t samplesWritten = 0;

    while (samplesWritten < totalSamples) {
        uint32_t chunk = min((uint32_t)256, totalSamples - samplesWritten);
        for (uint32_t i = 0; i < chunk; i++) {
            float t = (float)(samplesWritten + i) / SAMPLE_RATE;
            // Sine wave with envelope (fade in/out)
            float env = 1.0f;
            float progress = (float)(samplesWritten + i) / totalSamples;
            if (progress < 0.05f) env = progress / 0.05f;       // fade in
            if (progress > 0.9f) env = (1.0f - progress) / 0.1f; // fade out

            float sample = sinf(2.0f * M_PI * freqHz * t) * env * volScale;
            buf[i] = (int16_t)(sample * 16000);
        }
        size_t written = 0;
        i2s_write(I2S_PORT, buf, chunk * sizeof(int16_t), &written, portMAX_DELAY);
        samplesWritten += chunk;
    }

    i2s_zero_dma_buffer(I2S_PORT);
    playing = false;
}

void playBootSound() {
    // Ascending three-note chime: C5 -> E5 -> G5
    playTone(523, 120);
    delay(30);
    playTone(659, 120);
    delay(30);
    playTone(784, 200);
}

void playConnectedSound() {
    // Two quick ascending notes
    playTone(880, 80);
    delay(20);
    playTone(1175, 150);
}

void playPCM(const uint8_t* data, size_t length) {
    if (!data || length == 0) return;
    playing = true;

    // Apply volume scaling to PCM data
    float volScale = volume / 100.0f;
    int16_t buf[256];
    const int16_t* pcm = (const int16_t*)data;
    size_t samples = length / 2;
    size_t offset = 0;

    while (offset < samples) {
        size_t chunk = min((size_t)256, samples - offset);
        for (size_t i = 0; i < chunk; i++) {
            buf[i] = (int16_t)(pcm[offset + i] * volScale);
        }
        size_t written = 0;
        i2s_write(I2S_PORT, buf, chunk * sizeof(int16_t), &written, portMAX_DELAY);
        offset += chunk;
    }

    playing = false;
}

void setVolume(uint8_t vol) {
    volume = min(vol, (uint8_t)100);
}

bool isPlaying() {
    return playing;
}

} // namespace Audio
