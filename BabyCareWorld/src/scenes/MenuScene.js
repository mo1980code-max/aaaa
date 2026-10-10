import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import SaveManager from '../systems/SaveManager.js';

/**
 * MenuScene - Main menu with play, settings buttons.
 * Features animated background and interactive elements.
 */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: GAME_CONFIG.SCENES.MENU });
    this.saveManager = new SaveManager();
  }

  create() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;

    // Initialize save data
    this.saveManager.initialize();

    // ---- BACKGROUND ----
    this.createAnimatedBackground();

    // ---- GAME LOGO ----
    this.createLogo(centerX, centerY - 280);

    // ---- MENU BUTTONS ----
    this.createMenuButtons(centerX, centerY);

    // ---- CURRENCY DISPLAY ----
    this.createCurrencyDisplay();

    // ---- DECORATIVE CHARACTERS ----
    this.createDecorations();

    // ---- VERSION TEXT ----
    this.add.text(WIDTH - 20, HEIGHT - 20, 'v1.0.0', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      alpha: 0.6
    }).setOrigin(1, 1);

    // ---- INTERACTIVITY ----
    this.setupInput();
  }

  createAnimatedBackground() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // Sky gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xB3E5FC, 0xB3E5FC, 1);
    sky.fillRect(0, 0, WIDTH, HEIGHT);

    // Sun
    const sun = this.add.graphics();
    sun.fillStyle(0xFFD93D, 1);
    sun.fillCircle(0, 0, 60);
    sun.fillStyle(0xFFF176, 0.5);
    sun.fillCircle(0, 0, 90);
    sun.setPosition(WIDTH - 150, 120);

    this.tweens.add({
      targets: sun,
      scale: 1.1,
      duration: 2000,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    // Clouds
    for (let i = 0; i < 6; i++) {
      this.createCloud(
        Math.random() * WIDTH,
        60 + Math.random() * 200,
        0.5 + Math.random() * 0.8
      );
    }

    // Grass ground
    const ground = this.add.graphics();
    ground.fillStyle(0x81C784, 1);
    ground.fillRect(0, HEIGHT * 0.78, WIDTH, HEIGHT * 0.22);
    ground.fillStyle(0x66BB6A, 1);
    // Rolling hills
    for (let x = 0; x < WIDTH; x += 200) {
      ground.fillEllipse(x + 100, HEIGHT * 0.78, 250, 60);
    }

    // Flowers on ground
    for (let i = 0; i < 12; i++) {
      const fx = Math.random() * WIDTH;
      const fy = HEIGHT * 0.82 + Math.random() * (HEIGHT * 0.15);
      this.createFlower(fx, fy);
    }

    // Butterflies
    for (let i = 0; i < 4; i++) {
      this.createButterfly(
        200 + Math.random() * (WIDTH - 400),
        300 + Math.random() * 300
      );
    }
  }

  createCloud(x, y, scale) {
    const cloud = this.add.graphics();
    cloud.fillStyle(0xFFFFFF, 0.85);
    cloud.fillEllipse(0, 0, 150 * scale, 60 * scale);
    cloud.fillEllipse(-40 * scale, -10 * scale, 90 * scale, 45 * scale);
    cloud.fillEllipse(50 * scale, -5 * scale, 80 * scale, 40 * scale);
    cloud.fillEllipse(20 * scale, 10 * scale, 100 * scale, 45 * scale);
    cloud.setPosition(x, y);

    this.tweens.add({
      targets: cloud,
      x: cloud.x + 80 + Math.random() * 100,
      duration: 10000 + Math.random() * 8000,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }

  createFlower(x, y) {
    const colors = [0xFF4081, 0xFFD93D, 0xFF7043, 0xAB47BC, 0xEF5350];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const flower = this.add.graphics();
    
    // Stem
    flower.lineStyle(2, 0x4CAF50, 1);
    flower.lineBetween(0, 0, 0, -20);
    
    // Petals
    flower.fillStyle(color, 1);
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      flower.fillCircle(
        Math.cos(angle) * 6,
        -20 + Math.sin(angle) * 6,
        5
      );
    }
    // Center
    flower.fillStyle(0xFFD93D, 1);
    flower.fillCircle(0, -20, 4);
    
    flower.setPosition(x, y);
    flower.setScale(0.8 + Math.random() * 0.5);

    // Gentle sway
    this.tweens.add({
      targets: flower,
      rotation: 0.1,
      duration: 1500 + Math.random() * 1000,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }

  createButterfly(x, y) {
    const butterfly = this.add.container(x, y);
    const colors = [0xFF4081, 0x7C4DFF, 0xFF6D00, 0x00BCD4];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const wing1 = this.add.graphics();
    wing1.fillStyle(color, 0.8);
    wing1.fillEllipse(-8, 0, 20, 14);
    
    const wing2 = this.add.graphics();
    wing2.fillStyle(color, 0.8);
    wing2.fillEllipse(8, 0, 20, 14);

    const body = this.add.graphics();
    body.fillStyle(0x3E2723, 1);
    body.fillEllipse(0, 0, 4, 12);
    
    butterfly.add([wing1, wing2, body]);
    butterfly.setScale(0.8);

    // Wing flapping
    this.tweens.add({
      targets: wing1,
      scaleX: 0.3,
      duration: 150,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
    
    this.tweens.add({
      targets: wing2,
      scaleX: 0.3,
      duration: 150,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    // Random movement
    this.tweens.add({
      targets: butterfly,
      x: butterfly.x + Phaser.Math.Between(-200, 200),
      y: butterfly.y + Phaser.Math.Between(-100, 100),
      duration: 4000 + Math.random() * 3000,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }

  createLogo(x, y) {
    // Logo background plate
    const plate = this.add.graphics();
    plate.fillStyle(0xFFFFFF, 0.2);
    plate.fillRoundedRect(x - 250, y - 60, 500, 120, 30);
    plate.lineStyle(4, 0xFFFFFF, 0.5);
    plate.strokeRoundedRect(x - 250, y - 60, 500, 120, 30);

    // Title text
    this.add.text(x, y - 20, 'Baby Care World', {
      fontSize: '56px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#E91E63',
      strokeThickness: 8,
      shadow: {
        offsetX: 2,
        offsetY: 4,
        color: '#000',
        blur: 6,
        fill: true
      }
    }).setOrigin(0.5);

    // Arabic subtitle
    this.add.text(x, y + 35, '🍼 عالم رعاية الأطفال 🍼', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFD93D',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Logo bounce
    this.tweens.add({
      targets: [plate],
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 2000,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }

  createMenuButtons(centerX, centerY) {
    const buttonStartY = centerY + 30;
    const buttonSpacing = 110;

    // PLAY button
    this.playBtn = this.createButton(
      centerX, buttonStartY,
      '🎮  ابدأ اللعب',
      0x4CAF50, 0x388E3C,
      () => this.onPlayClicked()
    );

    // SETTINGS button
    this.settingsBtn = this.createButton(
      centerX, buttonStartY + buttonSpacing,
      '⚙️  الإعدادات',
      0x607D8B, 0x455A64,
      () => this.onSettingsClicked()
    );

    // CLOTHES SHOP button (locked in phase 1 but visible)
    this.shopBtn = this.createButton(
      centerX, buttonStartY + buttonSpacing * 2,
      '👗  متجر الملابس',
      0xFF9800, 0xF57C00,
      () => this.onShopClicked()
    );
  }

  createButton(x, y, text, color, darkColor, callback) {
    const btnWidth = 320;
    const btnHeight = 80;

    const container = this.add.container(x, y);

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 20);
    bg.lineStyle(4, darkColor, 1);
    bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 20);
    
    // Shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.2);
    shadow.fillRoundedRect(-btnWidth / 2 + 4, -btnHeight / 2 + 6, btnWidth, btnHeight, 20);

    // Text
    const txt = this.add.text(0, 0, text, {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Add shadow first, then bg, then text
    container.add([shadow, bg, txt]);

    // Make interactive
    const hitArea = this.add.zone(0, 0, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true });
    container.add(hitArea);

    // Hover/press effects
    hitArea.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        ease: 'Power2'
      });
    });

    hitArea.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Power2'
      });
    });

    hitArea.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        ease: 'Power2',
        onComplete: () => {
          this.tweens.add({
            targets: container,
            scaleX: 1,
            scaleY: 1,
            duration: 100,
            ease: 'Power2'
          });
          callback();
        }
      });
    });

    // Gentle idle animation
    this.tweens.add({
      targets: container,
      y: y - 3,
      duration: 1500 + Math.random() * 500,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    return container;
  }

  createCurrencyDisplay() {
    const { WIDTH } = GAME_CONFIG;
    const saveData = this.saveManager.getSaveData();

    // Coins
    const coinContainer = this.add.container(WIDTH - 180, 50);
    const coinBg = this.add.graphics();
    coinBg.fillStyle(0x000000, 0.3);
    coinBg.fillRoundedRect(-80, -22, 160, 44, 22);
    const coinIcon = this.add.image(-55, 0, 'icon_coin').setScale(0.7);
    const coinText = this.add.text(10, 0, `${saveData.coins}`, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5);
    coinContainer.add([coinBg, coinIcon, coinText]);

    // Stars
    const starContainer = this.add.container(WIDTH - 360, 50);
    const starBg = this.add.graphics();
    starBg.fillStyle(0x000000, 0.3);
    starBg.fillRoundedRect(-80, -22, 160, 44, 22);
    const starIcon = this.add.image(-55, 0, 'icon_star').setScale(0.7);
    const starText = this.add.text(10, 0, `${saveData.stars}`, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5);
    starContainer.add([starBg, starIcon, starText]);
  }

  createDecorations() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // Baby boy on the left
    const boy = this.add.image(200, HEIGHT - 200, 'baby_boy')
      .setScale(1.5)
      .setOrigin(0.5);

    this.tweens.add({
      targets: boy,
      y: HEIGHT - 220,
      duration: 1200,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    // Baby girl on the right
    const girl = this.add.image(WIDTH - 200, HEIGHT - 200, 'baby_girl')
      .setScale(1.5)
      .setOrigin(0.5);

    this.tweens.add({
      targets: girl,
      y: HEIGHT - 220,
      duration: 1200,
      delay: 600,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    // Toy blocks near characters
    this.add.image(100, HEIGHT - 120, 'furniture_toys').setScale(1.2);
    this.add.image(WIDTH - 100, HEIGHT - 130, 'furniture_toys').setScale(1.0);
  }

  setupInput() {
    // Handle resize
    this.scale.on('resize', (gameSize) => {
      // Layout is handled by Phaser's scale system
    });
  }

  // ---- BUTTON HANDLERS ----

  onPlayClicked() {
    // Transition effect
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(GAME_CONFIG.SCENES.CHARACTER_SELECT);
    });

    // Click sound (placeholder)
    this.playClickSound();
  }

  onSettingsClicked() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(GAME_CONFIG.SCENES.SETTINGS);
    });
    this.playClickSound();
  }

  onShopClicked() {
    // Show "coming soon" toast
    this.showToast('قريباً! 🛍️');
    this.playClickSound();
  }

  playClickSound() {
    // Placeholder for sound - will be added in later phases
  }

  showToast(message) {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const toast = this.add.text(WIDTH / 2, HEIGHT - 100, message, {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      backgroundColor: '#000000CC',
      padding: { x: 20, y: 12 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setDepth(1000);

    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: HEIGHT - 130,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: toast,
          alpha: 0,
          y: HEIGHT - 160,
          delay: 1500,
          duration: 300,
          ease: 'Power2',
          onComplete: () => toast.destroy()
        });
      }
    });
  }
}
