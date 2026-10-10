// =============================================================================
// WaterInteraction — نظام الماء والدش | Baby Care World
// -----------------------------------------------------------------------------
// المسؤوليات:
//   1) طور FILL_WATER: ضغط مستمر على الصنبور => تدفق مرئي + تقدم زمني،
//      ومنسوب سطح الماء يرتفع تدريجياً (Y + Scale + Alpha) تبعاً لتقدم
//      الـ State Machine نفسها — لا يرتفع الماء إلا بما تقبله البوابة.
//   2) طور RINSE: سحب رأس الدش فوق جسم الطفل => رذاذ ماء (Particles)
//      + خفض نسبة الرغوة عبر SoapInteraction.setFoamLevel() حتى تزول تماماً
//      عند بلوغ تقدم الشطف 100%.
//
// كل التقدم يمر حصراً عبر activity.reportProgress(...) — هذا الملف لا يملك
// أي سلطة على نسب التقدم أو تجاوز الأطوار.
// =============================================================================

const WATER_TUNING = Object.freeze({
  FILL_PHASE: 'FILL_WATER',
  RINSE_PHASE: 'RINSE',
  FILL_RATE_PER_SEC: 25,        // يطابق سقف الطور — الامتلاء الكامل في ~4 ثوانٍ
  RINSE_RATE_PER_SEC: 25,       // الشطف الكامل في ~4 ثوانٍ من الرش الفعلي
  EMPTY_WATER: {                // حالة سطح الماء قبل التعبئة (نِسَب من الحالة النهائية)
    scale: 0.7, yOffset: 55, alpha: 0
  },
  SPRAY_OFFSET_Y: 110,          // نقطة خروج الرذاذ أسفل رأس الدش
  RETURN_TWEEN_MS: 350
});

class WaterInteraction {

