import Phaser from 'phaser';
import BaseRoomScene from './BaseRoomScene.js';
import { GAME_CONFIG } from '../config.js';

/**
 * BedroomScene - Interactive bedroom with bed, crib, and nightlight.
 */
export default class BedroomScene extends BaseRoomScene {
  constructor() {
    super(GAME_CONFIG.SCENES.BEDROOM);
  }

  create() {
    super.create({
      bgColor: 0xF3E5F5,
      floorColor: 0xCE93D8,
      wallAccent: 0xE1BEE7,
      title: '🛏️ غرفة النوم - Bedroom',
      babyX: GAME_CONFIG.WIDTH * 0.5,
      babyY: GAME_CONFIG.HEIGHT * 0.62
    });
  }

  createFurniture(config) {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // Stars on ceiling
    for (let i = 0; i < 15; i++) {
      const star = this.add.text(
        100 + Math.random() * (WIDTH - 200),
        20 + Math.random() * 120,
        '⭐', { fontSize: `${10 + Math.random() * 16}px` }
      ).setAlpha(0.4);

      this.tweens.add({
        targets: star,
        alpha: 0.1,
        duration: 1500 + Math.random() * 2000,
        repeat: -1,
        yoyo: true
      });
    }

    // Moon
    const moon = this.add.graphics();
    moon.fillStyle(0xFFF9C4, 0.8);
    moon.fillCircle(WIDTH * 0.85, 70, 35);
    moon.fillStyle(0xF3E5F5, 1);
    moon.fillCircle(WIDTH * 0.85 + 10, 65, 30);

    // Bed
    const bed = this.add.graphics();
    // Bed frame
    bed.fillStyle(0x8D6E63, 1);
    bed.fillRoundedRect(WIDTH * 0.15, HEIGHT * 0.42, 400, 220, 15);
    // Mattress
    bed.fillStyle(0xFFFFFF, 1);
    bed.fillRoundedRect(WIDTH * 0.16, HEIGHT * 0.44, 380, 180, 10);
    // Blanket
    bed.fillStyle(0xCE93D8, 0.8);
    bed.fillRoundedRect(WIDTH * 0.16, HEIGHT * 0.52, 380, 130, 10);
    // Blanket pattern
    bed.fillStyle(0xAB47BC, 0.5);
    for (let x = WIDTH * 0.18; x < WIDTH * 0.16 + 370; x += 50) {
      bed.fillCircle(x, HEIGHT * 0.60, 8);
      bed.fillCircle(x + 25, HEIGHT * 0.68, 8);
    }
    // Pillow
    bed.fillStyle(0xF8BBD0, 1);
    bed.fillRoundedRect(WIDTH * 0.18, HEIGHT * 0.44, 100, 60, 20);
    // Headboard
    bed.fillStyle(0x6D4C41, 1);
    bed.fillRoundedRect(WIDTH * 0.13, HEIGHT * 0.25, 30, 200, 8);
    bed.fillRoundedRect(WIDTH * 0.15, HEIGHT * 0.30, 400, 30, 8);

    // Teddy bear on bed
    const teddy = this.add.graphics();
    teddy.fillStyle(0xA1887F, 1);
    teddy.fillCircle(WIDTH * 0.42, HEIGHT * 0.48, 25); // body
    teddy.fillCircle(WIDTH * 0.42, HEIGHT * 0.44 - 15, 18); // head
    teddy.fillCircle(WIDTH * 0.42 - 15, HEIGHT * 0.44 - 25, 8); // ear
    teddy.fillCircle(WIDTH * 0.42 + 15, HEIGHT * 0.44 - 25, 8); // ear
    teddy.fillStyle(0x6D4C41, 1);
    teddy.fillCircle(WIDTH * 0.42 - 5, HEIGHT * 0.44 - 18, 3); // eye
    teddy.fillCircle(WIDTH * 0.42 + 5, HEIGHT * 0.44 - 18, 3); // eye
    teddy.fillCircle(WIDTH * 0.42, HEIGHT * 0.44 - 12, 3); // nose

    // Nightstand
    const nightstand = this.add.graphics();
    nightstand.fillStyle(0x8D6E63, 1);
    nightstand.fillRoundedRect(WIDTH * 0.60, HEIGHT * 0.50, 100, 120, 8);
    nightstand.fillStyle(0x795548, 1);
    nightstand.lineBetween(WIDTH * 0.60, HEIGHT * 0.56, WIDTH * 0.60 + 100, HEIGHT * 0.56);
    // Drawer handle
    nightstand.fillStyle(0xFFD54F, 1);
    nightstand.fillCircle(WIDTH * 0.65, HEIGHT * 0.53, 4);

    // Nightlight
    const nightlight = this.add.graphics();
    nightlight.fillStyle(0xFFEB3B, 0.6);
    nightlight.fillCircle(WIDTH * 0.65, HEIGHT * 0.46, 15);
    nightlight.fillStyle(0xFFF9C4, 0.3);
    nightlight.fillCircle(WIDTH * 0.65, HEIGHT * 0.46, 30);

    // Glow effect
    this.tweens.add({
      targets: nightlight,
      alpha: 0.5,
      duration: 2000,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    // Wardrobe
    const wardrobe = this.add.graphics();
    wardrobe.fillStyle(0x6D4C41, 1);
    wardrobe.fillRoundedRect(WIDTH * 0.75, HEIGHT * 0.15, 180, HEIGHT * 0.55, 10);
    wardrobe.lineBetween(WIDTH * 0.75 + 90, HEIGHT * 0.15, WIDTH * 0.75 + 90, HEIGHT * 0.15 + HEIGHT * 0.55);
    // Handles
    wardrobe.fillStyle(0xFFD54F, 1);
    wardrobe.fillCircle(WIDTH * 0.75 + 80, HEIGHT * 0.42, 5);
    wardrobe.fillCircle(WIDTH * 0.75 + 100, HEIGHT * 0.42, 5);

    // Rug
    const rug = this.add.graphics();
    rug.fillStyle(0xF48FB1, 0.6);
    rug.fillRoundedRect(WIDTH * 0.30, HEIGHT * 0.75, 350, 60, 25);
    rug.lineStyle(3, 0xEC407A, 0.5);
    rug.strokeRoundedRect(WIDTH * 0.30 + 10, HEIGHT * 0.75 + 8, 330, 44, 20);
  }

  setupInteractions(config) {
    const { WIDTH, HEIGHT } = GAME_CONFIG;

    // Bed interaction - put baby to sleep
    const bedZone = this.add.zone(WIDTH * 0.34, HEIGHT * 0.55, 380, 150)
      .setInteractive({ useHandCursor: true });
    bedZone.on('pointerdown', () => {
      this.tweens.add({
        targets: this.baby,
        x: WIDTH * 0.34,
        y: HEIGHT * 0.52,
        duration: 800,
        ease: 'Power2',
        onComplete: () => {
          // Sleep animation
          this.baby.setTexture(this.saveManager.getSaveData().selectedCharacter + '_sleep');
          this.showToast('😴 الطفل نائم... تصبح على خير!');
          this.showReward(5, 1);
          this.needsManager.sleep(30);

          // Zzz animation
          for (let i = 0; i < 3; i++) {
            const zzz = this.add.text(this.baby.x + 50 + i * 20, this.baby.y - 80, '💤', {
              fontSize: `${20 + i * 8}px`
            }).setOrigin(0.5).setAlpha(0);

            this.tweens.add({
              targets: zzz,
              alpha: 1,
              y: zzz.y - 60,
              duration: 2000,
              delay: i * 500,
              repeat: 2,
              onComplete: () => zzz.destroy()
            });
          }

          // Wake up after a while
          this.time.delayedCall(5000, () => {
            this.baby.setTexture(this.saveManager.getSaveData().selectedCharacter);
            this.showToast('☀️ استيقظ الطفل! صباح الخير!');
            this.needsManager.rest(15);
          });
        }
      });
    });

    // Wardrobe - clothes selection hint
    const wardrobeZone = this.add.zone(WIDTH * 0.84, HEIGHT * 0.4, 180, HEIGHT * 0.5)
      .setInteractive({ useHandCursor: true });
    wardrobeZone.on('pointerdown', () => {
      this.showToast('👗 متجر الملابس - قريباً!');
    });

    // Teddy bear
    const teddyZone = this.add.zone(WIDTH * 0.42, HEIGHT * 0.45, 60, 60)
      .setInteractive({ useHandCursor: true });
    teddyZone.on('pointerdown', () => {
      this.showToast('🧸 الدبدوب اللطيف!');
      this.needsManager.play(5);
    });
  }
}
