/**
 * HUD - Heads-Up Display for the game.
 * Shows needs bars, currency, and quick actions.
 */
import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';

export default class HUD {
  constructor(scene) {
    this.scene = scene;
    this.bars = {};
    this.visible = true;
  }

  create() {
    const { WIDTH } = GAME_CONFIG;

    // Needs panel background
    this.panelBg = this.scene.add.graphics();
    this.panelBg.setScrollFactor(0).setDepth(100);
    this.panelBg.fillStyle(0x000000, 0.4);
    this.panelBg.fillRoundedRect(10, 10, 280, 200, 15);

    // Create needs bars
    this.createNeedsBars();

    // Currency display
    this.createCurrencyDisplay();
  }

  createNeedsBars() {
    const barConfig = {
      hunger: { label: '🍔', color: GAME_CONFIG.COLORS.HUNGER },
      hygiene: { label: '🧼', color: GAME_CONFIG.COLORS.HYGIENE },
      sleep: { label: '😴', color: GAME_CONFIG.COLORS.SLEEP },
      energy: { label: '⚡', color: GAME_CONFIG.COLORS.ENERGY },
      happiness: { label: '😊', color: GAME_CONFIG.COLORS.HAPPINESS }
    };

    let y = 25;
    for (const [key, config] of Object.entries(barConfig)) {
      const icon = this.scene.add.text(20, y, config.label, {
        fontSize: '18px', fontFamily: 'Arial'
      }).setScrollFactor(0).setDepth(101);

      const bg = this.scene.add.graphics();
      bg.setScrollFactor(0).setDepth(101);
      bg.fillStyle(0x424242, 0.6);
      bg.fillRoundedRect(55, y + 4, 220, 14, 7);

      const fill = this.scene.add.graphics();
      fill.setScrollFactor(0).setDepth(102);

      this.bars[key] = { fill, color: config.color, value: 100 };
      y += 35;
    }
  }

  createCurrencyDisplay() {
    const { WIDTH } = GAME_CONFIG;

    this.currencyBg = this.scene.add.graphics();
    this.currencyBg.setScrollFactor(0).setDepth(100);
    this.currencyBg.fillStyle(0x000000, 0.4);
    this.currencyBg.fillRoundedRect(WIDTH - 300, 10, 290, 50, 15);
  }

  /**
   * Update needs display
   */
  updateNeeds(needs) {
    for (const [key, bar] of Object.entries(this.bars)) {
      bar.value = needs[key] || 0;
      bar.fill.clear();
      bar.fill.fillStyle(bar.color, 1);
      bar.fill.fillRoundedRect(55, 4, (220 * bar.value) / 100, 14, 7);
    }
  }

  /**
   * Update currency display
   */
  updateCurrency(coins, stars) {
    // Will be updated when currency text objects are created
  }

  /**
   * Show/hide HUD
   */
  setVisible(visible) {
    this.visible = visible;
    // Toggle visibility of all HUD elements
  }

  /**
   * Destroy HUD
   */
  destroy() {
    this.panelBg.destroy();
    for (const bar of Object.values(this.bars)) {
      bar.fill.destroy();
    }
  }
}
