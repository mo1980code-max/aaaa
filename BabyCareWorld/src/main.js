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

// Safely hide the pre-loader
function hidePreLoader() {
  const preLoader = document.getElementById('pre-loader');
  if (preLoader) {
    preLoader.style.opacity = '0';
    preLoader.style.pointerEvents = 'none';
    setTimeout(() => preLoader.remove(), 600);
  }
}

// Force hide after 3 seconds as fallback
setTimeout(() => {
  hidePreLoader();
}, 3000);

// Phaser game configuration
const config = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  parent: 'game-container',
  
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT
  },

  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
    transparent: false,
    backgroundColor: '#1a1a2e',
    powerPreference: 'high-performance'
  },

  input: {
    activePointers: 3,
    touch: {
      capture: true
    }
  },

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

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GAME_CONFIG.GRAVITY },
      debug: false
    }
  },

  banner: false,
  disableContextMenu: true
};

// Create the game safely
let game;
try {
  game = new Phaser.Game(config);

  game.events.once('ready', () => {
    hidePreLoader();
  });

  // Also hide when first scene starts (safety net)
  game.events.once('boot', () => {
    hidePreLoader();
  });
} catch (e) {
  console.error('Failed to create Phaser game:', e);
  // Try with Canvas renderer as fallback
  try {
    config.type = Phaser.CANVAS;
    game = new Phaser.Game(config);
    game.events.once('ready', () => hidePreLoader());
  } catch (e2) {
    console.error('Canvas fallback also failed:', e2);
    // Still hide pre-loader and show error
    document.querySelector('#pre-loader h1').textContent = '⚠️ خطأ في تحميل اللعبة';
    document.querySelector('#pre-loader h1').style.fontSize = '1.5rem';
    hidePreLoader();
  }
}

// Handle visibility change (pause/resume) - safe wrapper
document.addEventListener('visibilitychange', () => {
  try {
    if (game && game.scene) {
      const lastScene = game.scene.getScenes(true).pop();
      if (lastScene && lastScene.sound) {
        document.hidden ? lastScene.sound.pauseAll() : lastScene.sound.resumeAll();
      }
    }
  } catch (e) { /* ignore */ }
});

// Lock orientation on mobile - safe wrapper
function lockOrientation() {
  try {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {});
    }
  } catch (e) { /* ignore */ }
}

try {
  window.addEventListener('load', lockOrientation);
  document.addEventListener('click', lockOrientation, { once: true });
  document.addEventListener('touchstart', lockOrientation, { once: true });
} catch (e) { /* ignore */ }

// Handle back button on Android - safe wrapper
try {
  history.pushState(null, '', location.href);
} catch (e) { /* ignore - iframe restrictions */ }

window.addEventListener('popstate', (e) => {
  try {
    if (game && game.scene) {
      const currentScene = game.scene.getScenes(true).find(s => s.scene && s.scene.isActive());
      if (currentScene) {
        const key = currentScene.scene.key;
        if (key === 'MenuScene') {
          if (confirm('هل تريد الخروج من اللعبة؟')) {
            window.close();
          } else {
            try { history.pushState(null, '', location.href); } catch (e) { /* ignore */ }
          }
        } else if (key === 'HouseScene') {
          currentScene.scene.start('MenuScene');
        } else {
          currentScene.scene.start('HouseScene');
        }
      }
    }
    try { history.pushState(null, '', location.href); } catch (e) { /* ignore */ }
  } catch (e) { /* ignore */ }
});

export default game;
