// =============================================================================
// SoapInteraction — نظام الصابون والفرك | Baby Care World
// -----------------------------------------------------------------------------
// المسؤوليات:
//   1) سحب وإفلات الصابون (Drag & Drop) مع عودة تلقائية لموضعه الأصلي.
//   2) حساب الفرك الحقيقي: التقدم = مسافة حركة المؤشر (Pointer Delta)
//      داخل Hit Area لجسم الطفل فقط — اليد الثابتة فوق الطفل = صفر تقدم.
//   3) توليد فقاعات (Particle Emitter) عند نقطة الفرك الفعلية فقط،
//      وفقط عندما تقبل الـ State Machine التقدم (accepted > 0).
//   4) طبقة رغوة دائمة (Foam Blobs) تتراكم فوق جسم الطفل أثناء الفرك،
//      وتُخفَّض لاحقاً عبر setFoamLevel() من نظام الشطف (WaterInteraction).
//   5) ربط التفاعل العاطفي: SOAP_REACTION عند الاقتراب + ضحك دوري أثناء الفرك
//      عبر BabyAnimationController.
//
// كل التقدم يمر حصراً عبر activity.reportProgress('APPLY_SOAP', ...) —
// القصّ والتقييد الزمني مسؤولية BathActivityManager وحده.
// =============================================================================

const SOAP_TUNING = Object.freeze({
  PHASE: 'APPLY_SOAP',          // الطور الذي يعمل فيه هذا النظام
  POINTS_PER_PX: 0.02,          // نقاط تقدم لكل بكسل فرك (500px/ث ≈ 10 نقاط/ث)
  MIN_MOVE_PX: 1.5,             // أقل حركة تُحتسب — يمنع ضجيج المؤشر الثابت
  MAX_STEP_PX: 80,              // تجاهل القفزات غير الواقعية بين إطارين (teleport)
  FOAM_POINTS_PER_BLOB: 4,      // كل 4 نقاط مقبولة = فقاعة رغوة دائمة جديدة
  MAX_FOAM_BLOBS: 40,           // سقف فقاعات الرغوة الدائمة
  LAUGH_RUB_PX: 1100,           // مسافة فرك تراكمية تطلق ضحكة
  SOAP_NEAR_COOLDOWN_MS: 4000,  // تهدئة تفاعل "اقتراب الصابون"
  RETURN_TWEEN_MS: 350          // زمن عودة الصابون لموضعه
});

class SoapInteraction {

