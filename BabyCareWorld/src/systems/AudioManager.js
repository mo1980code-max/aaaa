/**
 * AudioManager - Handles all game audio (music and sound effects).
 * Placeholder for phase 7+ implementation.
 */
export default class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.musicVolume = 0.7;
    this.sfxVolume = 0.8;
    this.muted = false;
    this.currentMusic = null;
  }

  /**
   * Play background music
   */
  playMusic(key) {
    // Future: implement with actual audio files
    if (this.currentMusic) {
      this.currentMusic.stop();
    }
    // this.currentMusic = this.scene.sound.add(key, { loop: true });
    // this.currentMusic.play();
  }

  /**
   * Play a sound effect
   */
  playSfx(key) {
    if (this.muted) return;
    // Future: this.scene.sound.play(key, { volume: this.sfxVolume });
  }

  /**
   * Set music volume (0-1)
   */
  setMusicVolume(volume) {
    this.musicVolume = volume;
    if (this.currentMusic) {
      this.currentMusic.setVolume(volume);
    }
  }

  /**
   * Set SFX volume (0-1)
   */
  setSfxVolume(volume) {
    this.sfxVolume = volume;
  }

  /**
   * Mute/unmute all audio
   */
  setMuted(muted) {
    this.muted = muted;
    if (this.currentMusic) {
      this.currentMusic.setMuted(muted);
    }
  }

  /**
   * Stop all audio
   */
  stopAll() {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
    }
    this.scene.sound.stopAll();
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    this.stopAll();
  }
}
