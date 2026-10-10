// =============================================================================
// TowelInteraction — نظام المنشفة والتجفيف | Baby Care World
// -----------------------------------------------------------------------------
// المسؤوليات:
//   1) سحب المنشفة من حاملها ومسح جسم الطفل (طور DRY).
//   2) تجفيف حقيقي: التقدم = مسافة حركة المؤشر داخل Hit Area جسم الطفل —
//      نفس فلسفة SoapInteraction: اليد الثابتة = صفر تقدم.
//   3) مؤثر "امتصاص" (قطرات صغيرة تتلاشى) عند نقطة المسح المقبولة فقط.
//   4) عند اكتمال DRY تتكفل الـ State Machine بالانتقال إلى COMPLETE —
//      الاحتفال (نجوم + ضحك + مكافأة) مسؤولية BathScene.
// =============================================================================

const TOWEL_TUNING = Object.freeze({
  PHASE: 'DRY',
  POINTS_PER_PX: 0.025,        // أسرع قليلاً من الصابون (طور أقصر)
  MIN_MOVE_PX: 1.5,            // فلترة المؤشر الثابت
  MAX_STEP_PX: 80,             // تجاهل القفزات غير الواقعية
  RETURN_TWEEN_MS: 350
});

class TowelInteraction {

  /**
   * @param {Phaser.Scene} scene
   * @param {object} opts
   * @param {Phaser.GameObjects.Image} opts.towel      المنشفة في المشهد
   * @param {BathActivityManager}      opts.activity
   * @param {BabyAnimationController}  opts.babyController
   * @param {Phaser.Geom.Ellipse}      opts.hitArea    منطقة جسم الطفل
   * @param {number} [opts.fxDepth=45]                 عمق مؤثرات التجفيف
   */
  constructor(scene, opts) {
    this.scene = scene;
    this.towel = opts.towel;
    this.activity = opts.activity;
    this.babyController = opts.babyController;
    this.hitArea = opts.hitArea;
    this.fxDepth = opts.fxDepth ?? 45;

    this.enabled = false;
    this.homeX = this.towel.x;
    this.homeY = this.towel.y;
    this._lastPointer = null;
    this._affordanceTween = null;

    // إعدادات الجودة للأجهزة المتوسطة/الضعيفة (تُحقن من MobileGameConfig)
    const q = (typeof window !== 'undefined' && window.BathQuality) || null;
    this._fxQuantity = q ? q.bubbleQuantity : 2;

    // --- مؤثر الامتصاص: قطرات/بريق صغير يتطاير من نقطة المسح -----------------
    this.dryEmitter = scene.add.particles(0, 0, 'bubble_particle', {
      speed: { min: 40, max: 110 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: { min: 250, max: 450 },
      tint: [0xffffff, 0xbfe8f7],
      maxAliveParticles: q ? q.maxParticles : 120,
      emitting: false
    }).setDepth(this.fxDepth);

    // --- السحب ---------------------------------------------------------------
    this.towel.setInteractive({ useHandCursor: true, draggable: true });
    this.towel.on('dragstart', this._onDragStart, this);
    this.towel.on('drag', this._onDrag, this);
    this.towel.on('dragend', this._onDragEnd, this);

    this.activity.on('phase:enter', this._onPhaseEnter, this);
    this._onPhaseEnter(this.activity.phase || '');
  }

  // ===========================================================================
  // دورة السحب والمسح
  // ===========================================================================

  _onDragStart(pointer) {
    this._lastPointer = { x: pointer.worldX, y: pointer.worldY };
    this._stopAffordance();
    this.scene.tweens.add({
      targets: this.towel, angle: -12, duration: 150, ease: 'Sine.easeOut'
    });
  }

  _onDrag(pointer, dragX, dragY) {
    this.towel.setPosition(dragX, dragY);

    const px = pointer.worldX;
    const py = pointer.worldY;
    const inside = Phaser.Geom.Ellipse.Contains(this.hitArea, px, py);

    if (!this.enabled || !inside || !this._lastPointer) {
      this._lastPointer = { x: px, y: py };
      return;
    }

    // --- المسح الحقيقي: مسافة حركة المؤشر فقط --------------------------------
    const dist = Phaser.Math.Distance.Between(
      this._lastPointer.x, this._lastPointer.y, px, py
    );
    this._lastPointer = { x: px, y: py };

    if (dist < TOWEL_TUNING.MIN_MOVE_PX || dist > TOWEL_TUNING.MAX_STEP_PX) return;

    // البوابة الوحيدة — الـ State Machine تقص وتقيّد
    const accepted = this.activity.reportProgress(
      TOWEL_TUNING.PHASE, dist * TOWEL_TUNING.POINTS_PER_PX
    );
    if (accepted <= 0) return;

    // مؤثر الامتصاص عند نقطة المسح الفعلية فقط
    this.dryEmitter.emitParticleAt(px, py, this._fxQuantity);

    // اهتزازة مسح لطيفة للمنشفة
    this.towel.setAngle(Phaser.Math.Between(-14, 14));
  }

  _onDragEnd() {
    this._lastPointer = null;
    this.scene.tweens.add({
      targets: this.towel,
      x: this.homeX, y: this.homeY, angle: 0, scale: 1,
      duration: TOWEL_TUNING.RETURN_TWEEN_MS,
      ease: 'Back.easeOut',
      onComplete: () => { if (this.enabled) this._startAffordance(); }
    });
  }

  // ===========================================================================
  // تفعيل حسب الطور
  // ===========================================================================

  _onPhaseEnter(phase) {
    this.enabled = (phase === TOWEL_TUNING.PHASE);
    if (this.enabled) this._startAffordance();
    else this._stopAffordance();
  }

  _startAffordance() {
    if (this._affordanceTween) return;
    this._affordanceTween = this.scene.tweens.add({
      targets: this.towel, scale: 1.1, duration: 500,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  _stopAffordance() {
    if (this._affordanceTween) {
      this._affordanceTween.remove();
      this._affordanceTween = null;
      this.towel.setScale(1).setAngle(0);
    }
  }

  destroy() {
    this.activity.off('phase:enter', this._onPhaseEnter, this);
    this.towel.off('dragstart', this._onDragStart, this);
    this.towel.off('drag', this._onDrag, this);
    this.towel.off('dragend', this._onDragEnd, this);
    this._stopAffordance();
    this.dryEmitter.destroy();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TowelInteraction, TOWEL_TUNING };
}
if (typeof window !== 'undefined') {
  window.TowelInteraction = TowelInteraction;
}
