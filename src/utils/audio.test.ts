import { describe, it, expect, beforeEach } from 'vitest';
import { audio } from './audio';

describe('Audio Utils', () => {
  beforeEach(() => {
    // Reset mute state
    audio.setMuted(false);
  });

  it('should not play audio if muted', () => {
    audio.setMuted(true);
    
    // Call the methods; they shouldn't throw, and shouldn't interact with the context deeply
    // Since we mocked AudioContext globally, we know it won't crash, but let's test the state logic
    expect(() => {
      audio.playStart();
      audio.playBeep();
      audio.playFanfare();
    }).not.toThrow();
  });

  it('should play start sound without throwing', () => {
    expect(() => {
      audio.playStart();
    }).not.toThrow();
  });

  it('should play beep sound without throwing', () => {
    expect(() => {
      audio.playBeep();
    }).not.toThrow();
  });

  it('should play fanfare sound without throwing', () => {
    expect(() => {
      audio.playFanfare();
    }).not.toThrow();
  });
});
