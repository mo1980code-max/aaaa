import Phaser from 'phaser';
import { GAME_CONFIG } from './config.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import CharacterSelectScene from './scenes/CharacterSelectScene.js';
import HouseScene from './scenes/HouseScene.js';
import LivingRoomScene from './scenes/LivingRoomScene.js';
import KitchenScene from './scenes/KitchenScene.js';
import BathroomScene from './scenes/BathroomScene.js';
import BedroomScene from './scenes/BedroomScene.js';
import PlayroomScene from './scenes/PlayroomScene.js';
import GardenScene from './scenes/GardenScene.js';
import SettingsScene from './scenes/SettingsScene.js';

// Phaser game configuration
const config = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  parent: 'game-container',
  
  // Scale mode for responsive design
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT
  },

  // Rendering optimization
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
    transparent: false,
    batchSize: 2048
  },

  // Input configuration
  input: {
    activePointers: 3,
    touch: {
      capture: true
    }
  },

  // Scene list
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    CharacterSelectScene,
    HouseScene,
    LivingRoomScene,
    KitchenScene,
    BathroomScene,
    BedroomScene,
    PlayroomScene,
    GardenScene,
    SettingsScene
  ],

  // Physics (for future use)
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GAME_CONFIG.GRAVITY },
      debug: false
    }
  },

  // Banner
  banner: false
};

// Create the game
const game = new Phaser.Game(config);

// Hide the pre-loader once Phaser is ready
game.events.once('ready', () => {
  const preLoader = document.getElementById('pre-loader');
  if (preLoader) {
    preLoader.classList.add('hidden');
    setTimeout(() => preLoader.remove(), 500);
  }
});

// Handle visibility change (pause/resume)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.scene.getScene(game.scene.scenes[game.scene.scenes.length - 1])?.sound.pauseAll();
  } else {
    game.scene.getScene(game.scene.scenes[game.scene.scenes.length - 1])?.sound.resumeAll();
  }
});

// Lock orientation on mobile
function lockOrientation() {
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch(() => {});
  }
}

window.addEventListener('load', lockOrientation);
document.addEventListener('click', lockOrientation, { once: true });
document.addEventListener('touchstart', lockOrientation, { once: true });

// Handle back button on Android
window.addEventListener('popstate', (e) => {
  const currentScene = game.scene.scenes.find(s => s.scene.isActive());
  if (currentScene) {
    if (currentScene.scene.key === 'MenuScene') {
      // Confirm exit
      if (confirm('هل تريد الخروج من اللعبة؟')) {
        window.close();
      } else {
        history.pushState(null, '', location.href);
      }
    } else if (currentScene.scene.key === 'HouseScene') {
      currentScene.scene.start('MenuScene');
    } else {
      // Go back to house
      currentScene.scene.start('HouseScene');
    }
  }
  history.pushState(null, '', location.href);
});

// Push initial history state for back button handling
history.pushState(null, '', location.href);

export default game;
