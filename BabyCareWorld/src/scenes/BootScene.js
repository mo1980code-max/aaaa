import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';

/**
 * BootScene - First scene that loads.
 * Creates placeholder textures and transitions to PreloadScene.
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: GAME_CONFIG.SCENES.BOOT });
  }

  create() {
    // Generate all placeholder textures programmatically
    this.generateTextures();

    // Brief delay then transition to preload
    this.time.delayedCall(300, () => {
      this.scene.start(GAME_CONFIG.SCENES.PRELOAD);
    });
  }

  /**
   * Generate all game textures as colored rectangles/shapes.
   * These will be replaced with actual art in later phases.
   */
  generateTextures() {
    const gfx = this.make.graphics(0, 0);

    // ---- BUTTONS ----
    // Play button (green rounded rect with play icon)
    gfx.clear();
    gfx.fillStyle(0x4CAF50, 1);
    gfx.fillRoundedRect(0, 0, 280, 90, 20);
    gfx.lineStyle(4, 0x388E3C, 1);
    gfx.strokeRoundedRect(0, 0, 280, 90, 20);
    // Play triangle
    gfx.fillStyle(0xFFFFFF, 1);
    gfx.fillTriangle(120, 20, 120, 70, 170, 45);
    gfx.generateTexture('btn_play', 280, 90);

    // Settings button (gray gear-like)
    gfx.clear();
    gfx.fillStyle(0x607D8B, 1);
    gfx.fillRoundedRect(0, 0, 280, 90, 20);
    gfx.lineStyle(4, 0x455A64, 1);
    gfx.strokeRoundedRect(0, 0, 280, 90, 20);
    // Gear circle
    gfx.fillStyle(0xFFFFFF, 1);
    gfx.fillCircle(140, 45, 25);
    gfx.fillStyle(0x607D8B, 1);
    gfx.fillCircle(140, 45, 15);
    gfx.generateTexture('btn_settings', 280, 90);

    // Back button
    gfx.clear();
    gfx.fillStyle(0xFF7043, 1);
    gfx.fillRoundedRect(0, 0, 200, 70, 18);
    gfx.lineStyle(3, 0xE64A19, 1);
    gfx.strokeRoundedRect(0, 0, 200, 70, 18);
    // Arrow
    gfx.fillStyle(0xFFFFFF, 1);
    gfx.fillTriangle(60, 35, 100, 15, 100, 55);
    gfx.fillRect(95, 28, 50, 14);
    gfx.generateTexture('btn_back', 200, 70);

    // Small round button (for UI)
    gfx.clear();
    gfx.fillStyle(0xFF9800, 1);
    gfx.fillCircle(35, 35, 35);
    gfx.lineStyle(3, 0xF57C00, 1);
    gfx.strokeCircle(35, 35, 35);
    gfx.generateTexture('btn_round', 70, 70);

    // ---- ROOM BACKGROUNDS ----
    const roomColors = {
      'room_living': 0xFFE4B5,
      'room_kitchen': 0xFFDAB9,
      'room_bathroom': 0xE0F7FA,
      'room_bedroom': 0xF3E5F5,
      'room_playroom': 0xFFF9C4,
      'room_garden': 0xC8E6C9
    };

    for (const [key, color] of Object.entries(roomColors)) {
      gfx.clear();
      // Background
      gfx.fillStyle(color, 1);
      gfx.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
      // Floor
      const floorColor = Phaser.Display.Color.GetColor(
        Math.max(0, (color >> 16 & 0xFF) - 40),
        Math.max(0, (color >> 8 & 0xFF) - 40),
        Math.max(0, (color & 0xFF) - 40)
      );
      gfx.fillStyle(floorColor, 1);
      gfx.fillRect(0, GAME_CONFIG.HEIGHT * 0.7, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT * 0.3);
      // Wall line
      gfx.lineStyle(3, 0x000000, 0.1);
      gfx.lineBetween(0, GAME_CONFIG.HEIGHT * 0.7, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT * 0.7);
      gfx.generateTexture(key, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    }

    // ---- HOUSE EXTERIOR ----
    gfx.clear();
    // Sky gradient effect (solid for placeholder)
    gfx.fillStyle(0x87CEEB, 1);
    gfx.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    // Ground
    gfx.fillStyle(0x90EE90, 1);
    gfx.fillRect(0, GAME_CONFIG.HEIGHT * 0.75, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT * 0.25);
    // House body
    gfx.fillStyle(0xFFF8DC, 1);
    gfx.fillRect(300, 200, 1320, 600);
    gfx.lineStyle(4, 0x8B4513, 1);
    gfx.strokeRect(300, 200, 1320, 600);
    // Roof
    gfx.fillStyle(0xD2691E, 1);
    gfx.fillTriangle(250, 200, 1670, 200, 960, 50);
    gfx.lineStyle(4, 0x8B4513, 1);
    gfx.strokeTriangle(250, 200, 1670, 200, 960, 50);
    // Door
    gfx.fillStyle(0x8B4513, 1);
    gfx.fillRoundedRect(860, 500, 200, 300, 10);
    // Windows
    gfx.fillStyle(0x87CEEB, 1);
    gfx.fillRect(400, 350, 200, 200);
    gfx.fillRect(1320, 350, 200, 200);
    gfx.lineStyle(4, 0x8B4513, 1);
    gfx.strokeRect(400, 350, 200, 200);
    gfx.strokeRect(1320, 350, 200, 200);
    // Window crosses
    gfx.lineStyle(3, 0x8B4513, 1);
    gfx.lineBetween(500, 350, 500, 550);
    gfx.lineBetween(400, 450, 600, 450);
    gfx.lineBetween(1420, 350, 1420, 550);
    gfx.lineBetween(1320, 450, 1520, 450);
    gfx.generateTexture('house_exterior', GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

    // ---- BABY CHARACTERS ----
    this.generateBabyTextures(gfx, 'baby_boy', 0x4FC3F7, 0x29B6F6);
    this.generateBabyTextures(gfx, 'baby_girl', 0xF48FB1, 0xF06292);

    // ---- FURNITURE PLACEHOLDERS ----
    // Bed
    gfx.clear();
    gfx.fillStyle(0x8D6E63, 1);
    gfx.fillRoundedRect(0, 60, 300, 150, 10);
    gfx.fillStyle(0xFFFFFF, 1);
    gfx.fillRoundedRect(10, 10, 280, 80, 8);
    gfx.fillStyle(0xE3F2FD, 1);
    gfx.fillRoundedRect(10, 10, 280, 80, 8);
    // Pillow
    gfx.fillStyle(0xFFFFFF, 1);
    gfx.fillRoundedRect(20, 20, 80, 50, 15);
    gfx.generateTexture('furniture_bed', 300, 210);

    // Chair
    gfx.clear();
    gfx.fillStyle(0x8D6E63, 1);
    gfx.fillRect(20, 0, 60, 120);
    gfx.fillRect(0, 80, 100, 20);
    gfx.fillRect(10, 100, 15, 60);
    gfx.fillRect(75, 100, 15, 60);
    gfx.generateTexture('furniture_chair', 100, 160);

    // Table
    gfx.clear();
    gfx.fillStyle(0xA1887F, 1);
    gfx.fillRect(0, 0, 250, 20);
    gfx.fillRect(20, 20, 15, 100);
    gfx.fillRect(215, 20, 15, 100);
    gfx.generateTexture('furniture_table', 250, 120);

    // Bathtub
    gfx.clear();
    gfx.fillStyle(0xE0E0E0, 1);
    gfx.fillRoundedRect(0, 30, 300, 170, 20);
    gfx.fillStyle(0xB3E5FC, 1);
    gfx.fillRoundedRect(20, 50, 260, 130, 15);
    // Faucet
    gfx.fillStyle(0x9E9E9E, 1);
    gfx.fillCircle(250, 20, 15);
    gfx.fillRect(240, 0, 20, 30);
    gfx.generateTexture('furniture_bathtub', 300, 200);

    // Toy blocks
    gfx.clear();
    gfx.fillStyle(0xFF5252, 1);
    gfx.fillRect(0, 30, 40, 40);
    gfx.fillStyle(0x448AFF, 1);
    gfx.fillRect(50, 30, 40, 40);
    gfx.fillStyle(0x69F0AE, 1);
    gfx.fillRect(25, 0, 40, 40);
    gfx.generateTexture('furniture_toys', 100, 70);

    // TV
    gfx.clear();
    gfx.fillStyle(0x37474F, 1);
    gfx.fillRoundedRect(0, 0, 200, 130, 8);
    gfx.fillStyle(0x4FC3F7, 1);
    gfx.fillRect(10, 10, 180, 100);
    gfx.fillStyle(0x546E7A, 1);
    gfx.fillRect(70, 130, 60, 15);
    gfx.fillRect(50, 145, 100, 10);
    gfx.generateTexture('furniture_tv', 200, 155);

    // Cabinet
    gfx.clear();
    gfx.fillStyle(0x8D6E63, 1);
    gfx.fillRoundedRect(0, 0, 150, 250, 5);
    gfx.lineStyle(2, 0x6D4C41, 1);
    gfx.lineBetween(0, 125, 150, 125);
    gfx.fillStyle(0xFFD54F, 1);
    gfx.fillCircle(130, 62, 8);
    gfx.fillCircle(130, 187, 8);
    gfx.generateTexture('furniture_cabinet', 150, 250);

    // ---- FOOD ITEMS ----
    // Apple
    gfx.clear();
    gfx.fillStyle(0xF44336, 1);
    gfx.fillCircle(25, 30, 22);
    gfx.fillStyle(0x4CAF50, 1);
    gfx.fillRect(22, 5, 6, 15);
    gfx.generateTexture('food_apple', 50, 55);

    // Bottle
    gfx.clear();
    gfx.fillStyle(0xBBDEFB, 1);
    gfx.fillRoundedRect(5, 20, 30, 50, 5);
    gfx.fillStyle(0xFFFFFF, 1);
    gfx.fillRect(12, 5, 16, 20);
    gfx.fillStyle(0xFFECB3, 1);
    gfx.fillRoundedRect(8, 35, 24, 30, 3);
    gfx.generateTexture('food_bottle', 40, 70);

    // Soap
    gfx.clear();
    gfx.fillStyle(0xE1BEE7, 1);
    gfx.fillRoundedRect(0, 10, 60, 35, 10);
    // Bubbles
    gfx.fillStyle(0xFFFFFF, 0.7);
    gfx.fillCircle(50, 5, 8);
    gfx.fillCircle(60, 15, 6);
    gfx.fillCircle(45, 0, 5);
    gfx.generateTexture('item_soap', 70, 50);

    // Toothbrush
    gfx.clear();
    gfx.fillStyle(0x4CAF50, 1);
    gfx.fillRoundedRect(0, 12, 70, 12, 5);
    gfx.fillStyle(0xFFFFFF, 1);
    gfx.fillRect(60, 8, 20, 20);
    gfx.generateTexture('item_toothbrush', 80, 35);

    // ---- UI ELEMENTS ----
    // Coin icon
    gfx.clear();
    gfx.fillStyle(0xFFD700, 1);
    gfx.fillCircle(20, 20, 18);
    gfx.lineStyle(2, 0xFFA000, 1);
    gfx.strokeCircle(20, 20, 18);
    gfx.fillStyle(0xFFA000, 1);
    gfx.fillCircle(20, 20, 10);
    gfx.generateTexture('icon_coin', 40, 40);

    // Star icon
    gfx.clear();
    gfx.fillStyle(0xFFD700, 1);
    this.drawStar(gfx, 22, 22, 5, 20, 9);
    gfx.generateTexture('icon_star', 44, 44);

    // Heart icon
    gfx.clear();
    gfx.fillStyle(0xFF4081, 1);
    this.drawHeart(gfx, 22, 22, 20);
    gfx.generateTexture('icon_heart', 44, 44);

    // Progress bar background
    gfx.clear();
    gfx.fillStyle(0x424242, 0.5);
    gfx.fillRoundedRect(0, 0, 200, 20, 10);
    gfx.generateTexture('bar_bg', 200, 20);

    // Progress bar fill (gradient-like)
    gfx.clear();
    gfx.fillStyle(0x4CAF50, 1);
    gfx.fillRoundedRect(0, 0, 196, 16, 8);
    gfx.generateTexture('bar_fill', 200, 20);

    // Door overlay for rooms
    gfx.clear();
    gfx.fillStyle(0x8B4513, 1);
    gfx.fillRoundedRect(0, 0, 120, 200, 8);
    gfx.fillStyle(0xA0522D, 1);
    gfx.fillRoundedRect(10, 10, 100, 180, 5);
    gfx.fillStyle(0xFFD700, 1);
    gfx.fillCircle(95, 100, 8);
    gfx.generateTexture('door', 120, 200);

    // Room label plate
    gfx.clear();
    gfx.fillStyle(0xFFFFFF, 0.9);
    gfx.fillRoundedRect(0, 0, 200, 50, 12);
    gfx.lineStyle(3, 0x4CAF50, 1);
    gfx.strokeRoundedRect(0, 0, 200, 50, 12);
    gfx.generateTexture('label_plate', 200, 50);

    gfx.destroy();
  }

  /**
   * Draw a star shape
   */
  drawStar(gfx, cx, cy, points, outerRadius, innerRadius) {
    const step = Math.PI / points;
    gfx.beginPath();
    for (let i = 0; i < 2 * points; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * step - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) gfx.moveTo(x, y);
      else gfx.lineTo(x, y);
    }
    gfx.closePath();
    gfx.fillPath();
  }

  /**
   * Draw a heart shape
   */
  drawHeart(gfx, cx, cy, size) {
    gfx.beginPath();
    const topY = cy - size * 0.4;
    gfx.moveTo(cx, cy + size * 0.5);
    gfx.curveTo(cx - size, cy - size * 0.1, cx - size * 0.5, topY);
    gfx.curveTo(cx, topY - size * 0.2, cx, cy - size * 0.1);
    gfx.curveTo(cx, topY - size * 0.2, cx + size * 0.5, topY);
    gfx.curveTo(cx + size, cy - size * 0.1, cx, cy + size * 0.5);
    gfx.closePath();
    gfx.fillPath();
  }

  /**
   * Generate baby character placeholder textures
   */
  generateBabyTextures(gfx, key, bodyColor, darkColor) {
    gfx.clear();

    // Body
    gfx.fillStyle(bodyColor, 1);
    gfx.fillRoundedRect(25, 70, 70, 80, 15);

    // Head (big head for cartoon style)
    gfx.fillStyle(0xFFE0BD, 1); // Skin color
    gfx.fillCircle(60, 45, 40);

    // Eyes (big eyes)
    gfx.fillStyle(0xFFFFFF, 1);
    gfx.fillCircle(45, 40, 12);
    gfx.fillCircle(75, 40, 12);
    gfx.fillStyle(0x3E2723, 1);
    gfx.fillCircle(47, 42, 7);
    gfx.fillCircle(77, 42, 7);
    // Eye shine
    gfx.fillStyle(0xFFFFFF, 1);
    gfx.fillCircle(50, 39, 3);
    gfx.fillCircle(80, 39, 3);

    // Mouth (smile)
    gfx.lineStyle(3, 0xE91E63, 1);
    gfx.beginPath();
    gfx.arc(60, 55, 12, 0.1 * Math.PI, 0.9 * Math.PI);
    gfx.strokePath();

    // Cheeks (blush)
    gfx.fillStyle(0xFFAB91, 0.5);
    gfx.fillCircle(35, 52, 8);
    gfx.fillCircle(85, 52, 8);

    // Hair
    gfx.fillStyle(darkColor, 1);
    if (key === 'baby_boy') {
      // Boy hair - short
      gfx.fillRoundedRect(25, 5, 70, 30, 15);
      gfx.fillRect(25, 15, 15, 25);
      gfx.fillRect(80, 15, 15, 25);
    } else {
      // Girl hair - longer with bows
      gfx.fillRoundedRect(20, 5, 80, 35, 18);
      gfx.fillRect(15, 20, 15, 50);
      gfx.fillRect(90, 20, 15, 50);
      // Bow
      gfx.fillStyle(0xFF4081, 1);
      gfx.fillTriangle(100, 10, 120, 5, 110, 20);
      gfx.fillTriangle(100, 10, 120, 20, 110, 5);
    }

    // Arms
    gfx.fillStyle(0xFFE0BD, 1);
    gfx.fillRoundedRect(5, 80, 22, 50, 10);
    gfx.fillRoundedRect(93, 80, 22, 50, 10);

    // Legs
    gfx.fillStyle(0xFFE0BD, 1);
    gfx.fillRoundedRect(30, 145, 22, 45, 10);
    gfx.fillRoundedRect(68, 145, 22, 45, 10);

    // Shoes
    gfx.fillStyle(darkColor, 1);
    gfx.fillRoundedRect(25, 180, 30, 15, 7);
    gfx.fillRoundedRect(65, 180, 30, 15, 7);

    gfx.generateTexture(key, 120, 200);

    // Generate sad version
    gfx.clear();
    // Body
    gfx.fillStyle(bodyColor, 1);
    gfx.fillRoundedRect(25, 70, 70, 80, 15);
    // Head
    gfx.fillStyle(0xFFE0BD, 1);
    gfx.fillCircle(60, 45, 40);
    // Sad eyes
    gfx.fillStyle(0xFFFFFF, 1);
    gfx.fillCircle(45, 42, 12);
    gfx.fillCircle(75, 42, 12);
    gfx.fillStyle(0x3E2723, 1);
    gfx.fillCircle(47, 45, 7);
    gfx.fillCircle(77, 45, 7);
    // Sad mouth
    gfx.lineStyle(3, 0x3E2723, 1);
    gfx.beginPath();
    gfx.arc(60, 70, 12, 1.1 * Math.PI, 1.9 * Math.PI);
    gfx.strokePath();
    // Tears
    gfx.fillStyle(0x64B5F6, 0.8);
    gfx.fillCircle(40, 55, 4);
    gfx.fillCircle(80, 58, 4);
    // Hair
    gfx.fillStyle(darkColor, 1);
    if (key === 'baby_boy') {
      gfx.fillRoundedRect(25, 5, 70, 30, 15);
    } else {
      gfx.fillRoundedRect(20, 5, 80, 35, 18);
      gfx.fillRect(15, 20, 15, 50);
      gfx.fillRect(90, 20, 15, 50);
    }
    // Arms drooping
    gfx.fillStyle(0xFFE0BD, 1);
    gfx.fillRoundedRect(5, 90, 22, 50, 10);
    gfx.fillRoundedRect(93, 90, 22, 50, 10);
    // Legs
    gfx.fillStyle(0xFFE0BD, 1);
    gfx.fillRoundedRect(30, 145, 22, 45, 10);
    gfx.fillRoundedRect(68, 145, 22, 45, 10);
    gfx.fillStyle(darkColor, 1);
    gfx.fillRoundedRect(25, 180, 30, 15, 7);
    gfx.fillRoundedRect(65, 180, 30, 15, 7);

    gfx.generateTexture(key + '_sad', 120, 200);

    // Sleeping version
    gfx.clear();
    gfx.fillStyle(bodyColor, 1);
    gfx.fillRoundedRect(25, 70, 70, 80, 15);
    gfx.fillStyle(0xFFE0BD, 1);
    gfx.fillCircle(60, 45, 40);
    // Closed eyes
    gfx.lineStyle(3, 0x3E2723, 1);
    gfx.beginPath();
    gfx.arc(45, 42, 8, 0, Math.PI);
    gfx.strokePath();
    gfx.beginPath();
    gfx.arc(75, 42, 8, 0, Math.PI);
    gfx.strokePath();
    // Sleeping mouth
    gfx.fillStyle(0xE91E63, 0.5);
    gfx.fillCircle(60, 60, 5);
    // Zzz
    gfx.fillStyle(0xFFFFFF, 0.8);
    gfx.setFontSize(16);
    // Hair
    gfx.fillStyle(darkColor, 1);
    if (key === 'baby_boy') {
      gfx.fillRoundedRect(25, 5, 70, 30, 15);
    } else {
      gfx.fillRoundedRect(20, 5, 80, 35, 18);
      gfx.fillRect(15, 20, 15, 50);
      gfx.fillRect(90, 20, 15, 50);
    }
    // Arms
    gfx.fillStyle(0xFFE0BD, 1);
    gfx.fillRoundedRect(5, 85, 22, 45, 10);
    gfx.fillRoundedRect(93, 85, 22, 45, 10);
    // Legs
    gfx.fillStyle(0xFFE0BD, 1);
    gfx.fillRoundedRect(30, 145, 22, 45, 10);
    gfx.fillRoundedRect(68, 145, 22, 45, 10);
    gfx.fillStyle(darkColor, 1);
    gfx.fillRoundedRect(25, 180, 30, 15, 7);
    gfx.fillRoundedRect(65, 180, 30, 15, 7);

    gfx.generateTexture(key + '_sleep', 120, 200);
  }
}
