// Baby Care World — a small, touch-friendly Phaser game.
// Character artwork lives in public/assets/characters/ and is loaded at startup.

(function () {
  'use strict';

  const WIDTH = 1920;
  const HEIGHT = 1080;
  const SAVE_KEY = 'babyCareWorld_save';
  const FONT = 'Arial, sans-serif';

  const CHARACTERS = {
    baby_boy: { label: 'الطفل', asset: './public/assets/characters/baby-boy.svg' },
    baby_girl: { label: 'الطفلة', asset: './public/assets/characters/baby-girl.svg' }
  };

  const SHOP_ITEMS = [
    { id: 'pink_bow', name: 'ربطة الفراشة', description: 'زينة وردية لطيفة لطفلك.', icon: '🎀', price: 20 },
    { id: 'gold_crown', name: 'التاج الذهبي', description: 'لأن كل طفل أمير صغير!', icon: '👑', price: 35 },
    { id: 'blue_cap', name: 'قبعة المغامرات', description: 'قبعة مرحة للعب والاستكشاف.', icon: '🧢', price: 30 }
  ];

  const STAT_META = {
    hunger: { label: 'الجوع', icon: '🍎', color: 0xFF9F43 },
    hygiene: { label: 'النظافة', icon: '🫧', color: 0x38BDF8 },
    sleep: { label: 'النوم', icon: '🌙', color: 0x818CF8 },
    energy: { label: 'الطاقة', icon: '⚡', color: 0xFACC15 },
    happiness: { label: 'السعادة', icon: '💖', color: 0xF472B6 }
  };

  const CARE_ACTIONS = {
    feed: { hunger: 26, energy: 4 },
    bath: { hygiene: 30, happiness: 10 },
    sleep: { sleep: 32, energy: 18 },
    play: { happiness: 24, energy: -8 }
  };

  const ROOMS = [
    {
      id: 'living', sceneKey: 'LivingRoomScene', name: 'غرفة المعيشة', icon: '🛋️',
      hint: 'وقت للعناق والمرح', action: 'play', actionLabel: 'العب مع الطفل',
      success: 'ضحكة صغيرة تجعل البيت أجمل!', wall: 0xFFF0D9, floor: 0xD4A982,
      furniture: 'furniture_sofa', scale: 0.92, accent: 0xE8A87C
    },
    {
      id: 'kitchen', sceneKey: 'KitchenScene', name: 'المطبخ', icon: '🍳',
      hint: 'حضّر وجبة لذيذة', action: 'feed', actionLabel: 'قدّم وجبة للطفل',
      success: 'لذيذ! أصبح بطن الطفل ممتلئاً.', wall: 0xFFF0E4, floor: 0xC7B2A1,
      furniture: 'furniture_kitchen', scale: 0.92, accent: 0xF4A261
    },
    {
      id: 'bathroom', sceneKey: 'BathroomScene', name: 'الحمّام', icon: '🛁',
      hint: 'حمّام دافئ ومنعش', action: 'bath', actionLabel: 'ابدأ وقت الاستحمام',
      success: 'أصبح الطفل نظيفاً وسعيداً!', wall: 0xE5F8FC, floor: 0xB8E3E9,
      furniture: 'furniture_bathtub', scale: 0.92, accent: 0x55B9D7
    },
    {
      id: 'bedroom', sceneKey: 'BedroomScene', name: 'غرفة النوم', icon: '🛏️',
      hint: 'حان وقت الراحة', action: 'sleep', actionLabel: 'ساعد الطفل على النوم',
      success: 'أحلاماً سعيدة! الطفل يرتاح الآن.', wall: 0xF3EAFE, floor: 0xC6B3D8,
      furniture: 'furniture_bed', scale: 0.92, accent: 0x9A86C8
    },
    {
      id: 'playroom', sceneKey: 'PlayroomScene', name: 'غرفة الألعاب', icon: '🧸',
      hint: 'ألعاب ملوّنة ومغامرات', action: 'play', actionLabel: 'العب بالألعاب',
      success: 'يا له من وقت ممتع مع الألعاب!', wall: 0xFFF9D9, floor: 0xE5D47F,
      furniture: 'furniture_toys', scale: 1.02, accent: 0xE3B341
    },
    {
      id: 'garden', sceneKey: 'GardenScene', name: 'الحديقة', icon: '🌷',
      hint: 'هواء منعش وأزهار جميلة', action: 'play', actionLabel: 'اخرج للعب في الحديقة',
      success: 'استمتع الطفل بالهواء الطلق!', wall: 0xDDF5E1, floor: 0x84C989,
      furniture: 'furniture_tree', scale: 0.82, accent: 0x58A96A
    }
  ];

  if (typeof Phaser === 'undefined') {
    const loader = document.getElementById('pre-loader');
    if (loader) {
      loader.classList.remove('hidden');
      loader.innerHTML = '<div class="load-error"><h1>تعذّر تحميل اللعبة</h1><p>تحقّق من اتصال الإنترنت ثم أعد تحميل الصفحة.</p></div>';
    }
    return;
  }

  // ---------------------------------------------------------------------------
  // Persistent state
  // ---------------------------------------------------------------------------
  class SaveManager {
    constructor() {
      this.data = this.defaultState();
    }

    defaultState() {
      return {
        version: 2,
        coins: 100,
        stars: 0,
        selectedCharacter: 'baby_boy',
        babyNeeds: { hunger: 80, hygiene: 90, sleep: 70, energy: 85, happiness: 100 },
        careActions: 0,
        accessories: [],
        equippedAccessory: '',
        settings: { musicVolume: 0.7, sfxVolume: 0.8, reduceMotion: false }
      };
    }

    normalize(value) {
      const defaults = this.defaultState();
      const data = value && typeof value === 'object' ? value : {};
      const savedNeeds = data.babyNeeds && typeof data.babyNeeds === 'object' ? data.babyNeeds : {};
      const savedSettings = data.settings && typeof data.settings === 'object' ? data.settings : {};
      const validAccessoryIds = new Set(SHOP_ITEMS.map((item) => item.id));
      const accessories = Array.isArray(data.accessories)
        ? [...new Set(data.accessories.filter((id) => validAccessoryIds.has(id)))]
        : [];
      const numberInRange = (input, fallback, min, max) => {
        const number = Number(input);
        return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
      };

      return {
        version: 2,
        coins: Math.floor(numberInRange(data.coins, defaults.coins, 0, 999999)),
        stars: Math.floor(numberInRange(data.stars, defaults.stars, 0, 999999)),
        selectedCharacter: Object.prototype.hasOwnProperty.call(CHARACTERS, data.selectedCharacter)
          ? data.selectedCharacter
          : defaults.selectedCharacter,
        babyNeeds: Object.keys(STAT_META).reduce((needs, key) => {
          needs[key] = numberInRange(savedNeeds[key], defaults.babyNeeds[key], 0, 100);
          return needs;
        }, {}),
        careActions: Math.floor(numberInRange(data.careActions, 0, 0, 999999)),
        accessories,
        equippedAccessory: accessories.includes(data.equippedAccessory) ? data.equippedAccessory : '',
        settings: {
          musicVolume: numberInRange(savedSettings.musicVolume, defaults.settings.musicVolume, 0, 1),
          sfxVolume: numberInRange(savedSettings.sfxVolume, defaults.settings.sfxVolume, 0, 1),
          reduceMotion: Boolean(savedSettings.reduceMotion)
        }
      };
    }

    load() {
      try {
        const raw = window.localStorage.getItem(SAVE_KEY);
        return raw ? this.normalize(JSON.parse(raw)) : this.defaultState();
      } catch (error) {
        return this.defaultState();
      }
    }

    init() {
      this.data = this.load();
      this.save();
      return this.data;
    }

    save() {
      try {
        window.localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
      } catch (error) {
        // The game remains playable when storage is disabled or full.
      }
    }

    reset() {
      this.data = this.defaultState();
      this.save();
      return this.data;
    }
  }

  class NeedsManager {
    constructor(saveManager) {
      this.saveManager = saveManager;
    }

    get() {
      return { ...this.saveManager.data.babyNeeds };
    }

    tick() {
      const decay = { hunger: 0.32, hygiene: 0.2, sleep: 0.24, energy: 0.18, happiness: 0.14 };
      const needs = this.saveManager.data.babyNeeds;
      Object.keys(decay).forEach((key) => {
        needs[key] = Math.max(0, needs[key] - decay[key]);
      });
      this.saveManager.save();
    }

    perform(actionId) {
      const changes = CARE_ACTIONS[actionId];
      if (!changes) return { ok: false, reason: 'unknown-action' };

      const needs = this.saveManager.data.babyNeeds;
      const canHelp = Object.entries(changes).some(([key, amount]) => amount > 0 && needs[key] < 100);
      if (!canHelp) return { ok: false, reason: 'already-full' };

      Object.entries(changes).forEach(([key, amount]) => {
        needs[key] = Math.max(0, Math.min(100, needs[key] + amount));
      });

      this.saveManager.data.careActions += 1;
      this.saveManager.data.coins += 5;
      const starReward = this.saveManager.data.careActions % 5 === 0 ? 1 : 0;
      this.saveManager.data.stars += starReward;
      this.saveManager.save();

      return { ok: true, coinReward: 5, starReward };
    }

    mood() {
      const values = Object.values(this.saveManager.data.babyNeeds);
      const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      if (average >= 80) return { label: 'سعيد جداً', icon: '😄' };
      if (average >= 60) return { label: 'بخير', icon: '😊' };
      if (average >= 40) return { label: 'يحتاج إلى رعاية', icon: '😟' };
      return { label: 'يحتاج إلى مساعدتك', icon: '😢' };
    }
  }

  // ---------------------------------------------------------------------------
  // Shared interface helpers
  // ---------------------------------------------------------------------------
  function hidePreloader() {
    const loader = document.getElementById('pre-loader');
    if (!loader) return;
    loader.classList.add('hidden');
    window.setTimeout(() => loader.remove(), 500);
  }

  function showToast(scene, message) {
    if (scene.currentToast && scene.currentToast.active) scene.currentToast.destroy();
    const toast = scene.add.text(WIDTH / 2, HEIGHT - 74, message, {
      fontFamily: FONT,
      fontSize: '25px',
      color: '#FFFFFF',
      fontStyle: 'bold',
      backgroundColor: '#26354DE8',
      padding: { x: 26, y: 15 },
      align: 'center'
    }).setOrigin(0.5).setAlpha(0).setDepth(1200);
    scene.currentToast = toast;

    scene.tweens.add({
      targets: toast,
      alpha: 1,
      y: HEIGHT - 104,
      duration: 220,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: toast,
          alpha: 0,
          y: HEIGHT - 130,
          delay: 1450,
          duration: 250,
          onComplete: () => toast.destroy()
        });
      }
    });
  }

  function navigate(scene, sceneKey, data) {
    if (scene.isNavigating) return;
    scene.isNavigating = true;
    scene.cameras.main.fadeOut(220, 37, 48, 75);
    scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(sceneKey, data));
  }

  function addButton(scene, options) {
    const {
      x, y, width = 320, height = 76, label, color = 0x4CAF50,
      border = 0x388E3C, fontSize = 27, onClick, depth = 20, disabled = false
    } = options;
    const container = scene.add.container(x, y).setDepth(depth);
    const background = scene.add.graphics();
    background.fillStyle(disabled ? 0xAAB4BE : color, 1);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, 22);
    background.lineStyle(4, disabled ? 0x8F9AA5 : border, 1);
    background.strokeRoundedRect(-width / 2, -height / 2, width, height, 22);
    const text = scene.add.text(0, 0, label, {
      fontFamily: FONT, fontSize: `${fontSize}px`, color: '#FFFFFF',
      fontStyle: 'bold', align: 'center', wordWrap: { width: width - 28 }
    }).setOrigin(0.5);
    container.add([background, text]);

    if (!disabled) {
      const zone = scene.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
      container.add(zone);
      zone.on('pointerdown', () => {
        if (typeof onClick !== 'function' || scene.isNavigating) return;
        scene.tweens.add({
          targets: container, scaleX: 0.97, scaleY: 0.97, duration: 65, yoyo: true,
          onComplete: () => { if (container.active && !scene.isNavigating) onClick(); }
        });
      });
      zone.on('pointerover', () => {
        if (!scene.isNavigating) scene.tweens.add({ targets: container, scaleX: 1.025, scaleY: 1.025, duration: 100 });
      });
      zone.on('pointerout', () => {
        if (container.active) scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
      });
    }
    return { container, text, background };
  }

  function createHud(scene, saveManager, needsManager) {
    const depth = 100;
    const panel = scene.add.graphics().setDepth(depth);
    panel.fillStyle(0xFFFFFF, 0.94);
    panel.fillRoundedRect(32, 22, WIDTH - 64, 142, 28);
    panel.lineStyle(3, 0xFFFFFF, 0.85);
    panel.strokeRoundedRect(32, 22, WIDTH - 64, 142, 28);

    const title = scene.add.text(76, 58, '🍼 عالم رعاية الأطفال', {
      fontFamily: FONT, fontSize: '25px', color: '#26354D', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(depth + 1);
    const moodText = scene.add.text(78, 111, '', {
      fontFamily: FONT, fontSize: '19px', color: '#617187', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(depth + 1);

    const bars = [];
    const barWidth = 174;
    const startX = 385;
    const step = 204;
    Object.entries(STAT_META).forEach(([key, meta], index) => {
      const x = startX + index * step;
      const label = scene.add.text(x, 62, `${meta.icon} ${meta.label}`, {
        fontFamily: FONT, fontSize: '18px', color: '#46556A', fontStyle: 'bold'
      }).setOrigin(0, 0.5).setDepth(depth + 1);
      const value = scene.add.text(x + barWidth, 62, '', {
        fontFamily: FONT, fontSize: '17px', color: '#46556A', fontStyle: 'bold'
      }).setOrigin(1, 0.5).setDepth(depth + 1);
      const track = scene.add.graphics().setDepth(depth + 1);
      track.fillStyle(0xE8EDF3, 1);
      track.fillRoundedRect(x, 91, barWidth, 17, 9);
      const fill = scene.add.graphics().setDepth(depth + 2);
      bars.push({ key, meta, label, value, fill, x });
    });

    const coinText = scene.add.text(1514, 93, '', {
      fontFamily: FONT, fontSize: '22px', color: '#805A00', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(depth + 1);
    const starText = scene.add.text(1700, 93, '', {
      fontFamily: FONT, fontSize: '22px', color: '#8B5B00', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(depth + 1);

    function refresh() {
      const needs = needsManager.get();
      bars.forEach(({ key, meta, value, fill, x }) => {
        const percent = Math.round(needs[key]);
        value.setText(`${percent}%`);
        fill.clear();
        fill.fillStyle(meta.color, 1);
        if (percent > 0) fill.fillRoundedRect(x, 91, barWidth * percent / 100, 17, 9);
      });
      const mood = needsManager.mood();
      moodText.setText(`حالة الطفل: ${mood.icon} ${mood.label}`);
      coinText.setText(`🪙 ${saveManager.data.coins}`);
      starText.setText(`⭐ ${saveManager.data.stars}`);
    }

    refresh();
    return { refresh };
  }

  function addCharacter(scene, saveManager, x, y, scale, depth = 12) {
    const characterKey = saveManager.data.selectedCharacter;
    const image = scene.add.image(x, y, characterKey).setScale(scale).setDepth(depth);
    const accessory = SHOP_ITEMS.find((item) => item.id === saveManager.data.equippedAccessory);
    let accessoryText = null;
    if (accessory) {
      accessoryText = scene.add.text(x, y - image.displayHeight * 0.36, accessory.icon, {
        fontFamily: FONT,
        fontSize: `${Math.max(28, Math.round(46 * scale))}px`
      }).setOrigin(0.5).setDepth(depth + 1);
    }
    return { image, accessoryText };
  }

  function animateCharacter(scene, character, saveManager, distance = 11, duration = 1200) {
    if (saveManager.data.settings.reduceMotion) return;
    const targets = [character.image];
    if (character.accessoryText) targets.push(character.accessoryText);
    scene.tweens.add({
      targets,
      y: `-=${distance}`,
      duration,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }

  function addCloud(scene, x, y, scale, saveManager) {
    const cloud = scene.add.graphics();
    cloud.fillStyle(0xFFFFFF, 0.82);
    cloud.fillEllipse(0, 0, 145, 58);
    cloud.fillEllipse(-42, -10, 85, 44);
    cloud.fillEllipse(35, -17, 92, 57);
    cloud.fillEllipse(70, 0, 75, 40);
    cloud.setPosition(x, y).setScale(scale);
    if (!saveManager.data.settings.reduceMotion) {
      scene.tweens.add({ targets: cloud, x: x + 90, duration: 9500 + x % 2400, repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
    }
    return cloud;
  }

  function drawMenuBackground(scene, saveManager) {
    const sky = scene.add.graphics();
    sky.fillStyle(0xA9DFF7, 1);
    sky.fillRect(0, 0, WIDTH, HEIGHT);
    sky.fillStyle(0xDFF5FF, 0.58);
    sky.fillEllipse(960, 680, 2200, 430);

    const sun = scene.add.graphics();
    sun.fillStyle(0xFFE07A, 1);
    sun.fillCircle(0, 0, 72);
    sun.setPosition(1660, 190);
    if (!saveManager.data.settings.reduceMotion) {
      scene.tweens.add({ targets: sun, scale: 1.08, duration: 2100, repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
    }

    addCloud(scene, 290, 150, 1.0, saveManager);
    addCloud(scene, 1010, 125, 0.82, saveManager);
    addCloud(scene, 1420, 300, 0.7, saveManager);

    const landscape = scene.add.graphics();
    landscape.fillStyle(0x9DD9A0, 1);
    landscape.fillEllipse(280, 900, 900, 310);
    landscape.fillEllipse(1430, 870, 1160, 350);
    landscape.fillStyle(0x6FC481, 1);
    landscape.fillRect(0, 864, WIDTH, 216);
    landscape.fillStyle(0x5BB875, 1);
    landscape.fillEllipse(950, 875, 2300, 130);

    for (let i = 0; i < 8; i += 1) {
      const flower = scene.add.graphics();
      const colors = [0xFF85A1, 0xFFE46B, 0xB9A1F2, 0xFFFFFF];
      flower.fillStyle(0x4F9A54, 1);
      flower.fillRect(0, 8, 5, 34);
      flower.fillStyle(colors[i % colors.length], 1);
      flower.fillCircle(2, 1, 9);
      flower.fillStyle(0xFFE47A, 1);
      flower.fillCircle(2, 1, 3);
      flower.setPosition(150 + i * 225, 900 + (i % 3) * 40);
    }
  }

  function makeTexture(scene, key, width, height, draw) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    draw(graphics);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  function createFallbackCharacter(scene, key, bodyColor, hairColor) {
    makeTexture(scene, key, 512, 640, (g) => {
      g.fillStyle(0x594A55, 0.16); g.fillEllipse(256, 600, 260, 42);
      g.fillStyle(0xFFE0C5, 1); g.fillCircle(256, 232, 132);
      g.fillStyle(hairColor, 1); g.fillEllipse(256, 125, 218, 112);
      g.fillStyle(bodyColor, 1); g.fillRoundedRect(150, 340, 212, 226, 55);
      g.fillStyle(0xFFE0C5, 1); g.fillRoundedRect(100, 365, 62, 158, 28); g.fillRoundedRect(350, 365, 62, 158, 28);
      g.fillRoundedRect(186, 526, 62, 76, 26); g.fillRoundedRect(264, 526, 62, 76, 26);
      g.fillStyle(0xFFFFFF, 1); g.fillCircle(210, 240, 25); g.fillCircle(302, 240, 25);
      g.fillStyle(0x4B3A3B, 1); g.fillCircle(214, 246, 12); g.fillCircle(306, 246, 12);
      g.fillStyle(0xF19A94, 0.7); g.fillCircle(180, 295, 19); g.fillCircle(332, 295, 19);
      g.lineStyle(9, 0xA95A5B, 1); g.beginPath(); g.arc(256, 286, 34, 0.15 * Math.PI, 0.85 * Math.PI); g.strokePath();
    });
  }

  function createWorldTextures(scene) {
    makeTexture(scene, 'furniture_sofa', 520, 340, (g) => {
      g.fillStyle(0x8A584E, 1); g.fillRoundedRect(26, 120, 468, 190, 36);
      g.fillStyle(0xB46D62, 1); g.fillRoundedRect(43, 58, 434, 172, 42);
      g.fillStyle(0xD98A7C, 1); g.fillRoundedRect(74, 98, 170, 150, 32); g.fillRoundedRect(276, 98, 170, 150, 32);
      g.fillStyle(0xECA698, 1); g.fillRoundedRect(92, 260, 336, 80, 26);
      g.fillStyle(0x775047, 1); g.fillRect(70, 302, 24, 33); g.fillRect(426, 302, 24, 33);
      g.lineStyle(7, 0x774A43, 1); g.strokeRoundedRect(26, 120, 468, 190, 36);
    });

    makeTexture(scene, 'furniture_kitchen', 520, 360, (g) => {
      g.fillStyle(0x9D6B56, 1); g.fillRoundedRect(20, 78, 480, 252, 18);
      g.fillStyle(0xF7F1E9, 1); g.fillRoundedRect(10, 48, 500, 52, 14);
      g.fillStyle(0xC58B70, 1); g.fillRect(36, 120, 130, 195); g.fillRect(181, 120, 150, 195); g.fillRect(346, 120, 137, 195);
      g.lineStyle(5, 0x8A5B4B, 1); g.strokeRect(36, 120, 130, 195); g.strokeRect(181, 120, 150, 195); g.strokeRect(346, 120, 137, 195);
      g.fillStyle(0xEAD7BD, 1); g.fillRoundedRect(53, 137, 96, 69, 8); g.fillRoundedRect(199, 137, 114, 69, 8); g.fillRoundedRect(363, 137, 103, 69, 8);
      g.fillStyle(0x625960, 1); g.fillRoundedRect(204, 222, 108, 77, 10);
      g.fillStyle(0xE9C46A, 1); g.fillCircle(224, 244, 8); g.fillCircle(292, 244, 8); g.fillCircle(224, 278, 8); g.fillCircle(292, 278, 8);
      g.fillStyle(0xBCE4EF, 1); g.fillRoundedRect(377, 224, 78, 71, 9);
      g.lineStyle(5, 0x8A5B4B, 1); g.strokeRoundedRect(10, 48, 500, 52, 14);
    });

    makeTexture(scene, 'furniture_bathtub', 540, 350, (g) => {
      g.fillStyle(0x8EADB5, 1); g.fillRoundedRect(35, 117, 470, 205, 58);
      g.fillStyle(0xF7FFFF, 1); g.fillRoundedRect(48, 76, 445, 95, 48);
      g.fillStyle(0xA8E3F5, 1); g.fillRoundedRect(76, 117, 389, 152, 42);
      g.fillStyle(0xD4F5FC, 0.8); g.fillCircle(165, 172, 14); g.fillCircle(229, 212, 9); g.fillCircle(356, 177, 12); g.fillCircle(402, 227, 8);
      g.fillStyle(0x829DA4, 1); g.fillRoundedRect(65, 302, 30, 32, 8); g.fillRoundedRect(447, 302, 30, 32, 8);
      g.fillStyle(0x90A4AE, 1); g.fillRect(431, 37, 18, 68); g.fillRoundedRect(410, 30, 60, 24, 10);
      g.lineStyle(7, 0x718E96, 1); g.strokeRoundedRect(35, 117, 470, 205, 58);
    });

    makeTexture(scene, 'furniture_bed', 550, 360, (g) => {
      g.fillStyle(0x805D76, 1); g.fillRoundedRect(20, 88, 510, 240, 30);
      g.fillStyle(0x9A7791, 1); g.fillRoundedRect(20, 65, 510, 95, 26);
      g.fillStyle(0xFFF9FC, 1); g.fillRoundedRect(42, 104, 180, 85, 24);
      g.fillStyle(0xE8DDF5, 1); g.fillRoundedRect(224, 116, 285, 174, 23);
      g.fillStyle(0xC0A7D8, 1); g.fillRoundedRect(250, 140, 220, 18, 9);
      g.fillStyle(0xFFDA78, 1); g.fillCircle(363, 214, 26);
      g.lineStyle(6, 0x70536A, 1); g.strokeRoundedRect(20, 88, 510, 240, 30);
      g.fillStyle(0x674C61, 1); g.fillRect(50, 310, 24, 40); g.fillRect(475, 310, 24, 40);
    });

    makeTexture(scene, 'furniture_toys', 430, 360, (g) => {
      g.fillStyle(0xE94F64, 1); g.fillRoundedRect(37, 217, 120, 118, 15);
      g.fillStyle(0x42A5F5, 1); g.fillRoundedRect(166, 155, 117, 180, 14);
      g.fillStyle(0xFFCA55, 1); g.fillRoundedRect(292, 205, 101, 130, 15);
      g.fillStyle(0x75D89A, 1); g.fillRoundedRect(103, 111, 112, 103, 16);
      g.fillStyle(0xF48FB1, 1); g.fillCircle(326, 122, 55);
      g.fillStyle(0xFFFFFF, 0.75); g.fillCircle(309, 106, 13);
      g.fillStyle(0x5F4B58, 1); g.fillCircle(315, 124, 5); g.fillCircle(339, 124, 5);
      g.lineStyle(6, 0xFFFFFF, 0.8); g.strokeRoundedRect(37, 217, 120, 118, 15); g.strokeRoundedRect(166, 155, 117, 180, 14); g.strokeRoundedRect(292, 205, 101, 130, 15);
      g.fillStyle(0xFFF6D0, 1); g.fillCircle(87, 263, 8); g.fillCircle(212, 215, 8); g.fillCircle(335, 258, 8);
    });

    makeTexture(scene, 'furniture_tree', 440, 520, (g) => {
      g.fillStyle(0x7A4D38, 1); g.fillRoundedRect(187, 270, 68, 228, 16);
      g.fillStyle(0x54A665, 1); g.fillCircle(220, 177, 116); g.fillCircle(137, 225, 82); g.fillCircle(303, 220, 88); g.fillCircle(207, 95, 76);
      g.fillStyle(0x77C875, 1); g.fillCircle(176, 154, 45); g.fillCircle(262, 195, 48); g.fillCircle(120, 223, 28);
      g.fillStyle(0xF06292, 1); g.fillCircle(177, 205, 12); g.fillCircle(269, 120, 12); g.fillCircle(318, 238, 12);
      g.fillStyle(0xFFE082, 1); g.fillCircle(177, 205, 5); g.fillCircle(269, 120, 5); g.fillCircle(318, 238, 5);
    });

    makeTexture(scene, 'food_apple', 130, 140, (g) => {
      g.fillStyle(0xE94B4B, 1); g.fillCircle(65, 77, 51); g.fillCircle(39, 80, 35); g.fillCircle(91, 80, 35);
      g.fillStyle(0x6EBB62, 1); g.fillEllipse(83, 17, 42, 21);
      g.lineStyle(8, 0x72503D, 1); g.lineBetween(66, 39, 72, 12);
      g.fillStyle(0xFFFFFF, 0.65); g.fillCircle(44, 58, 9);
    });

    makeTexture(scene, 'food_bottle', 112, 170, (g) => {
      g.fillStyle(0xD8F1FC, 1); g.fillRoundedRect(19, 47, 74, 112, 18);
      g.fillStyle(0xFFF0CB, 1); g.fillRoundedRect(25, 85, 62, 66, 13);
      g.fillStyle(0xFFFFFF, 1); g.fillRoundedRect(32, 22, 48, 37, 10);
      g.fillStyle(0xA7D9EA, 1); g.fillRoundedRect(40, 6, 32, 24, 7);
      g.lineStyle(5, 0x72AFC1, 1); g.strokeRoundedRect(19, 47, 74, 112, 18);
    });

    makeTexture(scene, 'icon_heart', 90, 90, (g) => {
      g.fillStyle(0xF05E91, 1);
      g.fillCircle(30, 31, 22); g.fillCircle(60, 31, 22);
      g.fillTriangle(9, 34, 81, 34, 45, 80);
      g.fillStyle(0xFFFFFF, 0.62); g.fillCircle(28, 26, 6);
    });
  }

  // ---------------------------------------------------------------------------
  // Scenes
  // ---------------------------------------------------------------------------
  class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
      Object.entries(CHARACTERS).forEach(([key, character]) => this.load.image(key, character.asset));
      this.load.on('loaderror', (file) => console.warn(`Could not load ${file.src}; using the built-in character fallback.`));
    }

    create() {
      if (!this.textures.exists('baby_boy')) createFallbackCharacter(this, 'baby_boy', 0x58BCE8, 0x604331);
      if (!this.textures.exists('baby_girl')) createFallbackCharacter(this, 'baby_girl', 0xF079A7, 0x4B303B);
      createWorldTextures(this);
      this.scene.start('MenuScene');
    }
  }

  class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }

    create() {
      this.isNavigating = false;
      this.saveManager = new SaveManager();
      this.saveManager.init();
      drawMenuBackground(this, this.saveManager);

      this.add.text(660, 240, 'Baby Care World', {
        fontFamily: FONT, fontSize: '78px', color: '#FFFFFF', fontStyle: 'bold',
        stroke: '#E45E92', strokeThickness: 10, shadow: { offsetX: 3, offsetY: 5, color: '#7A5272', blur: 10, fill: true }
      }).setOrigin(0.5);
      this.add.text(660, 320, 'عالم صغير مليء بالحب والمرح', {
        fontFamily: FONT, fontSize: '36px', color: '#FFF8C9', fontStyle: 'bold',
        stroke: '#659A7A', strokeThickness: 4
      }).setOrigin(0.5);
      this.add.text(660, 372, 'أطعمه، العب معه، وساعده على النمو بسعادة.', {
        fontFamily: FONT, fontSize: '25px', color: '#486474', fontStyle: 'bold'
      }).setOrigin(0.5);

      addButton(this, {
        x: 660, y: 500, width: 430, height: 88,
        label: '🎮  ابدأ اللعب', color: 0x52B878, border: 0x36945A, fontSize: 31,
        onClick: () => navigate(this, 'CharacterSelectScene')
      });
      addButton(this, {
        x: 660, y: 620, width: 430, height: 82,
        label: '🎁  متجر الإكسسوارات', color: 0xF2A64A, border: 0xCD7B2C, fontSize: 28,
        onClick: () => navigate(this, 'ShopScene')
      });
      addButton(this, {
        x: 660, y: 735, width: 430, height: 78,
        label: '⚙️  الإعدادات', color: 0x788DA2, border: 0x5B7085, fontSize: 27,
        onClick: () => navigate(this, 'SettingsScene')
      });

      const character = addCharacter(this, this.saveManager, 1430, 660, 0.75, 10);
      animateCharacter(this, character, this.saveManager, 14, 1250);
      this.add.text(1430, 975, `🪙 ${this.saveManager.data.coins}     ⭐ ${this.saveManager.data.stars}`, {
        fontFamily: FONT, fontSize: '26px', color: '#614932', fontStyle: 'bold',
        backgroundColor: '#FFFFFFCC', padding: { x: 24, y: 14 }
      }).setOrigin(0.5);

      this.cameras.main.fadeIn(250, 255, 255, 255);
      hidePreloader();
    }
  }

  class CharacterSelectScene extends Phaser.Scene {
    constructor() { super({ key: 'CharacterSelectScene' }); }

    create() {
      this.isNavigating = false;
      this.saveManager = new SaveManager();
      this.saveManager.init();
      this.selectedCharacter = this.saveManager.data.selectedCharacter;
      this.cardBackgrounds = {};
      this.cardMarks = {};

      const background = this.add.graphics();
      background.fillStyle(0xF9EAF1, 1); background.fillRect(0, 0, WIDTH, HEIGHT);
      background.fillStyle(0xE7F5FE, 1); background.fillEllipse(970, 1030, 2200, 440);

      this.add.text(WIDTH / 2, 220, 'اختر صديقك الصغير', {
        fontFamily: FONT, fontSize: '53px', color: '#9C4D79', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.add.text(WIDTH / 2, 278, 'يمكنك تغيير اختيارك لاحقاً من هذه الشاشة.', {
        fontFamily: FONT, fontSize: '24px', color: '#6E7181'
      }).setOrigin(0.5);

      this.createCard(690, 570, 'baby_boy', 'الطفل', 0x58BCE8);
      this.createCard(1230, 570, 'baby_girl', 'الطفلة', 0xF079A7);
      this.refreshCards();

      addButton(this, {
        x: 745, y: 925, width: 300, height: 72,
        label: '←  القائمة', color: 0x8795A4, border: 0x667482, fontSize: 25,
        onClick: () => navigate(this, 'MenuScene')
      });
      addButton(this, {
        x: 1175, y: 925, width: 360, height: 72,
        label: '✅  تأكيد الاختيار', color: 0x52B878, border: 0x36945A, fontSize: 26,
        onClick: () => {
          this.saveManager.data.selectedCharacter = this.selectedCharacter;
          this.saveManager.save();
          navigate(this, 'HouseScene');
        }
      });

      this.cameras.main.fadeIn(220, 249, 234, 241);
    }

    createCard(x, y, key, label, accent) {
      const container = this.add.container(x, y).setDepth(10);
      const graphics = this.add.graphics();
      graphics.fillStyle(0xFFFFFF, 0.92);
      graphics.fillRoundedRect(-215, -242, 430, 484, 32);
      graphics.lineStyle(6, accent, 1);
      graphics.strokeRoundedRect(-215, -242, 430, 484, 32);
      const character = this.add.image(0, -26, key).setScale(0.67);
      const name = this.add.text(0, 210, label, {
        fontFamily: FONT, fontSize: '40px', color: '#485466', fontStyle: 'bold'
      }).setOrigin(0.5);
      const mark = this.add.text(0, -197, '', {
        fontFamily: FONT, fontSize: '24px', color: '#FFFFFF', fontStyle: 'bold',
        backgroundColor: '#55B879', padding: { x: 16, y: 8 }
      }).setOrigin(0.5);
      const zone = this.add.zone(0, 0, 430, 484).setInteractive({ useHandCursor: true });
      container.add([graphics, character, name, mark, zone]);
      zone.on('pointerdown', () => {
        this.selectedCharacter = key;
        this.refreshCards();
      });
      this.cardBackgrounds[key] = { graphics, accent };
      this.cardMarks[key] = mark;

      if (!this.saveManager.data.settings.reduceMotion) {
        this.tweens.add({ targets: character, y: -39, duration: 1250, repeat: -1, yoyo: true, ease: 'Sine.easeInOut' });
      }
    }

    refreshCards() {
      Object.keys(this.cardBackgrounds).forEach((key) => {
        const { graphics, accent } = this.cardBackgrounds[key];
        const selected = key === this.selectedCharacter;
        graphics.clear();
        graphics.fillStyle(selected ? 0xFFF9FC : 0xFFFFFF, 0.96);
        graphics.fillRoundedRect(-215, -242, 430, 484, 32);
        graphics.lineStyle(selected ? 10 : 5, selected ? 0xF2C14E : accent, 1);
        graphics.strokeRoundedRect(-215, -242, 430, 484, 32);
        this.cardMarks[key].setText(selected ? '✓ تم الاختيار' : 'اخترني');
        this.cardMarks[key].setBackgroundColor(selected ? '#55B879' : '#A1AAB6');
      });
    }
  }

  class HouseScene extends Phaser.Scene {
    constructor() { super({ key: 'HouseScene' }); }

    create() {
      this.isNavigating = false;
      this.saveManager = new SaveManager();
      this.saveManager.init();
      this.needsManager = new NeedsManager(this.saveManager);
      this.drawBackground();
      this.hud = createHud(this, this.saveManager, this.needsManager);

      this.add.text(WIDTH / 2, 218, 'أين نذهب الآن؟', {
        fontFamily: FONT, fontSize: '47px', color: '#43515E', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.add.text(WIDTH / 2, 268, 'اختر غرفة لتهتم بطفلك وتكسب العملات والنجوم.', {
        fontFamily: FONT, fontSize: '24px', color: '#62717B'
      }).setOrigin(0.5);

      const centersX = [330, 960, 1590];
      const centersY = [437, 728];
      ROOMS.forEach((room, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        this.createRoomCard(centersX[col], centersY[row], room);
      });

      addButton(this, {
        x: 167, y: 995, width: 240, height: 65,
        label: '🏠  القائمة', color: 0x788DA2, border: 0x5B7085, fontSize: 23,
        onClick: () => navigate(this, 'MenuScene')
      });
      addButton(this, {
        x: 1750, y: 995, width: 255, height: 65,
        label: '🎁  المتجر', color: 0xF2A64A, border: 0xCD7B2C, fontSize: 23,
        onClick: () => navigate(this, 'ShopScene')
      });

      this.startNeedsTimer();
      this.cameras.main.fadeIn(220, 250, 246, 239);
    }

    drawBackground() {
      const graphics = this.add.graphics();
      graphics.fillStyle(0xFFF8E9, 1); graphics.fillRect(0, 0, WIDTH, HEIGHT);
      graphics.fillStyle(0xE9D5B9, 1); graphics.fillRect(0, 872, WIDTH, 208);
      graphics.fillStyle(0xD6BD9C, 1); graphics.fillRect(0, 866, WIDTH, 15);
      graphics.fillStyle(0xFFE4C7, 0.68); graphics.fillRoundedRect(65, 295, 1790, 575, 45);
      graphics.lineStyle(5, 0xFFFFFF, 0.76); graphics.strokeRoundedRect(65, 295, 1790, 575, 45);
      graphics.fillStyle(0xC7E7F3, 1); graphics.fillRoundedRect(145, 330, 120, 100, 18);
      graphics.lineStyle(8, 0xFFFFFF, 1); graphics.strokeRoundedRect(145, 330, 120, 100, 18);
      graphics.lineBetween(205, 332, 205, 428); graphics.lineBetween(147, 380, 263, 380);
      graphics.fillStyle(0xA9DCA4, 1); graphics.fillEllipse(1670, 865, 520, 125);
    }

    createRoomCard(x, y, room) {
      const width = 550;
      const height = 270;
      const container = this.add.container(x, y).setDepth(15);
      const background = this.add.graphics();
      const draw = (hovered) => {
        background.clear();
        background.fillStyle(hovered ? 0xFFFFFF : 0xFFFEFC, 0.96);
        background.fillRoundedRect(-width / 2, -height / 2, width, height, 30);
        background.lineStyle(hovered ? 8 : 5, room.accent, 0.96);
        background.strokeRoundedRect(-width / 2, -height / 2, width, height, 30);
        background.fillStyle(room.accent, 0.13);
        background.fillCircle(-179, -48, 68);
      };
      draw(false);
      const icon = this.add.text(-179, -51, room.icon, { fontFamily: FONT, fontSize: '66px' }).setOrigin(0.5);
      const title = this.add.text(-80, -66, room.name, {
        fontFamily: FONT, fontSize: '34px', color: '#39495A', fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      const hint = this.add.text(-80, -14, room.hint, {
        fontFamily: FONT, fontSize: '21px', color: '#71808D'
      }).setOrigin(0, 0.5);
      const pill = this.add.text(0, 77, 'اضغط لزيارة الغرفة  ←', {
        fontFamily: FONT, fontSize: '20px', color: '#FFFFFF', fontStyle: 'bold',
        backgroundColor: `#${room.accent.toString(16).padStart(6, '0')}`,
        padding: { x: 18, y: 11 }
      }).setOrigin(0.5);
      const zone = this.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
      container.add([background, icon, title, hint, pill, zone]);
      zone.on('pointerover', () => draw(true));
      zone.on('pointerout', () => draw(false));
      zone.on('pointerdown', () => navigate(this, room.sceneKey));
    }

    startNeedsTimer() {
      this.needsTimer = this.time.addEvent({
        delay: 10000,
        loop: true,
        callback: () => { this.needsManager.tick(); this.hud.refresh(); }
      });
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.needsTimer.remove());
    }
  }

  class CareRoomScene extends Phaser.Scene {
    constructor(room) {
      super({ key: room.sceneKey });
      this.room = room;
    }

    create() {
      this.isNavigating = false;
      this.saveManager = new SaveManager();
      this.saveManager.init();
      this.needsManager = new NeedsManager(this.saveManager);
      this.actionLocked = false;
      this.drawRoom();
      this.hud = createHud(this, this.saveManager, this.needsManager);

      this.add.text(WIDTH / 2, 218, `${this.room.icon}  ${this.room.name}`, {
        fontFamily: FONT, fontSize: '46px', color: '#39495A', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.add.text(WIDTH / 2, 272, this.room.hint, {
        fontFamily: FONT, fontSize: '24px', color: '#687889'
      }).setOrigin(0.5);

      this.addFurniture();
      this.character = addCharacter(this, this.saveManager, 575, 660, 0.66, 20);
      animateCharacter(this, this.character, this.saveManager, 8, 1500);
      this.add.text(575, 890, 'طفلك هنا', {
        fontFamily: FONT, fontSize: '21px', color: '#4F6070', fontStyle: 'bold',
        backgroundColor: '#FFFFFFCC', padding: { x: 16, y: 9 }
      }).setOrigin(0.5);

      if (this.room.id === 'kitchen') this.addFoodItems();
      this.addRoomActionButton();
      addButton(this, {
        x: 170, y: 995, width: 260, height: 65,
        label: '←  العودة إلى المنزل', color: 0x788DA2, border: 0x5B7085, fontSize: 21,
        onClick: () => navigate(this, 'HouseScene')
      });
      addButton(this, {
        x: 1750, y: 995, width: 250, height: 65,
        label: '🎁  المتجر', color: 0xF2A64A, border: 0xCD7B2C, fontSize: 23,
        onClick: () => navigate(this, 'ShopScene')
      });

      this.startNeedsTimer();
      this.cameras.main.fadeIn(220, 250, 246, 239);
    }

    drawRoom() {
      const graphics = this.add.graphics();
      graphics.fillStyle(this.room.wall, 1); graphics.fillRect(0, 0, WIDTH, HEIGHT);
      graphics.fillStyle(0xFFFFFF, 0.28); graphics.fillRoundedRect(180, 182, 1560, 654, 50);
      graphics.fillStyle(this.room.floor, 1); graphics.fillRect(0, 830, WIDTH, 250);
      graphics.fillStyle(0xFFFFFF, 0.45); graphics.fillRect(0, 825, WIDTH, 14);

      // A sunny window and a few simple wall decorations give every room a homey feel.
      graphics.fillStyle(0xBDE8F5, 0.92); graphics.fillRoundedRect(270, 315, 160, 138, 18);
      graphics.lineStyle(9, 0xFFFFFF, 0.95); graphics.strokeRoundedRect(270, 315, 160, 138, 18);
      graphics.lineBetween(350, 319, 350, 449); graphics.lineBetween(274, 384, 426, 384);
      graphics.fillStyle(this.room.accent, 0.35); graphics.fillCircle(1620, 386, 57);
      graphics.fillStyle(0xFFFFFF, 0.72); graphics.fillCircle(1620, 386, 36);
      graphics.fillStyle(this.room.accent, 0.75); graphics.fillCircle(1620, 386, 24);

      graphics.fillStyle(this.room.accent, 0.12);
      graphics.fillRoundedRect(220, 480, 1480, 345, 36);
    }

    addFurniture() {
      const furniture = this.add.image(1325, 642, this.room.furniture)
        .setScale(this.room.scale).setDepth(8).setInteractive({ useHandCursor: true });
      furniture.on('pointerdown', () => this.performCare());
      this.add.text(1325, 846, 'المس الأثاث أو الزر للبدء', {
        fontFamily: FONT, fontSize: '19px', color: '#61717F', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(9);
    }

    addFoodItems() {
      const food = [
        { key: 'food_apple', x: 1065, y: 482, scale: 0.78 },
        { key: 'food_bottle', x: 1510, y: 475, scale: 0.72 }
      ];
      food.forEach((item) => {
        const image = this.add.image(item.x, item.y, item.key).setScale(item.scale).setDepth(35)
          .setInteractive({ useHandCursor: true });
        image.setData('careAction', 'feed');
        image.setData('homeX', item.x);
        image.setData('homeY', item.y);
        this.input.setDraggable(image);
        image.on('pointerup', (pointer) => {
          // A short tap feeds the baby; a drag is handled by the drop target below.
          if (pointer.getDistance() < 12) this.performCare();
        });
      });

      this.input.on('dragstart', (pointer, gameObject) => {
        if (gameObject.getData('careAction')) gameObject.setDepth(50);
      });
      this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        if (gameObject.getData('careAction')) {
          gameObject.x = dragX;
          gameObject.y = dragY;
        }
      });
      this.input.on('dragend', (pointer, gameObject) => {
        if (!gameObject.getData('careAction')) return;
        const distance = Phaser.Math.Distance.Between(gameObject.x, gameObject.y, this.character.image.x, this.character.image.y - 80);
        if (distance < 245) {
          this.performCare();
        } else {
          showToast(this, 'اسحب الطعام بالقرب من الطفل لإطعامه 🍎');
        }
        this.tweens.add({
          targets: gameObject, x: gameObject.getData('homeX'), y: gameObject.getData('homeY'),
          duration: 260, ease: 'Back.easeOut', onComplete: () => gameObject.setDepth(35)
        });
      });
    }

    addRoomActionButton() {
      const button = addButton(this, {
        x: 1325, y: 927, width: 495, height: 82,
        label: `${this.room.icon}  ${this.room.actionLabel}`,
        color: this.room.accent, border: this.darken(this.room.accent), fontSize: 25,
        onClick: () => this.performCare()
      });
      button.container.setDepth(30);
    }

    darken(color) {
      const r = Math.max(0, ((color >> 16) & 255) - 45);
      const g = Math.max(0, ((color >> 8) & 255) - 45);
      const b = Math.max(0, (color & 255) - 45);
      return (r << 16) | (g << 8) | b;
    }

    performCare() {
      if (this.actionLocked) return;
      const result = this.needsManager.perform(this.room.action);
      if (!result.ok) {
        showToast(this, 'هذه الحاجة مكتملة الآن 😊 جرّب غرفة أخرى.');
        return;
      }
      this.actionLocked = true;
      this.hud.refresh();

      const reward = result.starReward ? '  🪙 +5  ⭐ +1 نجمة!' : '  🪙 +5 عملات';
      showToast(this, `${this.room.success}${reward}`);
      this.tweens.add({
        targets: this.character.image,
        scaleX: this.character.image.scaleX * 1.08,
        scaleY: this.character.image.scaleY * 1.08,
        duration: 180,
        yoyo: true,
        onComplete: () => {
          if (this.character && this.character.image.active) {
            this.character.image.setScale(0.66);
          }
        }
      });
      const heart = this.add.image(this.character.image.x + 105, this.character.image.y - 150, 'icon_heart')
        .setScale(0.7).setDepth(60).setAlpha(0);
      this.tweens.add({
        targets: heart, alpha: 1, y: heart.y - 82, scale: 1.1, duration: 310,
        yoyo: true, hold: 250, onComplete: () => heart.destroy()
      });
      this.time.delayedCall(700, () => { this.actionLocked = false; });
    }

    startNeedsTimer() {
      this.needsTimer = this.time.addEvent({
        delay: 10000,
        loop: true,
        callback: () => { this.needsManager.tick(); this.hud.refresh(); }
      });
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.needsTimer.remove());
    }
  }

  class ShopScene extends Phaser.Scene {
    constructor() { super({ key: 'ShopScene' }); }

    create() {
      this.isNavigating = false;
      this.saveManager = new SaveManager();
      this.saveManager.init();
      this.needsManager = new NeedsManager(this.saveManager);
      const background = this.add.graphics();
      background.fillStyle(0xF4EDFF, 1); background.fillRect(0, 0, WIDTH, HEIGHT);
      background.fillStyle(0xFFE7EF, 0.8); background.fillEllipse(950, 1050, 2200, 450);
      this.hud = createHud(this, this.saveManager, this.needsManager);

      this.add.text(WIDTH / 2, 218, 'متجر الإكسسوارات', {
        fontFamily: FONT, fontSize: '48px', color: '#74518B', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.add.text(WIDTH / 2, 273, 'اشترِ زينة لطيفة لطفلك بالعملات التي تكسبها من العناية به.', {
        fontFamily: FONT, fontSize: '23px', color: '#746E80'
      }).setOrigin(0.5);
      this.itemCards = [];
      this.itemButtons = [];
      this.renderItems();
      addButton(this, {
        x: 175, y: 995, width: 260, height: 65,
        label: '←  العودة', color: 0x788DA2, border: 0x5B7085, fontSize: 23,
        onClick: () => navigate(this, 'MenuScene')
      });
      this.cameras.main.fadeIn(220, 244, 237, 255);
    }

    renderItems() {
      if (this.itemCards) this.itemCards.forEach((card) => card.destroy(true));
      if (this.itemButtons) this.itemButtons.forEach((button) => button.destroy(true));
      this.itemCards = [];
      this.itemButtons = [];
      const centers = [365, 960, 1555];
      SHOP_ITEMS.forEach((item, index) => {
        const x = centers[index];
        const y = 610;
        const container = this.add.container(x, y).setDepth(20);
        const bg = this.add.graphics();
        bg.fillStyle(0xFFFFFF, 0.94); bg.fillRoundedRect(-245, -222, 490, 444, 32);
        bg.lineStyle(5, [0xF2A0BD, 0xE4BD51, 0x78B6DD][index], 0.9);
        bg.strokeRoundedRect(-245, -222, 490, 444, 32);
        bg.fillStyle(0xF7F4FA, 1); bg.fillCircle(0, -112, 78);
        const icon = this.add.text(0, -112, item.icon, { fontFamily: FONT, fontSize: '77px' }).setOrigin(0.5);
        const title = this.add.text(0, 10, item.name, {
          fontFamily: FONT, fontSize: '31px', color: '#485466', fontStyle: 'bold'
        }).setOrigin(0.5);
        const description = this.add.text(0, 58, item.description, {
          fontFamily: FONT, fontSize: '19px', color: '#73808C', align: 'center', wordWrap: { width: 390 }
        }).setOrigin(0.5);
        container.add([bg, icon, title, description]);
        this.itemCards.push(container);

        const owned = this.saveManager.data.accessories.includes(item.id);
        const equipped = this.saveManager.data.equippedAccessory === item.id;
        const button = addButton(this, {
          x, y: 780, width: 340, height: 68,
          label: equipped ? '✓ مُرتدى الآن' : owned ? 'استخدم هذه الزينة' : `شراء  •  ${item.price} 🪙`,
          color: equipped ? 0x7CBF91 : owned ? 0x729CC4 : 0xE6A14F,
          border: equipped ? 0x56936B : owned ? 0x547BA2 : 0xC77D36,
          fontSize: 23,
          onClick: () => this.selectItem(item)
        });
        this.itemButtons.push(button.container);
      });
    }

    selectItem(item) {
      const owned = this.saveManager.data.accessories.includes(item.id);
      if (!owned) {
        if (this.saveManager.data.coins < item.price) {
          showToast(this, 'عملاتك لا تكفي بعد. اعتنِ بالطفل لتكسب المزيد!');
          return;
        }
        this.saveManager.data.coins -= item.price;
        this.saveManager.data.accessories.push(item.id);
        this.saveManager.data.equippedAccessory = item.id;
        this.saveManager.save();
        showToast(this, `أحسنت! حصلت على ${item.name} 🎉`);
      } else {
        this.saveManager.data.equippedAccessory = this.saveManager.data.equippedAccessory === item.id ? '' : item.id;
        this.saveManager.save();
        showToast(this, this.saveManager.data.equippedAccessory ? `تم اختيار ${item.name} ✨` : 'تمت إزالة الزينة.');
      }
      this.hud.refresh();
      this.renderItems();
    }
  }

  class SettingsScene extends Phaser.Scene {
    constructor() { super({ key: 'SettingsScene' }); }

    create() {
      this.isNavigating = false;
      this.saveManager = new SaveManager();
      this.saveManager.init();
      const background = this.add.graphics();
      background.fillStyle(0xEAF2FA, 1); background.fillRect(0, 0, WIDTH, HEIGHT);
      background.fillStyle(0xE7DDF5, 0.72); background.fillEllipse(990, 1080, 2100, 420);

      this.add.text(WIDTH / 2, 195, 'الإعدادات والمساعدة', {
        fontFamily: FONT, fontSize: '48px', color: '#405568', fontStyle: 'bold'
      }).setOrigin(0.5);

      const panel = this.add.graphics();
      panel.fillStyle(0xFFFFFF, 0.92); panel.fillRoundedRect(475, 280, 970, 540, 32);
      panel.lineStyle(4, 0xCBD9E5, 1); panel.strokeRoundedRect(475, 280, 970, 540, 32);
      this.add.text(WIDTH / 2, 350, 'كيف تلعب؟', {
        fontFamily: FONT, fontSize: '31px', color: '#3F596E', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.add.text(WIDTH / 2, 417,
        'زر المنزل لزيارة الغرف، وكل غرفة فيها نشاط يساعد طفلك.\n' +
        'كلما اعتنيت به، كسبت عملات؛ واحصل على نجمة بعد كل خمس رعايات.\n' +
        'تُحفظ العملات واختيارك تلقائياً على هذا الجهاز.', {
          fontFamily: FONT, fontSize: '22px', color: '#657889', align: 'center',
          lineSpacing: 12, wordWrap: { width: 780 }
        }).setOrigin(0.5);

      this.motionButton = addButton(this, {
        x: WIDTH / 2, y: 575, width: 500, height: 74,
        label: this.motionLabelText(), color: 0x7B91A4, border: 0x5B7085, fontSize: 23,
        onClick: () => {
          this.saveManager.data.settings.reduceMotion = !this.saveManager.data.settings.reduceMotion;
          this.saveManager.save();
          this.motionButton.text.setText(this.motionLabelText());
          showToast(this, 'تم حفظ إعداد الحركة. سيُطبّق عند فتح الشاشة التالية.');
        }
      });

      addButton(this, {
        x: WIDTH / 2, y: 690, width: 420, height: 72,
        label: '🗑️  إعادة ضبط التقدّم', color: 0xE66B6B, border: 0xBD4F4F, fontSize: 23,
        onClick: () => {
          const confirmed = window.confirm('هل تريد إعادة ضبط العملات والنجوم واختيار الشخصية؟');
          if (!confirmed) return;
          this.saveManager.reset();
          showToast(this, 'تمت إعادة ضبط التقدّم.');
        }
      });

      addButton(this, {
        x: 175, y: 980, width: 260, height: 68,
        label: '←  القائمة الرئيسية', color: 0x788DA2, border: 0x5B7085, fontSize: 22,
        onClick: () => navigate(this, 'MenuScene')
      });
      this.cameras.main.fadeIn(220, 234, 243, 250);
    }

    motionLabelText() {
      const enabled = this.saveManager.data.settings.reduceMotion;
      return `تقليل حركة الرسوم: ${enabled ? 'مفعّل ✓' : 'متوقف'}`;
    }
  }

  const gameConfig = {
    type: Phaser.CANVAS,
    width: WIDTH,
    height: HEIGHT,
    parent: 'game-container',
    backgroundColor: '#A9DFF7',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: WIDTH,
      height: HEIGHT
    },
    input: { activePointers: 2, touch: { capture: true } },
    render: { antialias: true, roundPixels: false },
    scene: [
      BootScene,
      MenuScene,
      CharacterSelectScene,
      HouseScene,
      ...ROOMS.map((room) => new CareRoomScene(room)),
      ShopScene,
      SettingsScene
    ]
  };

  try {
    new Phaser.Game(gameConfig);
  } catch (error) {
    console.error('Baby Care World failed to start:', error);
    const loader = document.getElementById('pre-loader');
    if (loader) {
      loader.classList.remove('hidden');
      loader.innerHTML = '<div class="load-error"><h1>حدث خطأ عند تشغيل اللعبة</h1><p>أعد تحميل الصفحة، أو جرّب متصفحاً أحدث.</p></div>';
    }
  }
})();
