/**
 * InventoryManager - Manages player's inventory (clothes, toys, decorations).
 * Handles unlocking, equipping, and tracking owned items.
 */
import SaveManager from './SaveManager.js';

export default class InventoryManager {
  constructor() {
    this.saveManager = new SaveManager();
    this.categories = {
      clothes: [],
      toys: [],
      decorations: [],
      furniture: []
    };
  }

  /**
   * Initialize inventory from save data
   */
  initialize() {
    const data = this.saveManager.getSaveData();
    this.categories.clothes = data.unlockedClothes || ['default'];
    this.categories.toys = data.unlockedToys || ['basic'];
    this.categories.decorations = data.unlockedDecorations || [];
  }

  /**
   * Check if item is owned
   */
  hasItem(category, itemId) {
    return this.categories[category]?.includes(itemId) || false;
  }

  /**
   * Unlock a new item
   */
  unlockItem(category, itemId) {
    if (!this.categories[category]) return false;
    if (this.categories[category].includes(itemId)) return false;
    
    this.categories[category].push(itemId);
    this.saveToDisk();
    return true;
  }

  /**
   * Get all items in a category
   */
  getItems(category) {
    return this.categories[category] || [];
  }

  /**
   * Get total item count
   */
  getTotalItems() {
    return Object.values(this.categories).reduce((sum, arr) => sum + arr.length, 0);
  }

  /**
   * Save to disk
   */
  saveToDisk() {
    const data = this.saveManager.getSaveData();
    data.unlockedClothes = this.categories.clothes;
    data.unlockedToys = this.categories.toys;
    data.unlockedDecorations = this.categories.decorations;
    this.saveManager.save();
  }
}
