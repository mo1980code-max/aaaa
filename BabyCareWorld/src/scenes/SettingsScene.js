import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import SaveManager from '../systems/SaveManager.js';

/**
 * SettingsScene - Game settings (volume, reset, etc.)
 */
export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super({ key: GAME_CONFIG.SCENES.SETTINGS });
    this.saveManager = new SaveManager();
  }

  create() {
    this.saveManager.initialize();
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const centerX = WIDTH / 2;
    const saveData = this.saveManager.getSaveData();
    const settings = saveData.settings;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0xE8EAF6, 1);
    bg.fillRect(0, 0, WIDTH, HEIGHT);

    // Title
    this.add.text(centerX, 60, '⚙️ الإعدادات - Settings', {
      fontSize: '42px',
      fontFamily: 'Arial',
      color: '#333333',
      fontStyle: 'bold',
      stroke: '#FFFFFF',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Settings panel
    const panel = this.add.graphics();
    panel.fillStyle(0xFFFFFF, 0.9);
    panel.fillRoundedRect(centerX - 350, 120, 700, HEIGHT - 240, 20);
    panel.lineStyle(3, 0x9FA8DA, 1);
    panel.strokeRoundedRect(centerX - 350, 120, 700, HEIGHT - 240, 20);

    // Music volume
    this.musicVolume = settings.musicVolume;
    this.createSlider(
      centerX - 250, 180,
      '🎵 صوت الموسيقى',
      this.musicVolume,
      (value) => {
        this.musicVolume = value;
        this.saveManager.updateSettings({ musicVolume: value });
      }
    );

    // SFX volume
    this.sfxVolume = settings.sfxVolume;
    this.createSlider(
      centerX - 250, 280,
      '🔊 تأثيرات صوتية',
      this.sfxVolume,
      (value) => {
        this.sfxVolume = value;
        this.saveManager.updateSettings({ sfxVolume: value });
      }
    );

    // Notifications toggle
    this.notifications = settings.notifications;
    this.createToggle(
      centerX - 250, 380,
      '🔔 الإشعارات',
      this.notifications,
      (value) => {
        this.notifications = value;
        this.saveManager.updateSettings({ notifications: value });
      }
    );

    // Reduced effects toggle
    this.reducedEffects = settings.reducedEffects;
    this.createToggle(
      centerX - 250, 460,
      '✨ تقليل المؤثرات',
      this.reducedEffects,
      (value) => {
        this.reducedEffects = value;
        this.saveManager.updateSettings({ reducedEffects: value });
      }
    );

    // Reset progress button
    this.createResetButton(centerX, 560);

    // Game info
    this.add.text(centerX, HEIGHT - 180, 'Baby Care World v1.0.0', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#666666'
    }).setOrigin(0.5);

    this.add.text(centerX, HEIGHT - 150, '© 2024 - جميع الحقوق محفوظة', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#999999'
    }).setOrigin(0.5);

    // Back button
    this.createBackButton();
  }

  createSlider(x, y, label, initialValue, onChange) {
    const { WIDTH } = GAME_CONFIG;

    // Label
    this.add.text(x, y, label, {
      fontSize: '26px',
      fontFamily: 'Arial',
      color: '#333333',
      fontStyle: 'bold'
    });

    // Slider track
    const trackX = x + 250;
    const trackWidth = 300;
    const track = this.add.graphics();
    track.fillStyle(0xE0E0E0, 1);
    track.fillRoundedRect(trackX, y + 8, trackWidth, 16, 8);

    // Slider fill
    const fill = this.add.graphics();
    const updateFill = (value) => {
      fill.clear();
      fill.fillStyle(0x4CAF50, 1);
      fill.fillRoundedRect(trackX, y + 8, trackWidth * value, 16, 8);
    };
    updateFill(initialValue);

    // Slider handle
    const handleX = trackX + trackWidth * initialValue;
    const handle = this.add.graphics();
    handle.fillStyle(0xFFFFFF, 1);
    handle.fillCircle(handleX, y + 16, 14);
    handle.lineStyle(3, 0x4CAF50, 1);
    handle.strokeCircle(handleX, y + 16, 14);

    // Value text
    const valueText = this.add.text(trackX + trackWidth + 20, y, `${Math.floor(initialValue * 100)}%`, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#4CAF50',
      fontStyle: 'bold'
    });

    // Make interactive
    const sliderZone = this.add.zone(trackX + trackWidth / 2, y + 16, trackWidth + 30, 40)
      .setInteractive({ useHandCursor: true });

    sliderZone.on('pointerdown', (pointer) => {
      const localX = pointer.x - trackX;
      const value = Phaser.Math.Clamp(localX / trackWidth, 0, 1);
      updateFill(value);
      handle.clear();
      handle.fillStyle(0xFFFFFF, 1);
      handle.fillCircle(trackX + trackWidth * value, y + 16, 14);
      handle.lineStyle(3, 0x4CAF50, 1);
      handle.strokeCircle(trackX + trackWidth * value, y + 16, 14);
      valueText.setText(`${Math.floor(value * 100)}%`);
      onChange(value);
    });

    sliderZone.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        const localX = pointer.x - trackX;
        const value = Phaser.Math.Clamp(localX / trackWidth, 0, 1);
        updateFill(value);
        handle.clear();
        handle.fillStyle(0xFFFFFF, 1);
        handle.fillCircle(trackX + trackWidth * value, y + 16, 14);
        handle.lineStyle(3, 0x4CAF50, 1);
        handle.strokeCircle(trackX + trackWidth * value, y + 16, 14);
        valueText.setText(`${Math.floor(value * 100)}%`);
        onChange(value);
      }
    });
  }

  createToggle(x, y, label, initialValue, onChange) {
    // Label
    this.add.text(x, y, label, {
      fontSize: '26px',
      fontFamily: 'Arial',
      color: '#333333',
      fontStyle: 'bold'
    });

    // Toggle switch
    const toggleX = x + 300;
    let currentValue = initialValue;

    const toggleBg = this.add.graphics();
    const toggleKnob = this.add.graphics();
    const toggleText = this.add.text(toggleX + 75, y, currentValue ? 'ON ✅' : 'OFF ❌', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#333',
      fontStyle: 'bold'
    });

    const drawToggle = () => {
      toggleBg.clear();
      toggleBg.fillStyle(currentValue ? 0x4CAF50 : 0xBDBDBD, 1);
      toggleBg.fillRoundedRect(toggleX, y, 60, 32, 16);

      toggleKnob.clear();
      toggleKnob.fillStyle(0xFFFFFF, 1);
      toggleKnob.fillCircle(currentValue ? toggleX + 44 : toggleX + 16, y + 16, 12);
    };
    drawToggle();

    const toggleZone = this.add.zone(toggleX + 30, y + 16, 70, 40)
      .setInteractive({ useHandCursor: true });

    toggleZone.on('pointerdown', () => {
      currentValue = !currentValue;
      drawToggle();
      toggleText.setText(currentValue ? 'ON ✅' : 'OFF ❌');
      onChange(currentValue);
    });
  }

  createResetButton(centerX, y) {
    const container = this.add.container(centerX, y);

    const bg = this.add.graphics();
    bg.fillStyle(0xF44336, 1);
    bg.fillRoundedRect(-120, -25, 240, 50, 15);
    bg.lineStyle(3, 0xC62828, 1);
    bg.strokeRoundedRect(-120, -25, 240, 50, 15);

    const text = this.add.text(0, 0, '🗑️ حذف جميع البيانات', {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, text]);

    const zone = this.add.zone(0, 0, 240, 50).setInteractive({ useHandCursor: true });
    container.add(zone);

    zone.on('pointerdown', () => {
      this.showResetConfirmation();
    });
  }

  showResetConfirmation() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;

    // Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.5);
    overlay.fillRect(0, 0, WIDTH, HEIGHT);
    overlay.setDepth(100);

    // Dialog
    const dialog = this.add.graphics();
    dialog.fillStyle(0xFFFFFF, 1);
    dialog.fillRoundedRect(centerX - 250, centerY - 120, 500, 240, 20);
    dialog.lineStyle(4, 0xF44336, 1);
    dialog.strokeRoundedRect(centerX - 250, centerY - 120, 500, 240, 20);
    dialog.setDepth(101);

    const warningText = this.add.text(centerX, centerY - 80, '⚠️ تحذير!', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#F44336',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(102);

    const confirmText = this.add.text(centerX, centerY - 30, 'هل تريد حذف جميع البيانات؟\nلا يمكن التراجع عن هذا الإجراء!', {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#333333',
      align: 'center'
    }).setOrigin(0.5).setDepth(102);

    // Yes button
    const yesBtn = this.add.container(centerX - 80, centerY + 60);
    yesBtn.setDepth(102);
    const yesBg = this.add.graphics();
    yesBg.fillStyle(0xF44336, 1);
    yesBg.fillRoundedRect(-60, -22, 120, 44, 12);
    const yesText = this.add.text(0, 0, 'نعم، احذف', {
      fontSize: '20px', fontFamily: 'Arial', color: '#FFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    yesBtn.add([yesBg, yesText]);
    const yesZone = this.add.zone(0, 0, 120, 44).setInteractive({ useHandCursor: true });
    yesBtn.add(yesZone);

    // No button
    const noBtn = this.add.container(centerX + 80, centerY + 60);
    noBtn.setDepth(102);
    const noBg = this.add.graphics();
    noBg.fillStyle(0x4CAF50, 1);
    noBg.fillRoundedRect(-60, -22, 120, 44, 12);
    const noText = this.add.text(0, 0, 'إلغاء', {
      fontSize: '20px', fontFamily: 'Arial', color: '#FFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    noBtn.add([noBg, noText]);
    const noZone = this.add.zone(0, 0, 120, 44).setInteractive({ useHandCursor: true });
    noBtn.add(noZone);

    // Handlers
    yesZone.on('pointerdown', () => {
      this.saveManager.reset();
      overlay.destroy();
      dialog.destroy();
      warningText.destroy();
      confirmText.destroy();
      yesBtn.destroy();
      noBtn.destroy();
      yesZone.destroy();
      noZone.destroy();
      this.showToast('تم حذف جميع البيانات! ✅');
    });

    noZone.on('pointerdown', () => {
      overlay.destroy();
      dialog.destroy();
      warningText.destroy();
      confirmText.destroy();
      yesBtn.destroy();
      noBtn.destroy();
      yesZone.destroy();
      noZone.destroy();
    });
  }

  showToast(message) {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const toast = this.add.text(WIDTH / 2, HEIGHT - 80, message, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      backgroundColor: '#333333CC',
      padding: { x: 20, y: 10 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setDepth(200);

    this.tweens.add({
      targets: toast,
      alpha: 1,
      duration: 300,
      onComplete: () => {
        this.tweens.add({
          targets: toast,
          alpha: 0,
          delay: 1500,
          duration: 300,
          onComplete: () => toast.destroy()
        });
      }
    });
  }

  createBackButton() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    const btn = this.add.container(WIDTH - 120, HEIGHT - 50);
    const bg = this.add.graphics();
    bg.fillStyle(0xFF7043, 1);
    bg.fillRoundedRect(-70, -28, 140, 56, 15);
    bg.lineStyle(3, 0xE64A19, 1);
    bg.strokeRoundedRect(-70, -28, 140, 56, 15);

    const text = this.add.text(0, 0, '→ رجوع', {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btn.add([bg, text]);

    const zone = this.add.zone(0, 0, 140, 56).setInteractive({ useHandCursor: true });
    btn.add(zone);

    zone.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(GAME_CONFIG.SCENES.MENU);
      });
    });
  }
}
