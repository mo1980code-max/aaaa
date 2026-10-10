// Baby Care World — a small, self-contained Phaser game.
// Character artwork is loaded from public/assets/characters/.
(function () {
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
      STORE: 'StoreScene',
      GUIDE: 'GuideScene',
      SETTINGS: 'SettingsScene',
      LIVING_ROOM: 'LivingRoomScene',
      KITCHEN: 'KitchenScene',
      BATHROOM: 'BathroomScene',
      BEDROOM: 'BedroomScene',
      PLAYROOM: 'PlayroomScene',
      GARDEN: 'GardenScene'
    }
  };

  const NEEDS = [
    { key: 'hunger', label: 'الجوع', icon: '🍽️', color: 0xFFB74D },
    { key: 'hygiene', label: 'النظافة', icon: '🛁', color: 0x4FC3F7 },
    { key: 'sleep', label: 'النوم', icon: '🌙', color: 0x9575CD },
    { key: 'energy', label: 'الطاقة', icon: '⚡', color: 0xFFD54F },
    { key: 'happiness', label: 'السعادة', icon: '💖', color: 0xF06292 }
  ];

  const ROOMS = [
    {
      id: 'living', scene: CONFIG.SCENES.LIVING_ROOM, title: 'غرفة المعيشة', emoji: '🛋️',
      description: 'شاهدوا التلفاز واستمتعوا بوقت هادئ.',
      color: 0xFFE4B5, floor: 0xD7B98E, action: 'play', amount: 20,
      actionLabel: '📺  شاهدوا برنامجاً ممتعاً', actionMessage: 'استمتع الطفل بوقت التلفاز!'
    },
    {
      id: 'kitchen', scene: CONFIG.SCENES.KITCHEN, title: 'المطبخ', emoji: '🍳',
      description: 'وجبة لذيذة وزجاجة حليب للصغير.',
      color: 0xFFF0DC, floor: 0xCBB7A2, action: 'feed', amount: 28,
      actionLabel: '🍼  قدّم وجبة للطفل', actionMessage: 'تناول الطفل وجبة شهية!'
    },
    {
      id: 'bathroom', scene: CONFIG.SCENES.BATHROOM, title: 'الحمّام', emoji: '🛁',
      description: 'حمّام دافئ وفقاعات مرحة.',
      color: 0xDDF6FA, floor: 0xA8DDE0, action: 'bath', amount: 32,
      actionLabel: '🧼  وقت الاستحمام', actionMessage: 'أصبح الطفل نظيفاً ومنتعشاً!'
    },
    {
      id: 'bedroom', scene: CONFIG.SCENES.BEDROOM, title: 'غرفة النوم', emoji: '🛏️',
      description: 'قيلولة قصيرة تعيد النشاط.',
      color: 0xF1E7FA, floor: 0xC8B3D4, action: 'sleep', amount: 36,
      actionLabel: '🌙  ساعد الطفل على النوم', actionMessage: 'نام الطفل بهدوء واستعاد طاقته!'
    },
    {
      id: 'playroom', scene: CONFIG.SCENES.PLAYROOM, title: 'غرفة الألعاب', emoji: '🧸',
      description: 'ألعاب ملوّنة ووقت مليء بالضحك.',
      color: 0xFFF7C7, floor: 0xE9D888, action: 'play', amount: 25,
      actionLabel: '🧸  العب مع الطفل', actionMessage: 'قضى الطفل وقتاً رائعاً في اللعب!'
    },
    {
      id: 'garden', scene: CONFIG.SCENES.GARDEN, title: 'الحديقة', emoji: '🌳',
      description: 'هواء نقي وزهور جميلة في الخارج.',
      color: 0xDDF3D7, floor: 0x81C784, action: 'play', amount: 22,
      actionLabel: '🌼  تنزّه والعب في الحديقة', actionMessage: 'استمتع الطفل بنزهة جميلة!'
    }
  ];

  const SHOP_ITEMS = [
    { id: 'snack', icon: '🍎', title: 'سلة وجبات', description: 'ترفع مقياس الجوع ٣٠ نقطة.', price: 25, use: needs => needs.feed(30) },
    { id: 'bubbles', icon: '🫧', title: 'فقاعات الاستحمام', description: 'ترفع مقياس النظافة ٣٥ نقطة.', price: 25, use: needs => needs.bath(35) },
    { id: 'blanket', icon: '🧸', title: 'بطانية ناعمة', description: 'ترفع مقياس النوم ٣٥ نقطة.', price: 25, use: needs => needs.sleep(35) },
    { id: 'toy', icon: '🎈', title: 'بالون ملوّن', description: 'يرفع مقياس السعادة ٣٠ نقطة.', price: 25, use: needs => needs.play(30) }
  ];

  let audioContext = null;

  // Persistent save data. Values from older or damaged saves are normalized.
  class SaveManager {
    constructor() {
      this.key = 'babyCareWorld_save';
      this.data = null;
    }

    getDefault() {
      return {
        version: 1,
        coins: 100,
        stars: 0,
        selectedCharacter: 'baby_boy',
        babyNeeds: { hunger: 80, hygiene: 90, sleep: 70, energy: 85, happiness: 100 },
        settings: { soundEnabled: true, animationsEnabled: true }
      };
    }

    normalize(raw) {
      const defaults = this.getDefault();
      const source = raw && typeof raw === 'object' ? raw : {};
      const rawNeeds = source.babyNeeds && typeof source.babyNeeds === 'object' ? source.babyNeeds : {};
      const rawSettings = source.settings && typeof source.settings === 'object' ? source.settings : {};
      const clampNeed = value => {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? Math.max(0, Math.min(100, numeric)) : 50;
      };
      const safeCount = value => {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0;
      };

      return {
        version: 1,
        coins: safeCount(source.coins ?? defaults.coins),
        stars: safeCount(source.stars ?? defaults.stars),
        selectedCharacter: source.selectedCharacter === 'baby_girl' ? 'baby_girl' : 'baby_boy',
        babyNeeds: Object.fromEntries(Object.keys(defaults.babyNeeds).map(key => [key, clampNeed(rawNeeds[key] ?? defaults.babyNeeds[key])])),
        settings: {
          soundEnabled: rawSettings.soundEnabled !== false,
          animationsEnabled: rawSettings.animationsEnabled !== false
        }
      };
    }

    load() {
      try {
        const raw = localStorage.getItem(this.key);
        return raw ? this.normalize(JSON.parse(raw)) : null;
      } catch (error) {
        console.warn('Could not read saved game data:', error);
        return null;
      }
    }

    init() {
      this.data = this.load() || this.getDefault();
      this.data = this.normalize(this.data);
      this.save();
      return this.data;
    }

    get() {
      return this.data || this.init();
    }

    save() {
      try {
        if (this.data) localStorage.setItem(this.key, JSON.stringify(this.data));
      } catch (error) {
        console.warn('Could not save game data:', error);
      }
    }

    addCoins(amount) {
      this.get().coins = Math.max(0, this.data.coins + Math.floor(Number(amount) || 0));
      this.save();
      return this.data.coins;
    }

    spendCoins(amount) {
      const cost = Math.max(0, Math.floor(Number(amount) || 0));
      if (this.get().coins < cost) return false;
      this.data.coins -= cost;
      this.save();
      return true;
    }

    addStars(amount) {
      this.get().stars = Math.max(0, this.data.stars + Math.floor(Number(amount) || 0));
      this.save();
      return this.data.stars;
    }
  }

  class NeedsManager {
    constructor(saveManager) {
      this.saveManager = saveManager;
      this.needs = { ...saveManager.get().babyNeeds };
    }

    get() {
      return { ...this.needs };
    }

    persist() {
      this.saveManager.data.babyNeeds = { ...this.needs };
      this.saveManager.save();
    }

    tick() {
      this.needs.hunger = Math.max(0, this.needs.hunger - 1.2);
      this.needs.hygiene = Math.max(0, this.needs.hygiene - 0.7);
      this.needs.sleep = Math.max(0, this.needs.sleep - 0.9);
      this.needs.energy = Math.max(0, this.needs.energy - 0.8);
      this.needs.happiness = Math.max(0, this.needs.happiness - 0.5);
      this.persist();
    }

    feed(amount = 28) {
      this.needs.hunger = Math.min(100, this.needs.hunger + amount);
      this.needs.energy = Math.min(100, this.needs.energy + 5);
      this.persist();
    }

    bath(amount = 32) {
      this.needs.hygiene = Math.min(100, this.needs.hygiene + amount);
      this.needs.happiness = Math.min(100, this.needs.happiness + 10);
      this.persist();
    }

    sleep(amount = 36) {
      this.needs.sleep = Math.min(100, this.needs.sleep + amount);
      this.needs.energy = Math.min(100, this.needs.energy + 20);
      this.persist();
    }

    play(amount = 20) {
      this.needs.happiness = Math.min(100, this.needs.happiness + amount);
      this.needs.energy = Math.max(0, this.needs.energy - 8);
      this.persist();
    }
  }

  function averageNeeds(needs) {
    const values = Object.values(needs);
    return values.reduce((total, value) => total + value, 0) / values.length;
  }

  function getMood(needs) {
    const average = averageNeeds(needs);
    if (average >= 80) return 'سعيد جداً';
    if (average >= 60) return 'مرتاح';
    if (average >= 40) return 'يحتاج إلى الرعاية';
    return 'حزين';
  }

  function characterTexture(scene, key) {
    const safeKey = key === 'baby_girl' ? 'baby_girl' : 'baby_boy';
    return scene.textures.exists(safeKey) ? safeKey : `fallback_${safeKey}`;
  }

  function createBaby(scene, x, y, key, width = 180, height = 240) {
    return scene.add.image(x, y, characterTexture(scene, key))
      .setDisplaySize(width, height)
      .setDepth(8);
  }

  function playSound(save, kind = 'tap') {
    try {
      if (!save || !save.get().settings.soundEnabled || typeof window === 'undefined') return;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioContext = audioContext || new AudioContextClass();
      if (audioContext.state === 'suspended') audioContext.resume();

      const frequencies = kind === 'success' ? [660, 880] : [520];
      frequencies.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const start = audioContext.currentTime + index * 0.07;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.055, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.17);
      });
    } catch (error) {
      // Sound is optional; a blocked audio context should never interrupt play.
    }
  }

  function addButton(scene, options) {
    const {
      x, y, width = 360, height = 78, label, onClick,
      color = 0x4CAF50, border = 0x388E3C, fontSize = 28,
      depth = 30, textColor = '#FFFFFF'
    } = options;

    const button = scene.add.container(x, y).setDepth(depth);
    const background = scene.add.graphics();
    background.fillStyle(color, 1);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, 22);
    background.lineStyle(4, border, 1);
    background.strokeRoundedRect(-width / 2, -height / 2, width, height, 22);
    const text = scene.add.text(0, 0, label, {
      fontSize: `${fontSize}px`, fontFamily: 'Arial', color: textColor,
      fontStyle: 'bold', align: 'center', wordWrap: { width: width - 28 }
    }).setOrigin(0.5);
    const hitArea = scene.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
    button.add([background, text, hitArea]);

    hitArea.on('pointerdown', () => {
      playSound(scene.save, 'tap');
      if (scene.save && scene.save.get().settings.animationsEnabled) {
        scene.tweens.add({
          targets: button, scaleX: 0.96, scaleY: 0.96, duration: 55, yoyo: true,
          onComplete: () => { if (onClick) onClick(); }
        });
      } else if (onClick) {
        onClick();
      }
    });
    hitArea.on('pointerover', () => {
      if (scene.save && scene.save.get().settings.animationsEnabled) {
        scene.tweens.add({ targets: button, scaleX: 1.025, scaleY: 1.025, duration: 90 });
      }
    });
    hitArea.on('pointerout', () => {
      if (scene.save && scene.save.get().settings.animationsEnabled) {
        scene.tweens.add({ targets: button, scaleX: 1, scaleY: 1, duration: 90 });
      }
    });
    return button;
  }

  function addCurrencyHUD(scene, save, x = 70, y = 38) {
    const root = scene.add.container(x, y).setDepth(150);
    const pillWidth = 145;
    const gap = 12;
    const texts = [];

    [0, 1].forEach(index => {
      const pill = scene.add.graphics();
      pill.fillStyle(0xFFFFFF, 0.92);
      pill.fillRoundedRect(index * (pillWidth + gap), 0, pillWidth, 52, 22);
      pill.lineStyle(2, index === 0 ? 0xFFC107 : 0xFBC02D, 1);
      pill.strokeRoundedRect(index * (pillWidth + gap), 0, pillWidth, 52, 22);
      const text = scene.add.text(index * (pillWidth + gap) + pillWidth / 2, 26, '', {
        fontSize: '22px', fontFamily: 'Arial', color: '#594215', fontStyle: 'bold'
      }).setOrigin(0.5);
      texts.push(text);
      root.add([pill, text]);
    });

    const refresh = () => {
      const data = save.get();
      texts[0].setText(`🪙 ${data.coins}`);
      texts[1].setText(`⭐ ${data.stars}`);
    };
    refresh();
    return refresh;
  }

  function createNeedsHUD(scene, needsManager, options = {}) {
    const x = options.x ?? 160;
    const y = options.y ?? 170;
    const width = options.width ?? 1600;
    const gap = options.gap ?? 18;
    const cellWidth = (width - gap * (NEEDS.length - 1)) / NEEDS.length;
    const labelFontSize = options.labelFontSize ?? 20;
    const barHeight = options.barHeight ?? 18;
    const groups = NEEDS.map((item, index) => {
      const cellX = x + index * (cellWidth + gap);
      const label = scene.add.text(cellX + cellWidth, y, `${item.icon} ${item.label}`, {
        fontSize: `${labelFontSize}px`, fontFamily: 'Arial', color: '#3F3D56', fontStyle: 'bold'
      }).setOrigin(1, 0.5).setDepth(140);
      const value = scene.add.text(cellX, y, '', {
        fontSize: `${labelFontSize - 1}px`, fontFamily: 'Arial', color: '#5F5A73', fontStyle: 'bold'
      }).setOrigin(0, 0.5).setDepth(140);
      const back = scene.add.graphics().setDepth(135);
      back.fillStyle(0xFFFFFF, 0.8);
      back.fillRoundedRect(cellX, y + 16, cellWidth, barHeight, barHeight / 2);
      const fill = scene.add.graphics().setDepth(136);
      return { item, cellX, label, value, back, fill, cellWidth };
    });

    return () => {
      const current = needsManager.get();
      groups.forEach(group => {
        const amount = Math.max(0, Math.min(100, current[group.item.key]));
        const fillWidth = group.cellWidth * amount / 100;
        group.value.setText(`${Math.round(amount)}%`);
        group.value.setColor(amount < 30 ? '#C62828' : '#5F5A73');
        group.fill.clear();
        if (fillWidth > 1) {
          group.fill.fillStyle(group.item.color, 1);
          group.fill.fillRoundedRect(group.cellX + group.cellWidth - fillWidth, y + 16, fillWidth, barHeight, barHeight / 2);
        }
      });
    };
  }

  function showToast(scene, message, success = false) {
    const toast = scene.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 105, message, {
      fontSize: '27px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold',
      backgroundColor: '#283044E8', padding: { x: 26, y: 15 }, align: 'center'
    }).setOrigin(0.5).setAlpha(0).setDepth(1000);
    if (success) playSound(scene.save, 'success');
    scene.tweens.add({
      targets: toast, alpha: 1, y: CONFIG.HEIGHT - 135, duration: 220, ease: 'Back.easeOut',
      onComplete: () => scene.tweens.add({
        targets: toast, alpha: 0, y: CONFIG.HEIGHT - 165, delay: 1500, duration: 250,
        onComplete: () => toast.destroy()
      })
    });
    return toast;
  }

  function fadeTo(scene, nextScene) {
    if (scene.isChangingScene) return;
    scene.isChangingScene = true;
    scene.cameras.main.fadeOut(250, 20, 20, 38);
    scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(nextScene));
  }

  function drawSkyAndGrass(scene) {
    const sky = scene.add.graphics();
    sky.fillGradientStyle(0x7DD9F5, 0xA5E7F5, 0xD9F7FA, 0xB8ECF0, 1);
    sky.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    sky.fillStyle(0x8BCB7B, 1);
    sky.fillRect(0, CONFIG.HEIGHT * 0.78, CONFIG.WIDTH, CONFIG.HEIGHT * 0.22);
    sky.fillStyle(0x78BD6A, 1);
    for (let x = -80; x < CONFIG.WIDTH + 100; x += 260) {
      sky.fillEllipse(x + 130, CONFIG.HEIGHT * 0.78, 300, 54);
    }

    for (let i = 0; i < 5; i++) {
      const cloud = scene.add.graphics();
      cloud.fillStyle(0xFFFFFF, 0.86);
      cloud.fillEllipse(0, 0, 150, 62);
      cloud.fillEllipse(-42, -10, 90, 46);
      cloud.fillEllipse(52, -7, 82, 43);
      cloud.setPosition(180 + i * 390, 80 + (i % 3) * 60).setDepth(1);
      if (scene.save.get().settings.animationsEnabled) {
        scene.tweens.add({ targets: cloud, x: cloud.x + 65, duration: 6000 + i * 900, repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
      }
    }
  }

  function drawRoomBackground(scene, room) {
    const graphics = scene.add.graphics();
    graphics.fillStyle(room.color, 1);
    graphics.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    graphics.fillStyle(room.floor, 1);
    graphics.fillRect(0, CONFIG.HEIGHT * 0.74, CONFIG.WIDTH, CONFIG.HEIGHT * 0.26);
    graphics.fillStyle(0xFFFFFF, 0.4);
    graphics.fillRect(0, CONFIG.HEIGHT * 0.73, CONFIG.WIDTH, 12);
    graphics.fillStyle(0xFFFFFF, 0.22);
    graphics.fillCircle(220, 245, 92);
    graphics.fillCircle(CONFIG.WIDTH - 230, 255, 74);
  }

  // ============ BOOT SCENE ============
  class BootScene extends Phaser.Scene {
    constructor() { super({ key: CONFIG.SCENES.BOOT }); }

    create() {
      this.generateTextures();
      this.scene.start(CONFIG.SCENES.PRELOAD);
    }

    generateTextures() {
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });

      const makeBabyFallback = (key, bodyColor, darkColor) => {
        graphics.clear();
        graphics.fillStyle(bodyColor, 1);
        graphics.fillRoundedRect(25, 72, 70, 82, 18);
        graphics.fillStyle(0xFFE0BD, 1);
        graphics.fillCircle(60, 48, 40);
        graphics.fillStyle(0xFFFFFF, 1);
        graphics.fillCircle(45, 44, 12);
        graphics.fillCircle(75, 44, 12);
        graphics.fillStyle(0x3E2723, 1);
        graphics.fillCircle(47, 45, 7);
        graphics.fillCircle(77, 45, 7);
        graphics.fillStyle(0xFFAB91, 0.75);
        graphics.fillCircle(34, 59, 8);
        graphics.fillCircle(86, 59, 8);
        graphics.lineStyle(3, 0xE91E63, 1);
        graphics.beginPath(); graphics.arc(60, 65, 12, 0.1 * Math.PI, 0.9 * Math.PI); graphics.strokePath();
        graphics.fillStyle(darkColor, 1);
        graphics.fillRoundedRect(25, 8, 70, 28, 14);
        graphics.fillStyle(0xFFE0BD, 1);
        graphics.fillRoundedRect(6, 82, 22, 48, 10);
        graphics.fillRoundedRect(92, 82, 22, 48, 10);
        graphics.fillRoundedRect(30, 148, 22, 40, 10);
        graphics.fillRoundedRect(68, 148, 22, 40, 10);
        graphics.fillStyle(darkColor, 1);
        graphics.fillRoundedRect(25, 182, 32, 14, 7);
        graphics.fillRoundedRect(63, 182, 32, 14, 7);
        graphics.generateTexture(key, 120, 200);
      };

      makeBabyFallback('fallback_baby_boy', 0x4FC3F7, 0x29B6F6);
      makeBabyFallback('fallback_baby_girl', 0xF48FB1, 0xF06292);

      const furniture = (key, width, height, draw) => {
        graphics.clear();
        draw(graphics);
        graphics.generateTexture(key, width, height);
      };

      furniture('furniture_sofa', 360, 210, g => {
        g.fillStyle(0x8D6E63, 1);
        g.fillRoundedRect(0, 35, 360, 145, 28);
        g.fillRoundedRect(22, 0, 316, 96, 24);
        g.fillStyle(0xA1887F, 1);
        g.fillRoundedRect(28, 55, 92, 95, 16);
        g.fillRoundedRect(134, 55, 92, 95, 16);
        g.fillRoundedRect(240, 55, 92, 95, 16);
        g.fillStyle(0x6D4C41, 1);
        g.fillRoundedRect(25, 165, 34, 38, 8);
        g.fillRoundedRect(301, 165, 34, 38, 8);
      });

      furniture('furniture_bed', 360, 230, g => {
        g.fillStyle(0x8D6E63, 1);
        g.fillRoundedRect(0, 66, 360, 145, 18);
        g.fillStyle(0xE3F2FD, 1);
        g.fillRoundedRect(12, 18, 336, 78, 14);
        g.fillStyle(0xFFFFFF, 1);
        g.fillRoundedRect(28, 30, 112, 60, 16);
        g.fillStyle(0xCE93D8, 1);
        g.fillRoundedRect(130, 82, 218, 98, 16);
        g.fillStyle(0x6D4C41, 1);
        g.fillRoundedRect(20, 193, 26, 30, 6);
        g.fillRoundedRect(314, 193, 26, 30, 6);
      });

      furniture('furniture_tv', 240, 190, g => {
        g.fillStyle(0x37474F, 1);
        g.fillRoundedRect(0, 0, 240, 150, 14);
        g.fillStyle(0x4FC3F7, 1);
        g.fillRoundedRect(13, 13, 214, 124, 8);
        g.fillStyle(0x546E7A, 1);
        g.fillRect(92, 150, 56, 20);
        g.fillRoundedRect(65, 169, 110, 16, 7);
        g.fillStyle(0xFFF176, 0.9);
        g.fillCircle(184, 44, 17);
        g.fillStyle(0x81C784, 1);
        g.fillTriangle(25, 130, 90, 76, 155, 130);
      });

      furniture('furniture_table', 320, 180, g => {
        g.fillStyle(0xA1887F, 1);
        g.fillRoundedRect(0, 16, 320, 38, 12);
        g.fillRect(25, 50, 24, 120);
        g.fillRect(271, 50, 24, 120);
        g.fillStyle(0xBCAAA4, 1);
        g.fillRoundedRect(10, 8, 300, 16, 8);
      });

      furniture('furniture_bathtub', 360, 230, g => {
        g.fillStyle(0x9E9E9E, 1);
        g.fillRoundedRect(0, 42, 360, 170, 28);
        g.fillStyle(0xE0F7FA, 1);
        g.fillRoundedRect(16, 56, 328, 126, 22);
        g.fillStyle(0x80DEEA, 0.75);
        g.fillRoundedRect(24, 118, 312, 56, 18);
        g.fillStyle(0xB0BEC5, 1);
        g.fillCircle(303, 31, 17);
        g.fillRoundedRect(294, 2, 18, 38, 8);
        g.fillStyle(0xFFFFFF, 0.9);
        g.fillCircle(75, 102, 12);
        g.fillCircle(105, 87, 10);
        g.fillCircle(129, 108, 8);
      });

      furniture('furniture_toys', 260, 190, g => {
        g.fillStyle(0xFF5252, 1); g.fillRoundedRect(16, 90, 76, 76, 10);
        g.fillStyle(0x448AFF, 1); g.fillRoundedRect(102, 90, 76, 76, 10);
        g.fillStyle(0x69F0AE, 1); g.fillRoundedRect(59, 10, 76, 76, 10);
        g.fillStyle(0xFFFFFF, 0.8);
        g.fillCircle(53, 128, 10); g.fillCircle(140, 128, 10); g.fillCircle(97, 48, 10);
        g.fillStyle(0xFFD54F, 1); g.fillCircle(215, 138, 28);
        g.fillStyle(0xFF7043, 1); g.fillCircle(207, 132, 4); g.fillCircle(223, 132, 4);
      });

      furniture('food_apple', 70, 78, g => {
        g.fillStyle(0xF44336, 1);
        g.fillCircle(28, 43, 25); g.fillCircle(47, 43, 25);
        g.fillStyle(0x4CAF50, 1); g.fillRoundedRect(34, 5, 8, 22, 4);
        g.fillStyle(0x81C784, 1); g.fillEllipse(50, 17, 22, 12);
      });

      furniture('food_bottle', 58, 94, g => {
        g.fillStyle(0xFFFFFF, 1); g.fillRoundedRect(20, 8, 18, 20, 5);
        g.fillStyle(0xBBDEFB, 1); g.fillRoundedRect(10, 24, 38, 63, 10);
        g.fillStyle(0xFFECB3, 1); g.fillRoundedRect(14, 49, 30, 31, 7);
        g.fillStyle(0x90CAF9, 1); g.fillRect(23, 4, 12, 8);
      });

      furniture('item_soap', 90, 66, g => {
        g.fillStyle(0xCE93D8, 1); g.fillRoundedRect(6, 25, 72, 36, 13);
        g.fillStyle(0xFFFFFF, 0.78);
        g.fillCircle(61, 15, 11); g.fillCircle(76, 27, 8); g.fillCircle(48, 10, 7);
      });

      graphics.destroy();
    }
  }

  // ============ ASSET PRELOAD ============
  class PreloadScene extends Phaser.Scene {
    constructor() { super({ key: CONFIG.SCENES.PRELOAD }); }

    preload() {
      this.cameras.main.setBackgroundColor('#667eea');
      this.add.text(CONFIG.WIDTH / 2, 430, 'نجهّز عالم الطفل...', {
        fontSize: '42px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
      }).setOrigin(0.5);
      const barX = CONFIG.WIDTH / 2 - 250;
      const barY = 520;
      const barBackground = this.add.graphics();
      barBackground.fillStyle(0xFFFFFF, 0.25);
      barBackground.fillRoundedRect(barX, barY, 500, 24, 12);
      const barFill = this.add.graphics();
      const progressText = this.add.text(CONFIG.WIDTH / 2, 570, 'جاري تحميل الشخصيات...', {
        fontSize: '22px', fontFamily: 'Arial', color: '#FFFFFF'
      }).setOrigin(0.5);

      this.load.on('progress', progress => {
        barFill.clear();
        barFill.fillStyle(0xFFF176, 1);
        barFill.fillRoundedRect(barX, barY, Math.max(8, 500 * progress), 24, 12);
      });
      this.load.on('loaderror', file => console.warn(`Could not load ${file.src}; using the built-in character fallback.`));
      this.load.image('baby_boy', './public/assets/characters/baby-boy.svg');
      this.load.image('baby_girl', './public/assets/characters/baby-girl.svg');
      this.load.once('complete', () => progressText.setText('أهلاً بك!'));
    }

    create() {
      this.time.delayedCall(260, () => this.scene.start(CONFIG.SCENES.MENU));
    }
  }

  // ============ MAIN MENU ============
  class MenuScene extends Phaser.Scene {
    constructor() { super({ key: CONFIG.SCENES.MENU }); this.save = new SaveManager(); }

    create() {
      this.save.init();
      this.cameras.main.fadeIn(220);
      drawSkyAndGrass(this);
      const sun = this.add.graphics();
      sun.fillStyle(0xFFD93D, 1); sun.fillCircle(0, 0, 60);
      sun.setPosition(CONFIG.WIDTH - 145, 125).setDepth(2);
      if (this.save.get().settings.animationsEnabled) {
        this.tweens.add({ targets: sun, scale: 1.08, duration: 1900, repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
      }

      this.add.text(CONFIG.WIDTH / 2, 115, 'Baby Care World', {
        fontSize: '78px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold',
        stroke: '#E91E63', strokeThickness: 9, shadow: { color: '#6D3152', blur: 10, fill: true, offsetY: 5 }
      }).setOrigin(0.5).setDepth(10);
      this.add.text(CONFIG.WIDTH / 2, 205, '🍼  عالم رعاية الأطفال  🍼', {
        fontSize: '34px', fontFamily: 'Arial', color: '#FFF176', fontStyle: 'bold', stroke: '#815E6B', strokeThickness: 2
      }).setOrigin(0.5).setDepth(10);

      addCurrencyHUD(this, this.save, 68, 38);
      const buttons = [
        { y: 378, label: '🎮  ابدأ اللعب', color: 0x4CAF50, border: 0x388E3C, next: CONFIG.SCENES.CHARACTER_SELECT },
        { y: 480, label: '🛍️  متجر الرعاية', color: 0xFF9800, border: 0xF57C00, next: CONFIG.SCENES.STORE },
        { y: 582, label: '📖  كيف نلعب؟', color: 0x42A5F5, border: 0x1976D2, next: CONFIG.SCENES.GUIDE },
        { y: 684, label: '⚙️  الإعدادات', color: 0x78909C, border: 0x546E7A, next: CONFIG.SCENES.SETTINGS }
      ];
      buttons.forEach(item => addButton(this, {
        x: CONFIG.WIDTH / 2, y: item.y, width: 460, height: 78,
        label: item.label, color: item.color, border: item.border, fontSize: 30,
        onClick: () => fadeTo(this, item.next)
      }));

      const boy = createBaby(this, 250, 850, 'baby_boy', 190, 255).setDepth(5);
      const girl = createBaby(this, CONFIG.WIDTH - 250, 850, 'baby_girl', 190, 255).setDepth(5);
      if (this.save.get().settings.animationsEnabled) {
        this.tweens.add({ targets: boy, y: 832, duration: 1200, repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: girl, y: 832, duration: 1200, delay: 450, repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
      }
      this.add.text(CONFIG.WIDTH / 2, 825, 'اعتنِ باحتياجات طفلك، واستكشف غرف البيت الستّ!', {
        fontSize: '24px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold', stroke: '#427947', strokeThickness: 3
      }).setOrigin(0.5).setDepth(10);
    }
  }

  // ============ CHARACTER SELECTION ============
  class CharacterSelectScene extends Phaser.Scene {
    constructor() { super({ key: CONFIG.SCENES.CHARACTER_SELECT }); this.save = new SaveManager(); }

    create() {
      this.save.init();
      this.cameras.main.fadeIn(220);
      const background = this.add.graphics();
      background.fillGradientStyle(0xFCE4EC, 0xFCE4EC, 0xFFF8E1, 0xFFF8E1, 1);
      background.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
      this.add.text(CONFIG.WIDTH / 2, 82, 'اختر طفلك', {
        fontSize: '52px', fontFamily: 'Arial', color: '#C44569', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.add.text(CONFIG.WIDTH / 2, 140, 'يمكنك تغيير اختيارك في أي وقت ببدء لعبة جديدة.', {
        fontSize: '24px', fontFamily: 'Arial', color: '#725A67'
      }).setOrigin(0.5);

      this.selectedCharacter = this.save.get().selectedCharacter;
      this.characterCards = {};
      this.createCharacterCard(660, 'baby_boy', '👦  آدم', 0x4FC3F7);
      this.createCharacterCard(1260, 'baby_girl', '👧  ليان', 0xF48FB1);
      this.refreshCharacterCards();

      addButton(this, {
        x: CONFIG.WIDTH / 2, y: 940, width: 360, height: 72,
        label: '✅  تأكيد الاختيار', color: 0x4CAF50, border: 0x388E3C, fontSize: 27,
        onClick: () => {
          this.save.data.selectedCharacter = this.selectedCharacter;
          this.save.save();
          fadeTo(this, CONFIG.SCENES.HOUSE);
        }
      });
      addButton(this, {
        x: 140, y: 1000, width: 200, height: 58, label: '→  القائمة',
        color: 0xFF7043, border: 0xE64A19, fontSize: 21,
        onClick: () => fadeTo(this, CONFIG.SCENES.MENU)
      });
    }

    createCharacterCard(x, key, name, color) {
      const card = this.add.container(x, 525);
      const background = this.add.graphics();
      background.fillStyle(0xFFFFFF, 0.96);
      background.fillRoundedRect(-210, -300, 420, 600, 30);
      background.lineStyle(7, color, 1);
      background.strokeRoundedRect(-210, -300, 420, 600, 30);
      const baby = createBaby(this, 0, -60, key, 220, 300);
      const label = this.add.text(0, 155, name, {
        fontSize: '42px', fontFamily: 'Arial', color: '#3E3A43', fontStyle: 'bold'
      }).setOrigin(0.5);
      const hint = this.add.text(0, 215, 'اضغط لاختياري', {
        fontSize: '22px', fontFamily: 'Arial', color: '#77717A'
      }).setOrigin(0.5);
      const hitArea = this.add.zone(0, 0, 420, 600).setInteractive({ useHandCursor: true });
      card.add([background, baby, label, hint, hitArea]);
      hitArea.on('pointerdown', () => {
        this.selectedCharacter = key;
        this.refreshCharacterCards();
        showToast(this, `تم اختيار ${name} 💕`, true);
      });
      if (this.save.get().settings.animationsEnabled) {
        this.tweens.add({ targets: baby, y: -72, duration: 1100, repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
      }
      this.characterCards[key] = background;
    }

    refreshCharacterCards() {
      Object.entries(this.characterCards).forEach(([key, background]) => {
        const color = key === this.selectedCharacter ? 0x4CAF50 : (key === 'baby_girl' ? 0xF48FB1 : 0x4FC3F7);
        background.clear();
        background.fillStyle(0xFFFFFF, 0.96);
        background.fillRoundedRect(-210, -300, 420, 600, 30);
        background.lineStyle(key === this.selectedCharacter ? 10 : 5, color, 1);
        background.strokeRoundedRect(-210, -300, 420, 600, 30);
      });
    }
  }

  // ============ HOUSE / ROOM SELECTOR ============
  class HouseScene extends Phaser.Scene {
    constructor() { super({ key: CONFIG.SCENES.HOUSE }); this.save = new SaveManager(); }

    create() {
      this.save.init();
      this.cameras.main.fadeIn(220);
      const background = this.add.graphics();
      background.fillGradientStyle(0xFFF4E0, 0xFFF4E0, 0xF6DFBE, 0xF6DFBE, 1);
      background.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
      addCurrencyHUD(this, this.save, 68, 38);
      this.needs = new NeedsManager(this.save);
      this.refreshNeedsHUD = createNeedsHUD(this, this.needs, { x: 160, y: 185, width: 1600, labelFontSize: 20 });
      this.refreshNeedsHUD();

      this.add.text(CONFIG.WIDTH / 2, 58, 'بيتك الرائع', {
        fontSize: '50px', fontFamily: 'Arial', color: '#704D34', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.moodLabel = this.add.text(CONFIG.WIDTH / 2, 115, '', {
        fontSize: '23px', fontFamily: 'Arial', color: '#765E4C'
      }).setOrigin(0.5);
      this.refreshMoodLabel = () => this.moodLabel.setText(`مزاج طفلك الآن: ${getMood(this.needs.get())}  •  اختر غرفة للزيارة`);
      this.refreshMoodLabel();

      const cardWidth = 500;
      const cardHeight = 260;
      const gapX = 40;
      const gapY = 35;
      const startX = (CONFIG.WIDTH - cardWidth * 3 - gapX * 2) / 2;
      const startY = 310;
      ROOMS.forEach((room, index) => {
        const column = index % 3;
        const row = Math.floor(index / 3);
        this.createRoomCard(
          startX + column * (cardWidth + gapX) + cardWidth / 2,
          startY + row * (cardHeight + gapY) + cardHeight / 2,
          cardWidth, cardHeight, room
        );
      });

      this.add.text(CONFIG.WIDTH / 2, 938, 'أنجز أنشطة الرعاية لتحصل على عملات، واجمع النجوم عندما يكون طفلك سعيداً جداً.', {
        fontSize: '22px', fontFamily: 'Arial', color: '#725A47'
      }).setOrigin(0.5);
      addButton(this, {
        x: CONFIG.WIDTH - 135, y: 1015, width: 210, height: 58, label: '☰  القائمة',
        color: 0xFF7043, border: 0xE64A19, fontSize: 21,
        onClick: () => fadeTo(this, CONFIG.SCENES.MENU)
      });

      this.needsTimer = this.time.addEvent({
        delay: 45000, loop: true,
        callback: () => { this.needs.tick(); this.refreshNeedsHUD(); this.refreshMoodLabel(); }
      });
      this.events.once('shutdown', () => {
        if (this.needsTimer) this.needsTimer.remove();
      });
    }

    createRoomCard(x, y, width, height, room) {
      const card = this.add.container(x, y).setDepth(5);
      const background = this.add.graphics();
      background.fillStyle(0xFFFFFF, 0.94);
      background.fillRoundedRect(-width / 2, -height / 2, width, height, 28);
      background.lineStyle(4, room.color, 1);
      background.strokeRoundedRect(-width / 2, -height / 2, width, height, 28);
      const icon = this.add.text(0, -72, room.emoji, { fontSize: '68px', fontFamily: 'Arial' }).setOrigin(0.5);
      const title = this.add.text(0, 8, room.title, {
        fontSize: '34px', fontFamily: 'Arial', color: '#393442', fontStyle: 'bold'
      }).setOrigin(0.5);
      const description = this.add.text(0, 67, room.description, {
        fontSize: '21px', fontFamily: 'Arial', color: '#6C6672', align: 'center', wordWrap: { width: width - 50 }
      }).setOrigin(0.5);
      const hitArea = this.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
      card.add([background, icon, title, description, hitArea]);
      hitArea.on('pointerdown', () => fadeTo(this, room.scene));
      hitArea.on('pointerover', () => {
        if (this.save.get().settings.animationsEnabled) this.tweens.add({ targets: card, scale: 1.025, duration: 100 });
      });
      hitArea.on('pointerout', () => {
        if (this.save.get().settings.animationsEnabled) this.tweens.add({ targets: card, scale: 1, duration: 100 });
      });
    }
  }

  // ============ SHARED ROOM BEHAVIOUR ============
  class CareRoomScene extends Phaser.Scene {
    constructor(room) {
      super({ key: room.scene });
      this.room = room;
      this.save = new SaveManager();
    }

    create() {
      this.save.init();
      this.needs = new NeedsManager(this.save);
      this.cameras.main.fadeIn(220);
      drawRoomBackground(this, this.room);
      this.refreshCurrencyHUD = addCurrencyHUD(this, this.save, 68, 38);
      this.refreshNeedsHUD = createNeedsHUD(this, this.needs, { x: 160, y: 155, width: 1600, labelFontSize: 19, barHeight: 17 });
      this.refreshNeedsHUD();

      this.add.text(CONFIG.WIDTH / 2, 51, this.room.title, {
        fontSize: '46px', fontFamily: 'Arial', color: '#3E3A43', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(100);
      this.add.text(CONFIG.WIDTH / 2, 104, this.room.description, {
        fontSize: '22px', fontFamily: 'Arial', color: '#625B65'
      }).setOrigin(0.5).setDepth(100);

      const selected = this.save.get().selectedCharacter;
      const position = this.getBabyPosition();
      this.baby = createBaby(this, position.x, position.y, selected, 190, 254);
      if (this.save.get().settings.animationsEnabled) {
        this.tweens.add({ targets: this.baby, y: position.y - 8, duration: 1400, repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
      }

      this.buildRoomArt();
      addButton(this, {
        x: CONFIG.WIDTH / 2, y: 925, width: 520, height: 78,
        label: this.room.actionLabel, color: 0x4CAF50, border: 0x388E3C, fontSize: 26,
        onClick: () => this.performRoomAction()
      });
      addButton(this, {
        x: 142, y: 1014, width: 210, height: 58, label: '🏠  البيت',
        color: 0xFF7043, border: 0xE64A19, fontSize: 21,
        onClick: () => fadeTo(this, CONFIG.SCENES.HOUSE)
      });

      this.needsTimer = this.time.addEvent({
        delay: 45000, loop: true,
        callback: () => { this.needs.tick(); this.refreshNeedsHUD(); }
      });
      this.events.once('shutdown', () => {
        if (this.needsTimer) this.needsTimer.remove();
      });
    }

    getBabyPosition() {
      return { x: 960, y: 660 };
    }

    buildRoomArt() {}

    performRoomAction() {
      this.performCare(this.room.action, this.room.amount, this.room.actionMessage);
    }

    performCare(action, amount, message) {
      const before = this.needs.get();
      this.needs[action](amount);
      this.save.addCoins(5);
      const after = this.needs.get();
      let reward = '  +٥ 🪙';
      if (averageNeeds(before) < 80 && averageNeeds(after) >= 80) {
        this.save.addStars(1);
        this.save.addCoins(5);
        reward += '  ⭐ +١';
      }
      this.refreshNeedsHUD();
      this.refreshCurrencyHUD();
      showToast(this, `${message}${reward}`, true);
    }

    makeInteractiveImage(x, y, key, width, height, onTap) {
      const item = this.add.image(x, y, key).setDisplaySize(width, height).setDepth(7);
      const baseScale = item.scale;
      item.setInteractive({ useHandCursor: true });
      item.on('pointerdown', onTap);
      item.on('pointerover', () => {
        if (this.save.get().settings.animationsEnabled) this.tweens.add({ targets: item, scale: baseScale * 1.06, duration: 100 });
      });
      item.on('pointerout', () => {
        if (this.save.get().settings.animationsEnabled) this.tweens.add({ targets: item, scale: baseScale, duration: 100 });
      });
      return item;
    }
  }

  class LivingRoomScene extends CareRoomScene {
    constructor() { super(ROOMS[0]); }
    buildRoomArt() {
      this.add.image(555, 670, 'furniture_sofa').setDisplaySize(520, 304).setDepth(4);
      this.makeInteractiveImage(1400, 520, 'furniture_tv', 300, 238, () => this.performRoomAction());
      this.add.text(1400, 665, 'اضغط على التلفاز للعب', {
        fontSize: '21px', fontFamily: 'Arial', color: '#514C53', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(6);
      const lamp = this.add.graphics().setDepth(3);
      lamp.fillStyle(0x795548, 1); lamp.fillRoundedRect(1660, 515, 18, 210, 8);
      lamp.fillStyle(0xFFCC80, 1); lamp.fillTriangle(1605, 525, 1735, 525, 1670, 390);
    }
  }

  class KitchenScene extends CareRoomScene {
    constructor() { super(ROOMS[1]); }
    getBabyPosition() { return { x: 960, y: 665 }; }
    buildRoomArt() {
      this.add.image(960, 750, 'furniture_table').setDisplaySize(660, 340).setDepth(5);
      this.makeInteractiveImage(525, 560, 'food_apple', 118, 132, () => this.performRoomAction());
      this.makeInteractiveImage(1400, 560, 'food_bottle', 100, 162, () => this.performRoomAction());
      this.add.text(525, 650, 'تفاحة طازجة', { fontSize: '21px', fontFamily: 'Arial', color: '#514C53', fontStyle: 'bold' }).setOrigin(0.5).setDepth(6);
      this.add.text(1400, 665, 'حليب دافئ', { fontSize: '21px', fontFamily: 'Arial', color: '#514C53', fontStyle: 'bold' }).setOrigin(0.5).setDepth(6);
    }
  }

  class BathroomScene extends CareRoomScene {
    constructor() { super(ROOMS[2]); }
    getBabyPosition() { return { x: 860, y: 665 }; }
    buildRoomArt() {
      this.makeInteractiveImage(1320, 650, 'furniture_bathtub', 590, 378, () => this.performRoomAction());
      this.makeInteractiveImage(520, 550, 'item_soap', 144, 106, () => this.performRoomAction());
      this.add.text(520, 625, 'صابون الفقاعات', { fontSize: '21px', fontFamily: 'Arial', color: '#514C53', fontStyle: 'bold' }).setOrigin(0.5).setDepth(6);
      const bubbles = this.add.graphics().setDepth(6);
      bubbles.fillStyle(0xFFFFFF, 0.7);
      [[1140, 500, 19], [1190, 455, 14], [1245, 510, 22], [1365, 480, 15], [1430, 515, 18]].forEach(([x, y, r]) => bubbles.fillCircle(x, y, r));
    }
  }

  class BedroomScene extends CareRoomScene {
    constructor() { super(ROOMS[3]); }
    getBabyPosition() { return { x: 610, y: 665 }; }
    buildRoomArt() {
      this.makeInteractiveImage(1300, 660, 'furniture_bed', 610, 390, () => this.performRoomAction());
      this.add.text(1300, 790, 'سرير مريح', { fontSize: '22px', fontFamily: 'Arial', color: '#514C53', fontStyle: 'bold' }).setOrigin(0.5).setDepth(7);
      this.sleepText = this.add.text(610, 485, '💤', { fontSize: '54px', fontFamily: 'Arial' })
        .setOrigin(0.5).setDepth(20).setVisible(false);
    }
    performRoomAction() {
      this.performCare('sleep', this.room.amount, this.room.actionMessage);
      this.showSleepEffect();
    }
    showSleepEffect() {
      if (this.sleepText && this.sleepText.active) {
        this.sleepText.setVisible(true);
        if (this.save.get().settings.animationsEnabled) {
          this.tweens.add({ targets: this.sleepText, y: this.sleepText.y - 34, alpha: 0, duration: 900, repeat: 1, yoyo: true, onComplete: () => this.sleepText.setVisible(false) });
        } else {
          this.time.delayedCall(1300, () => this.sleepText && this.sleepText.setVisible(false));
        }
      }
    }
  }

  class PlayroomScene extends CareRoomScene {
    constructor() { super(ROOMS[4]); }
    getBabyPosition() { return { x: 620, y: 670 }; }
    buildRoomArt() {
      this.makeInteractiveImage(1320, 650, 'furniture_toys', 420, 308, () => this.performRoomAction());
      this.add.text(1320, 810, 'ألعاب آمنة وممتعة', { fontSize: '22px', fontFamily: 'Arial', color: '#514C53', fontStyle: 'bold' }).setOrigin(0.5).setDepth(7);
      const ball = this.add.graphics().setDepth(5);
      ball.fillStyle(0xFF5252, 1); ball.fillCircle(960, 770, 48);
      ball.lineStyle(7, 0xFFFFFF, 0.9); ball.strokeCircle(960, 770, 48);
    }
  }

  class GardenScene extends CareRoomScene {
    constructor() { super(ROOMS[5]); }
    getBabyPosition() { return { x: 960, y: 680 }; }
    buildRoomArt() {
      const garden = this.add.graphics().setDepth(2);
      garden.fillStyle(0x795548, 1); garden.fillRoundedRect(300, 420, 58, 320, 16);
      garden.fillStyle(0x388E3C, 1);
      garden.fillCircle(330, 375, 105); garden.fillCircle(260, 430, 72); garden.fillCircle(405, 430, 75);
      const colors = [0xFF4081, 0xFFEB3B, 0x7C4DFF, 0xFF6D00];
      for (let index = 0; index < 13; index++) {
        const x = 610 + index * 58;
        const y = 770 + (index % 3) * 22;
        garden.lineStyle(4, 0x388E3C, 1); garden.lineBetween(x, y, x, y + 34);
        garden.fillStyle(colors[index % colors.length], 1);
        for (let petal = 0; petal < 5; petal++) {
          const angle = petal * Math.PI * 2 / 5;
          garden.fillCircle(x + Math.cos(angle) * 13, y - 9 + Math.sin(angle) * 13, 9);
        }
        garden.fillStyle(0xFFEB3B, 1); garden.fillCircle(x, y - 9, 7);
      }
      this.add.text(330, 560, '🌳', { fontSize: '54px', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(7);
    }
  }

  // ============ CARE SHOP ============
  class StoreScene extends Phaser.Scene {
    constructor() { super({ key: CONFIG.SCENES.STORE }); this.save = new SaveManager(); }

    create() {
      this.save.init();
      this.needs = new NeedsManager(this.save);
      this.cameras.main.fadeIn(220);
      const background = this.add.graphics();
      background.fillGradientStyle(0xFFF3E0, 0xFFF3E0, 0xFCE4EC, 0xFCE4EC, 1);
      background.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
      this.refreshCurrencyHUD = addCurrencyHUD(this, this.save, 68, 38);
      this.refreshNeedsHUD = createNeedsHUD(this, this.needs, { x: 160, y: 158, width: 1600, labelFontSize: 19, barHeight: 17 });
      this.refreshNeedsHUD();
      this.add.text(CONFIG.WIDTH / 2, 58, 'متجر الرعاية', {
        fontSize: '48px', fontFamily: 'Arial', color: '#9A5810', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.add.text(CONFIG.WIDTH / 2, 107, 'استخدم العملات لشراء مساعدة فورية لطفلك.', {
        fontSize: '22px', fontFamily: 'Arial', color: '#725A47'
      }).setOrigin(0.5);

      const cardWidth = 600;
      const cardHeight = 235;
      const centersX = [610, 1310];
      const centersY = [405, 680];
      SHOP_ITEMS.forEach((item, index) => {
        const x = centersX[index % 2];
        const y = centersY[Math.floor(index / 2)];
        this.createShopCard(x, y, cardWidth, cardHeight, item);
      });
      addButton(this, {
        x: 142, y: 1014, width: 210, height: 58, label: '←  القائمة',
        color: 0xFF7043, border: 0xE64A19, fontSize: 21,
        onClick: () => fadeTo(this, CONFIG.SCENES.MENU)
      });
    }

    createShopCard(x, y, width, height, item) {
      const card = this.add.container(x, y);
      const background = this.add.graphics();
      background.fillStyle(0xFFFFFF, 0.94);
      background.fillRoundedRect(-width / 2, -height / 2, width, height, 26);
      background.lineStyle(3, 0xF6C56F, 1);
      background.strokeRoundedRect(-width / 2, -height / 2, width, height, 26);
      const icon = this.add.text(-width / 2 + 100, -24, item.icon, { fontSize: '76px', fontFamily: 'Arial' }).setOrigin(0.5);
      const title = this.add.text(25, -72, item.title, {
        fontSize: '30px', fontFamily: 'Arial', color: '#443B45', fontStyle: 'bold'
      }).setOrigin(0.5);
      const description = this.add.text(25, -27, item.description, {
        fontSize: '20px', fontFamily: 'Arial', color: '#706977', align: 'center', wordWrap: { width: 390 }
      }).setOrigin(0.5);
      card.add([background, icon, title, description]);
      addButton(this, {
        x, y: y + 68, width: 270, height: 58, label: `اشترِ  •  ${item.price} 🪙`,
        color: 0xFFB74D, border: 0xF57C00, fontSize: 22, depth: 40,
        onClick: () => this.purchase(item)
      });
    }

    purchase(item) {
      if (!this.save.spendCoins(item.price)) {
        showToast(this, 'لا تملك عملات كافية بعد. اعتنِ بطفلك لتحصل على المزيد.');
        return;
      }
      item.use(this.needs);
      this.refreshNeedsHUD();
      this.refreshCurrencyHUD();
      showToast(this, `تم شراء ${item.title}!`, true);
    }
  }

  // ============ HOW TO PLAY ============
  class GuideScene extends Phaser.Scene {
    constructor() { super({ key: CONFIG.SCENES.GUIDE }); this.save = new SaveManager(); }

    create() {
      this.save.init();
      this.cameras.main.fadeIn(220);
      const background = this.add.graphics();
      background.fillGradientStyle(0xE3F2FD, 0xE3F2FD, 0xF3E5F5, 0xF3E5F5, 1);
      background.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
      this.add.text(CONFIG.WIDTH / 2, 90, 'كيف نلعب؟', {
        fontSize: '54px', fontFamily: 'Arial', color: '#4B5B91', fontStyle: 'bold'
      }).setOrigin(0.5);

      const panel = this.add.graphics();
      panel.fillStyle(0xFFFFFF, 0.9); panel.fillRoundedRect(300, 175, 1320, 660, 32);
      panel.lineStyle(3, 0xB6C5E8, 1); panel.strokeRoundedRect(300, 175, 1320, 660, 32);
      const instructions = [
        '١. اختر طفلك، ثم افتح أي غرفة من غرف البيت الستّ.',
        '٢. اضغط على الطعام لإطعامه، أو زرّ النشاط للعناية به.',
        '٣. راقب مقاييس الجوع والنظافة والنوم والطاقة والسعادة.',
        '٤. تكسب ٥ عملات بعد كل نشاط؛ اشترِ بها مساعدات من المتجر.',
        '٥. عندما يرتفع مزاج الطفل إلى «سعيد جداً»، تحصل على نجمة.'
      ];
      instructions.forEach((line, index) => {
        this.add.text(1480, 265 + index * 105, line, {
          fontSize: '28px', fontFamily: 'Arial', color: '#3F465C',
          align: 'right', wordWrap: { width: 1080 }
        }).setOrigin(1, 0.5);
      });
      addButton(this, {
        x: CONFIG.WIDTH / 2, y: 940, width: 280, height: 70, label: 'فهمت!  ←',
        color: 0x4CAF50, border: 0x388E3C, fontSize: 26,
        onClick: () => fadeTo(this, CONFIG.SCENES.MENU)
      });
    }
  }

  // ============ SETTINGS ============
  class SettingsScene extends Phaser.Scene {
    constructor() { super({ key: CONFIG.SCENES.SETTINGS }); this.save = new SaveManager(); }

    create() {
      this.save.init();
      this.cameras.main.fadeIn(220);
      const background = this.add.graphics();
      background.fillGradientStyle(0xE8EAF6, 0xE8EAF6, 0xF3E5F5, 0xF3E5F5, 1);
      background.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
      this.add.text(CONFIG.WIDTH / 2, 90, 'الإعدادات', {
        fontSize: '50px', fontFamily: 'Arial', color: '#41445F', fontStyle: 'bold'
      }).setOrigin(0.5);
      const panel = this.add.graphics();
      panel.fillStyle(0xFFFFFF, 0.9); panel.fillRoundedRect(420, 190, 1080, 620, 28);
      panel.lineStyle(3, 0xB5B8D5, 1); panel.strokeRoundedRect(420, 190, 1080, 620, 28);

      this.soundLabel = this.add.text(CONFIG.WIDTH / 2, 330, '', {
        fontSize: '30px', fontFamily: 'Arial', color: '#36394B', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.animationLabel = this.add.text(CONFIG.WIDTH / 2, 465, '', {
        fontSize: '30px', fontFamily: 'Arial', color: '#36394B', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.refreshToggleLabels();
      addButton(this, {
        x: CONFIG.WIDTH / 2, y: 385, width: 390, height: 64, label: 'تبديل الصوت',
        color: 0x607D8B, border: 0x455A64, fontSize: 23,
        onClick: () => { this.save.data.settings.soundEnabled = !this.save.data.settings.soundEnabled; this.save.save(); this.refreshToggleLabels(); }
      });
      addButton(this, {
        x: CONFIG.WIDTH / 2, y: 520, width: 390, height: 64, label: 'تبديل الحركة',
        color: 0x7E57C2, border: 0x5E35B1, fontSize: 23,
        onClick: () => { this.save.data.settings.animationsEnabled = !this.save.data.settings.animationsEnabled; this.save.save(); this.refreshToggleLabels(); }
      });
      addButton(this, {
        x: CONFIG.WIDTH / 2, y: 680, width: 340, height: 68, label: '🗑️  حذف بيانات اللعب',
        color: 0xEF5350, border: 0xC62828, fontSize: 23,
        onClick: () => this.resetSave()
      });
      addButton(this, {
        x: CONFIG.WIDTH - 140, y: 1010, width: 200, height: 58, label: '→  رجوع',
        color: 0xFF7043, border: 0xE64A19, fontSize: 21,
        onClick: () => fadeTo(this, CONFIG.SCENES.MENU)
      });
      this.add.text(CONFIG.WIDTH / 2, 875, 'Baby Care World  •  الإصدار 1.1', {
        fontSize: '20px', fontFamily: 'Arial', color: '#77778A'
      }).setOrigin(0.5);
    }

    refreshToggleLabels() {
      this.soundLabel.setText(`🔊  المؤثرات الصوتية: ${this.save.get().settings.soundEnabled ? 'مفعّلة' : 'متوقفة'}`);
      this.animationLabel.setText(`✨  الحركات: ${this.save.get().settings.animationsEnabled ? 'مفعّلة' : 'هادئة'}`);
    }

    resetSave() {
      if (!window.confirm('هل تريد حذف جميع بيانات اللعب والبدء من جديد؟')) return;
      this.save.data = this.save.getDefault();
      this.save.save();
      this.refreshToggleLabels();
      showToast(this, 'تمت إعادة اللعبة إلى حالتها الأولى.');
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
      StoreScene,
      GuideScene,
      SettingsScene
    ]
  };

  try {
    if (typeof Phaser === 'undefined') throw new Error('Phaser did not load. Check your internet connection and reload.');
    const game = new Phaser.Game(gameConfig);
    game.events.once('ready', () => {
      const preLoader = document.getElementById('pre-loader');
      if (!preLoader) return;
      preLoader.classList.add('hidden');
      window.setTimeout(() => preLoader.remove(), 550);
    });
  } catch (error) {
    console.error('Baby Care World failed to start:', error);
    const preLoader = document.getElementById('pre-loader');
    if (preLoader) {
      const errorBox = document.createElement('div');
      errorBox.className = 'load-error';
      const title = document.createElement('h1');
      title.textContent = '⚠️ تعذّر تحميل اللعبة';
      const details = document.createElement('p');
      details.textContent = String(error.message || error);
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = 'إعادة المحاولة';
      retry.addEventListener('click', () => window.location.reload());
      errorBox.append(title, details, retry);
      preLoader.replaceChildren(errorBox);
    }
  }
})();
