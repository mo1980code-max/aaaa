import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: GAME_CONFIG.SCENES.PRELOAD });
  }

  create() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;

    // Background (solid color - safe)
    const bg = this.add.graphics();
    bg.fillStyle(0x667eea, 1);
    bg.fillRect(0, 0, WIDTH, HEIGHT);

    // Second color overlay for gradient effect
    const bg2 = this.add.graphics();
    bg2.fillStyle(0x764ba2, 1);
    bg2.fillTriangle(0, 0, WIDTH, 0, WIDTH, HEIGHT);

    // Decorative circles
    for (let i = 0; i < 8; i++) {
      const circle = this.add.graphics();
      circle.fillStyle(0xFFFFFF, 0.1);
      circle.fillCircle(0, 0, 40 + Math.random() * 60);
      circle.setPosition(
        Math.random() * WIDTH,
        Math.random() * HEIGHT
      );
    }

    // Game title
    const title = this.add.text(centerX, centerY - 180, 'Baby Care World', {
      fontSize: '72px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#000',
        blur: 8,
        fill: true
      }
    }).setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(centerX, centerY - 100, 'عالم رعاية الأطفال', {
      fontSize: '36px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFD93D',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Baby characters
    let boy, girl;
    try {
      boy = this.add.image(centerX - 150, centerY + 80, 'baby_boy').setScale(1.2);
    } catch (e) {
      boy = this.add.graphics();
      boy.fillStyle(0x4FC3F7, 1);
      boy.fillCircle(0, 0, 40);
      boy.setPosition(centerX - 150, centerY + 80);
    }

    try {
      girl = this.add.image(centerX + 150, centerY + 80, 'baby_girl').setScale(1.2);
    } catch (e) {
      girl = this.add.graphics();
      girl.fillStyle(0xF48FB1, 1);
      girl.fillCircle(0, 0, 40);
      girl.setPosition(centerX + 150, centerY + 80);
    }

    // Bounce animation
    this.tweens.add({
      targets: boy,
      y: centerY + 50,
      duration: 800,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    this.tweens.add({
      targets: girl,
      y: centerY + 50,
      duration: 800,
      delay: 400,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    // Loading bar
    const barWidth = 400;
    const barHeight = 20;
    const barX = centerX - barWidth / 2;
    const barY = centerY + 250;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x000000, 0.3);
    barBg.fillRoundedRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10, 15);

    const barFill = this.add.graphics();

    const loadingText = this.add.text(centerX, barY + 50, 'جاري التحميل...', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Simulate loading
    let progress = 0;
    const loadTimer = this.time.addEvent({
      delay: 50,
      callback: () => {
        progress += Math.random() * 5 + 2;
        if (progress >= 100) {
          progress = 100;
          loadTimer.remove();
          loadingText.setText('!مرحباً بك');
          this.time.delayedCall(800, () => this.transitionToMenu());
        }
        barFill.clear();
        barFill.fillStyle(0x4CAF50, 1);
        barFill.fillRoundedRect(barX, barY, (barWidth * progress) / 100, barHeight, 10);
        loadingText.setText('جاري التحميل... ' + Math.floor(progress) + '%');
      },
      repeat: -1
    });

    // Title pulse
    this.tweens.add({
      targets: title,
      scale: 1.05,
      duration: 1500,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }

  transitionToMenu() {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(GAME_CONFIG.SCENES.MENU);
    });
  }
}
