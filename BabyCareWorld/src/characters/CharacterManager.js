/**
 * CharacterManager - Manages character selection and state.
 */
import SaveManager from '../systems/SaveManager.js';

export default class CharacterManager {
  constructor() {
    this.saveManager = new SaveManager();
    this.currentCharacter = null;
    this.characters = {
      baby_boy: {
        name: 'ولد',
        nameEn: 'Boy',
        texture: 'baby_boy',
        defaultClothes: 'default'
      },
      baby_girl: {
        name: 'بنت',
        nameEn: 'Girl',
        texture: 'baby_girl',
        defaultClothes: 'default'
      }
    };
  }

  /**
   * Initialize and load selected character
   */
  initialize() {
    const data = this.saveManager.getSaveData();
    this.currentCharacter = data.selectedCharacter || 'baby_boy';
    return this.characters[this.currentCharacter];
  }

  /**
   * Get current character info
   */
  getCurrentCharacter() {
    return this.characters[this.currentCharacter];
  }

  /**
   * Set active character
   */
  setCharacter(charKey) {
    if (this.characters[charKey]) {
      this.currentCharacter = charKey;
      this.saveManager.update('selectedCharacter', charKey);
      return true;
    }
    return false;
  }

  /**
   * Get all available characters
   */
  getAllCharacters() {
    return this.characters;
  }

  /**
   * Get character texture key
   */
  getTextureKey() {
    return this.currentCharacter;
  }
}
