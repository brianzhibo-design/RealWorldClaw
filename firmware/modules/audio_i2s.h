#pragma once
// RWC Audio Module - I2S Driver (INMP441 + MAX98357A)
// Part of RealWorldClaw firmware

#include <Arduino.h>
#include <driver/i2s.h>

// Default I2S pins (mapped to RWC Bus)
#define AUDIO_I2S_BCK   GPIO_NUM_4   // SDA bus pin → I2S_BCK
#define AUDIO_I2S_WS    GPIO_NUM_5   // GP_A (TX-MOSI) → I2S_WS
#define AUDIO_I2S_SD    GPIO_NUM_6   // GP_B (RX-MISO) → I2S_SD

// I2S port assignments
#define I2S_PORT_SPK    I2S_NUM_0
#define I2S_PORT_MIC    I2S_NUM_1

// Audio config
#define AUDIO_SAMPLE_RATE_REC   16000   // Recording: 16kHz
#define AUDIO_SAMPLE_RATE_PLAY  44100   // Playback: 44.1kHz
#define AUDIO_BITS              16
#define AUDIO_DMA_BUF_COUNT     4
#define AUDIO_DMA_BUF_LEN       512

// WAV header
struct WavHeader {
    char     riff[4];       // "RIFF"
    uint32_t file_size;
    char     wave[4];       // "WAVE"
    char     fmt[4];        // "fmt "
    uint32_t fmt_size;      // 16
    uint16_t audio_fmt;     // 1 = PCM
    uint16_t channels;
    uint32_t sample_rate;
    uint32_t byte_rate;
    uint16_t block_align;
    uint16_t bits_per_sample;
    char     data[4];       // "data"
    uint32_t data_size;
};

class AudioI2S {
public:
    bool begin(gpio_num_t bck = AUDIO_I2S_BCK,
               gpio_num_t ws  = AUDIO_I2S_WS,
               gpio_num_t sd  = AUDIO_I2S_SD);
    void end();
    
    // Playback
    bool playWav(const uint8_t *data, size_t len);
    bool playTone(uint16_t freq_hz, uint16_t duration_ms, uint8_t volume = 128);
    void stopPlayback();
    bool isPlaying() const { return _playing; }
    
    // Recording
    bool startRecording(uint8_t *buffer, size_t max_len);
    size_t stopRecording();  // returns bytes recorded
    bool isRecording() const { return _recording; }
    
    // Volume (0-255)
    void setVolume(uint8_t vol) { _volume = vol; }
    uint8_t getVolume() const { return _volume; }
    
    // Utility
    static bool isValidWav(const uint8_t *data, size_t len);
    static WavHeader createWavHeader(uint32_t sample_rate, uint16_t bits,
                                      uint16_t channels, uint32_t data_size);

private:
    gpio_num_t _bck, _ws, _sd;
    uint8_t _volume = 200;
    volatile bool _playing = false;
    volatile bool _recording = false;
    uint8_t *_rec_buffer = nullptr;
    size_t _rec_max = 0;
    size_t _rec_pos = 0;
    
    bool initSpeaker(uint32_t sample_rate);
    bool initMic();
    void deinitI2S(i2s_port_t port);
    void applyVolume(int16_t *samples, size_t count);
};
