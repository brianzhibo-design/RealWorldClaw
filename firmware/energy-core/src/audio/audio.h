/**
 * Audio System - I2S output for sounds and TTS
 */

#pragma once
#include <Arduino.h>

namespace Audio {
    /// Initialize I2S audio output
    void init();

    /// Play the boot chime
    void playBootSound();

    /// Play the WiFi-connected success tone
    void playConnectedSound();

    /// Play a tone at given frequency and duration
    void playTone(uint16_t freqHz, uint16_t durationMs);

    /// Play raw PCM audio data (16-bit mono, 16kHz)
    /// This is the TTS interface - feed PCM data from network
    void playPCM(const uint8_t* data, size_t length);

    /// Set output volume (0-100)
    void setVolume(uint8_t vol);

    /// Check if audio is currently playing
    bool isPlaying();
}
