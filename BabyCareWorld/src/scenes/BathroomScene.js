import Phaser from 'phaser';
import BaseRoomScene from './BaseRoomScene.js';
import { GAME_CONFIG } from '../config.js';

/**
 * BathroomScene - Interactive bathroom with bathtub, soap, toothbrush.
 */
export default class BathroomScene extends BaseRoomScene {
  constructor() {
    super(GAME_CONFIG.SCENES.BATHROOM);
  }

  create() {
    super.create({
      bgColor: 0xE0F7FA,
      floorColor: 0xB2DFDB,
      wallAccent: 0x80DEEA,
      title: '🛁 الحمام - Bathroom',
      babyX: GAME_CONFIG.WIDTH * 0.5,
      babyY: GAME_CONFIG.HEIGHT * 0.62
    });
  }

  createFurniture(config) {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // Tile pattern on walls
    const tiles = this.add.graphics();
    tiles.lineStyle(1, 0xB2EBF2, 0.5);
    for (let x = 0; x < WIDTH; x += 60) {
      tiles.lineBetween(x, 0, x, HEIGHT * 0.75);
    }
    for (let y = 0; y < HEIGHT * 0.75; y += 60) {
      tiles.lineBetween(0, y, WIDTH, y);
    }

    // Bathtub
    const tub = this.add.graphics();
    tub.fillStyle(0xECEFF1, 1);
    tub.fillRoundedRect(WIDTH * 0.25, HEIGHT * 0.45, 400, 200, 30);
    tub.fillStyle(0xB3E5FC, 0.8);
    tub.fillRoundedRect(WIDTH * 0.27, HEIGHT * 0.48, 360, 170, 25);
    // Water ripples
    for (let i = 0; i < 5; i++) {
      tub.lineStyle(1, 0x81D4FA, 0.4);
      tub.beginPath();
      tub.arc(WIDTH * 0.44, HEIGHT * 0.58, 40 + i * 30, 0, Math.PI);
      tub.strokePath();
    }
    // Faucet
    tub.fillStyle(0x90A4AE, 1);
    tub.fillRect(WIDTH * 0.60, HEIGHT * 0.35, 15, 60);
    tub.fillCircle(WIDTH * 0.607, HEIGHT * 0.34, 15);
    // Handles
    tub.fillStyle(0xF44336, 1);
    tub.fillCircle(WIDTH * 0.58, HEIGHT * 0.34, 8);
    tub.fillStyle(0x2196F3, 1);
    tub.fillCircle(WIDTH * 0.635, HEIGHT * 0.34, 8);

    // Water animation
    this.createWaterDrops();

    // Sink
    const sink = this.add.graphics();
    sink.fillStyle(0xECEFF1, 1);
    sink.fillRoundedRect(WIDTH * 0.02, HEIGHT * 0.35, 160, 100, 15);
    sink.fillStyle(0xB3E5FC, 0.6);
    sink.fillRoundedRect(WIDTH * 0.03, HEIGHT * 0.38, 140, 70, 10);
    // Mirror above sink
    sink.fillStyle(0xE3F2FD, 1);
    sink.fillRoundedRect(WIDTH * 0.03, HEIGHT * 0.08, 140, 180, 20);
    sink.lineStyle(4, 0xFFD54F, 1);
    sink.strokeRoundedRect(WIDTH * 0.03, HEIGHT * 0.08, 140, 180, 20);

    // Towel rack
    const towelRack = this.add.graphics();
    towelRack.fillStyle(0x90A4AE, 1);
    towelRack.fillRect(WIDTH * 0.78, HEIGHT * 0.3, 120, 5);
    // Towel
    towelRack.fillStyle(0xFF80AB, 1);
    towelRack.fillRoundedRect(WIDTH * 0.79, HEIGHT * 0.31, 50, 120, 5);
    towelRack.fillStyle(0xCE93D8, 1);
    towelRack.fillRoundedRect(WIDTH * 0.79 + 55, HEIGHT * 0.31, 50, 100, 5);

    // Toilet
    const toilet = this.add.graphics();
    toilet.fillStyle(0xECEFF1, 1);
    toilet.fillRoundedRect(WIDTH * 0.82, HEIGHT * 0.5, 100, 130, 15);
    toilet.fillStyle(0xCFD8DC, 1);
    toilet.fillRoundedRect(WIDTH * 0.83, HEIGHT * 0.45, 80, 40, 10);

    // Interactive items
    this.createInteractiveItems();

    // Rubber duck
    const duck = this.add.graphics();
    duck.fillStyle(0xFFEB3B, 1);
    duck.fillCircle(WIDTH * 0.38, HEIGHT * 0.52, 18); // body
    duck.fillCircle(WIDTH * 0.38 + 15, HEIGHT * 0.52 - 12, 12); // head
    duck.fillStyle(0xFF9800, 1);
    duck.fillRect(WIDTH * 0.38 + 24, HEIGHT * 0.52 - 14, 12, 5); // beak
    duck.fillStyle(0x000000, 1);
    duck.fillCircle(WIDTH * 0.38 + 20, HEIGHT * 0.52 - 15, 2); // eye
    
    this.duck = duck;
  }