  /**
   * @param {Phaser.Scene} scene
   * @param {object} opts
   * @param {Phaser.GameObjects.Image} opts.faucet        الصنبور
   * @param {Phaser.GameObjects.Image} opts.showerHead    رأس الدش
   * @param {Phaser.GameObjects.Image} opts.waterSurface  سطح الماء
   * @param {BathActivityManager}      opts.activity
   * @param {SoapInteraction}          opts.foam          طبقة الرغوة (للشطف)
   * @param {Phaser.Geom.Ellipse}      opts.babyHitArea   منطقة جسم الطفل
   * @param {number} [opts.streamDepth=45]                عمق تدفق/رذاذ الماء
   */
  constructor(scene, opts) {
    this.scene = scene;
    this.faucet = opts.faucet;
    this.showerHead = opts.showerHead;
    this.waterSurface = opts.waterSurface;
    this.activity = opts.activity;
    this.foam = opts.foam;
    this.babyHitArea = opts.babyHitArea;
    this.streamDepth = opts.streamDepth ?? 45;

    this._fillEnabled = false;
    this._rinseEnabled = false;
    this._holdingFaucet = false;
    this._draggingShower = false;

    this.showerHome = { x: this.showerHead.x, y: this.showerHead.y };

    // --- الحالة النهائية لسطح الماء (كما وضعها BathScene) --------------------
    this._waterFull = {
      y: this.waterSurface.y,
      scaleX: this.waterSurface.scaleX,
      scaleY: this.waterSurface.scaleY,
      alpha: this.waterSurface.alpha      // 0.75 من إعداد المشهد
    };
    // الحوض يبدأ فارغاً دائماً — لا يمتلئ إلا عبر تقدم FILL_WATER المقبول
    this._applyWaterLevel(0);

    // --- تدفق الصنبور: عمود ماء بسيط يظهر أثناء الضغط ------------------------
    // (من فوهة الصنبور حتى مستوى الماء الحالي)
    this.stream = scene.add.rectangle(
      this.faucet.x - 30, this.faucet.y + 55, 26, 10, 0x9bdcf5, 0.85
    )
      .setOrigin(0.5, 0)
      .setDepth(this.streamDepth)
      .setVisible(false);

    // إعدادات الجودة للأجهزة المتوسطة/الضعيفة (تُحقن من MobileGameConfig)
    const q = (typeof window !== 'undefined' && window.BathQuality) || null;

    // --- رذاذ الدش: باعث جزيئات يتبع رأس الدش --------------------------------
    this.sprayEmitter = scene.add.particles(0, 0, 'bubble_particle', {
      speedY: { min: 320, max: 460 },
      speedX: { min: -35, max: 35 },
      scale: { start: 0.18, end: 0.05 },
      alpha: { start: 0.85, end: 0.15 },
      lifespan: { min: 300, max: 450 },
      tint: 0x9bdcf5,
      quantity: q ? q.sprayQuantity : 4,            // دفعة أصغر على الأجهزة الضعيفة
      frequency: q ? q.sprayFrequency : 28,         // فاصل أطول = جزيئات أقل/ثانية
      maxAliveParticles: q ? q.maxParticles : 200,  // سقف صارم للجزيئات الحية
      emitting: false
    }).setDepth(this.streamDepth);
    this.sprayEmitter.startFollow(this.showerHead, 0, WATER_TUNING.SPRAY_OFFSET_Y);

    // --- إدخال الصنبور: ضغط مستمر ---------------------------------------------
    this.faucet.setInteractive({ useHandCursor: true });
    this.faucet.on('pointerdown', () => { this._holdingFaucet = true; });
    scene.input.on('pointerup', this._releaseAll, this);

    // --- إدخال الدش: سحب حر ----------------------------------------------------
    this.showerHead.setInteractive({ useHandCursor: true, draggable: true });
    this.showerHead.on('dragstart', () => { this._draggingShower = true; });
    this.showerHead.on('drag', (_p, dragX, dragY) => {
      this.showerHead.setPosition(dragX, dragY);
    });
    this.showerHead.on('dragend', () => {
      this._draggingShower = false;
      this.sprayEmitter.stop();
      this.scene.tweens.add({
        targets: this.showerHead,
        x: this.showerHome.x, y: this.showerHome.y,
        duration: WATER_TUNING.RETURN_TWEEN_MS, ease: 'Back.easeOut'
      });
    });

    // --- ربط الأطوار والتقدم ----------------------------------------------------
    this.activity.on('phase:enter', this._onPhaseEnter, this);
    this.activity.on('progress', this._onProgress, this);
    this._onPhaseEnter(this.activity.phase || '');

    // حلقة التحديث: تغذية التقدم الزمني للضغط المستمر/الرش
    scene.events.on(Phaser.Scenes.Events.UPDATE, this._update, this);
  }

  // ===========================================================================
  // إدارة الأطوار
  // ===========================================================================

  _onPhaseEnter(phase) {
    this._fillEnabled = (phase === WATER_TUNING.FILL_PHASE);
    this._rinseEnabled = (phase === WATER_TUNING.RINSE_PHASE);

    if (this._fillEnabled) {
      // تهيئة الحوض فارغاً عند بدء طور التعبئة
      this._applyWaterLevel(0);
      this._pulse(this.faucet);
    } else if (this._rinseEnabled) {
      this._pulse(this.showerHead);
    } else {
      this._holdingFaucet = false;
      this.stream.setVisible(false);
      this.sprayEmitter.stop();
      this._stopPulse();

      // بدء التجفيف => تصريف ماء الحوض تدريجياً (مؤثر بصري فقط)
      if (phase === 'DRY') {
        const drain = { t: 1 };
        this.scene.tweens.add({
          targets: drain, t: 0, duration: 1600, ease: 'Sine.easeIn',
          onUpdate: () => this._applyWaterLevel(drain.t)
        });
      }
    }
  }

  // ===========================================================================
  // حلقة التحديث — التغذية الزمنية (كل إطار أثناء التفاعل الفعلي فقط)
  // ===========================================================================

