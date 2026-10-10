/**
 * Settings - In-game settings overlay.
 * Quick settings accessible from any scene.
 */
import SaveManager from '../systems/SaveManager.js';

export default class Settings {
  constructor(scene) {
    this.scene = scene;
    this.saveManager = new SaveManager();
    this.panel = null;
  }

  /**
   * Show settings panel
   */
  show() {
    // Full settings are in SettingsScene
    // This is for quick in-game settings overlay
    this.scene.scene.start('SettingsScene');
  }
}
