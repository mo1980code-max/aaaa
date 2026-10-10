import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import SaveManager from '../systems/SaveManager.js';
import NeedsManager from '../systems/NeedsManager.js';

/**
 * HouseScene - Open house view showing all rooms.
 * Camera can scroll left/right to explore the house.
 * Click on a room to zoom into it.
 */
export default class HouseScene extends Phaser.Scene {
  constructor() {
    super({ key: GAME_CONFIG.SCENES.HOUSE });
    this.saveManager = new SaveManager();
    this.needsManager = null;
  }

  create() {
    this.saveManager.initialize();
    this.needsManager = new NeedsManager(this.saveManager);
    
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // ---- WORLD SETUP ----
    // The house interior is wider than the screen for scrolling
    this.worldWidth = 3840;
    this.worldHeight = HEIGHT;

    // Create the house interior background
    this.createHouseInterior();

    // Create room areas
    this.rooms = this.createRoomAreas();

    // Create the baby character
    this.createBabyCharacter();

    // Create HUD (needs bars, coins, etc)
    this.createHUD();

    // Setup camera
    this.setupCamera();

    // Create back button
    this.createBackButton();

    // Start needs decay timer
    this.startNeedsDecay();

    // Setup drag for baby
    this.setupBabyDrag();
  }

  createHouseInterior() {
    const { HEIGHT } = GAME_CONFIG;
    const gfx = this.add.graphics();

    // Full house background - sky visible through windows
    gfx.fillStyle(0xFFF8E1, 1);
    gfx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    // Ceiling
    gfx.fillStyle(0xFFFDE7, 1);
    gfx.fillRect(0, 0, this.worldWidth, 80);
    
    // Ceiling decoration
    gfx.lineStyle(3, 0xFFD54F, 0.5);
    gfx.lineBetween(0, 78, this.worldWidth, 78);

    // Floor
    gfx.fillStyle(0xA1887F, 1);
    gfx.fillRect(0, HEIGHT * 0.78, this.worldWidth, HEIGHT * 0.22);
    
    // Floor boards pattern
    gfx.lineStyle(2, 0x8D6E63, 0.3);
    for (let x = 0; x < this.worldWidth; x += 120) {
      gfx.lineBetween(x, HEIGHT * 0.78, x, HEIGHT);
    }
    for (let y = HEIGHT * 0.78; y < HEIGHT; y += 40) {
      gfx.lineBetween(0, y, this.worldWidth, y);
    }

    // Baseboard
    gfx.fillStyle(0x795548, 1);
    gfx.fillRect(0, HEIGHT * 0.78 - 10, this.worldWidth, 10);

    // Wall divisions between rooms
    const roomWidth = this.worldWidth / 6;
    for (let i = 1; i < 6; i++) {
      const wallX = i * roomWidth;
      // Wall
      gfx.fillStyle(0x8D6E63, 1);
      gfx.fillRect(wallX - 8, 80, 16, HEIGHT * 0.78 - 80);
      // Doorway opening
      gfx.fillStyle(0xFFF8E1, 1);
      gfx.fillRect(wallX - 50, HEIGHT * 0.4, 100, HEIGHT * 0.38 - 10);
      // Door frame
      gfx.lineStyle(4, 0x6D4C41, 1);
      gfx.strokeRect(wallX - 50, HEIGHT * 0.4, 100, HEIGHT * 0.38 - 10);
      // Arch
      gfx.beginPath();
      gfx.arc(wallX, HEIGHT * 0.4, 50, Math.PI, 0);
      gfx.strokePath();
    }
  }

