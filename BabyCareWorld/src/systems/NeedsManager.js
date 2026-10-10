import { GAME_CONFIG } from '../config.js';

/**
 * NeedsManager - Manages baby's needs (hunger, hygiene, sleep, energy, happiness).
 * Needs decay over time and are affected by player activities.
 */
export default class NeedsManager {
  constructor(saveManager) {
    this.saveManager = saveManager;
    this.needs = { ...GAME_CONFIG.DEFAULT_NEEDS };
    
    // Decay rates per tick (every 5 seconds)
    this.decayRates = {
      hunger: 0.5,
      hygiene: 0.3,
      sleep: 0.4,
      energy: 0.3,
      happiness: 0.2
    };

    this.loadNeeds();
  }

  /**
   * Load needs from save data
   */
  loadNeeds() {
    const saveData = this.saveManager.getSaveData();
    this.needs = { ...saveData.babyNeeds };
  }

  /**
   * Get current needs
   */
  getNeeds() {
    return { ...this.needs };
  }

  /**
   * Decay needs over time (called every tick)
   */
  tick() {
    for (const [key, value] of Object.entries(this.needs)) {
      this.needs[key] = Math.max(0, value - this.decayRates[key]);
    }
    this.save();
  }

  /**
   * Feed the baby (increases hunger)
   */
  feed(amount = 25) {
    this.needs.hunger = Math.min(100, this.needs.hunger + amount);
    this.needs.energy = Math.min(100, this.needs.energy + 5);
    this.save();
    return { success: true, needs: this.getNeeds() };
  }

  /**
   * Bath the baby (increases hygiene)
   */
  bath(amount = 30) {
    this.needs.hygiene = Math.min(100, this.needs.hygiene + amount);
    this.needs.happiness = Math.min(100, this.needs.happiness + 10);
    this.save();
    return { success: true, needs: this.getNeeds() };
  }

  /**
   * Put baby to sleep (increases sleep)
   */
  sleep(amount = 35) {
    this.needs.sleep = Math.min(100, this.needs.sleep + amount);
    this.needs.energy = Math.min(100, this.needs.energy + 20);
    this.save();
    return { success: true, needs: this.getNeeds() };
  }

  /**
   * Play with baby (increases happiness, decreases energy)
   */
  play(amount = 20) {
    this.needs.happiness = Math.min(100, this.needs.happiness + amount);
    this.needs.energy = Math.max(0, this.needs.energy - 10);
    this.needs.hunger = Math.max(0, this.needs.hunger - 5);
    this.save();
    return { success: true, needs: this.getNeeds() };
  }

  /**
   * Rest (increases energy)
   */
  rest(amount = 15) {
    this.needs.energy = Math.min(100, this.needs.energy + amount);
    this.save();
    return { success: true, needs: this.getNeeds() };
  }

  /**
   * Get baby mood based on needs
   */
  getMood() {
    const avg = (this.needs.hunger + this.needs.hygiene + this.needs.sleep + 
                 this.needs.energy + this.needs.happiness) / 5;
    
    if (avg >= 80) return 'happy';
    if (avg >= 60) return 'neutral';
    if (avg >= 40) return 'sad';
    return 'crying';
  }

  /**
   * Get the need that is most urgent (lowest value)
   */
  getMostUrgentNeed() {
    let minKey = null;
    let minValue = Infinity;
    
    for (const [key, value] of Object.entries(this.needs)) {
      if (value < minValue) {
        minValue = value;
        minKey = key;
      }
    }
    
    return { need: minKey, value: minValue };
  }

  /**
   * Check if baby needs attention (any need below threshold)
   */
  needsAttention(threshold = 30) {
    for (const [key, value] of Object.entries(this.needs)) {
      if (value < threshold) {
        return true;
      }
    }
    return false;
  }

  /**
   * Save current needs
   */
  save() {
    this.saveManager.updateNeeds(this.needs);
  }

  /**
   * Reset needs to defaults
   */
  reset() {
    this.needs = { ...GAME_CONFIG.DEFAULT_NEEDS };
    this.save();
  }
}
