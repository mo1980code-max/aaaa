import { GAME_CONFIG } from '../config.js';

/**
 * SaveManager - Handles all game save/load operations using localStorage.
 * Manages player progress, inventory, currency, and settings.
 */
export default class SaveManager {
  constructor() {
    this.saveKey = GAME_CONFIG.SAVE_KEY;
    this.saveData = null;
  }

  /**
   * Get default save data structure
   */
  getDefaultData() {
    return {
      version: 1,
      coins: GAME_CONFIG.INITIAL_COINS,
      stars: GAME_CONFIG.INITIAL_STARS,
      selectedCharacter: 'baby_boy',
      
      // Baby needs
      babyNeeds: { ...GAME_CONFIG.DEFAULT_NEEDS },
      
      // Unlocked items
      unlockedClothes: ['default'],
      currentClothes: 'default',
      unlockedToys: ['basic'],
      unlockedDecorations: [],
      
      // Progress
      totalPlayTime: 0,
      activitiesCompleted: 0,
      achievements: [],
      
      // Settings
      settings: {
        musicVolume: 0.7,
        sfxVolume: 0.8,
        notifications: true,
        reducedEffects: false
      },
      
      // Meta
      lastPlayed: Date.now(),
      createdAt: Date.now()
    };
  }

  /**
   * Initialize save data - loads existing or creates new
   */
  initialize() {
    const existing = this.load();
    if (existing) {
      this.saveData = this.mergeWithDefaults(existing);
    } else {
      this.saveData = this.getDefaultData();
      this.save();
    }
    return this.saveData;
  }

  /**
   * Load save data from localStorage
   */
  load() {
    try {
      const raw = localStorage.getItem(this.saveKey);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('SaveManager: Failed to load save data', e);
    }
    return null;
  }

  /**
   * Save current data to localStorage
   */
  save() {
    try {
      this.saveData.lastPlayed = Date.now();
      localStorage.setItem(this.saveKey, JSON.stringify(this.saveData));
      return true;
    } catch (e) {
      console.warn('SaveManager: Failed to save data', e);
      return false;
    }
  }

  /**
   * Merge loaded data with defaults (handles missing fields in older saves)
   */
  mergeWithDefaults(loaded) {
    const defaults = this.getDefaultData();
    return {
      ...defaults,
      ...loaded,
      babyNeeds: { ...defaults.babyNeeds, ...(loaded.babyNeeds || {}) },
      settings: { ...defaults.settings, ...(loaded.settings || {}) }
    };
  }

  /**
   * Get current save data
   */
  getSaveData() {
    if (!this.saveData) {
      this.initialize();
    }
    return this.saveData;
  }

  /**
   * Update a specific field
   */
  update(field, value) {
    if (this.saveData) {
      this.saveData[field] = value;
      this.save();
    }
  }

  /**
   * Add coins
   */
  addCoins(amount) {
    this.saveData.coins += amount;
    this.save();
    return this.saveData.coins;
  }

  /**
   * Spend coins (returns false if not enough)
   */
  spendCoins(amount) {
    if (this.saveData.coins >= amount) {
      this.saveData.coins -= amount;
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Add stars
   */
  addStars(amount) {
    this.saveData.stars += amount;
    this.save();
    return this.saveData.stars;
  }

  /**
   * Update baby needs
   */
  updateNeeds(needs) {
    this.saveData.babyNeeds = { ...this.saveData.babyNeeds, ...needs };
    this.save();
  }

  /**
   * Unlock a clothing item
   */
  unlockClothing(itemId) {
    if (!this.saveData.unlockedClothes.includes(itemId)) {
      this.saveData.unlockedClothes.push(itemId);
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Set current clothing
   */
  setCurrentClothing(itemId) {
    this.saveData.currentClothes = itemId;
    this.save();
  }

  /**
   * Track activity completion
   */
  completeActivity() {
    this.saveData.activitiesCompleted++;
    this.save();
  }

  /**
   * Update settings
   */
  updateSettings(settings) {
    this.saveData.settings = { ...this.saveData.settings, ...settings };
    this.save();
  }

  /**
   * Reset all progress
   */
  reset() {
    this.saveData = this.getDefaultData();
    this.save();
  }

  /**
   * Export save data (for backup)
   */
  export() {
    return JSON.stringify(this.saveData);
  }

  /**
   * Import save data
   */
  import(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      this.saveData = this.mergeWithDefaults(data);
      this.save();
      return true;
    } catch (e) {
      console.warn('SaveManager: Failed to import data', e);
      return false;
    }
  }
}