  createRoomAreas() {
    const { HEIGHT } = GAME_CONFIG;
    const roomWidth = this.worldWidth / 6;
    const rooms = [];

    const roomData = [
      { key: 'living', nameAr: 'غرفة المعيشة', nameEn: 'Living Room', scene: GAME_CONFIG.SCENES.LIVING_ROOM, color: 0xFFE4B5, icon: '🛋️' },
      { key: 'kitchen', nameAr: 'المطبخ', nameEn: 'Kitchen', scene: GAME_CONFIG.SCENES.KITCHEN, color: 0xFFDAB9, icon: '🍳' },
      { key: 'bathroom', nameAr: 'الحمام', nameEn: 'Bathroom', scene: GAME_CONFIG.SCENES.BATHROOM, color: 0xE0F7FA, icon: '🛁' },
      { key: 'bedroom', nameAr: 'غرفة النوم', nameEn: 'Bedroom', scene: GAME_CONFIG.SCENES.BEDROOM, color: 0xF3E5F5, icon: '🛏️' },
      { key: 'playroom', nameAr: 'غرفة الألعاب', nameEn: 'Playroom', scene: GAME_CONFIG.SCENES.PLAYROOM, color: 0xFFF9C4, icon: '🧸' },
      { key: 'garden', nameAr: 'الحديقة', nameEn: 'Garden', scene: GAME_CONFIG.SCENES.GARDEN, color: 0xC8E6C9, icon: '🌳' }
    ];

    roomData.forEach((data, index) => {
      const roomX = index * roomWidth;
      const centerX = roomX + roomWidth / 2;

      // Room background fill
      const roomBg = this.add.graphics();
      roomBg.fillStyle(data.color, 0.3);
      roomBg.fillRect(roomX + 10, 82, roomWidth - 20, HEIGHT * 0.78 - 82);

      // Room name label
      const labelBg = this.add.graphics();
      labelBg.fillStyle(0xFFFFFF, 0.85);
      labelBg.fillRoundedRect(centerX - 120, 100, 240, 55, 15);
      labelBg.lineStyle(3, data.color, 1);
      labelBg.strokeRoundedRect(centerX - 120, 100, 240, 55, 15);

      this.add.text(centerX, 115, `${data.icon} ${data.nameAr}`, {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#333333',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.add.text(centerX, 140, data.nameEn, {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#666666'
      }).setOrigin(0.5);

      // Add room-specific furniture decorations
      this.addRoomFurniture(data.key, centerX, HEIGHT * 0.6);

      // Interactive zone for room entry
      const zone = this.add.zone(centerX, HEIGHT / 2, roomWidth - 40, HEIGHT - 200)
        .setInteractive({ useHandCursor: true });

      zone.on('pointerdown', () => {
        this.enterRoom(data.scene);
      });

      // Hover effect
      zone.on('pointerover', () => {
        roomBg.clear();
        roomBg.fillStyle(data.color, 0.5);
        roomBg.fillRect(roomX + 10, 82, roomWidth - 20, HEIGHT * 0.78 - 82);
      });

      zone.on('pointerout', () => {
        roomBg.clear();
        roomBg.fillStyle(data.color, 0.3);
        roomBg.fillRect(roomX + 10, 82, roomWidth - 20, HEIGHT * 0.78 - 82);
      });

      rooms.push({ ...data, x: centerX, zone, roomBg, roomWidth, roomX });
    });

    return rooms;
  }

  addRoomFurniture(roomKey, centerX, baseY) {
    const scale = 1.5;
    
    switch (roomKey) {
      case 'living':
        this.add.image(centerX - 100, baseY + 50, 'furniture_tv').setScale(scale * 0.9);
        this.add.image(centerX + 120, baseY + 80, 'furniture_chair').setScale(scale * 1.2);
        this.add.image(centerX - 20, baseY + 100, 'furniture_table').setScale(scale * 0.8);
        break;
      case 'kitchen':
        this.add.image(centerX, baseY + 60, 'furniture_table').setScale(scale * 1.2);
        this.add.image(centerX - 130, baseY + 20, 'furniture_cabinet').setScale(scale * 0.9);
        this.add.image(centerX + 80, baseY - 20, 'food_apple').setScale(scale * 2);
        this.add.image(centerX + 140, baseY - 10, 'food_bottle').setScale(scale * 2);
        break;
      case 'bathroom':
        this.add.image(centerX, baseY + 50, 'furniture_bathtub').setScale(scale * 1.3);
        this.add.image(centerX - 180, baseY + 80, 'item_soap').setScale(scale * 1.5);
        this.add.image(centerX + 180, baseY + 90, 'item_toothbrush').setScale(scale * 1.5);
        break;
      case 'bedroom':
        this.add.image(centerX, baseY + 30, 'furniture_bed').setScale(scale * 1.5);
        this.add.image(centerX + 200, baseY + 20, 'furniture_cabinet').setScale(scale * 0.8);
        break;
      case 'playroom':
        this.add.image(centerX - 80, baseY + 60, 'furniture_toys').setScale(scale * 2);
        this.add.image(centerX + 80, baseY + 40, 'furniture_toys').setScale(scale * 1.8);
        this.add.image(centerX, baseY + 100, 'furniture_toys').setScale(scale * 1.5);
        break;
      case 'garden':
        // Trees and flowers
        const tree = this.add.graphics();
        tree.fillStyle(0x4CAF50, 1);
        tree.fillCircle(0, -60, 60);
        tree.fillCircle(-30, -40, 45);
        tree.fillCircle(30, -40, 45);
        tree.fillStyle(0x795548, 1);
        tree.fillRect(-10, -20, 20, 60);
        tree.setPosition(centerX - 150, baseY + 40);

        const flower1 = this.add.graphics();
        flower1.fillStyle(0xFF4081, 1);
        flower1.fillCircle(0, 0, 12);
        flower1.fillStyle(0xFFD93D, 1);
        flower1.fillCircle(0, 0, 5);
        flower1.lineStyle(2, 0x4CAF50, 1);
        flower1.lineBetween(0, 12, 0, 40);
        flower1.setPosition(centerX + 100, baseY + 50);

        const flower2 = this.add.graphics();
        flower2.fillStyle(0x7C4DFF, 1);
        flower2.fillCircle(0, 0, 10);
        flower2.fillStyle(0xFFD93D, 1);
        flower2.fillCircle(0, 0, 4);
        flower2.lineStyle(2, 0x4CAF50, 1);
        flower2.lineBetween(0, 10, 0, 35);
        flower2.setPosition(centerX + 160, baseY + 60);
        break;
    }
  }

