// Baby Care World - Single File Game
// Uses Phaser from CDN

(function() {
  'use strict';
  
  const CONFIG = {
    WIDTH: 1920,
    HEIGHT: 1080,
    SCENES: {
      BOOT: 'BootScene',
      PRELOAD: 'PreloadScene',
      MENU: 'MenuScene',
      CHARACTER_SELECT: 'CharacterSelectScene',
      HOUSE: 'HouseScene',
      LIVING_ROOM: 'LivingRoomScene',
      KITCHEN: 'KitchenScene',
      BATHROOM: 'BathroomScene',
      BEDROOM: 'BedroomScene',
      PLAYROOM: 'PlayroomScene',
      GARDEN: 'GardenScene',
      SETTINGS: 'SettingsScene'
    },
    COLORS: {
      PRIMARY: 0xFF6B9D,
      SECONDARY: 0xC44569,
      ACCENT: 0xFFD93D
    }
  };

  // Save Manager
  class SaveManager {
    constructor() {
      this.key = 'babyCareWorld_save';
      this.data = null;
    }
    
    getDefault() {
      return {
        coins: 100,
        stars: 0,
        selectedCharacter: 'baby_boy',
        babyNeeds: { hunger: 80, hygiene: 90, sleep: 70, energy: 85, happiness: 100 },
        settings: { musicVolume: 0.7, sfxVolume: 0.8 }
      };
    }
    
    load() {
      try {
        const raw = localStorage.getItem(this.key);
        return raw ? JSON.parse(raw) : null;
      } catch(e) { return null; }
    }
    
    save() {
      try {
        localStorage.setItem(this.key, JSON.stringify(this.data));
      } catch(e) {}
    }
    
    init() {
      this.data = this.load() || this.getDefault();
      this.save();
      return this.data;
    }
    
    get() { return this.data || this.init(); }
    addCoins(n) { this.data.coins += n; this.save(); return this.data.coins; }
    addStars(n) { this.data.stars += n; this.save(); return this.data.stars; }
  }

  // Needs Manager
  class NeedsManager {
    constructor(saveManager) {
      this.save = saveManager;
      this.needs = { ...saveManager.get().babyNeeds };
    }
    
    get() { return { ...this.needs }; }
    
    tick() {
      this.needs.hunger = Math.max(0, this.needs.hunger - 0.5);
      this.needs.hygiene = Math.max(0, this.needs.hygiene - 0.3);
      this.needs.sleep = Math.max(0, this.needs.sleep - 0.4);
      this.needs.energy = Math.max(0, this.needs.energy - 0.3);
      this.needs.happiness = Math.max(0, this.needs.happiness - 0.2);
      this.save();
    }
    
    feed(n=25) { this.needs.hunger = Math.min(100, this.needs.hunger + n); this.needs.energy = Math.min(100, this.needs.energy + 5); this.save(); }
    bath(n=30) { this.needs.hygiene = Math.min(100, this.needs.hygiene + n); this.needs.happiness = Math.min(100, this.needs.happiness + 10); this.save(); }
    sleep(n=35) { this.needs.sleep = Math.min(100, this.needs.sleep + n); this.needs.energy = Math.min(100, this.needs.energy + 20); this.save(); }
    play(n=20) { this.needs.happiness = Math.min(100, this.needs.happiness + n); this.needs.energy = Math.max(0, this.needs.energy - 10); this.save(); }
    
    getMood() {
      const avg = (this.needs.hunger + this.needs.hygiene + this.needs.sleep + this.needs.energy + this.needs.happiness) / 5;
      if (avg >= 80) return 'happy';
      if (avg >= 60) return 'neutral';
      if (avg >= 40) return 'sad';
      return 'crying';
    }
    
    save() { this.save.data.babyNeeds = { ...this.needs }; this.save.save(); }
  }

  // ============ BOOT SCENE ============
  class BootScene extends Phaser.Scene {
    constructor() { super({ key: CONFIG.SCENES.BOOT }); }
    
    create() {
      this.generateTextures();
      this.time.delayedCall(300, () => this.scene.start(CONFIG.SCENES.PRELOAD));
    }
    
    generateTextures() {
      const g = this.make.graphics(0, 0);
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
      
      // Buttons
      this.makeButton(g, 'btn_play', 280, 90, 0x4CAF50, 0x388E3C);
      this.makeButton(g, 'btn_settings', 280, 90, 0x607D8B, 0x455A64);
      this.makeButton(g, 'btn_back', 200, 70, 0xFF7043, 0xE64A19);
      
      // Room backgrounds
      const rooms = {
        'room_living': 0xFFE4B5, 'room_kitchen': 0xFFDAB9, 'room_bathroom': 0xE0F7FA,
        'room_bedroom': 0xF3E5F5, 'room_playroom': 0xFFF9C4, 'room_garden': 0xC8E6C9
      };
      
      for (const [key, color] of Object.entries(rooms)) {
        g.clear();
        g.fillStyle(color, 1);
        g.fillRect(0, 0, W, H);
        const r = Math.max(0, (color >> 16) - 40);
        const gr = Math.max(0, ((color >> 8) & 0xFF) - 40);
        const b = Math.max(0, (color & 0xFF) - 40);
        g.fillStyle((r << 16) | (gr << 8) | b, 1);
        g.fillRect(0, H * 0.7, W, H * 0.3);
        g.generateTexture(key, W, H);
      }
      
      // House
      g.clear();
      g.fillStyle(0x87CEEB, 1); g.fillRect(0, 0, W, H);
      g.fillStyle(0x90EE90, 1); g.fillRect(0, H * 0.75, W, H * 0.25);
      g.fillStyle(0xFFF8DC, 1); g.fillRect(300, 200, 1320, 600);
      g.lineStyle(4, 0x8B4513, 1); g.strokeRect(300, 200, 1320, 600);
      g.fillStyle(0xD2691E, 1); g.fillTriangle(250, 200, 1670, 200, 960, 50);
      g.fillStyle(0x8B4513, 1); g.fillRoundedRect(860, 500, 200, 300, 10);
      g.fillStyle(0x87CEEB, 1); g.fillRect(400, 350, 200, 200); g.fillRect(1320, 350, 200, 200);
      g.lineStyle(3, 0x8B4513, 1);
      g.strokeRect(400, 350, 200, 200); g.strokeRect(1320, 350, 200, 200);
      g.lineBetween(500, 350, 500, 550); g.lineBetween(400, 450, 600, 450);
      g.lineBetween(1420, 350, 1420, 550); g.lineBetween(1320, 450, 1520, 450);
      g.generateTexture('house_exterior', W, H);
      
      // Babies
      this.makeBaby(g, 'baby_boy', 0x4FC3F7, 0x29B6F6);
      this.makeBaby(g, 'baby_girl', 0xF48FB1, 0xF06292);
      this.makeBaby(g, 'baby_boy_sad', 0x4FC3F7, 0x29B6F6, true);
      this.makeBaby(g, 'baby_girl_sad', 0xF48FB1, 0xF06292, true);
      this.makeBaby(g, 'baby_boy_sleep', 0x4FC3F7, 0x29B6F6, false, true);
      this.makeBaby(g, 'baby_girl_sleep', 0xF48FB1, 0xF06292, false, true);
      
      // Furniture
      this.makeFurniture(g);
      
      // Icons
      g.clear(); g.fillStyle(0xFFD700, 1); g.fillCircle(20, 20, 18);
      g.lineStyle(2, 0xFFA000, 1); g.strokeCircle(20, 20, 18);
      g.fillStyle(0xFFA000, 1); g.fillCircle(20, 20, 10);
      g.generateTexture('icon_coin', 40, 40);
      
      g.clear(); g.fillStyle(0xFFD700, 1);
      this.drawStar(g, 22, 22, 5, 20, 9);
      g.generateTexture('icon_star', 44, 44);
      
      g.clear(); g.fillStyle(0xFF4081, 1);
      g.fillCircle(16, 16, 10); g.fillCircle(28, 16, 10);
      g.fillTriangle(6, 16, 38, 16, 22, 36);
      g.generateTexture('icon_heart', 44, 44);
      
      g.destroy();
    }
    
    makeButton(g, key, w, h, color, border) {
      g.clear();
      g.fillStyle(color, 1); g.fillRoundedRect(0, 0, w, h, 20);
      g.lineStyle(4, border, 1); g.strokeRoundedRect(0, 0, w, h, 20);
      g.generateTexture(key, w, h);
    }
    
    makeBaby(g, key, body, dark, sad, sleep) {
      g.clear();
      g.fillStyle(body, 1); g.fillRoundedRect(25, 70, 70, 80, 15);
      g.fillStyle(0xFFE0BD, 1); g.fillCircle(60, 45, 40);
      
      if (sleep) {
        g.lineStyle(3, 0x3E2723, 1);
        g.beginPath(); g.arc(45, 42, 8, 0, Math.PI); g.strokePath();
        g.beginPath(); g.arc(75, 42, 8, 0, Math.PI); g.strokePath();
      } else {
        g.fillStyle(0xFFFFFF, 1); g.fillCircle(45, 40, 12); g.fillCircle(75, 40, 12);
        g.fillStyle(0x3E2723, 1); g.fillCircle(47, 42, 7); g.fillCircle(77, 42, 7);
        g.fillStyle(0xFFFFFF, 1); g.fillCircle(50, 39, 3); g.fillCircle(80, 39, 3);
        
        if (sad) {
          g.lineStyle(3, 0x3E2723, 1);
          g.beginPath(); g.arc(60, 70, 12, 1.1 * Math.PI, 1.9 * Math.PI); g.strokePath();
          g.fillStyle(0x64B5F6, 0.8); g.fillCircle(40, 55, 4); g.fillCircle(80, 58, 4);
        } else {
          g.lineStyle(3, 0xE91E63, 1);
          g.beginPath(); g.arc(60, 55, 12, 0.1 * Math.PI, 0.9 * Math.PI); g.strokePath();
        }
      }
      
      g.fillStyle(0xFFAB91, 0.5); g.fillCircle(35, 52, 8); g.fillCircle(85, 52, 8);
      g.fillStyle(dark, 1); g.fillRoundedRect(25, 5, 70, 30, 15);
      g.fillStyle(0xFFE0BD, 1);
      g.fillRoundedRect(5, 80, 22, 50, 10); g.fillRoundedRect(93, 80, 22, 50, 10);
      g.fillRoundedRect(30, 145, 22, 45, 10); g.fillRoundedRect(68, 145, 22, 45, 10);
      g.fillStyle(dark, 1);
      g.fillRoundedRect(25, 180, 30, 15, 7); g.fillRoundedRect(65, 180, 30, 15, 7);
      g.generateTexture(key, 120, 200);
    }
    
    makeFurniture(g) {
      // Bed
      g.clear(); g.fillStyle(0x8D6E63, 1); g.fillRoundedRect(0, 60, 300, 150, 10);
      g.fillStyle(0xE3F2FD, 1); g.fillRoundedRect(10, 10, 280, 80, 8);
      g.fillStyle(0xFFFFFF, 1); g.fillRoundedRect(20, 20, 80, 50, 15);
      g.generateTexture('furniture_bed', 300, 210);
      
      // Chair
      g.clear(); g.fillStyle(0x8D6E63, 1);
      g.fillRect(20, 0, 60, 120); g.fillRect(0, 80, 100, 20);
      g.fillRect(10, 100, 15, 60); g.fillRect(75, 100, 15, 60);
      g.generateTexture('furniture_chair', 100, 160);
      
      // Table
      g.clear(); g.fillStyle(0xA1887F, 1);
      g.fillRect(0, 0, 250, 20); g.fillRect(20, 20, 15, 100); g.fillRect(215, 20, 15, 100);
      g.generateTexture('furniture_table', 250, 120);
      
      // Bathtub
      g.clear(); g.fillStyle(0xE0E0E0, 1); g.fillRoundedRect(0, 30, 300, 170, 20);
      g.fillStyle(0xB3E5FC, 1); g.fillRoundedRect(20, 50, 260, 130, 15);
      g.fillStyle(0x9E9E9E, 1); g.fillCircle(250, 20, 15); g.fillRect(240, 0, 20, 30);
      g.generateTexture('furniture_bathtub', 300, 200);
      
      // Toys
      g.clear(); g.fillStyle(0xFF5252, 1); g.fillRect(0, 30, 40, 40);
      g.fillStyle(0x448AFF, 1); g.fillRect(50, 30, 40, 40);
      g.fillStyle(0x69F0AE, 1); g.fillRect(25, 0, 40, 40);
      g.generateTexture('furniture_toys', 100, 70);
      
      // TV
      g.clear(); g.fillStyle(0x37474F, 1); g.fillRoundedRect(0, 0, 200, 130, 8);
      g.fillStyle(0x4FC3F7, 1); g.fillRect(10, 10, 180, 100);
      g.fillStyle(0x546E7A, 1); g.fillRect(70, 130, 60, 15); g.fillRect(50, 145, 100, 10);
      g.generateTexture('furniture_tv', 200, 155);
      
      // Cabinet
      g.clear(); g.fillStyle(0x8D6E63, 1); g.fillRoundedRect(0, 0, 150, 250, 5);
      g.lineStyle(2, 0x6D4C41, 1); g.lineBetween(0, 125, 150, 125);
      g.fillStyle(0xFFD54F, 1); g.fillCircle(130, 62, 8); g.fillCircle(130, 187, 8);
      g.generateTexture('furniture_cabinet', 150, 250);
      
      // Apple
      g.clear(); g.fillStyle(0xF44336, 1); g.fillCircle(25, 30, 22);
      g.fillStyle(0x4CAF50, 1); g.fillRect(22, 5, 6, 15);
      g.generateTexture('food_apple', 50, 55);
      
      // Bottle
      g.clear(); g.fillStyle(0xBBDEFB, 1); g.fillRoundedRect(5, 20, 30, 50, 5);
      g.fillStyle(0xFFFFFF, 1); g.fillRect(12, 5, 16, 20);
      g.fillStyle(0xFFECB3, 1); g.fillRoundedRect(8, 35, 24, 30, 3);
      g.generateTexture('food_bottle', 40, 70);
      
      // Soap
      g.clear(); g.fillStyle(0xE1BEE7, 1); g.fillRoundedRect(0, 10, 60, 35, 10);
      g.fillStyle(0xFFFFFF, 0.7);
      g.fillCircle(50, 5, 8); g.fillCircle(60, 15, 6); g.fillCircle(45, 0, 5);
      g.generateTexture('item_soap', 70, 50);
      
      // Toothbrush
      g.clear(); g.fillStyle(0x4CAF50, 1); g.fillRoundedRect(0, 12, 70, 12, 5);
      g.fillStyle(0xFFFFFF, 1); g.fillRect(60, 8, 20, 20);
      g.generateTexture('item_toothbrush', 80, 35);
    }
    
    drawStar(g, cx, cy, points, outerR, innerR) {
      const step = Math.PI / points;
      g.beginPath();
      for (let i = 0; i < 2 * points; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = i * step - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.closePath(); g.fillPath();
    }
  }

  // ============ PRELOAD SCENE ============
  class PreloadScene extends Phaser.Scene {
    constructor() { super({ key: CONFIG.SCENES.PRELOAD }); }
    
    create() {
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
      const cx = W / 2, cy = H / 2;
      
      // Background
      const bg = this.add.graphics();
      bg.fillStyle(0x667eea, 1); bg.fillRect(0, 0, W, H);
      const bg2 = this.add.graphics();
      bg2.fillStyle(0x764ba2, 1); bg2.fillTriangle(0, 0, W, 0, W, H);
      
      // Title
      this.add.text(cx, cy - 180, 'Baby Care World', {
        fontSize: '72px', fontFamily: 'Arial', color: '#FFFFFF',
        fontStyle: 'bold', stroke: '#000000', strokeThickness: 6
      }).setOrigin(0.5);
      
      this.add.text(cx, cy - 100, 'عالم رعاية الأطفال', {
        fontSize: '36px', fontFamily: 'Arial', color: '#FFD93D', fontStyle: 'bold'
      }).setOrigin(0.5);
      
      // Characters
      const boy = this.add.image(cx - 150, cy + 80, 'baby_boy').setScale(1.2);
      const girl = this.add.image(cx + 150, cy + 80, 'baby_girl').setScale(1.2);
      
      this.tweens.add({ targets: boy, y: cy + 50, duration: 800, repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: girl, y: cy + 50, duration: 800, delay: 400, repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
      
      // Loading bar
      const barW = 400, barH = 20, barX = cx - barW / 2, barY = cy + 250;
      const barBg = this.add.graphics();
      barBg.fillStyle(0x000000, 0.3); barBg.fillRoundedRect(barX - 5, barY - 5, barW + 10, barH + 10, 15);
      const barFill = this.add.graphics();
      
      const loadText = this.add.text(cx, barY + 50, 'جاري التحميل...', {
        fontSize: '24px', fontFamily: 'Arial', color: '#FFFFFF'
      }).setOrigin(0.5);
      
      let progress = 0;
      const timer = this.time.addEvent({
        delay: 50,
        callback: () => {
          progress += Math.random() * 5 + 2;
          if (progress >= 100) {
            progress = 100;
            timer.remove();
            loadText.setText('!مرحباً بك');
            this.time.delayedCall(800, () => {
              this.cameras.main.fadeOut(500, 0, 0, 0);
              this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(CONFIG.SCENES.MENU));
            });
          }
          barFill.clear();
          barFill.fillStyle(0x4CAF50, 1);
          barFill.fillRoundedRect(barX, barY, (barW * progress) / 100, barH, 10);
          loadText.setText('جاري التحميل... ' + Math.floor(progress) + '%');
        },
        repeat: -1
      });
    }
  }

  // ============ MENU SCENE ============
  class MenuScene extends Phaser.Scene {
    constructor() { super({ key: CONFIG.SCENES.MENU }); this.save = new SaveManager(); }
    
    create() {
      this.save.init();
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
      const cx = W / 2;
      
      // Background
      const bg = this.add.graphics();
      bg.fillStyle(0x87CEEB, 1); bg.fillRect(0, 0, W, H);
      
      // Ground
      const ground = this.add.graphics();
      ground.fillStyle(0x81C784, 1); ground.fillRect(0, H * 0.78, W, H * 0.22);
      ground.fillStyle(0x66BB6A, 1);
      for (let x = 0; x < W; x += 200) ground.fillEllipse(x + 100, H * 0.78, 250, 60);
      
      // Clouds
      for (let i = 0; i < 5; i++) {
        const cloud = this.add.graphics();
        cloud.fillStyle(0xFFFFFF, 0.85);
        cloud.fillEllipse(0, 0, 150, 60);
        cloud.fillEllipse(-40, -10, 90, 45);
        cloud.fillEllipse(50, -5, 80, 40);
        cloud.setPosition(Math.random() * W, 60 + Math.random() * 200);
        this.tweens.add({
          targets: cloud, x: cloud.x + 100,
          duration: 10000 + Math.random() * 8000, repeat: -1, yoyo: true, ease: 'Sine.easeInOut'
        });
      }
      
      // Sun
      const sun = this.add.graphics();
      sun.fillStyle(0xFFD93D, 1); sun.fillCircle(0, 0, 60);
      sun.setPosition(W - 150, 120);
      this.tweens.add({ targets: sun, scale: 1.1, duration: 2000, repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
      
      // Title
      this.add.text(cx, 150, 'Baby Care World', {
        fontSize: '72px', fontFamily: 'Arial', color: '#FFFFFF',
        fontStyle: 'bold', stroke: '#E91E63', strokeThickness: 8
      }).setOrigin(0.5);
      
      this.add.text(cx, 230, '🍼 عالم رعاية الأطفال 🍼', {
        fontSize: '32px', fontFamily: 'Arial', color: '#FFD93D', fontStyle: 'bold'
      }).setOrigin(0.5);
      
      // Buttons
      this.createButton(cx, 400, '🎮  ابدأ اللعب', 0x4CAF50, 0x388E3C, () => this.startGame());
      this.createButton(cx, 520, '⚙️  الإعدادات', 0x607D8B, 0x455A64, () => this.openSettings());
      this.createButton(cx, 640, '👗  متجر الملابس', 0xFF9800, 0xF57C00, () => this.showToast('قريباً! 🛍️'));
      
      // Characters
      const boy = this.add.image(200, H - 200, 'baby_boy').setScale(1.5);
      const girl = this.add.image(W - 200, H - 200, 'baby_girl').setScale(1.5);
      this.tweens.add({ targets: boy, y: H - 220, duration: 1200, repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: girl, y: H - 220, duration: 1200, delay: 600, repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
      
      // Currency display
      const data = this.save.get();
      this.add.text(W - 150, 50, '🪙 ' + data.coins, { fontSize: '24px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold' });
      this.add.text(W - 300, 50, '⭐ ' + data.stars, { fontSize: '24px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold' });
    }
    
    createButton(x, y, text, color, border, callback) {
      const btn = this.add.container(x, y);
      const bg = this.add.graphics();
      bg.fillStyle(color, 1); bg.fillRoundedRect(-160, -40, 320, 80, 20);
      bg.lineStyle(4, border, 1); bg.strokeRoundedRect(-160, -40, 320, 80, 20);
      const txt = this.add.text(0, 0, text, {
        fontSize: '32px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
      }).setOrigin(0.5);
      btn.add([bg, txt]);
      
      const zone = this.add.zone(0, 0, 320, 80).setInteractive({ useHandCursor: true });
      btn.add(zone);
      
      zone.on('pointerdown', () => {
        this.tweens.add({ targets: btn, scaleX: 0.95, scaleY: 0.95, duration: 50, yoyo: true, onComplete: callback });
      });
      zone.on('pointerover', () => { this.tweens.add({ targets: btn, scaleX: 1.05, scaleY: 1.05, duration: 100 }); });
      zone.on('pointerout', () => { this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 100 }); });
      
      this.tweens.add({ targets: btn, y: y - 3, duration: 1500 + Math.random() * 500, repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
    }
    
    startGame() {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(CONFIG.SCENES.CHARACTER_SELECT));
    }
    
    openSettings() {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(CONFIG.SCENES.SETTINGS));
    }
    
    showToast(msg) {
      const toast = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 100, msg, {
        fontSize: '28px', fontFamily: 'Arial', color: '#FFFFFF',
        backgroundColor: '#000000CC', padding: { x: 20, y: 12 }, fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0).setDepth(1000);
      
      this.tweens.add({
        targets: toast, alpha: 1, y: CONFIG.HEIGHT - 130, duration: 300, ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: toast, alpha: 0, y: CONFIG.HEIGHT - 160, delay: 1500, duration: 300,
            onComplete: () => toast.destroy()
          });
        }
      });
    }
  }

  // ============ CHARACTER SELECT ============
  class CharacterSelectScene extends Phaser.Scene {
    constructor() { super({ key: CONFIG.SCENES.CHARACTER_SELECT }); this.save = new SaveManager(); }
    
    create() {
      this.save.init();
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
      const cx = W / 2;
      
      this.add.graphics().fillStyle(0xFCE4EC, 1).fillRect(0, 0, W, H);
      
      this.add.text(cx, 80, 'اختر شخصيتك', {
        fontSize: '48px', fontFamily: 'Arial', color: '#E91E63', fontStyle: 'bold'
      }).setOrigin(0.5);
      
      this.selectedChar = this.save.get().selectedCharacter;
      
      // Boy card
      this.createCharCard(cx - 300, H / 2, 'baby_boy', '👦 ولد', 0x4FC3F7);
      // Girl card
      this.createCharCard(cx + 300, H / 2, 'baby_girl', ' بنت', 0xF48FB1);
      
      // Confirm button
      const confirmBtn = this.add.container(cx, H - 100);
      const bg = this.add.graphics();
      bg.fillStyle(0x4CAF50, 1); bg.fillRoundedRect(-120, -25, 240, 50, 15);
      const txt = this.add.text(0, 0, '✅ تأكيد الاختيار', { fontSize: '26px', fontFamily: 'Arial', color: '#FFF', fontStyle: 'bold' }).setOrigin(0.5);
      confirmBtn.add([bg, txt]);
      const zone = this.add.zone(0, 0, 240, 50).setInteractive({ useHandCursor: true });
      confirmBtn.add(zone);
      zone.on('pointerdown', () => {
        this.save.data.selectedCharacter = this.selectedChar;
        this.save.save();
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(CONFIG.SCENES.HOUSE));
      });
      
      // Back button
      const backBtn = this.add.container(120, H - 100);
      const bg2 = this.add.graphics();
      bg2.fillStyle(0xFF7043, 1); bg2.fillRoundedRect(-60, -25, 120, 50, 15);
      const txt2 = this.add.text(0, 0, '← رجوع', { fontSize: '22px', fontFamily: 'Arial', color: '#FFF', fontStyle: 'bold' }).setOrigin(0.5);
      backBtn.add([bg2, txt2]);
      const zone2 = this.add.zone(0, 0, 120, 50).setInteractive({ useHandCursor: true });
      backBtn.add(zone2);
      zone2.on('pointerdown', () => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(CONFIG.SCENES.MENU));
      });
    }
    
    createCharCard(x, y, charKey, label, color) {
      const container = this.add.container(x, y);
      const bg = this.add.graphics();
      bg.fillStyle(0xFFFFFF, 0.9); bg.fillRoundedRect(-150, -250, 300, 500, 20);
      bg.lineStyle(4, color, 1); bg.strokeRoundedRect(-150, -250, 300, 500, 20);
      
      const char = this.add.image(0, -50, charKey).setScale(2);
      this.tweens.add({ targets: char, y: -70, duration: 1000, repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
      
      const name = this.add.text(0, 120, label, { fontSize: '36px', fontFamily: 'Arial', color: '#333', fontStyle: 'bold' }).setOrigin(0.5);
      container.add([bg, char, name]);
      
      const zone = this.add.zone(0, 0, 300, 500).setInteractive({ useHandCursor: true });
      container.add(zone);
      zone.on('pointerdown', () => {
        this.selectedChar = charKey;
        this.showToast('تم اختيار: ' + label);
      });
    }
    
    showToast(msg) {
      const toast = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 150, msg, {
        fontSize: '24px', fontFamily: 'Arial', color: '#FFF', backgroundColor: '#000000CC', padding: { x: 20, y: 10 }
      }).setOrigin(0.5).setAlpha(0).setDepth(1000);
      this.tweens.add({
        targets: toast, alpha: 1, duration: 300,
        onComplete: () => this.tweens.add({ targets: toast, alpha: 0, delay: 1000, duration: 300, onComplete: () => toast.destroy() })
      });
    }
  }

  // ============ HOUSE SCENE ============
  class HouseScene extends Phaser.Scene {
    constructor() { super({ key: CONFIG.SCENES.HOUSE }); this.save = new SaveManager(); this.needs = null; }
    
    create() {
      this.save.init();
      this.needs = new NeedsManager(this.save);
      
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
      this.worldWidth = W * 2;
      
      // Background
      const bg = this.add.graphics();
      bg.fillStyle(0xFFF8E1, 1); bg.fillRect(0, 0, this.worldWidth, H);
      bg.fillStyle(0xA1887F, 1); bg.fillRect(0, H * 0.78, this.worldWidth, H * 0.22);
      
      // Rooms
      const rooms = [
        { key: 'living', name: '🛋️ غرفة المعيشة', scene: CONFIG.SCENES.LIVING_ROOM, color: 0xFFE4B5 },
        { key: 'kitchen', name: '🍳 المطبخ', scene: CONFIG.SCENES.KITCHEN, color: 0xFFDAB9 },
        { key: 'bathroom', name: '🛁 الحمام', scene: CONFIG.SCENES.BATHROOM, color: 0xE0F7FA },
        { key: 'bedroom', name: '🛏️ غرفة النوم', scene: CONFIG.SCENES.BEDROOM, color: 0xF3E5F5 },
        { key: 'playroom', name: '🧸 غرفة الألعاب', scene: CONFIG.SCENES.PLAYROOM, color: 0xFFF9C4 },
        { key: 'garden', name: '🌳 الحديقة', scene: CONFIG.SCENES.GARDEN, color: 0xC8E6C9 }
      ];
      
      const roomW = this.worldWidth / 3;
      
      rooms.forEach((room, i) => {
        const rx = (i % 3) * roomW;
        const ry = Math.floor(i / 3) * (H / 2);
        const cx = rx + roomW / 2;
        const cy = ry + H / 4;
        
        // Room background
        const roomBg = this.add.graphics();
        roomBg.fillStyle(room.color, 0.5);
        roomBg.fillRoundedRect(rx + 20, ry + 20, roomW - 40, H / 2 - 40, 20);
        
        // Room label
        this.add.text(cx, cy - 30, room.name, {
          fontSize: '28px', fontFamily: 'Arial', color: '#333', fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Interactive zone
        const zone = this.add.zone(cx, cy, roomW - 40, H / 2 - 40).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => this.enterRoom(room.scene));
        
        zone.on('pointerover', () => {
          roomBg.clear();
          roomBg.fillStyle(room.color, 0.8);
          roomBg.fillRoundedRect(rx + 20, ry + 20, roomW - 40, H / 2 - 40, 20);
        });
        
        zone.on('pointerout', () => {
          roomBg.clear();
          roomBg.fillStyle(room.color, 0.5);
          roomBg.fillRoundedRect(rx + 20, ry + 20, roomW - 40, H / 2 - 40, 20);
        });
      });
      
      // Baby character
      const charKey = this.save.get().selectedCharacter;
      this.baby = this.add.image(W / 2, H * 0.6, charKey)
        .setScale(1.3).setOrigin(0.5).setDepth(10)
        .setInteractive({ draggable: true });
      
      this.tweens.add({ targets: this.baby, y: this.baby.y - 8, duration: 1200, repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
      
      this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        if (gameObject === this.baby) {
          gameObject.x = dragX;
          gameObject.y = Phaser.Math.Clamp(dragY, 200, H * 0.75);
        }
      });
      
      // HUD
      this.createHUD();
      
      // Back button
      this.createBackButton();
      
      // Needs decay
      this.needsTimer = this.time.addEvent({
        delay: 5000, loop: true,
        callback: () => { this.needs.tick(); this.updateHUD(); }
      });
    }
    
    createHUD() {
      const W = CONFIG.WIDTH;
      const data = this.save.get();
      this.add.text(W - 150, 50, '🪙 ' + data.coins, { fontSize: '24px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold' }).setDepth(100);
      this.add.text(W - 300, 50, '⭐ ' + data.stars, { fontSize: '24px', fontFamily: 'Arial', color: '#FFD700', fontStyle: 'bold' }).setDepth(100);
    }
    
    updateHUD() {
      // Update HUD with current needs
    }
    
    createBackButton() {
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
      const btn = this.add.container(W - 120, H - 50);
      const bg = this.add.graphics();
      bg.fillStyle(0xFF7043, 1); bg.fillRoundedRect(-70, -28, 140, 56, 15);
      const txt = this.add.text(0, 0, ' القائمة', { fontSize: '20px', fontFamily: 'Arial', color: '#FFF', fontStyle: 'bold' }).setOrigin(0.5);
      btn.add([bg, txt]);
      const zone = this.add.zone(0, 0, 140, 56).setInteractive({ useHandCursor: true });
      btn.add(zone);
      zone.on('pointerdown', () => {
        this.save.save();
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(CONFIG.SCENES.MENU));
      });
    }
    
    enterRoom(sceneKey) {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(sceneKey));
    }
    
    shutdown() {
      if (this.needsTimer) this.needsTimer.remove();
    }
  }

  // ============ ROOM SCENES (Simple versions) ============
  class LivingRoomScene extends Phaser.Scene {
    constructor() { super({ key: CONFIG.SCENES.LIVING_ROOM }); this.save = new SaveManager(); }
    create() {
      this.save.init();
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
      this.add.graphics().fillStyle(0xFFE4B5, 1).fillRect(0, 0, W, H);
      this.add.graphics().fillStyle(0xA1887F, 1).fillRect(0, H * 0.75, W, H * 0.25);
      
      this.add.text(W / 2, 80, '🛋️ غرفة المعيشة', { fontSize: '36px', fontFamily: 'Arial', color: '#333', fontStyle: 'bold' }).setOrigin(0.5);
      
      // TV
      const tv = this.add.image(W / 2, H / 2, 'furniture_tv').setScale(2).setInteractive({ useHandCursor: true });
      tv.on('pointerdown', () => this.showToast(' التلفاز يعمل!'));
      
      // Couch
      this.add.image(W * 0.7, H * 0.65, 'furniture_chair').setScale(3);
      
      // Baby
      const charKey = this.save.get().selectedCharacter;
      this.baby = this.add.image(W * 0.3, H * 0.65, charKey).setScale(1.3);
      
      this.addBackButton();
    }
    addBackButton() {
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
      const btn = this.add.container(100, H - 50);
      const bg = this.add.graphics();
      bg.fillStyle(0xFF7043, 1); bg.fillRoundedRect(-70, -28, 140, 56, 15);
      const txt = this.add.text(0, 0, '🏠 المنزل', { fontSize: '20px', fontFamily: 'Arial', color: '#FFF', fontStyle: 'bold' }).setOrigin(0.5);
      btn.add([bg, txt]);
      const zone = this.add.zone(0, 0, 140, 56).setInteractive({ useHandCursor: true });
      btn.add(zone);
      zone.on('pointerdown', () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(CONFIG.SCENES.HOUSE));
      });
    }
    showToast(msg) {
      const toast = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 100, msg, {
        fontSize: '28px', fontFamily: 'Arial', color: '#FFF', backgroundColor: '#000000CC', padding: { x: 20, y: 12 }
      }).setOrigin(0.5).setAlpha(0).setDepth(1000);
      this.tweens.add({
        targets: toast, alpha: 1, duration: 300,
        onComplete: () => this.tweens.add({ targets: toast, alpha: 0, delay: 1500, duration: 300, onComplete: () => toast.destroy() })
      });
    }
  }

  class KitchenScene extends Phaser.Scene {
    constructor() { super({ key: CONFIG.SCENES.KITCHEN }); this.save = new SaveManager(); }
    create() {
      this.save.init();
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
      this.add.graphics().fillStyle(0xFFDAB9, 1).fillRect(0, 0, W, H);
      this.add.graphics().fillStyle(0xBCAAA4, 1).fillRect(0, H * 0.75, W, H * 0.25);
      
      this.add.text(W / 2, 80, '🍳 المطبخ', { fontSize: '36px', fontFamily: 'Arial', color: '#333', fontStyle: 'bold' }).setOrigin(0.5);
      
      // Food items
      const apple = this.add.image(W * 0.3, H * 0.5, 'food_apple').setScale(3).setInteractive({ draggable: true });
      const bottle = this.add.image(W * 0.5, H * 0.5, 'food_bottle').setScale(3).setInteractive({ draggable: true });
      
      // Baby
      const charKey = this.save.get().selectedCharacter;
      this.baby = this.add.image(W * 0.7, H * 0.65, charKey).setScale(1.3);
      
      this.input.on('drag', (pointer, obj, dragX, dragY) => { obj.x = dragX; obj.y = dragY; });
      this.input.on('dragend', (pointer, obj) => {
        const dist = Phaser.Math.Distance.Between(obj.x, obj.y, this.baby.x, this.baby.y);
        if (dist < 100) {
          this.showToast('🍎 الطفل يأكل!');
          obj.x = obj.x < W / 2 ? W * 0.3 : W * 0.5;
          obj.y = H * 0.5;
        } else {
          obj.x = obj.x < W / 2 ? W * 0.3 : W * 0.5;
          obj.y = H * 0.5;
        }
      });
      
      this.addBackButton();
    }
    addBackButton() {
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
      const btn = this.add.container(100, H - 50);
      const bg = this.add.graphics();
      bg.fillStyle(0xFF7043, 1); bg.fillRoundedRect(-70, -28, 140, 56, 15);
      const txt = this.add.text(0, 0, '🏠 المنزل', { fontSize: '20px', fontFamily: 'Arial', color: '#FFF', fontStyle: 'bold' }).setOrigin(0.5);
      btn.add([bg, txt]);
      const zone = this.add.zone(0, 0, 140, 56).setInteractive({ useHandCursor: true });
      btn.add(zone);
      zone.on('pointerdown', () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(CONFIG.SCENES.HOUSE));
      });
    }
    showToast(msg) {
      const toast = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 100, msg, {
        fontSize: '28px', fontFamily: 'Arial', color: '#FFF', backgroundColor: '#000000CC', padding: { x: 20, y: 12 }
      }).setOrigin(0.5).setAlpha(0).setDepth(1000);
      this.tweens.add({
        targets: toast, alpha: 1, duration: 300,
        onComplete: () => this.tweens.add({ targets: toast, alpha: 0, delay: 1500, duration: 300, onComplete: () => toast.destroy() })
      });
    }
  }

  class BathroomScene extends Phaser.Scene {
    constructor() { super({ key: CONFIG.SCENES.BATHROOM }); this.save = new SaveManager(); }
    create() {
      this.save.init();
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
      this.add.graphics().fillStyle(0xE0F7FA, 1).fillRect(0, 0, W, H);
      this.add.graphics().fillStyle(0xB2DFDB, 1).fillRect(0, H * 0.75, W, H * 0.25);
      
      this.add.text(W / 2, 80, '🛁 الحمام', { fontSize: '36px', fontFamily: 'Arial', color: '#333', fontStyle: 'bold' }).setOrigin(0.5);
      
      // Bathtub
      this.add.image(W / 2, H * 0.6, 'furniture_bathtub').setScale(2).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.showToast('🛁 حوض الاستحمام'));
      
      // Soap
      const soap = this.add.image(W * 0.3, H * 0.5, 'item_soap').setScale(3).setInteractive({ draggable: true });
      
      // Baby
      const charKey = this.save.get().selectedCharacter;
      this.baby = this.add.image(W * 0.7, H * 0.65, charKey).setScale(1.3);
      
      this.input.on('drag', (pointer, obj, dragX, dragY) => { obj.x = dragX; obj.y = dragY; });
      this.input.on('dragend', (pointer, obj) => {
        const dist = Phaser.Math.Distance.Between(obj.x, obj.y, this.baby.x, this.baby.y);
        if (dist < 100) {
          this.showToast('🧼 الطفل يستحم!');
          obj.x = W * 0.3; obj.y = H * 0.5;
        } else {
          obj.x = W * 0.3; obj.y = H * 0.5;
        }
      });
      
      this.addBackButton();
    }
    addBackButton() {
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
      const btn = this.add.container(100, H - 50);
      const bg = this.add.graphics();
      bg.fillStyle(0xFF7043, 1); bg.fillRoundedRect(-70, -28, 140, 56, 15);
      const txt = this.add.text(0, 0, '🏠 المنزل', { fontSize: '20px', fontFamily: 'Arial', color: '#FFF', fontStyle: 'bold' }).setOrigin(0.5);
      btn.add([bg, txt]);
      const zone = this.add.zone(0, 0, 140, 56).setInteractive({ useHandCursor: true });
      btn.add(zone);
      zone.on('pointerdown', () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(CONFIG.SCENES.HOUSE));
      });
    }
    showToast(msg) {
      const toast = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 100, msg, {
        fontSize: '28px', fontFamily: 'Arial', color: '#FFF', backgroundColor: '#000000CC', padding: { x: 20, y: 12 }
      }).setOrigin(0.5).setAlpha(0).setDepth(1000);
      this.tweens.add({
        targets: toast, alpha: 1, duration: 300,
        onComplete: () => this.tweens.add({ targets: toast, alpha: 0, delay: 1500, duration: 300, onComplete: () => toast.destroy() })
      });
    }
  }

  class BedroomScene extends Phaser.Scene {
    constructor() { super({ key: CONFIG.SCENES.BEDROOM }); this.save = new SaveManager(); }
    create() {
      this.save.init();
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
      this.add.graphics().fillStyle(0xF3E5F5, 1).fillRect(0, 0, W, H);
      this.add.graphics().fillStyle(0xCE93D8, 1).fillRect(0, H * 0.75, W, H * 0.25);
      
      this.add.text(W / 2, 80, '🛏️ غرفة النوم', { fontSize: '36px', fontFamily: 'Arial', color: '#333', fontStyle: 'bold' }).setOrigin(0.5);
      
      // Bed
      const bed = this.add.image(W / 2, H * 0.6, 'furniture_bed').setScale(1.5).setInteractive({ useHandCursor: true });
      bed.on('pointerdown', () => {
        const charKey = this.save.get().selectedCharacter;
        this.baby.setTexture(charKey + '_sleep');
        this.showToast(' الطفل نائم... تصبح على خير!');
        this.time.delayedCall(3000, () => {
          this.baby.setTexture(charKey);
          this.showToast('☀️ استيقظ الطفل!');
        });
      });
      
      // Baby
      const charKey = this.save.get().selectedCharacter;
      this.baby = this.add.image(W * 0.3, H * 0.65, charKey).setScale(1.3);
      
      this.addBackButton();
    }
    addBackButton() {
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
      const btn = this.add.container(100, H - 50);
      const bg = this.add.graphics();
      bg.fillStyle(0xFF7043, 1); bg.fillRoundedRect(-70, -28, 140, 56, 15);
      const txt = this.add.text(0, 0, ' المنزل', { fontSize: '20px', fontFamily: 'Arial', color: '#FFF', fontStyle: 'bold' }).setOrigin(0.5);
      btn.add([bg, txt]);
      const zone = this.add.zone(0, 0, 140, 56).setInteractive({ useHandCursor: true });
      btn.add(zone);
      zone.on('pointerdown', () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(CONFIG.SCENES.HOUSE));
      });
    }
    showToast(msg) {
      const toast = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 100, msg, {
        fontSize: '28px', fontFamily: 'Arial', color: '#FFF', backgroundColor: '#000000CC', padding: { x: 20, y: 12 }
      }).setOrigin(0.5).setAlpha(0).setDepth(1000);
      this.tweens.add({
        targets: toast, alpha: 1, duration: 300,
        onComplete: () => this.tweens.add({ targets: toast, alpha: 0, delay: 1500, duration: 300, onComplete: () => toast.destroy() })
      });
    }
  }

  class PlayroomScene extends Phaser.Scene {
    constructor() { super({ key: CONFIG.SCENES.PLAYROOM }); this.save = new SaveManager(); }
    create() {
      this.save.init();
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
      this.add.graphics().fillStyle(0xFFF9C4, 1).fillRect(0, 0, W, H);
      this.add.graphics().fillStyle(0xFFF176, 1).fillRect(0, H * 0.75, W, H * 0.25);
      
      this.add.text(W / 2, 80, '🧸 غرفة الألعاب', { fontSize: '36px', fontFamily: 'Arial', color: '#333', fontStyle: 'bold' }).setOrigin(0.5);
      
      // Toys
      const toys = this.add.image(W / 2, H * 0.6, 'furniture_toys').setScale(4).setInteractive({ useHandCursor: true });
      toys.on('pointerdown', () => this.showToast('🧸 الطفل يلعب بالألعاب!'));
      
      // Baby
      const charKey = this.save.get().selectedCharacter;
      this.baby = this.add.image(W * 0.3, H * 0.65, charKey).setScale(1.3);
      
      this.addBackButton();
    }
    addBackButton() {
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
      const btn = this.add.container(100, H - 50);
      const bg = this.add.graphics();
      bg.fillStyle(0xFF7043, 1); bg.fillRoundedRect(-70, -28, 140, 56, 15);
      const txt = this.add.text(0, 0, '🏠 المنزل', { fontSize: '20px', fontFamily: 'Arial', color: '#FFF', fontStyle: 'bold' }).setOrigin(0.5);
      btn.add([bg, txt]);
      const zone = this.add.zone(0, 0, 140, 56).setInteractive({ useHandCursor: true });
      btn.add(zone);
      zone.on('pointerdown', () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(CONFIG.SCENES.HOUSE));
      });
    }
    showToast(msg) {
      const toast = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 100, msg, {
        fontSize: '28px', fontFamily: 'Arial', color: '#FFF', backgroundColor: '#000000CC', padding: { x: 20, y: 12 }
      }).setOrigin(0.5).setAlpha(0).setDepth(1000);
      this.tweens.add({
        targets: toast, alpha: 1, duration: 300,
        onComplete: () => this.tweens.add({ targets: toast, alpha: 0, delay: 1500, duration: 300, onComplete: () => toast.destroy() })
      });
    }
  }

  class GardenScene extends Phaser.Scene {
    constructor() { super({ key: CONFIG.SCENES.GARDEN }); this.save = new SaveManager(); }
    create() {
      this.save.init();
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
      this.add.graphics().fillStyle(0x87CEEB, 1).fillRect(0, 0, W, H);
      this.add.graphics().fillStyle(0x81C784, 1).fillRect(0, H * 0.7, W, H * 0.3);
      
      this.add.text(W / 2, 80, '🌳 الحديقة', { fontSize: '36px', fontFamily: 'Arial', color: '#333', fontStyle: 'bold' }).setOrigin(0.5);
      
      // Tree
      const tree = this.add.graphics();
      tree.fillStyle(0x795548, 1); tree.fillRect(W * 0.2 - 15, H * 0.4, 30, H * 0.3);
      tree.fillStyle(0x388E3C, 1);
      tree.fillCircle(W * 0.2, H * 0.35, 60);
      tree.fillCircle(W * 0.2 - 40, H * 0.4, 40);
      tree.fillCircle(W * 0.2 + 40, H * 0.4, 40);
      
      // Flowers
      for (let i = 0; i < 10; i++) {
        const fx = 100 + Math.random() * (W - 200);
        const fy = H * 0.75 + Math.random() * (H * 0.2);
        const flower = this.add.graphics();
        const colors = [0xFF4081, 0xFFEB3B, 0x7C4DFF, 0xFF6D00];
        flower.fillStyle(colors[i % 4], 1);
        flower.fillCircle(0, -10, 8);
        flower.fillStyle(0xFFEB3B, 1);
        flower.fillCircle(0, -10, 3);
        flower.lineStyle(2, 0x388E3C, 1);
        flower.lineBetween(0, 0, 0, 20);
        flower.setPosition(fx, fy);
        this.tweens.add({ targets: flower, rotation: 0.1, duration: 1500 + Math.random() * 1000, repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
      }
      
      // Baby
      const charKey = this.save.get().selectedCharacter;
      this.baby = this.add.image(W * 0.5, H * 0.65, charKey).setScale(1.3);
      
      this.addBackButton();
    }
    addBackButton() {
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
      const btn = this.add.container(100, H - 50);
      const bg = this.add.graphics();
      bg.fillStyle(0xFF7043, 1); bg.fillRoundedRect(-70, -28, 140, 56, 15);
      const txt = this.add.text(0, 0, '🏠 المنزل', { fontSize: '20px', fontFamily: 'Arial', color: '#FFF', fontStyle: 'bold' }).setOrigin(0.5);
      btn.add([bg, txt]);
      const zone = this.add.zone(0, 0, 140, 56).setInteractive({ useHandCursor: true });
      btn.add(zone);
      zone.on('pointerdown', () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(CONFIG.SCENES.HOUSE));
      });
    }
  }

  class SettingsScene extends Phaser.Scene {
    constructor() { super({ key: CONFIG.SCENES.SETTINGS }); this.save = new SaveManager(); }
    create() {
      this.save.init();
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
      const cx = W / 2;
      
      this.add.graphics().fillStyle(0xE8EAF6, 1).fillRect(0, 0, W, H);
      
      this.add.text(cx, 60, '️ الإعدادات', {
        fontSize: '42px', fontFamily: 'Arial', color: '#333', fontStyle: 'bold'
      }).setOrigin(0.5);
      
      const panel = this.add.graphics();
      panel.fillStyle(0xFFFFFF, 0.9); panel.fillRoundedRect(cx - 350, 120, 700, H - 240, 20);
      panel.lineStyle(3, 0x9FA8DA, 1); panel.strokeRoundedRect(cx - 350, 120, 700, H - 240, 20);
      
      // Reset button
      const resetBtn = this.add.container(cx, H / 2);
      const bg = this.add.graphics();
      bg.fillStyle(0xF44336, 1); bg.fillRoundedRect(-120, -25, 240, 50, 15);
      const txt = this.add.text(0, 0, '🗑️ حذف جميع البيانات', { fontSize: '22px', fontFamily: 'Arial', color: '#FFF', fontStyle: 'bold' }).setOrigin(0.5);
      resetBtn.add([bg, txt]);
      const zone = this.add.zone(0, 0, 240, 50).setInteractive({ useHandCursor: true });
      resetBtn.add(zone);
      zone.on('pointerdown', () => {
        if (confirm('هل تريد حذف جميع البيانات؟')) {
          this.save.data = this.save.getDefault();
          this.save.save();
          this.showToast('تم حذف البيانات! ✅');
        }
      });
      
      // Back button
      const backBtn = this.add.container(W - 120, H - 50);
      const bg2 = this.add.graphics();
      bg2.fillStyle(0xFF7043, 1); bg2.fillRoundedRect(-70, -28, 140, 56, 15);
      const txt2 = this.add.text(0, 0, '→ رجوع', { fontSize: '22px', fontFamily: 'Arial', color: '#FFF', fontStyle: 'bold' }).setOrigin(0.5);
      backBtn.add([bg2, txt2]);
      const zone2 = this.add.zone(0, 0, 140, 56).setInteractive({ useHandCursor: true });
      backBtn.add(zone2);
      zone2.on('pointerdown', () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(CONFIG.SCENES.MENU));
      });
      
      this.add.text(cx, H - 150, 'Baby Care World v1.0.0', { fontSize: '20px', fontFamily: 'Arial', color: '#666' }).setOrigin(0.5);
    }
    showToast(msg) {
      const toast = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 100, msg, {
        fontSize: '28px', fontFamily: 'Arial', color: '#FFF', backgroundColor: '#000000CC', padding: { x: 20, y: 12 }
      }).setOrigin(0.5).setAlpha(0).setDepth(1000);
      this.tweens.add({
        targets: toast, alpha: 1, duration: 300,
        onComplete: () => this.tweens.add({ targets: toast, alpha: 0, delay: 1500, duration: 300, onComplete: () => toast.destroy() })
      });
    }
  }

  // ============ GAME CONFIG ============
  const gameConfig = {
    type: Phaser.CANVAS,
    width: CONFIG.WIDTH,
    height: CONFIG.HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
      activePointers: 3,
      touch: { capture: true }
    },
    scene: [
      BootScene,
      PreloadScene,
      MenuScene,
      CharacterSelectScene,
      HouseScene,
      LivingRoomScene,
      KitchenScene,
      BathroomScene,
      BedroomScene,
      PlayroomScene,
      GardenScene,
      SettingsScene
    ],
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 980 }, debug: false }
    }
  };

  // Start game
  try {
    const game = new Phaser.Game(gameConfig);
    
    game.events.once('ready', () => {
      const preLoader = document.getElementById('pre-loader');
      if (preLoader) {
        preLoader.classList.add('hidden');
        setTimeout(() => preLoader.remove(), 500);
      }
    });
  } catch (e) {
    console.error('Game failed to start:', e);
    const preLoader = document.getElementById('pre-loader');
    if (preLoader) {
      preLoader.innerHTML = '<h1 style="color:white;font-size:2rem;">⚠️ خطأ في تحميل اللعبة</h1>';
    }
  }
})();
