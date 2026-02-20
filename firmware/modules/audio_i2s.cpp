// RWC Audio Module - I2S Driver Implementation
#include "audio_i2s.h"
#include <string.h>
#include <math.h>

bool AudioI2S::begin(gpio_num_t bck, gpio_num_t ws, gpio_num_t sd) {
    _bck = bck; _ws = ws; _sd = sd;
    return true;  // Lazy init on first use
}

void AudioI2S::end() {
    stopPlayback();
    if (_recording) stopRecording();
    deinitI2S(I2S_PORT_SPK);
    deinitI2S(I2S_PORT_MIC);
}

bool AudioI2S::initSpeaker(uint32_t sample_rate) {
    i2s_config_t cfg = {};
    cfg.mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX);
    cfg.sample_rate = sample_rate;
    cfg.bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT;
    cfg.channel_format = I2S_CHANNEL_FMT_ONLY_LEFT;
    cfg.communication_format = I2S_COMM_FORMAT_STAND_I2S;
    cfg.dma_buf_count = AUDIO_DMA_BUF_COUNT;
    cfg.dma_buf_len = AUDIO_DMA_BUF_LEN;
    cfg.use_apll = false;
    cfg.intr_alloc_flags = ESP_INTR_FLAG_LEVEL1;
    
    if (i2s_driver_install(I2S_PORT_SPK, &cfg, 0, NULL) != ESP_OK)
        return false;
    
    i2s_pin_config_t pins = {};
    pins.bck_io_num = _bck;
    pins.ws_io_num = _ws;
    pins.data_out_num = _sd;
    pins.data_in_num = I2S_PIN_NO_CHANGE;
    
    return i2s_set_pin(I2S_PORT_SPK, &pins) == ESP_OK;
}

bool AudioI2S::initMic() {
    i2s_config_t cfg = {};
    cfg.mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX);
    cfg.sample_rate = AUDIO_SAMPLE_RATE_REC;
    cfg.bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT;
    cfg.channel_format = I2S_CHANNEL_FMT_ONLY_LEFT;
    cfg.communication_format = I2S_COMM_FORMAT_STAND_I2S;
    cfg.dma_buf_count = AUDIO_DMA_BUF_COUNT;
    cfg.dma_buf_len = AUDIO_DMA_BUF_LEN;
    cfg.use_apll = false;
    cfg.intr_alloc_flags = ESP_INTR_FLAG_LEVEL1;
    
    if (i2s_driver_install(I2S_PORT_MIC, &cfg, 0, NULL) != ESP_OK)
        return false;
    
    i2s_pin_config_t pins = {};
    pins.bck_io_num = _bck;
    pins.ws_io_num = _ws;
    pins.data_out_num = I2S_PIN_NO_CHANGE;
    pins.data_in_num = _sd;
    
    return i2s_set_pin(I2S_PORT_MIC, &pins) == ESP_OK;
}

void AudioI2S::deinitI2S(i2s_port_t port) {
    i2s_driver_uninstall(port);
}

void AudioI2S::applyVolume(int16_t *samples, size_t count) {
    for (size_t i = 0; i < count; i++) {
        samples[i] = (int16_t)(((int32_t)samples[i] * _volume) >> 8);
    }
}

// ─── Playback ───────────────────────────────────────

bool AudioI2S::playWav(const uint8_t *data, size_t len) {
    if (!isValidWav(data, len)) return false;
    
    const WavHeader *hdr = (const WavHeader *)data;
    const uint8_t *pcm = data + sizeof(WavHeader);
    size_t pcm_len = hdr->data_size;
    
    if (!initSpeaker(hdr->sample_rate)) return false;
    _playing = true;
    
    size_t offset = 0;
    int16_t chunk[AUDIO_DMA_BUF_LEN];
    
    while (offset < pcm_len && _playing) {
        size_t to_write = min((size_t)(AUDIO_DMA_BUF_LEN * 2), pcm_len - offset);
        size_t samples = to_write / 2;
        
        memcpy(chunk, pcm + offset, to_write);
        applyVolume(chunk, samples);
        
        size_t written = 0;
        i2s_write(I2S_PORT_SPK, chunk, to_write, &written, portMAX_DELAY);
        offset += written;
    }
    
    _playing = false;
    deinitI2S(I2S_PORT_SPK);
    return true;
}

