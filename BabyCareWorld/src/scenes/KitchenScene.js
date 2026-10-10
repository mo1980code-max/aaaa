import Phaser from 'phaser';
import BaseRoomScene from './BaseRoomScene.js';
import { GAME_CONFIG } from '../config.js';

/**
 * KitchenScene - Interactive kitchen with food items and cooking.
 */
export default class KitchenScene extends BaseRoomScene {
  constructor() {
    super(GAME_CONFIG.SCENES.KITCHEN);
  }

  create() {
    super.create({
      bgColor: 0xFFDAB9,
      floorColor: 0xBCAAA4,
      wallAccent: 0xFFCC80,
      title: '🍳 المطبخ - Kitchen',
      babyX: GAME_CONFIG.WIDTH * 0.5,
      babyY: GAME_CONFIG.HEIGHT * 0.62
    });
  }

  createFurniture(config) {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // Kitchen counter
    const counter = this.add.graphics();
    counter.fillStyle(0x8D6E63, 1);
    counter.fillRect(WIDTH * 0.05, HEIGHT * 0.45, WIDTH * 0.35, 20);
    counter.fillStyle(0x795548, 1);
    counter.fillRect(WIDTH * 0.05, HEIGHT * 0.47, WIDTH * 0.35, HEIGHT * 0.28);
    // Counter top (marble effect)
    counter.fillStyle(0xEEEEEE, 1);
    counter.fillRect(WIDTH * 0.05, HEIGHT * 0.43, WIDTH * 0.35, 15);

    // Cabinets above
    const cabinets = this.add.graphics();
    for (let x = WIDTH * 0.05; x < WIDTH * 0.38; x += 140) {
      cabinets.fillStyle(0x6D4C41, 1);
      cabinets.fillRoundedRect(x, HEIGHT * 0.1, 120, 160, 8);
      cabinets.fillStyle(0x5D4037, 1);
      cabinets.fillRoundedRect(x + 5, HEIGHT * 0.12, 110, 70, 5);
      cabinets.fillRoundedRect(x + 5, HEIGHT * 0.12 + 80, 110, 70, 5);
      // Handles
      cabinets.fillStyle(0xFFD54F, 1);
      cabinets.fillCircle(x + 60, HEIGHT * 0.12 + 50, 5);
      cabinets.fillCircle(x + 60, HEIGHT * 0.12 + 130, 5);
    }

    // Stove
    const stove = this.add.graphics();
    stove.fillStyle(0x37474F, 1);
    stove.fillRoundedRect(WIDTH * 0.12, HEIGHT * 0.35, 180, 80, 5);
    // Burners
    stove.fillStyle(0x212121, 1);
    stove.fillCircle(WIDTH * 0.17, HEIGHT * 0.39, 22);
    stove.fillCircle(WIDTH * 0.25, HEIGHT * 0.39, 22);
    stove.fillCircle(WIDTH * 0.17, HEIGHT * 0.47, 18);
    stove.fillCircle(WIDTH * 0.25, HEIGHT * 0.47, 18);

    // Pot on stove
    const pot = this.add.graphics();
    pot.fillStyle(0x757575, 1);
    pot.fillRoundedRect(WIDTH * 0.14, HEIGHT * 0.3, 80, 50, 8);
    pot.fillStyle(0x9E9E9E, 1);
    pot.fillRoundedRect(WIDTH * 0.13, HEIGHT * 0.29, 100, 10, 5);
    // Steam
    this.createSteamEffect(WIDTH * 0.18, HEIGHT * 0.25);

    // Fridge
    const fridge = this.add.graphics();
    fridge.fillStyle(0xE0E0E0, 1);
    fridge.fillRoundedRect(WIDTH * 0.75, HEIGHT * 0.15, 160, HEIGHT * 0.58, 10);
    fridge.lineStyle(3, 0xBDBDBD, 1);
    fridge.strokeRoundedRect(WIDTH * 0.75, HEIGHT * 0.15, 160, HEIGHT * 0.58, 10);
    fridge.lineBetween(WIDTH * 0.75, HEIGHT * 0.4, WIDTH * 0.75 + 160, HEIGHT * 0.4);
    // Fridge handles
    fridge.fillStyle(0x9E9E9E, 1);
    fridge.fillRoundedRect(WIDTH * 0.76 + 130, HEIGHT * 0.25, 8, 50, 4);
    fridge.fillRoundedRect(WIDTH * 0.76 + 130, HEIGHT * 0.45, 8, 50, 4);

    // Dining table
    const table = this.add.graphics();
    table.fillStyle(0xA1887F, 1);
    table.fillRoundedRect(WIDTH * 0.4, HEIGHT * 0.55, 280, 20, 5);
    table.fillStyle(0x8D6E63, 1);
    table.fillRect(WIDTH * 0.42, HEIGHT * 0.57, 15, 120);
    table.fillRect(WIDTH * 0.42 + 230, HEIGHT * 0.57, 15, 120);

    // High chair for baby
    const highChair = this.add.graphics();
    highChair.fillStyle(0xFFAB91, 1);
    highChair.fillRoundedRect(WIDTH * 0.48, HEIGHT * 0.45, 80, 50, 8);
    highChair.fillStyle(0xFF8A65, 1);
    highChair.fillRect(WIDTH * 0.48 + 5, HEIGHT * 0.35, 70, 20);
    // Chair legs
    highChair.fillStyle(0x795548, 1);
    highChair.fillRect(WIDTH * 0.49, HEIGHT * 0.50, 8, 100);
    highChair.fillRect(WIDTH * 0.48 + 60, HEIGHT * 0.50, 8, 100);

    // Food items (interactive)
    this.createFoodItems();

    // Kitchen window
    const window1 = this.add.graphics();
    window1.fillStyle(0x87CEEB, 1);
    window1.fillRect(WIDTH * 0.55, HEIGHT * 0.1, 130, 140);
    window1.lineStyle(6, 0x8D6E63, 1);
    window1.strokeRect(WIDTH * 0.55, HEIGHT * 0.1, 130, 140);
    // Checkered curtain
    window1.fillStyle(0xFFCDD2, 0.7);
    window1.fillRect(WIDTH * 0.55, HEIGHT * 0.08, 130, 30);
  }

