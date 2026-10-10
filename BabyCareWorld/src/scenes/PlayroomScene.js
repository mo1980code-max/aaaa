import Phaser from 'phaser';
import BaseRoomScene from './BaseRoomScene.js';
import { GAME_CONFIG } from '../config.js';

/**
 * PlayroomScene - Interactive playroom with toys and mini-games.
 */
export default class PlayroomScene extends BaseRoomScene {
  constructor() {
    super(GAME_CONFIG.SCENES.PLAYROOM);
  }

  create() {
    super.create({
      bgColor: 0xFFF9C4,
      floorColor: 0xFFF176,
      wallAccent: 0xFFEE58,
      title: '🧸 غرفة الألعاب - Playroom',
      babyX: GAME_CONFIG.WIDTH * 0.5,
      babyY: GAME_CONFIG.HEIGHT * 0.62
    });
  }

  createFurniture(config) {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // Colorful wall decorations
    const colors = [0xFF5252, 0xFF9800, 0xFFEB3B, 0x4CAF50, 0x2196F3, 0x9C27B0];
    for (let i = 0; i < 8; i++) {
      const balloon = this.add.graphics();
      const color = colors[i % colors.length];
      balloon.fillStyle(color, 0.8);
      balloon.fillEllipse(0, 0, 40, 50);
      balloon.lineStyle(1, 0x000000, 0.3);
      balloon.lineBetween(0, 25, 0, 80);
      balloon.setPosition(
        150 + (i % 4) * (WIDTH / 4) + Math.random() * 100,
        60 + Math.floor(i / 4) * 80 + Math.random() * 40
      );

      this.tweens.add({
        targets: balloon,
        y: balloon.y - 10,
        duration: 2000 + Math.random() * 1000,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }

    // Toy box
    const toyBox = this.add.graphics();
    toyBox.fillStyle(0x4CAF50, 1);
    toyBox.fillRoundedRect(WIDTH * 0.05, HEIGHT * 0.5, 180, 130, 10);
    toyBox.fillStyle(0x388E3C, 1);
    toyBox.fillRoundedRect(WIDTH * 0.05, HEIGHT * 0.48, 180, 30, 8);
    // Toys sticking out
    toyBox.fillStyle(0xFF5252, 1);
    toyBox.fillTriangle(WIDTH * 0.08, HEIGHT * 0.48, WIDTH * 0.08 + 20, HEIGHT * 0.48 - 30, WIDTH * 0.08 + 40, HEIGHT * 0.48);
    toyBox.fillStyle(0x2196F3, 1);
    toyBox.fillCircle(WIDTH * 0.05 + 130, HEIGHT * 0.47, 15);

    // Play mat
    const mat = this.add.graphics();
    mat.fillStyle(0x81D4FA, 0.5);
    mat.fillRoundedRect(WIDTH * 0.2, HEIGHT * 0.7, 600, 100, 20);
    // Mat pattern
    const matColors = [0xFFCDD2, 0xC8E6C9, 0xBBDEFB, 0xFFF9C4];
    for (let x = 0; x < 4; x++) {
      mat.fillStyle(matColors[x], 0.8);
      mat.fillRect(WIDTH * 0.22 + x * 145, HEIGHT * 0.72, 130, 75);
    }

    // Building blocks
    this.createBuildingBlocks(WIDTH * 0.35, HEIGHT * 0.65);

    // Toy train
    this.createToyTrain(WIDTH * 0.65, HEIGHT * 0.72);

    // Ball pit corner
    this.createBallPit(WIDTH * 0.82, HEIGHT * 0.55);

    // Shelf with toys
    const shelf = this.add.graphics();
    shelf.fillStyle(0xFFCC80, 1);
    shelf.fillRect(WIDTH * 0.85, HEIGHT * 0.15, 130, HEIGHT * 0.55);
    for (let y = HEIGHT * 0.15; y < HEIGHT * 0.7; y += 100) {
      shelf.fillStyle(0xFFB74D, 1);
      shelf.fillRect(WIDTH * 0.85, y, 130, 8);
    }
  }

  createBuildingBlocks(x, y) {
    const blocks = [
      { dx: 0, dy: 0, color: 0xFF5252 },
      { dx: 35, dy: 0, color: 0x4CAF50 },
      { dx: 70, dy: 0, color: 0x2196F3 },
      { dx: 17, dy: -30, color: 0xFFEB3B },
      { dx: 52, dy: -30, color: 0x9C27B0 },
      { dx: 35, dy: -60, color: 0xFF9800 }
    ];

    blocks.forEach((block, i) => {
      const gfx = this.add.graphics();
      gfx.fillStyle(block.color, 1);
      gfx.fillRect(x + block.dx, y + block.dy, 30, 30);
      gfx.lineStyle(2, 0x000000, 0.2);
      gfx.strokeRect(x + block.dx, y + block.dy, 30, 30);
      
      this.tweens.add({
        targets: gfx,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 500,
        delay: i * 100,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    });
  }

  createToyTrain(x, y) {
    const train = this.add.graphics();
    // Engine
    train.fillStyle(0xF44336, 1);
    train.fillRoundedRect(x, y, 70, 40, 8);
    train.fillStyle(0x000000, 1);
    train.fillCircle(x + 15, y + 45, 10);
    train.fillCircle(x + 55, y + 45, 10);
    // Chimney
    train.fillStyle(0x333333, 1);
    train.fillRect(x + 10, y - 20, 15, 25);
    // Carriage
    train.fillStyle(0x2196F3, 1);
    train.fillRoundedRect(x + 80, y + 5, 60, 35, 5);
    train.fillStyle(0x000000, 1);
    train.fillCircle(x + 90, y + 45, 10);
    train.fillCircle(x + 130, y + 45, 10);

    // Smoke puffs
    this.time.addEvent({
      delay: 600,
      loop: true,
      callback: () => {
        const smoke = this.add.graphics();
        smoke.fillStyle(0xEEEEEE, 0.5);
        smoke.fillCircle(0, 0, 8);
        smoke.setPosition(x + 17, y - 25);
        
        this.tweens.add({
          targets: smoke,
          y: y - 80,
          x: x + 17 + Phaser.Math.Between(-20, 20),
          alpha: 0,
          scale: 2,
          duration: 1500,
          onComplete: () => smoke.destroy()
        });
      }
    });
  }

  createBallPit(x, y) {
    // Pool outline
    const pool = this.add.graphics();
    pool.fillStyle(0xFF7043, 0.8);
    pool.fillRoundedRect(x - 80, y - 20, 160, 120, 20);

    // Colorful balls
    const ballColors = [0xFF5252, 0x4CAF50, 0x2196F3, 0xFFEB3B, 0xFF9800, 0x9C27B0, 0xE91E63];
    for (let i = 0; i < 15; i++) {
      const ball = this.add.graphics();
      ball.fillStyle(ballColors[i % ballColors.length], 1);
      ball.fillCircle(0, 0, 10);
      ball.setPosition(
        x - 60 + Math.random() * 120,
        y - 5 + Math.random() * 80
      );
    }
  }

  setupInteractions(config) {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // Toy box - play animation
    const toyBoxZone = this.add.zone(WIDTH * 0.08, HEIGHT * 0.55, 180, 130)
      .setInteractive({ useHandCursor: true });
    toyBoxZone.on('pointerdown', () => {
      this.tweens.add({
        targets: this.baby,
        x: WIDTH * 0.15,
        duration: 500,
        ease: 'Power2'
      });
      this.showToast('🎁 الطفل يلعب بالألعاب!');
      this.showReward(8, 2);
      this.needsManager.play(20);

      // Toy explosion animation
      const toyEmojis = ['🧸', '🎈', '⭐', '🎨', '🚗'];
      for (let i = 0; i < 6; i++) {
        const toy = this.add.text(WIDTH * 0.08, HEIGHT * 0.5, toyEmojis[i % toyEmojis.length], {
          fontSize: '32px'
        }).setOrigin(0.5).setDepth(20);

        this.tweens.add({
          targets: toy,
          x: WIDTH * 0.08 + Phaser.Math.Between(-100, 100),
          y: HEIGHT * 0.5 + Phaser.Math.Between(-150, -50),
          alpha: 0,
          rotation: Math.PI * 2,
          duration: 1500,
          delay: i * 100,
          ease: 'Power2',
          onComplete: () => toy.destroy()
        });
      }
    });

    // Building blocks - stack/destroy
    const blocksZone = this.add.zone(WIDTH * 0.4, HEIGHT * 0.6, 120, 100)
      .setInteractive({ useHandCursor: true });
    blocksZone.on('pointerdown', () => {
      this.showToast('🏗️ الطفل يبني أبراج!');
      this.showReward(5, 1);
      this.needsManager.play(10);
    });

    // Ball pit
    const ballPitZone = this.add.zone(WIDTH * 0.82, HEIGHT * 0.55, 160, 120)
      .setInteractive({ useHandCursor: true });
    ballPitZone.on('pointerdown', () => {
      this.tweens.add({
        targets: this.baby,
        x: WIDTH * 0.82,
        duration: 500,
        ease: 'Power2'
      });
      this.showToast('🏊 الطفل في بركة الكرات!');
      this.showReward(6, 1);
      this.needsManager.play(15);
    });

    // Train
    const trainZone = this.add.zone(WIDTH * 0.68, HEIGHT * 0.72, 150, 60)
      .setInteractive({ useHandCursor: true });
    trainZone.on('pointerdown', () => {
      this.showToast('🚂 القطار ينطلق! Chu chu!');
      this.needsManager.play(8);
    });
  }
}
