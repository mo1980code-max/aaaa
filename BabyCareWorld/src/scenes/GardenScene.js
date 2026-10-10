import Phaser from 'phaser';
import BaseRoomScene from './BaseRoomScene.js';
import { GAME_CONFIG } from '../config.js';

/**
 * GardenScene - Interactive garden with nature elements.
 */
export default class GardenScene extends BaseRoomScene {
  constructor() {
    super(GAME_CONFIG.SCENES.GARDEN);
  }

  create() {
    super.create({
      bgColor: 0x87CEEB,
      floorColor: 0x81C784,
      wallAccent: 0xA5D6A7,
      title: '🌳 الحديقة - Garden',
      babyX: GAME_CONFIG.WIDTH * 0.5,
      babyY: GAME_CONFIG.HEIGHT * 0.62
    });
  }

  createFurniture(config) {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // Sky with sun
    const sky = this.add.graphics();
    sky.fillStyle(0x87CEEB, 1);
    sky.fillRect(0, 0, WIDTH, HEIGHT * 0.5);

    // Sun
    const sun = this.add.graphics();
    sun.fillStyle(0xFFD93D, 1);
    sun.fillCircle(WIDTH * 0.85, 100, 50);
    sun.fillStyle(0xFFF176, 0.3);
    sun.fillCircle(WIDTH * 0.85, 100, 80);
    
    this.tweens.add({
      targets: sun,
      scale: 1.05,
      duration: 3000,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    // Clouds
    for (let i = 0; i < 4; i++) {
      const cloud = this.add.graphics();
      cloud.fillStyle(0xFFFFFF, 0.8);
      cloud.fillEllipse(0, 0, 120, 40);
      cloud.fillEllipse(-30, -5, 60, 30);
      cloud.fillEllipse(40, -5, 70, 30);
      cloud.setPosition(200 + i * 400, 60 + Math.random() * 80);

      this.tweens.add({
        targets: cloud,
        x: cloud.x + 100,
        duration: 15000,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }

    // Grass ground
    const ground = this.add.graphics();
    ground.fillStyle(0x66BB6A, 1);
    ground.fillRect(0, HEIGHT * 0.65, WIDTH, HEIGHT * 0.35);
    // Grass tufts
    ground.fillStyle(0x4CAF50, 1);
    for (let x = 0; x < WIDTH; x += 30) {
      ground.fillTriangle(x, HEIGHT * 0.65, x + 5, HEIGHT * 0.65 - 10, x + 10, HEIGHT * 0.65);
    }

    // Path
    const path = this.add.graphics();
    path.fillStyle(0xD7CCC8, 0.8);
    path.fillRoundedRect(WIDTH * 0.3, HEIGHT * 0.72, WIDTH * 0.4, 60, 15);

    // Big tree
    const bigTree = this.add.graphics();
    // Trunk
    bigTree.fillStyle(0x795548, 1);
    bigTree.fillRect(WIDTH * 0.12 - 15, HEIGHT * 0.35, 30, HEIGHT * 0.32);
    // Leaves
    bigTree.fillStyle(0x388E3C, 1);
    bigTree.fillCircle(WIDTH * 0.12, HEIGHT * 0.25, 80);
    bigTree.fillCircle(WIDTH * 0.12 - 50, HEIGHT * 0.3, 55);
    bigTree.fillCircle(WIDTH * 0.12 + 50, HEIGHT * 0.3, 55);
    bigTree.fillCircle(WIDTH * 0.12, HEIGHT * 0.18, 60);
    // Fruit
    bigTree.fillStyle(0xF44336, 1);
    bigTree.fillCircle(WIDTH * 0.12 - 30, HEIGHT * 0.28, 8);
    bigTree.fillCircle(WIDTH * 0.12 + 40, HEIGHT * 0.32, 8);
    bigTree.fillCircle(WIDTH * 0.12 + 10, HEIGHT * 0.22, 8);

    // Swing set
    const swing = this.add.graphics();
    // Frame
    swing.lineStyle(6, 0x795548, 1);
    swing.lineBetween(WIDTH * 0.55, HEIGHT * 0.2, WIDTH * 0.50, HEIGHT * 0.65);
    swing.lineBetween(WIDTH * 0.55, HEIGHT * 0.2, WIDTH * 0.70, HEIGHT * 0.65);
    swing.lineBetween(WIDTH * 0.75, HEIGHT * 0.2, WIDTH * 0.70, HEIGHT * 0.65);
    swing.lineBetween(WIDTH * 0.75, HEIGHT * 0.2, WIDTH * 0.90, HEIGHT * 0.65);
    swing.lineBetween(WIDTH * 0.55, HEIGHT * 0.2, WIDTH * 0.75, HEIGHT * 0.2);
    // Swing seat
    swing.fillStyle(0xFF7043, 1);
    swing.fillRect(WIDTH * 0.62, HEIGHT * 0.50, 60, 10);
    // Chains
    swing.lineStyle(2, 0x616161, 1);
    swing.lineBetween(WIDTH * 0.63, HEIGHT * 0.2, WIDTH * 0.63, HEIGHT * 0.50);
    swing.lineBetween(WIDTH * 0.68, HEIGHT * 0.2, WIDTH * 0.68, HEIGHT * 0.50);

    // Animate swing
    this.swingAngle = 0;
    this.swingSeat = { x: WIDTH * 0.65, y: HEIGHT * 0.50 };

    // Flowers
    const flowerColors = [0xFF4081, 0xFFEB3B, 0x7C4DFF, 0xFF6D00, 0xE91E63, 0x00BCD4];
    for (let i = 0; i < 20; i++) {
      const fx = 50 + Math.random() * (WIDTH - 100);
      const fy = HEIGHT * 0.68 + Math.random() * (HEIGHT * 0.25);
      const color = flowerColors[i % flowerColors.length];
      
      const flower = this.add.graphics();
      // Stem
      flower.lineStyle(2, 0x388E3C, 1);
      flower.lineBetween(0, 0, 0, -18);
      // Petals
      flower.fillStyle(color, 1);
      for (let p = 0; p < 5; p++) {
        const angle = (p / 5) * Math.PI * 2;
        flower.fillCircle(Math.cos(angle) * 5, -18 + Math.sin(angle) * 5, 4);
      }
      flower.fillStyle(0xFFEB3B, 1);
      flower.fillCircle(0, -18, 3);
      flower.setPosition(fx, fy);

      // Sway animation
      this.tweens.add({
        targets: flower,
        rotation: 0.15,
        duration: 1500 + Math.random() * 1000,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }

    // Butterfly
    this.createButterfly(WIDTH * 0.3, HEIGHT * 0.4);
    this.createButterfly(WIDTH * 0.7, HEIGHT * 0.35);

    // Birds
    this.createBird(WIDTH * 0.2, HEIGHT * 0.15);
    this.createBird(WIDTH * 0.5, HEIGHT * 0.1);

    // Sandbox area
    const sandbox = this.add.graphics();
    sandbox.fillStyle(0xFFCC80, 0.8);
    sandbox.fillRoundedRect(WIDTH * 0.78, HEIGHT * 0.72, 150, 80, 10);
    sandbox.lineStyle(4, 0x8D6E63, 1);
    sandbox.strokeRoundedRect(WIDTH * 0.78, HEIGHT * 0.72, 150, 80, 10);
    // Sand toys
    sandbox.fillStyle(0xF44336, 1);
    sandbox.fillTriangle(WIDTH * 0.82, HEIGHT * 0.72, WIDTH * 0.82 + 15, HEIGHT * 0.72 - 25, WIDTH * 0.82 + 30, HEIGHT * 0.72);
  }

  createButterfly(x, y) {
    const butterfly = this.add.container(x, y);
    const colors = [0xFF4081, 0x7C4DFF, 0xFF6D00];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const wing1 = this.add.graphics();
    wing1.fillStyle(color, 0.8);
    wing1.fillEllipse(-10, 0, 24, 16);
    
    const wing2 = this.add.graphics();
    wing2.fillStyle(color, 0.8);
    wing2.fillEllipse(10, 0, 24, 16);

    const body = this.add.graphics();
    body.fillStyle(0x3E2723, 1);
    body.fillEllipse(0, 0, 4, 14);

    butterfly.add([wing1, wing2, body]);
    butterfly.setScale(0.7);

    this.tweens.add({
      targets: wing1,
      scaleX: 0.3,
      duration: 120,
      repeat: -1,
      yoyo: true
    });
    this.tweens.add({
      targets: wing2,
      scaleX: 0.3,
      duration: 120,
      repeat: -1,
      yoyo: true
    });

    this.tweens.add({
      targets: butterfly,
      x: x + Phaser.Math.Between(-150, 150),
      y: y + Phaser.Math.Between(-80, 80),
      duration: 5000 + Math.random() * 3000,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }

  createBird(x, y) {
    const bird = this.add.graphics();
    bird.lineStyle(3, 0x37474F, 1);
    bird.beginPath();
    bird.moveTo(-15, 0);
    bird.lineTo(0, -8);
    bird.lineTo(15, 0);
    bird.strokePath();

    bird.setPosition(x, y);
    this.tweens.add({
      targets: bird,
      x: x + 300,
      y: y + Phaser.Math.Between(-30, 30),
      duration: 8000,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }

  setupInteractions(config) {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // Swing
    const swingZone = this.add.zone(WIDTH * 0.65, HEIGHT * 0.5, 80, 80)
      .setInteractive({ useHandCursor: true });
    swingZone.on('pointerdown', () => {
      this.tweens.add({
        targets: this.baby,
        x: WIDTH * 0.65,
        y: HEIGHT * 0.5,
        duration: 500,
        ease: 'Power2'
      });
      this.showToast('🎠 الطفل يتأرجح! وايي!');
      this.showReward(5, 1);
      this.needsManager.play(15);

      // Swing animation
      this.tweens.add({
        targets: this.baby,
        x: this.baby.x + 30,
        duration: 600,
        repeat: 5,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    });

    // Tree (pick fruit)
    const treeZone = this.add.zone(WIDTH * 0.12, HEIGHT * 0.3, 160, 200)
      .setInteractive({ useHandCursor: true });
    treeZone.on('pointerdown', () => {
      this.showToast('🍎 الطفل يقطف التفاح!');
      this.showReward(5, 1);
      this.needsManager.feed(10);

      // Apple falling
      const apple = this.add.graphics();
      apple.fillStyle(0xF44336, 1);
      apple.fillCircle(0, 0, 10);
      apple.setPosition(WIDTH * 0.12 + Phaser.Math.Between(-30, 30), HEIGHT * 0.25);

      this.tweens.add({
        targets: apple,
        y: HEIGHT * 0.65,
        duration: 800,
        ease: 'Bounce.easeOut',
        onComplete: () => {
          this.time.delayedCall(500, () => apple.destroy());
        }
      });
    });

    // Sandbox
    const sandboxZone = this.add.zone(WIDTH * 0.855, HEIGHT * 0.76, 150, 80)
      .setInteractive({ useHandCursor: true });
    sandboxZone.on('pointerdown', () => {
      this.showToast('🏖️ الطفل يلعب في الرمل!');
      this.showReward(6, 1);
      this.needsManager.play(12);
    });

    // Flowers (pick them)
    const flowerZone = this.add.zone(WIDTH * 0.4, HEIGHT * 0.78, 200, 60)
      .setInteractive({ useHandCursor: true });
    flowerZone.on('pointerdown', () => {
      this.showToast('🌸 الطفل يقطف الأزهار!');
      this.needsManager.play(5);
      this.showReward(3, 1);
    });
  }
}
