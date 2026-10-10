import Phaser from 'phaser';
import BaseRoomScene from './BaseRoomScene.js';
import { GAME_CONFIG } from '../config.js';

/**
 * LivingRoomScene - Interactive living room with TV, couch, and toys.
 */
export default class LivingRoomScene extends BaseRoomScene {
  constructor() {
    super(GAME_CONFIG.SCENES.LIVING_ROOM);
  }

  create() {
    super.create({
      bgColor: 0xFFE4B5,
      floorColor: 0xA1887F,
      wallAccent: 0xFFCC80,
      title: '🛋️ غرفة المعيشة - Living Room',
      babyX: GAME_CONFIG.WIDTH * 0.4,
      babyY: GAME_CONFIG.HEIGHT * 0.62
    });
  }

  createFurniture(config) {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // Couch
    const couch = this.add.graphics();
    couch.fillStyle(0xE57373, 1);
    couch.fillRoundedRect(WIDTH * 0.55, HEIGHT * 0.52, 350, 160, 20);
    // Couch back
    couch.fillStyle(0xEF5350, 1);
    couch.fillRoundedRect(WIDTH * 0.55, HEIGHT * 0.42, 350, 120, 15);
    // Cushions
    couch.fillStyle(0xFFCDD2, 1);
    couch.fillRoundedRect(WIDTH * 0.57 + 20, HEIGHT * 0.52, 100, 80, 12);
    couch.fillRoundedRect(WIDTH * 0.57 + 140, HEIGHT * 0.52, 100, 80, 12);
    // Pillows
    couch.fillStyle(0xFFD54F, 1);
    couch.fillRoundedRect(WIDTH * 0.56 + 10, HEIGHT * 0.44, 50, 50, 20);
    couch.fillStyle(0x4FC3F7, 1);
    couch.fillRoundedRect(WIDTH * 0.56 + 290, HEIGHT * 0.44, 50, 50, 20);

    // TV on stand
    const tvStand = this.add.graphics();
    tvStand.fillStyle(0x5D4037, 1);
    tvStand.fillRoundedRect(WIDTH * 0.1, HEIGHT * 0.55, 180, 130, 10);
    // TV Screen
    const tv = this.add.graphics();
    tv.fillStyle(0x212121, 1);
    tv.fillRoundedRect(WIDTH * 0.08, HEIGHT * 0.28, 220, 150, 8);
    tv.fillStyle(0x4FC3F7, 1);
    tv.fillRect(WIDTH * 0.1, HEIGHT * 0.3, 196, 125);
    // TV is interactive
    this.tvScreen = tv;
    this.tvOn = false;

    // TV zone (click to turn on/off)
    const tvZone = this.add.zone(WIDTH * 0.18, HEIGHT * 0.38, 220, 150)
      .setInteractive({ useHandCursor: true });
    tvZone.on('pointerdown', () => this.toggleTV());

    // Carpet
    const carpet = this.add.graphics();
    carpet.fillStyle(0xFFAB91, 0.7);
    carpet.fillRoundedRect(WIDTH * 0.25, HEIGHT * 0.72, 500, 80, 20);
    carpet.lineStyle(3, 0xFF8A65, 0.8);
    carpet.strokeRoundedRect(WIDTH * 0.25 + 15, HEIGHT * 0.72 + 10, 470, 60, 12);

    // Toy box
    this.add.image(WIDTH * 0.82, HEIGHT * 0.68, 'furniture_toys').setScale(2);

    // Bookshelf
    const shelf = this.add.graphics();
    shelf.fillStyle(0x6D4C41, 1);
    shelf.fillRect(WIDTH * 0.85, HEIGHT * 0.2, 120, HEIGHT * 0.5);
    // Shelf levels
    for (let y = HEIGHT * 0.2; y < HEIGHT * 0.7; y += 70) {
      shelf.fillStyle(0x5D4037, 1);
      shelf.fillRect(WIDTH * 0.85, y, 120, 8);
      // Books
      const colors = [0xF44336, 0x2196F3, 0x4CAF50, 0xFF9800, 0x9C27B0];
      for (let bx = WIDTH * 0.86; bx < WIDTH * 0.85 + 110; bx += 18) {
        shelf.fillStyle(colors[Math.floor(Math.random() * colors.length)], 1);
        shelf.fillRect(bx, y + 10, 12, 50 + Math.random() * 15);
      }
    }

    // Window with curtains
    const window1 = this.add.graphics();
    window1.fillStyle(0x87CEEB, 1);
    window1.fillRect(WIDTH * 0.42, HEIGHT * 0.1, 160, 180);
    window1.lineStyle(6, 0x8D6E63, 1);
    window1.strokeRect(WIDTH * 0.42, HEIGHT * 0.1, 160, 180);
    // Curtains
    window1.fillStyle(0xE57373, 0.8);
    window1.fillRect(WIDTH * 0.40, HEIGHT * 0.08, 40, 200);
    window1.fillRect(WIDTH * 0.42 + 140, HEIGHT * 0.08, 40, 200);
  }

