import Phaser from 'phaser';
import { GAME_CONFIG } from '../config.js';
import SaveManager from '../systems/SaveManager.js';

/**
 * CharacterSelectScene - Player selects their baby character.
 */
export default class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: GAME_CONFIG.SCENES.CHARACTER_SELECT });
    this.saveManager = new SaveManager();
  }

  create() {
    this.saveManager.initialize();
    const { WIDTH, HEIGHT } = GAME_CONFIG;
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xFCE4EC, 0xFCE4EC, 0xF8BBD0, 0xF8BBD0, 1);
    bg.fillRect(0, 0, WIDTH, HEIGHT);

    // Decorative elements
    for (let i = 0; i < 8; i++) {
      const heart = this.add.image(
        100 + Math.random() * (WIDTH - 200),
        50 + Math.random() * (HEIGHT - 100),
        'icon_heart'
      ).setScale(0.5 + Math.random() * 0.5).setAlpha(0.3);

      this.tweens.add({
        targets: heart,
        y: heart.y - 20,
        alpha: 0.1,
        duration: 2000 + Math.random() * 2000,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }

    // Title
    this.add.text(centerX, 80, 'اختر شخصيتك', {
      fontSize: '48px',
      fontFamily: 'Arial',
      color: '#E91E63',
      fontStyle: 'bold',
      stroke: '#FFFFFF',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(centerX, 140, 'Choose Your Character', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#AD1457',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Character cards
    this.selectedChar = this.saveManager.getSaveData().selectedCharacter;

    // Boy card
    this.boyCard = this.createCharacterCard(
      centerX - 250, centerY + 30,
      'baby_boy', '👦 ولد', 'Boy',
      0x4FC3F7
    );

    // Girl card
    this.girlCard = this.createCharacterCard(
      centerX + 250, centerY + 30,
      'baby_girl', '👧 بنت', 'Girl',
      0xF48FB1
    );

    // Highlight current selection
    this.updateSelection();

    // Confirm button
    this.confirmBtn = this.createButton(
      centerX, HEIGHT - 100,
      '✅ تأكيد الاختيار',
      0x4CAF50, 0x388E3C,
      () => this.confirmSelection()
    );

    // Back button
    this.backBtn = this.createButton(
      160, HEIGHT - 100,
      '← رجوع',
      0xFF7043, 0xE64A19,
      () => this.goBack()
    );
  }

  createCharacterCard(x, y, charKey, labelAr, labelEn, themeColor) {
    const container = this.add.container(x, y);
    const cardWidth = 300;
    const cardHeight = 500;

    // Card background
    const cardBg = this.add.graphics();
    cardBg.fillStyle(0xFFFFFF, 0.9);
    cardBg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 20);
    cardBg.lineStyle(4, themeColor, 1);
    cardBg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 20);

    // Character image
    const character = this.add.image(0, -50, charKey)
      .setScale(2)
      .setOrigin(0.5);

    // Character name
    const nameAr = this.add.text(0, 120, labelAr, {
      fontSize: '36px',
      fontFamily: 'Arial',
      color: '#333333',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const nameEn = this.add.text(0, 165, labelEn, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#666666'
    }).setOrigin(0.5);

    // Selection ring (hidden by default)
    const selectionRing = this.add.graphics();
    selectionRing.lineStyle(6, themeColor, 1);
    selectionRing.strokeRoundedRect(-cardWidth / 2 - 8, -cardHeight / 2 - 8, cardWidth + 16, cardHeight + 16, 24);
    selectionRing.setVisible(false);

    container.add([cardBg, selectionRing, character, nameAr, nameEn]);

    // Bounce animation
    this.tweens.add({
      targets: character,
      y: -70,
      duration: 1000,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    // Make clickable
    const hitZone = this.add.zone(0, 0, cardWidth, cardHeight)
      .setInteractive({ useHandCursor: true });
    container.add(hitZone);

    hitZone.on('pointerdown', () => {
      this.selectedChar = charKey;
      this.updateSelection();
    });

    hitZone.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scaleX: 1.03,
        scaleY: 1.03,
        duration: 150,
        ease: 'Power2'
      });
    });

    hitZone.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Power2'
      });
    });

    return { container, selectionRing, charKey };
  }

  updateSelection() {
    this.boyCard.selectionRing.setVisible(this.selectedChar === 'baby_boy');
    this.girlCard.selectionRing.setVisible(this.selectedChar === 'baby_girl');
  }

  createButton(x, y, text, color, darkColor, callback) {
    const btnWidth = 240;
    const btnHeight = 65;
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 18);
    bg.lineStyle(3, darkColor, 1);
    bg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 18);

    const txt = this.add.text(0, 0, text, {
      fontSize: '26px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5);

    container.add([bg, txt]);

    const hitZone = this.add.zone(0, 0, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true });
    container.add(hitZone);

    hitZone.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: () => callback()
      });
    });

    return container;
  }

  confirmSelection() {
    this.saveManager.update('selectedCharacter', this.selectedChar);
    
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(GAME_CONFIG.SCENES.HOUSE);
    });
  }

  goBack() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(GAME_CONFIG.SCENES.MENU);
    });
  }
}