  /**
   * @param {Phaser.Scene} scene
   * @param {object} opts
   * @param {Phaser.GameObjects.Image} opts.soap       صورة الصابون في المشهد
   * @param {BathActivityManager}      opts.activity   مدير النشاط (بوابة التقدم)
   * @param {BabyAnimationController}  opts.babyController
   * @param {Phaser.Geom.Ellipse}      opts.hitArea    منطقة جسم الطفل (إحداثيات عالم)
   * @param {Phaser.Display.Masks.GeometryMask} [opts.mask]  قناع الحوض — يُطبق على الرغوة
   * @param {number} [opts.foamDepth=32]               عمق الرغوة (فوق الطفل، تحت واجهة الحوض)
   */
  constructor(scene, opts) {
    this.scene = scene;
    this.soap = opts.soap;
    this.activity = opts.activity;
    this.babyController = opts.babyController;
    this.hitArea = opts.hitArea;
    this.mask = opts.mask || null;
    this.foamDepth = opts.foamDepth ?? 32;

    this.enabled = false;              // يُفعَّل فقط في طور APPLY_SOAP
    this.homeX = this.soap.x;          // موضع العودة بعد الإفلات
    this.homeY = this.soap.y;

    this._lastPointer = null;          // آخر موضع مؤشر أثناء الفرك
    this._foamCredit = 0;              // نقاط مقبولة متراكمة نحو فقاعة جديدة
    this._rubSinceLaugh = 0;           // مسافة فرك تراكمية نحو الضحكة التالية
    this._lastSoapNearAt = -Infinity;  // آخر إطلاق لتفاعل الاقتراب
    this._wasInside = false;

    this.foamBlobs = [];               // فقاعات الرغوة الدائمة
    this._peakFoamCount = 0;           // أعلى عدد وصلت إليه الرغوة (مرجع الشطف)
    this._affordanceTween = null;

    // إعدادات الجودة للأجهزة المتوسطة/الضعيفة (تُحقن من MobileGameConfig)
    const q = (typeof window !== 'undefined' && window.BathQuality) || null;
    this._maxFoam = q ? q.maxFoamBlobs : SOAP_TUNING.MAX_FOAM_BLOBS;
    this._bubbleQuantity = q ? q.bubbleQuantity : 2;

    // --- باعث فقاعات الفرك اللحظية (يُطلق يدوياً عند نقطة الفرك فقط) --------
    this.bubbleEmitter = scene.add.particles(0, 0, 'bubble_particle', {
      speed: { min: 20, max: 70 },
      angle: { min: 230, max: 310 },         // تتصاعد لأعلى
      scale: { start: 0.35, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: { min: 500, max: 900 },
      gravityY: -40,
      maxAliveParticles: q ? q.maxParticles : 120, // سقف صارم للجزيئات الحية
      emitting: false
    }).setDepth(this.foamDepth + 1);

    // --- تفعيل السحب ---------------------------------------------------------
    this.soap.setInteractive({ useHandCursor: true, draggable: true });
    this.soap.on('dragstart', this._onDragStart, this);
    this.soap.on('drag', this._onDrag, this);
    this.soap.on('dragend', this._onDragEnd, this);

    // --- تفعيل/تعطيل حسب طور النشاط ------------------------------------------
    this.activity.on('phase:enter', this._onPhaseEnter, this);
    this._onPhaseEnter(this.activity.phase || '', {}); // مزامنة فورية
  }

  // ===========================================================================
  // دورة السحب
  // ===========================================================================

  _onDragStart(pointer) {
    this._lastPointer = { x: pointer.worldX, y: pointer.worldY };
    this._stopAffordance();
    this.scene.tweens.add({
      targets: this.soap, scale: this.soap.scale * 1.12, duration: 120, yoyo: false
    });
  }

  _onDrag(pointer, dragX, dragY) {
    // الصابون يتبع المؤشر دائماً (حتى خارج الطور — لكن بلا أي تقدم)
    this.soap.setPosition(dragX, dragY);

    const px = pointer.worldX;
    const py = pointer.worldY;
    const inside = Phaser.Geom.Ellipse.Contains(this.hitArea, px, py);

    // --- تفاعل الاقتراب: أول دخول لمنطقة الجسم (مع تهدئة) --------------------
    if (this.enabled && inside && !this._wasInside) {
      const now = this.scene.time.now;
      if (now - this._lastSoapNearAt > SOAP_TUNING.SOAP_NEAR_COOLDOWN_MS) {
        this._lastSoapNearAt = now;
        this.babyController.onSoapNear(); // رمش مزدوج + ضحكة مكتومة
      }
    }
    this._wasInside = inside;

    // --- حساب الفرك الحقيقي ----------------------------------------------------
    if (!this.enabled || !inside || !this._lastPointer) {
      this._lastPointer = { x: px, y: py };
      return;
    }

    const dist = Phaser.Math.Distance.Between(
      this._lastPointer.x, this._lastPointer.y, px, py
    );
    this._lastPointer = { x: px, y: py };

    // يد ثابتة أو اهتزاز ميكروسكوبي => لا تقدم. قفزة خيالية => تجاهل.
    if (dist < SOAP_TUNING.MIN_MOVE_PX || dist > SOAP_TUNING.MAX_STEP_PX) return;

    // البوابة الوحيدة للتقدم — قد تعيد 0 (طور خاطئ/تجاوز معدل)
    const accepted = this.activity.reportProgress(
      SOAP_TUNING.PHASE, dist * SOAP_TUNING.POINTS_PER_PX
    );
    if (accepted <= 0) return;

    // --- مؤثرات مربوطة بالتقدم المقبول فقط ------------------------------------
    this.bubbleEmitter.emitParticleAt(px, py, this._bubbleQuantity); // فقاعات عند نقطة الفرك الحقيقية
    this._accumulateFoam(accepted, px, py);          // رغوة دائمة تتراكم
    this._accumulateLaugh(dist);                     // ضحك دوري
  }

  _onDragEnd() {
    this._lastPointer = null;
    this._wasInside = false;
    // عودة سلسة لموضع الرف
    this.scene.tweens.add({
      targets: this.soap,
      x: this.homeX, y: this.homeY, scale: 1,
      duration: SOAP_TUNING.RETURN_TWEEN_MS,
      ease: 'Back.easeOut',
      onComplete: () => { if (this.enabled) this._startAffordance(); }
    });
  }

  // ===========================================================================
  // الرغوة الدائمة (Foam Layer)
  // ===========================================================================

  _accumulateFoam(acceptedPoints, x, y) {
    this._foamCredit += acceptedPoints;
    while (this._foamCredit >= SOAP_TUNING.FOAM_POINTS_PER_BLOB &&
           this.foamBlobs.length < this._maxFoam) {
      this._foamCredit -= SOAP_TUNING.FOAM_POINTS_PER_BLOB;
      this._spawnFoamBlob(
        x + Phaser.Math.Between(-45, 45),
        y + Phaser.Math.Between(-35, 35)
      );
    }
  }

  _spawnFoamBlob(x, y) {
    const blob = this.scene.add.image(x, y, 'bubble_particle')
      .setScale(0)
      .setAlpha(0.92)
      .setDepth(this.foamDepth);
    if (this.mask) blob.setMask(this.mask); // الرغوة تُقص عند قاع الحوض مثل الطفل

    const targetScale = Phaser.Math.FloatBetween(0.7, 1.3);
    this.scene.tweens.add({
      targets: blob, scale: targetScale, duration: 240, ease: 'Back.easeOut'
    });
    // تنفس خفيف دائم للرغوة
    this.scene.tweens.add({
      targets: blob, scale: targetScale * 1.08, duration: 900,
      yoyo: true, repeat: -1, delay: 240, ease: 'Sine.easeInOut'
    });

    this.foamBlobs.push(blob);
    this._peakFoamCount = Math.max(this._peakFoamCount, this.foamBlobs.length);
  }

  /**
   * واجهة الشطف — يستدعيها WaterInteraction أثناء طور RINSE.
   * @param {number} level 0..100 — نسبة الرغوة المتبقية المطلوبة
   *                       (100 = كاملة، 0 = تزول تماماً)
   */
  setFoamLevel(level) {
    const clamped = Phaser.Math.Clamp(level, 0, 100);
    const desired = Math.ceil(this._peakFoamCount * (clamped / 100));

    while (this.foamBlobs.length > desired) {
      // إزالة فقاعة عشوائية بتأثير "فرقعة"
      const i = Phaser.Math.Between(0, this.foamBlobs.length - 1);
      const blob = this.foamBlobs.splice(i, 1)[0];
      this.scene.tweens.killTweensOf(blob);
      this.scene.tweens.add({
        targets: blob, scale: blob.scale * 1.5, alpha: 0,
        duration: 200, ease: 'Quad.easeOut',
        onComplete: () => blob.destroy()
      });
    }
  }

  /** نسبة الرغوة الحالية 0..100 (مرجعها أعلى تراكم وصلت إليه). */
  getFoamLevel() {
    if (this._peakFoamCount === 0) return 0;
    return (this.foamBlobs.length / this._peakFoamCount) * 100;
  }

  // ===========================================================================
  // الضحك الدوري أثناء الفرك
  // ===========================================================================

  _accumulateLaugh(dist) {
    this._rubSinceLaugh += dist;
    if (this._rubSinceLaugh >= SOAP_TUNING.LAUGH_RUB_PX) {
      this._rubSinceLaugh = 0;
      this.babyController.laugh(1400); // يرتد تلقائياً إلى WASHING
    }
  }

  // ===========================================================================
  // تفعيل/تعطيل حسب الطور + إيحاء بصري (Affordance)
  // ===========================================================================

  _onPhaseEnter(phase) {
    this.enabled = (phase === SOAP_TUNING.PHASE);
    if (this.enabled) {
      this._startAffordance();
    } else {
      this._stopAffordance();
    }
  }

  _startAffordance() {
    if (this._affordanceTween) return;
    this._affordanceTween = this.scene.tweens.add({
      targets: this.soap, scale: 1.1, duration: 500,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  _stopAffordance() {
    if (this._affordanceTween) {
      this._affordanceTween.remove();
      this._affordanceTween = null;
      this.soap.setScale(1);
    }
  }

  // ===========================================================================
  // تنظيف
  // ===========================================================================
  destroy() {
    this.activity.off('phase:enter', this._onPhaseEnter, this);
    this.soap.off('dragstart', this._onDragStart, this);
    this.soap.off('drag', this._onDrag, this);
    this.soap.off('dragend', this._onDragEnd, this);
    this._stopAffordance();
    this.bubbleEmitter.destroy();
    this.foamBlobs.forEach((b) => { this.scene.tweens.killTweensOf(b); b.destroy(); });
    this.foamBlobs = [];
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SoapInteraction, SOAP_TUNING };
}
if (typeof window !== 'undefined') {
  window.SoapInteraction = SoapInteraction;
}