  createSteamEffect(x, y) {
    for (let i = 0; i < 3; i++) {
      const steam = this.add.graphics();
      steam.fillStyle(0xFFFFFF, 0.4);
      steam.fillCircle(0, 0, 8 + i * 3);
      steam.setPosition(x + i * 15, y);

      this.tweens.add({
        targets: steam,
        y: y - 60,
        alpha: 0,
        scale: 1.5,
        duration: 2000 + i * 500,
        repeat: -1,
        delay: i * 400,
        ease: 'Power1'
      });
    }
  }

  createFoodItems() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // Apple on counter
    this.apple = this.add.image(WIDTH * 0.15, HEIGHT * 0.38, 'food_apple')
      .setScale(1.8)
      .setInteractive({ draggable: true, useHandCursor: true });
    
    this.apple.setDepth(15);

    // Bottle
    this.bottle = this.add.image(WIDTH * 0.28, HEIGHT * 0.38, 'food_bottle')
      .setScale(1.8)
      .setInteractive({ draggable: true, useHandCursor: true });
    
    this.bottle.setDepth(15);

    // Extra food on table
    this.add.image(WIDTH * 0.52, HEIGHT * 0.5, 'food_apple')
      .setScale(1.5)
      .setInteractive({ draggable: true, useHandCursor: true })
      .setDepth(15);

    // Drag setup
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    this.input.on('dragend', (pointer, gameObject) => {
      // Check if food is near baby's mouth area
      const babyMouthX = this.baby.x;
      const babyMouthY = this.baby.y - 40;
      const dist = Phaser.Math.Distance.Between(gameObject.x, gameObject.y, babyMouthX, babyMouthY);

      if (dist < 80) {
        // Baby eats!
        this.feedBaby(gameObject);
      } else {
        // Return food to original position
        this.tweens.add({
          targets: gameObject,
          x: gameObject.getData('homeX') || gameObject.x,
          y: gameObject.getData('homeY') || gameObject.y,
          duration: 300,
          ease: 'Back.easeOut'
        });
      }
    });

    // Store home positions
    this.apple.setData('homeX', WIDTH * 0.15);
    this.apple.setData('homeY', HEIGHT * 0.38);
    this.bottle.setData('homeX', WIDTH * 0.28);
    this.bottle.setData('homeY', HEIGHT * 0.38);
  }

  feedBaby(foodItem) {
    // Eating animation
    this.showToast('🍎 الطفل يأكل! yum yum!');
    this.showReward(5, 1);
    this.needsManager.feed(20);

    // Animate food disappearing
    this.tweens.add({
      targets: foodItem,
      alpha: 0,
      scale: 0.3,
      duration: 300,
      onComplete: () => {
        // Reset food after delay
        this.time.delayedCall(1000, () => {
          foodItem.setAlpha(1).setScale(1.8);
          foodItem.x = foodItem.getData('homeX');
          foodItem.y = foodItem.getData('homeY');
        });
      }
    });

    // Baby happy reaction
    this.tweens.add({
      targets: this.baby,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 200,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut'
    });
  }

  setupInteractions(config) {
    // High chair interaction
    const chairZone = this.add.zone(GAME_CONFIG.WIDTH * 0.52, GAME_CONFIG.HEIGHT * 0.5, 100, 100)
      .setInteractive();
    chairZone.on('pointerdown', () => {
      this.tweens.add({
        targets: this.baby,
        x: GAME_CONFIG.WIDTH * 0.52,
        y: GAME_CONFIG.HEIGHT * 0.55,
        duration: 500,
        ease: 'Power2'
      });
      this.showToast('🪑 الطفل يجلس على كرسي الطعام');
    });

    // Fridge interaction
    const fridgeZone = this.add.zone(GAME_CONFIG.WIDTH * 0.83, GAME_CONFIG.HEIGHT * 0.4, 160, GAME_CONFIG.HEIGHT * 0.5)
      .setInteractive({ useHandCursor: true });
    fridgeZone.on('pointerdown', () => {
      this.showToast('🧊 الثلاجة مليئة بالطعام اللذيذ!');
    });
  }
}
