/**
 * DragDropManager - Manages drag and drop interactions.
 * Provides enhanced drag-and-drop with snap points, zones, and animations.
 */
import Phaser from 'phaser';

export default class DragDropManager {
  constructor(scene) {
    this.scene = scene;
    this.draggableItems = [];
    this.dropZones = [];
    this.activeDrag = null;
  }

  /**
   * Register a game object as draggable
   */
  registerDraggable(gameObject, options = {}) {
    gameObject.setInteractive({ draggable: true, useHandCursor: true });
    gameObject.setData('dragOptions', options);
    gameObject.setData('homeX', gameObject.x);
    gameObject.setData('homeY', gameObject.y);
    
    this.draggableItems.push(gameObject);
    return gameObject;
  }

  /**
   * Register a drop zone
   */
  registerDropZone(x, y, width, height, callback, options = {}) {
    const zone = this.scene.add.zone(x, y, width, height);
    zone.setInteractive();
    zone.setData('dropCallback', callback);
    zone.setData('dropOptions', options);
    this.dropZones.push(zone);
    return zone;
  }

  /**
   * Enable drag handling
   */
  enable() {
    this.scene.input.on('dragstart', (pointer, gameObject) => {
      this.activeDrag = gameObject;
      gameObject.setScale((gameObject.scaleX || 1) * 1.2);
      gameObject.setDepth(100);
    });

    this.scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    this.scene.input.on('dragend', (pointer, gameObject) => {
      gameObject.setScale((gameObject.scaleX || 1) / 1.2);
      gameObject.setDepth(gameObject.getData('dragOptions')?.depth || 10);

      // Check if dropped on a zone
      let dropped = false;
      for (const zone of this.dropZones) {
        if (this.isInZone(gameObject, zone)) {
          const callback = zone.getData('dropCallback');
          if (callback) callback(gameObject, zone);
          dropped = true;
          break;
        }
      }

      // Return home if not dropped on a zone
      if (!dropped) {
        const returnHome = gameObject.getData('dragOptions')?.returnHome !== false;
        if (returnHome) {
          this.scene.tweens.add({
            targets: gameObject,
            x: gameObject.getData('homeX'),
            y: gameObject.getData('homeY'),
            duration: 300,
            ease: 'Back.easeOut'
          });
        }
      }

      this.activeDrag = null;
    });
  }

  /**
   * Check if object is within a zone
   */
  isInZone(obj, zone) {
    const bounds = zone.getBounds();
    return Phaser.Geom.Intersects.RectangleToRectangle(
      new Phaser.Geom.Rectangle(obj.x - 20, obj.y - 20, 40, 40),
      bounds
    );
  }

  /**
   * Clean up
   */
  destroy() {
    this.draggableItems = [];
    this.dropZones = [];
    this.activeDrag = null;
  }
}