bool AudioI2S::playTone(uint16_t freq_hz, uint16_t duration_ms, uint8_t volume) {
    if (!initSpeaker(AUDIO_SAMPLE_RATE_PLAY)) return false;
    _playing = true;
    
    uint32_t total_samples = (uint32_t)AUDIO_SAMPLE_RATE_PLAY * duration_ms / 1000;
    int16_t buf[AUDIO_DMA_BUF_LEN];
    uint32_t sample = 0;
    
    while (sample < total_samples && _playing) {
        size_t chunk = min((uint32_t)AUDIO_DMA_BUF_LEN, total_samples - sample);
        for (size_t i = 0; i < chunk; i++) {
            float t = (float)(sample + i) / AUDIO_SAMPLE_RATE_PLAY;
            buf[i] = (int16_t)(volume * 128.0f * sinf(2.0f * M_PI * freq_hz * t));
        }
        size_t written = 0;
        i2s_write(I2S_PORT_SPK, buf, chunk * 2, &written, portMAX_DELAY);
        sample += written / 2;
    }
    
    _playing = false;
    deinitI2S(I2S_PORT_SPK);
    return true;
}

void AudioI2S::stopPlayback() {
    _playing = false;
}

// ─── Recording ──────────────────────────────────────

bool AudioI2S::startRecording(uint8_t *buffer, size_t max_len) {
    if (_recording) return false;
    
    // Write WAV header placeholder
    if (max_len < sizeof(WavHeader)) return false;
    _rec_buffer = buffer;
    _rec_max = max_len;
    _rec_pos = sizeof(WavHeader);
    
    if (!initMic()) return false;
    _recording = true;
    
    // Recording loop runs in caller's task/thread
    // Call stopRecording() to finalize
    int16_t chunk[AUDIO_DMA_BUF_LEN];
    while (_recording && _rec_pos < _rec_max) {
        size_t bytes_read = 0;
        size_t to_read = min((size_t)(AUDIO_DMA_BUF_LEN * 2), _rec_max - _rec_pos);
        
        i2s_read(I2S_PORT_MIC, chunk, to_read, &bytes_read, portMAX_DELAY);
        if (bytes_read > 0) {
            memcpy(_rec_buffer + _rec_pos, chunk, bytes_read);
            _rec_pos += bytes_read;
        }
    }
    
    return true;
}

size_t AudioI2S::stopRecording() {
    _recording = false;
    deinitI2S(I2S_PORT_MIC);
    
    if (_rec_buffer && _rec_pos > sizeof(WavHeader)) {
        uint32_t data_size = _rec_pos - sizeof(WavHeader);
        WavHeader hdr = createWavHeader(AUDIO_SAMPLE_RATE_REC, AUDIO_BITS, 1, data_size);
        memcpy(_rec_buffer, &hdr, sizeof(WavHeader));
    }
    
    return _rec_pos;
}

// ─── Utility ────────────────────────────────────────

bool AudioI2S::isValidWav(const uint8_t *data, size_t len) {
    if (len < sizeof(WavHeader)) return false;
    return memcmp(data, "RIFF", 4) == 0 && memcmp(data + 8, "WAVE", 4) == 0;
}

WavHeader AudioI2S::createWavHeader(uint32_t sample_rate, uint16_t bits,
                                     uint16_t channels, uint32_t data_size) {
    WavHeader h = {};
    memcpy(h.riff, "RIFF", 4);
    h.file_size = data_size + sizeof(WavHeader) - 8;
    memcpy(h.wave, "WAVE", 4);
    memcpy(h.fmt, "fmt ", 4);
    h.fmt_size = 16;
    h.audio_fmt = 1;  // PCM
    h.channels = channels;
    h.sample_rate = sample_rate;
    h.bits_per_sample = bits;
    h.block_align = channels * bits / 8;
    h.byte_rate = sample_rate * h.block_align;
    memcpy(h.data, "data", 4);
    h.data_size = data_size;
    return h;
}
