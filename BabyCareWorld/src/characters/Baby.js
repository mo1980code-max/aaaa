/**
 * Baby - Baby character class.
 * Manages character state, animations, and interactions.
 * Future phases will add sprite sheet animations.
 */
import Phaser from 'phaser';

export default class Baby extends Phaser.GameObjects.Container {
  constructor(scene, x, y, characterKey) {
    super(scene, x, y);
    
    this.characterKey = characterKey;
    this.mood = 'happy';
    this.state = 'idle'; // idle, walking, sitting, sleeping, eating, bathing, playing
    this.needs = {
      hunger: 80,
      hygiene: 90,
      sleep: 70,
      energy: 85,
      happiness: 100
    };

    // Create character sprite
    this.sprite = scene.add.image(0, 0, characterKey).setScale(1.3);
    this.add(this.sprite);

    // Name tag
    this.nameTag = scene.add.text(0, -110, characterKey === 'baby_boy' ? '👦' : '👧', {
      fontSize: '28px',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    this.add(this.nameTag);

    scene.add.existing(this);

    // Make interactive
    this.setInteractive({ draggable: true });

    // Start idle animation
    this.playIdle();
  }

  /**
   * Update character appearance based on mood
   */
  updateMood() {
    const avg = Object.values(this.needs).reduce((a, b) => a + b, 0) / 5;
    
    let newMood;
    if (avg >= 80) newMood = 'happy';
    else if (avg >= 60) newMood = 'neutral';
    else if (avg >= 40) newMood = 'sad';
    else newMood = 'crying';

    if (newMood !== this.mood) {
      this.mood = newMood;
      this.updateTexture();
    }
  }

  /**
   * Update texture based on current state and mood
   */
  updateTexture() {
    let textureKey = this.characterKey;
    
    if (this.state === 'sleeping') {
      textureKey += '_sleep';
    } else if (this.mood === 'sad' || this.mood === 'crying') {
      textureKey += '_sad';
    }

    this.sprite.setTexture(textureKey);
  }

  /**
   * Play idle animation
   */
  playIdle() {
    if (this.idleTween) this.idleTween.stop();
    
    this.idleTween = this.scene.tweens.add({
      targets: this,
      y: this.y - 8,
      duration: 1200,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Play walking animation (future: sprite sheet)
   */
  playWalk(targetX) {
    this.state = 'walking';
    if (this.idleTween) this.idleTween.stop();

    const direction = targetX > this.x ? 1 : -1;
    this.sprite.setFlipX(direction < 0);

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      duration: Math.abs(targetX - this.x) * 5,
      ease: 'Linear',
      onComplete: () => {
        this.state = 'idle';
        this.playIdle();
      }
    });

    // Walking bob
    this.walkTween = this.scene.tweens.add({
      targets: this.sprite,
      y: -5,
      duration: 200,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Set sleeping state
   */
  sleep() {
    this.state = 'sleeping';
    if (this.idleTween) this.idleTween.stop();
    if (this.walkTween) this.walkTween.stop();
    this.updateTexture();

    // Zzz effect
    for (let i = 0; i < 3; i++) {
      const z = this.scene.add.text(this.x + 40 + i * 15, this.y - 80, '💤', {
        fontSize: `${16 + i * 6}px`
      }).setAlpha(0);

      this.scene.tweens.add({
        targets: z,
        alpha: 1,
        y: z.y - 50,
        duration: 2000,
        delay: i * 500,
        repeat: 3,
        onComplete: () => z.destroy()
      });
    }
  }

  /**
   * Wake up from sleep
   */
  wakeUp() {
    this.state = 'idle';
    this.updateTexture();
    this.playIdle();
  }

  /**
   * Eat animation
   */
  eat() {
    this.state = 'eating';
    
    // Chomp animation
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.sprite.scaleX * 1.1,
      scaleY: this.sprite.scaleY * 0.9,
      duration: 200,
      repeat: 3,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.state = 'idle';
        this.sprite.setScale(1.3);
      }
    });

    // Show food particle
    const particle = this.scene.add.text(this.x, this.y - 50, '🍽️', {
      fontSize: '24px'
    }).setOrigin(0.5).setAlpha(0);

    this.scene.tweens.add({
      targets: particle,
      alpha: 1,
      scale: 1.5,
      duration: 500,
      yoyo: true,
      onComplete: () => particle.destroy()
    });
  }

  /**
   * Play animation
   */
  play() {
    this.state = 'playing';
    
    // Jump animation
    this.scene.tweens.add({
      targets: this,
      y: this.y - 40,
      rotation: 0.2,
      duration: 400,
      repeat: 3,
      yoyo: true,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        this.rotation = 0;
        this.state = 'idle';
      }
    });

    // Sparkle effects
    const emojis = ['⭐', '✨', '🎉', '💫'];
    for (let i = 0; i < 4; i++) {
      const sparkle = this.scene.add.text(
        this.x + Phaser.Math.Between(-40, 40),
        this.y + Phaser.Math.Between(-80, -20),
        emojis[i],
        { fontSize: '20px' }
      ).setOrigin(0.5).setAlpha(0);

      this.scene.tweens.add({
        targets: sparkle,
        alpha: 1,
        y: sparkle.y - 30,
        scale: 1.5,
        duration: 800,
        delay: i * 150,
        onComplete: () => sparkle.destroy()
      });
    }
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    if (this.idleTween) this.idleTween.stop();
    if (this.walkTween) this.walkTween.stop();
    super.destroy();
  }
}
