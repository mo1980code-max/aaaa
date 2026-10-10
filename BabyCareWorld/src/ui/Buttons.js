/**
 * Buttons - Reusable button factory for the game.
 */
import Phaser from 'phaser';

export default class Buttons {
  /**
   * Create a text button
   */
  static createTextButton(scene, x, y, text, bgColor, borderColor, callback, options = {}) {
    const width = options.width || 280;
    const height = options.height || 80;
    const radius = options.radius || 20;

    const container = scene.add.container(x, y);

    // Shadow
    const shadow = scene.add.graphics();
    shadow.fillStyle(0x000000, 0.2);
    shadow.fillRoundedRect(-width / 2 + 3, -height / 2 + 5, width, height, radius);

    // Background
    const bg = scene.add.graphics();
    bg.fillStyle(bgColor, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
    bg.lineStyle(3, borderColor, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);

    // Text
    const txt = scene.add.text(0, 0, text, {
      fontSize: options.fontSize || '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    container.add([shadow, bg, txt]);

    // Interactive zone
    const zone = scene.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
    container.add(zone);

    // Press animation
    zone.on('pointerdown', () => {
      scene.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: () => callback()
      });
    });

    // Hover
    zone.on('pointerover', () => {
      scene.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100
      });
    });

    zone.on('pointerout', () => {
      scene.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100
      });
    });

    return container;
  }

  /**
   * Create an icon button (round)
   */
  static createIconButton(scene, x, y, icon, size, bgColor, callback) {
    const container = scene.add.container(x, y);

    const bg = scene.add.graphics();
    bg.fillStyle(bgColor, 1);
    bg.fillCircle(0, 0, size / 2);

    const txt = scene.add.text(0, 0, icon, {
      fontSize: `${size * 0.5}px`,
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    container.add([bg, txt]);

    const zone = scene.add.zone(0, 0, size, size).setInteractive({ useHandCursor: true });
    container.add(zone);

    zone.on('pointerdown', () => {
      scene.tweens.add({
        targets: container,
        scale: 0.9,
        duration: 50,
        yoyo: true,
        onComplete: () => callback()
      });
    });

    return container;
  }
}