  _update(_time, deltaMs) {
    const dt = deltaMs / 1000;

    // --- 1) تعبئة الحوض: ضغط مستمر على الصنبور -------------------------------
    if (this._fillEnabled && this._holdingFaucet) {
      const accepted = this.activity.reportProgress(
        WATER_TUNING.FILL_PHASE, WATER_TUNING.FILL_RATE_PER_SEC * dt
      );
      this.stream.setVisible(accepted > 0);
      if (accepted > 0) this._updateStreamLength();
    } else {
      this.stream.setVisible(false);
    }

    // --- 2) الشطف: الدش مسحوب ورذاذه فوق جسم الطفل ----------------------------
    if (this._rinseEnabled && this._draggingShower) {
      const sprayX = this.showerHead.x;
      const sprayY = this.showerHead.y + WATER_TUNING.SPRAY_OFFSET_Y;
      const overBaby = Phaser.Geom.Ellipse.Contains(this.babyHitArea, sprayX, sprayY);

      if (overBaby) {
        const accepted = this.activity.reportProgress(
          WATER_TUNING.RINSE_PHASE, WATER_TUNING.RINSE_RATE_PER_SEC * dt
        );
        if (accepted > 0 && !this.sprayEmitter.emitting) this.sprayEmitter.start();
        if (accepted <= 0 && this.sprayEmitter.emitting) this.sprayEmitter.stop();
      } else if (this.sprayEmitter.emitting) {
        this.sprayEmitter.stop(); // الرش بعيداً عن الطفل لا يشطف شيئاً
      }
    }
  }

  // ===========================================================================
  // ربط التقدم بالمرئيات — المصدر الوحيد هو أحداث الـ State Machine
  // ===========================================================================

  _onProgress(phase, value) {
    if (phase === WATER_TUNING.FILL_PHASE) {
      // منسوب الماء يتبع التقدم المقبول فقط (لا يمكن رفعه غشاً)
      this._applyWaterLevel(value / 100);
    } else if (phase === WATER_TUNING.RINSE_PHASE) {
      // نسبة الرغوة المتبقية = 100 - تقدم الشطف => تزول تماماً عند 100%
      this.foam.setFoamLevel(100 - value);
    }
  }

  /** تموضع سطح الماء بين الحالة الفارغة والممتلئة (t: 0..1). */
  _applyWaterLevel(t) {
    const E = WATER_TUNING.EMPTY_WATER;
    const F = this._waterFull;
    this.waterSurface
      .setY(Phaser.Math.Linear(F.y + E.yOffset, F.y, t))
      .setScale(
        Phaser.Math.Linear(F.scaleX * E.scale, F.scaleX, t),
        Phaser.Math.Linear(F.scaleY * E.scale, F.scaleY, t)
      )
      .setAlpha(Phaser.Math.Linear(E.alpha, F.alpha, t));
  }

  /** مدّ عمود التدفق من فوهة الصنبور حتى مستوى الماء الحالي. */
  _updateStreamLength() {
    const bottom = this.waterSurface.y;
    this.stream.height = Math.max(10, bottom - this.stream.y);
  }

  _releaseAll() {
    this._holdingFaucet = false;
  }

  // ===========================================================================
  // إيحاء بصري للأداة النشطة
  // ===========================================================================

  _pulse(target) {
    this._stopPulse();
    this._pulseTween = this.scene.tweens.add({
      targets: target, scale: 1.1, duration: 500,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
    this._pulseTarget = target;
  }

  _stopPulse() {
    if (this._pulseTween) {
      this._pulseTween.remove();
      this._pulseTween = null;
      if (this._pulseTarget) this._pulseTarget.setScale(1);
      this._pulseTarget = null;
    }
  }

  // ===========================================================================
  // تنظيف
  // ===========================================================================
  destroy() {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this._update, this);
    this.scene.input.off('pointerup', this._releaseAll, this);
    this.activity.off('phase:enter', this._onPhaseEnter, this);
    this.activity.off('progress', this._onProgress, this);
    this._stopPulse();
    this.sprayEmitter.destroy();
    this.stream.destroy();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WaterInteraction, WATER_TUNING };
}
if (typeof window !== 'undefined') {
  window.WaterInteraction = WaterInteraction;
}