  toggleTV() {
    this.tvOn = !this.tvOn;
    
    if (this.tvOn) {
      // Turn TV on - show colors
      this.tvScreen.clear();
      this.tvScreen.fillStyle(0x212121, 1);
      this.tvScreen.fillRoundedRect(GAME_CONFIG.WIDTH * 0.08, GAME_CONFIG.HEIGHT * 0.28, 220, 150, 8);
      // Cartoon content
      this.tvScreen.fillStyle(0x4FC3F7, 1);
      this.tvScreen.fillRect(GAME_CONFIG.WIDTH * 0.1, GAME_CONFIG.HEIGHT * 0.3, 196, 125);
      this.tvScreen.fillStyle(0xFFEB3B, 1);
      this.tvScreen.fillCircle(GAME_CONFIG.WIDTH * 0.18, GAME_CONFIG.HEIGHT * 0.36, 20);
      
      this.showToast('📺 التلفاز يعمل!');
      this.needsManager.play(5);
      
      // TV animation
      this.time.addEvent({
        delay: 500,
        repeat: 10,
        callback: () => {
          const colors = [0xFF5252, 0x448AFF, 0x69F0AE, 0xFFD740];
          this.tvScreen.fillStyle(colors[Math.floor(Math.random() * colors.length)], 0.5);
          this.tvScreen.fillCircle(
            GAME_CONFIG.WIDTH * 0.15 + Math.random() * 100,
            GAME_CONFIG.HEIGHT * 0.35 + Math.random() * 80,
            10 + Math.random() * 15
          );
        }
      });
    } else {
      this.tvScreen.clear();
      this.tvScreen.fillStyle(0x212121, 1);
      this.tvScreen.fillRoundedRect(GAME_CONFIG.WIDTH * 0.08, GAME_CONFIG.HEIGHT * 0.28, 220, 150, 8);
      this.showToast('📺 التلفاز مطفأ');
    }
  }

  setupInteractions(config) {
    // Couch zone - baby can sit here
    const couchZone = this.add.zone(GAME_CONFIG.WIDTH * 0.7, GAME_CONFIG.HEIGHT * 0.55, 300, 100)
      .setInteractive();
    couchZone.on('pointerdown', () => {
      this.tweens.add({
        targets: this.baby,
        x: GAME_CONFIG.WIDTH * 0.7,
        y: GAME_CONFIG.HEIGHT * 0.55,
        duration: 500,
        ease: 'Power2'
      });
      this.showToast('😊 الطفل يجلس على الأريكة');
    });

    // Toy zone - baby can play
    const toyZone = this.add.zone(GAME_CONFIG.WIDTH * 0.82, GAME_CONFIG.HEIGHT * 0.65, 100, 100)
      .setInteractive({ useHandCursor: true });
    toyZone.on('pointerdown', () => {
      this.tweens.add({
        targets: this.baby,
        x: GAME_CONFIG.WIDTH * 0.78,
        duration: 500,
        ease: 'Power2'
      });
      this.showToast('🧸 الطفل يلعب بالألعاب!');
      this.showReward(3, 1);
      this.needsManager.play(15);
    });
  }
}