  createBabyCharacter() {
    const charKey = this.saveManager.getSaveData().selectedCharacter;
    
    this.baby = this.add.image(this.worldWidth / 2, GAME_CONFIG.HEIGHT * 0.6, charKey)
      .setScale(1.3)
      .setOrigin(0.5)
      .setDepth(10)
      .setInteractive({ draggable: true });

    // Baby idle animation (gentle bob)
    this.tweens.add({
      targets: this.baby,
      y: this.baby.y - 8,
      duration: 1200,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    // Baby name tag
    this.babyNameTag = this.add.text(this.baby.x, this.baby.y - 120, 
      charKey === 'baby_boy' ? '👦' : '👧', {
      fontSize: '32px',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setDepth(11);
  }

  createHUD() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // HUD background
    const hudBg = this.add.graphics();
    hudBg.setScrollFactor(0);
    hudBg.setDepth(100);
    hudBg.fillStyle(0x000000, 0.4);
    hudBg.fillRoundedRect(10, 10, 280, 200, 15);

    // Needs bars
    const needs = this.saveManager.getSaveData().babyNeeds;
    const barLabels = {
      hunger: { label: '🍔 الجوع', color: 0xFF6B6B },
      hygiene: { label: '🧼 النظافة', color: 0x4ECDC4 },
      sleep: { label: '😴 النوم', color: 0x45B7D1 },
      energy: { label: '⚡ الطاقة', color: 0xF7DC6F },
      happiness: { label: '😊 السعادة', color: 0xFF9FF3 }
    };

    this.needsBars = {};
    let barY = 25;

    for (const [key, data] of Object.entries(barLabels)) {
      // Label
      const label = this.add.text(20, barY, data.label, {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#FFFFFF'
      }).setScrollFactor(0).setDepth(101);

      // Bar background
      const barBg = this.add.graphics();
      barBg.setScrollFactor(0).setDepth(101);
      barBg.fillStyle(0x424242, 0.6);
      barBg.fillRoundedRect(130, barY + 2, 150, 16, 8);

      // Bar fill
      const barFill = this.add.graphics();
      barFill.setScrollFactor(0).setDepth(102);
      barFill.fillStyle(data.color, 1);
      barFill.fillRoundedRect(130, barY + 2, (150 * needs[key]) / 100, 16, 8);

      this.needsBars[key] = { fill: barFill, value: needs[key], y: barY + 2 };
      barY += 35;
    }

    // Coins & Stars display (top right)
    const saveData = this.saveManager.getSaveData();

    const topBarBg = this.add.graphics();
    topBarBg.setScrollFactor(0).setDepth(100);
    topBarBg.fillStyle(0x000000, 0.4);
    topBarBg.fillRoundedRect(WIDTH - 300, 10, 290, 50, 15);

    const coinIcon = this.add.image(WIDTH - 270, 35, 'icon_coin').setScale(0.6)
      .setScrollFactor(0).setDepth(101);
    this.coinText = this.add.text(WIDTH - 245, 27, `${saveData.coins}`, {
      fontSize: '20px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(101);

    const starIcon = this.add.image(WIDTH - 140, 35, 'icon_star').setScale(0.6)
      .setScrollFactor(0).setDepth(101);
    this.starText = this.add.text(WIDTH - 115, 27, `${saveData.stars}`, {
      fontSize: '20px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(101);
  }

  setupCamera() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.startScroll(this.worldWidth / 2 - WIDTH / 2, 0);

    // Camera drag to scroll
    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown && !this.babyDragging) {
        this.cameras.main.scrollX -= pointer.velocity.x * 0.016;
        // Clamp camera
        this.cameras.main.scrollX = Phaser.Math.Clamp(
          this.cameras.main.scrollX,
          0,
          this.worldWidth - WIDTH
        );
      }
    });

    // Touch scroll on sides
    this.leftArrow = this.createScrollArrow(50, HEIGHT / 2, '◀', -1);
    this.rightArrow = this.createScrollArrow(WIDTH - 50, HEIGHT / 2, '▶', 1);
  }

  createScrollArrow(x, y, symbol, direction) {
    const container = this.add.container(x, y);
    container.setScrollFactor(0).setDepth(100);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.3);
    bg.fillCircle(0, 0, 40);
    
    const text = this.add.text(0, 0, symbol, {
      fontSize: '36px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, text]);

    // Scroll while pressed
    const zone = this.add.zone(0, 0, 80, 80).setInteractive();
    container.add(zone);

    let scrollTimer = null;
    zone.on('pointerdown', () => {
      scrollTimer = this.time.addEvent({
        delay: 16,
        loop: true,
        callback: () => {
          this.cameras.main.scrollX += direction * 12;
          this.cameras.main.scrollX = Phaser.Math.Clamp(
            this.cameras.main.scrollX, 0, this.worldWidth - GAME_CONFIG.WIDTH
          );
        }
      });
    });

    zone.on('pointerup', () => {
      if (scrollTimer) scrollTimer.remove();
    });
    zone.on('pointerout', () => {
      if (scrollTimer) scrollTimer.remove();
    });

    return container;
  }

  setupBabyDrag() {
    this.babyDragging = false;

    this.input.on('dragstart', (pointer, gameObject) => {
      if (gameObject === this.baby) {
        this.babyDragging = true;
        this.baby.setScale(1.5);
      }
    });

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      if (gameObject === this.baby) {
        gameObject.x = dragX;
        gameObject.y = Phaser.Math.Clamp(dragY, 200, GAME_CONFIG.HEIGHT * 0.75);
        this.babyNameTag.setPosition(gameObject.x, gameObject.y - 120);
      }
    });

    this.input.on('dragend', (pointer, gameObject) => {
      if (gameObject === this.baby) {
        this.babyDragging = false;
        this.baby.setScale(1.3);
      }
    });
  }

  createBackButton() {
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    
    const btn = this.add.container(WIDTH - 120, HEIGHT - 50);
    btn.setScrollFactor(0).setDepth(100);

    const bg = this.add.graphics();
    bg.fillStyle(0xFF7043, 1);
    bg.fillRoundedRect(-70, -28, 140, 56, 15);
    bg.lineStyle(3, 0xE64A19, 1);
    bg.strokeRoundedRect(-70, -28, 140, 56, 15);

    const text = this.add.text(0, 0, '🏠 القائمة', {
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
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(GAME_CONFIG.SCENES.MENU);
      });
    });
  }

  enterRoom(sceneKey) {
    // Zoom transition effect
    this.cameras.main.zoomTo(1.5, 400, 'Power2');
    
    this.time.delayedCall(400, () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(sceneKey);
      });
    });
  }

  startNeedsDecay() {
    this.needsTimer = this.time.addEvent({
      delay: 5000, // Every 5 seconds
      loop: true,
      callback: () => {
        this.needsManager.tick();
        this.updateNeedsBars();
      }
    });
  }

  updateNeedsBars() {
    const needs = this.needsManager.getNeeds();
    
    for (const [key, bar] of Object.entries(this.needsBars)) {
      bar.value = needs[key];
      bar.fill.clear();
      const color = key === 'hunger' ? 0xFF6B6B :
                    key === 'hygiene' ? 0x4ECDC4 :
                    key === 'sleep' ? 0x45B7D1 :
                    key === 'energy' ? 0xF7DC6F : 0xFF9FF3;
      bar.fill.fillStyle(color, 1);
      bar.fill.fillRoundedRect(130, bar.y, (150 * needs[key]) / 100, 16, 8);
    }
  }

  shutdown() {
    if (this.needsTimer) this.needsTimer.remove();
  }
}