  createWaterDrops() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    
    // Bubbles floating up
    this.time.addEvent({
      delay: 800,
      loop: true,
      callback: () => {
        const bubble = this.add.graphics();
        bubble.fillStyle(0xE1F5FE, 0.6);
        const size = 5 + Math.random() * 10;
        bubble.fillCircle(0, 0, size);
        bubble.lineStyle(1, 0xB3E5FC, 0.8);
        bubble.strokeCircle(0, 0, size);
        bubble.setPosition(
          WIDTH * 0.3 + Math.random() * 250,
          HEIGHT * 0.55
        );
        bubble.setDepth(5);

        this.tweens.add({
          targets: bubble,
          y: HEIGHT * 0.3,
          alpha: 0,
          x: bubble.x + Phaser.Math.Between(-30, 30),
          duration: 2000 + Math.random() * 1000,
          ease: 'Power1',
          onComplete: () => bubble.destroy()
        });
      }
    });
  }

  createInteractiveItems() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // Soap
    this.soap = this.add.image(WIDTH * 0.72, HEIGHT * 0.42, 'item_soap')
      .setScale(2.5)
      .setInteractive({ draggable: true, useHandCursor: true })
      .setDepth(15);
    this.soap.setData('homeX', WIDTH * 0.72);
    this.soap.setData('homeY', HEIGHT * 0.42);

    // Toothbrush
    this.toothbrush = this.add.image(WIDTH * 0.08, HEIGHT * 0.32, 'item_toothbrush')
      .setScale(2.5)
      .setInteractive({ draggable: true, useHandCursor: true })
      .setDepth(15);
    this.toothbrush.setData('homeX', WIDTH * 0.08);
    this.toothbrush.setData('homeY', HEIGHT * 0.32);

    // Drag handling
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    this.input.on('dragend', (pointer, gameObject) => {
      const dist = Phaser.Math.Distance.Between(gameObject.x, gameObject.y, this.baby.x, this.baby.y);

      if (dist < 100) {
        if (gameObject === this.soap) {
          this.batheBaby();
        } else if (gameObject === this.toothbrush) {
          this.brushTeeth();
        }
      } else {
        this.tweens.add({
          targets: gameObject,
          x: gameObject.getData('homeX'),
          y: gameObject.getData('homeY'),
          duration: 300,
          ease: 'Back.easeOut'
        });
      }
    });

    // Rubber duck interaction
    this.input.on('gameobjectdown', (pointer, gameObject) => {
      if (gameObject === this.duck) {
        this.showToast('🦆 بطّة! كواك كواك!');
        this.needsManager.play(5);
      }
    });
    if (this.duck) {
      this.duck.setInteractive({ useHandCursor: true });
    }
  }

  batheBaby() {
    this.showToast('🧼 الطفل يستحم! نظيف ورائع!');
    this.showReward(8, 1);
    this.needsManager.bath(25);

    // Soap bubbles animation around baby
    for (let i = 0; i < 8; i++) {
      const bubble = this.add.graphics();
      bubble.fillStyle(0xE1F5FE, 0.5);
      const size = 8 + Math.random() * 15;
      bubble.fillCircle(0, 0, size);
      bubble.setPosition(this.baby.x, this.baby.y);
      bubble.setDepth(20);

      this.tweens.add({
        targets: bubble,
        x: this.baby.x + Phaser.Math.Between(-80, 80),
        y: this.baby.y + Phaser.Math.Between(-120, 20),
        alpha: 0,
        duration: 1500 + Math.random() * 500,
        delay: i * 100,
        ease: 'Power1',
        onComplete: () => bubble.destroy()
      });
    }
  }

  brushTeeth() {
    this.showToast('🪥 الطفل ينظف أسنانه!');
    this.showReward(5, 1);
    this.needsManager.bath(10);

    // Sparkle effect
    for (let i = 0; i < 5; i++) {
      const sparkle = this.add.text(this.baby.x, this.baby.y - 60, '✨', {
        fontSize: '24px'
      }).setOrigin(0.5).setDepth(20);

      this.tweens.add({
        targets: sparkle,
        x: this.baby.x + Phaser.Math.Between(-40, 40),
        y: this.baby.y - 60 + Phaser.Math.Between(-40, 40),
        alpha: 0,
        duration: 1000,
        delay: i * 150,
        onComplete: () => sparkle.destroy()
      });
    }
  }

  setupInteractions(config) {
    // Bathtub zone
    const tubZone = this.add.zone(GAME_CONFIG.WIDTH * 0.44, GAME_CONFIG.HEIGHT * 0.55, 350, 150)
      .setInteractive();
    tubZone.on('pointerdown', () => {
      this.tweens.add({
        targets: this.baby,
        x: GAME_CONFIG.WIDTH * 0.44,
        y: GAME_CONFIG.HEIGHT * 0.52,
        duration: 500,
        ease: 'Power2'
      });
      this.showToast('🛁 الطفل في حوض الاستحمام');
    });
  }
}
