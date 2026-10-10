import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import SaveManager from '../systems/SaveManager.js';
import NeedsManager from '../systems/NeedsManager.js';

/**
 * BaseRoomScene - Base class for all room scenes.
 * Provides common functionality: back button, HUD, baby character, interactions.
 */
export default class BaseRoomScene extends Phaser.Scene {
  constructor(key) {
    super({ key });
    this.saveManager = new SaveManager();
    this.needsManager = null;
  }

  create(roomConfig) {
    this.saveManager.initialize();
    this.needsManager = new NeedsManager(this.saveManager);
    
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // Room background
    this.createRoomBackground(roomConfig);

    // Room furniture and interactive items
    this.createFurniture(roomConfig);

    // Baby character
    this.createBaby(roomConfig);

    // HUD
    this.createHUD();

    // Back button
    this.createBackButton();

    // Needs decay timer
    this.startNeedsDecay();

    // Setup interactions
    this.setupInteractions(roomConfig);
  }

  createRoomBackground(config) {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(config.bgColor, 1);
    bg.fillRect(0, 0, WIDTH, HEIGHT);

    // Floor
    bg.fillStyle(config.floorColor, 1);
    bg.fillRect(0, HEIGHT * 0.75, WIDTH, HEIGHT * 0.25);

    // Wall pattern
    bg.lineStyle(2, config.wallAccent || 0x000000, 0.1);
    for (let y = 0; y < HEIGHT * 0.75; y += 80) {
      bg.lineBetween(0, y, WIDTH, y);
    }

    // Baseboard
    bg.fillStyle(0x795548, 0.8);
    bg.fillRect(0, HEIGHT * 0.75 - 8, WIDTH, 8);

    // Room title
    this.add.text(WIDTH / 2, 40, config.title, {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#333333',
      fontStyle: 'bold',
      stroke: '#FFFFFF',
      strokeThickness: 4
    }).setOrigin(0.5);
  }

  createFurniture(config) {
    // Override in subclasses
  }

  createBaby(config) {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const charKey = this.saveManager.getSaveData().selectedCharacter;
    
    this.baby = this.add.image(
      config.babyX || WIDTH / 2, 
      config.babyY || HEIGHT * 0.65, 
      this.getMoodTexture(charKey)
    )
      .setScale(1.3)
      .setOrigin(0.5)
      .setDepth(10)
      .setInteractive({ draggable: true });

    // Baby idle animation
    this.tweens.add({
      targets: this.baby,
      y: this.baby.y - 6,
      duration: 1000,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    // Baby drag
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      if (gameObject === this.baby) {
        gameObject.x = dragX;
        gameObject.y = Phaser.Math.Clamp(dragY, 200, HEIGHT * 0.72);
      }
    });
  }

  getMoodTexture(charKey) {
    const mood = this.needsManager.getMood();
    if (mood === 'happy' || mood === 'neutral') return charKey;
    if (mood === 'sad') return charKey + '_sad';
    return charKey + '_sad';
  }

  createHUD() {
    const { WIDTH } = GAME_CONFIG;
    const saveData = this.saveManager.getSaveData();

    // Top bar background
    const hudBg = this.add.graphics();
    hudBg.setDepth(100);
    hudBg.fillStyle(0x000000, 0.4);
    hudBg.fillRoundedRect(WIDTH - 300, 10, 290, 50, 15);

    // Coins
    this.add.image(WIDTH - 270, 35, 'icon_coin').setScale(0.6).setDepth(101);
    this.coinText = this.add.text(WIDTH - 245, 27, `${saveData.coins}`, {
      fontSize: '20px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold'
    }).setDepth(101);

    // Stars
    this.add.image(WIDTH - 140, 35, 'icon_star').setScale(0.6).setDepth(101);
    this.starText = this.add.text(WIDTH - 115, 27, `${saveData.stars}`, {
      fontSize: '20px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold'
    }).setDepth(101);
  }

  createBackButton() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    const btn = this.add.container(100, HEIGHT - 50);
    btn.setDepth(100);

    const bg = this.add.graphics();
    bg.fillStyle(0xFF7043, 1);
    bg.fillRoundedRect(-70, -28, 140, 56, 15);
    bg.lineStyle(3, 0xE64A19, 1);
    bg.strokeRoundedRect(-70, -28, 140, 56, 15);

    const text = this.add.text(0, 0, '🏠 المنزل', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btn.add([bg, text]);

    const zone = this.add.zone(0, 0, 140, 56).setInteractive({ useHandCursor: true });
    btn.add(zone);

    zone.on('pointerdown', () => {
      this.saveManager.save();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(GAME_CONFIG.SCENES.HOUSE);
      });
    });
  }

  setupInteractions(config) {
    // Override in subclasses
  }

  startNeedsDecay() {
    this.needsTimer = this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: () => {
        this.needsManager.tick();
      }
    });
  }

  /**
   * Show reward popup when activity is completed
   */
  showReward(coins = 5, stars = 1) {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    this.saveManager.addCoins(coins);
    this.saveManager.addStars(stars);
    this.saveManager.completeActivity();

    // Update HUD
    this.coinText.setText(`${this.saveManager.getSaveData().coins}`);
    this.starText.setText(`${this.saveManager.getSaveData().stars}`);

    // Show floating reward text
    const reward = this.add.text(WIDTH / 2, HEIGHT / 2, `+${coins} 🪙  +${stars} ⭐`, {
      fontSize: '36px',
      fontFamily: 'Arial',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(1000);

    this.tweens.add({
      targets: reward,
      y: HEIGHT / 2 - 100,
      alpha: 0,
      scale: 1.5,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => reward.destroy()
    });
  }

  /**
   * Show toast message
   */
  showToast(message) {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    
    const toast = this.add.text(WIDTH / 2, HEIGHT - 120, message, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      backgroundColor: '#000000CC',
      padding: { x: 20, y: 10 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setDepth(1000);

    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: HEIGHT - 150,
      duration: 300,
      onComplete: () => {
        this.tweens.add({
          targets: toast,
          alpha: 0,
          delay: 1200,
          duration: 300,
          onComplete: () => toast.destroy()
        });
      }
    });
  }

  shutdown() {
    if (this.needsTimer) this.needsTimer.remove();
    this.saveManager.save();
  }
}
