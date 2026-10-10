import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';

/**
 * PreloadScene - Shows loading progress with animated splash screen.
 * Transitions to MenuScene when complete.
 */
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: GAME_CONFIG.SCENES.PRELOAD });
  }

  create() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(
      0x667eea, 0x667eea,
      0x764ba2, 0x764ba2,
      1
    );
    bg.fillRect(0, 0, WIDTH, HEIGHT);

    // Decorative clouds
    for (let i = 0; i < 5; i++) {
      const cloud = this.add.graphics();
      cloud.fillStyle(0xFFFFFF, 0.3);
      cloud.fillEllipse(0, 0, 120 + Math.random() * 80, 50 + Math.random() * 30);
      cloud.fillEllipse(-30, -10, 80, 40);
      cloud.fillEllipse(40, -5, 70, 35);
      cloud.setPosition(
        Math.random() * WIDTH,
        50 + Math.random() * 200
      );
      
      // Animate clouds
      this.tweens.add({
        targets: cloud,
        x: cloud.x + 100,
        duration: 8000 + Math.random() * 4000,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }

    // Stars decoration
    for (let i = 0; i < 15; i++) {
      const star = this.add.image(
        Math.random() * WIDTH,
        Math.random() * HEIGHT * 0.4,
        'icon_star'
      );
      star.setScale(0.3 + Math.random() * 0.4);
      star.setAlpha(0.3 + Math.random() * 0.5);
      
      this.tweens.add({
        targets: star,
        alpha: 0.1,
        scale: star.scaleX * 0.5,
        duration: 1000 + Math.random() * 2000,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }

    // Game title
    const title = this.add.text(centerX, centerY - 180, '🍼 Baby Care World', {
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

    // Bouncing baby characters
    const boy = this.add.image(centerX - 150, centerY + 80, 'baby_boy')
      .setScale(1.2)
      .setOrigin(0.5);
    
    const girl = this.add.image(centerX + 150, centerY + 80, 'baby_girl')
      .setScale(1.2)
      .setOrigin(0.5);

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

    // Loading bar background
    const barWidth = 400;
    const barHeight = 20;
    const barX = centerX - barWidth / 2;
    const barY = centerY + 250;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x000000, 0.3);
    barBg.fillRoundedRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10, 15);

    // Loading bar fill
    const barFill = this.add.graphics();
    
    // Loading text
    const loadingText = this.add.text(centerX, barY + 50, 'جاري التحميل...', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Simulate loading progress
    let progress = 0;
    const loadTimer = this.time.addEvent({
      delay: 50,
      callback: () => {
        progress += Math.random() * 5 + 2;
        if (progress >= 100) {
          progress = 100;
          loadTimer.remove();
          
          loadingText.setText('!مرحباً بك');
          
          this.time.delayedCall(800, () => {
            this.transitionToMenu();
          });
        }
        
        // Update bar
        barFill.clear();
        barFill.fillStyle(0x4CAF50, 1);
        barFill.fillRoundedRect(barX, barY, (barWidth * progress) / 100, barHeight, 10);
        
        loadingText.setText(`جاري التحميل... ${Math.floor(progress)}%`);
      },
      repeat: -1
    });

    // Title pulse animation
    this.tweens.add({
      targets: title,
      scale: 1.05,
      duration: 1500,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Smooth transition to menu scene
   */
  transitionToMenu() {
    // Camera fade out
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(GAME_CONFIG.SCENES.MENU);
    });
  }
}
