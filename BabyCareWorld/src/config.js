// Game Configuration
export const GAME_CONFIG = {
  // Game dimensions (designed for landscape)
  WIDTH: 1920,
  HEIGHT: 1080,

  // Game title
  TITLE: 'Baby Care World',

  // Physics
  GRAVITY: 980,

  // Colors
  COLORS: {
    PRIMARY: '#FF6B9D',
    SECONDARY: '#C44569',
    ACCENT: '#FFD93D',
    BACKGROUND: '#87CEEB',
    SKY: '#E8F4FD',
    GROUND: '#90EE90',
    TEXT: '#2C3E50',
    WHITE: '#FFFFFF',
    DARK: '#1a1a2e',
    
    // Room colors
    LIVING_ROOM: '#FFE4B5',
    KITCHEN: '#FFDAB9',
    BATHROOM: '#E0F7FA',
    BEDROOM: '#F3E5F5',
    PLAYROOM: '#FFF9C4',
    GARDEN: '#C8E6C9',
    
    // Needs bar colors
    HUNGER: '#FF6B6B',
    HYGIENE: '#4ECDC4',
    SLEEP: '#45B7D1',
    ENERGY: '#F7DC6F',
    HAPPINESS: '#FF9FF3'
  },

  // Game scenes
  SCENES: {
    BOOT: 'BootScene',
    PRELOAD: 'PreloadScene',
    MENU: 'MenuScene',
    CHARACTER_SELECT: 'CharacterSelectScene',
    HOUSE: 'HouseScene',
    LIVING_ROOM: 'LivingRoomScene',
    KITCHEN: 'KitchenScene',
    BATHROOM: 'BathroomScene',
    BEDROOM: 'BedroomScene',
    PLAYROOM: 'PlayroomScene',
    GARDEN: 'GardenScene',
    CLOTHES_SHOP: 'ClothesShopScene',
    SETTINGS: 'SettingsScene'
  },

  // Baby needs defaults
  DEFAULT_NEEDS: {
    hunger: 80,
    hygiene: 90,
    sleep: 70,
    energy: 85,
    happiness: 100
  },

  // Currency
  INITIAL_COINS: 100,
  INITIAL_STARS: 0,

  // Save key
  SAVE_KEY: 'babyCareWorld_save'
};

export default GAME_CONFIG;
