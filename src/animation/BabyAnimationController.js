// =============================================================================
// BabyAnimationController — نظام تحريك الطفل | Baby Care World
// -----------------------------------------------------------------------------
// كلاس مستقل يدير شخصية الطفل داخل مشهد الحمام (وأي مشهد آخر لاحقاً):
//
//   • البنية: Phaser.GameObjects.Container من طبقتين:
//       root (يتحكم به المشهد: موضع/مقياس/عمق/Mask)
//        └─ rig (تستهدفه الحركات الإجرائية: تنفس/تمايل/قفز)
//            ├─ bodySprite  : Spritesheet الجسم (وجه فارغ، رأس ثابت الموضع)
//            ├─ eyesSprite  : طبقة العينين  (baby_face_eyes)
//            └─ mouthSprite : طبقة الفم     (baby_face_mouth)
//
//   • آلة حالات (State Machine) تربط كل حالة بـ:
//       أنيميشن جسم + إطار عينين + إطار فم + رمش + Tween إجرائي.
//
//   • المرجع الكامل لأسماء الأوراق والإطارات:
//       docs/baby-animation-manifest.md
// =============================================================================

// ---------------------------------------------------------------------------
// الحالات المدعومة
// ---------------------------------------------------------------------------
const BabyStates = Object.freeze({
  IDLE:          'IDLE',           // وقوف + تنفس
  SIT:           'SIT',            // جلوس داخل الحوض (قبل الماء)
  BATH_IDLE:     'BATH_IDLE',      // جلوس + تحريك يدين خفيف على الماء
  SOAP_REACTION: 'SOAP_REACTION',  // رمش وضحك عند اقتراب الصابون (مؤقتة)
  WASHING:       'WASHING',        // فرك/تفاعل مع الرغوة
  LAUGHING:      'LAUGHING',       // ضحك
  RINSING:       'RINSING',        // إغماض العينين أثناء الشطف
  DRYING:        'DRYING'          // استرخاء أثناء التنشيف
});

// ---------------------------------------------------------------------------
// فهارس إطارات الوجه (مطابقة للـ Manifest حرفياً)
// ---------------------------------------------------------------------------
const EYES = Object.freeze({
  OPEN: 0, HALF: 1, CLOSED: 2, HAPPY: 3, SQUEEZED: 4, SPARKLE: 5
});

const MOUTH = Object.freeze({
  NEUTRAL: 0, SMILE: 1, LAUGH_OPEN: 2, OOH: 3, RELAXED: 4, GIGGLE: 5
});

// ---------------------------------------------------------------------------
// مراسي الوجه: مركز العينين/الفم نسبةً لنقطة مقعد الطفل (Origin 0.5, 1)
// تُعاير هذه القيم مرة واحدة بعد استلام الرسوم النهائية.
// ---------------------------------------------------------------------------
const FACE_ANCHORS = Object.freeze({
  stand: { eyes: { x: 0, y: -418 }, mouth: { x: 0, y: -352 } },
  sit:   { eyes: { x: 0, y: -306 }, mouth: { x: 0, y: -240 } }
});

// ---------------------------------------------------------------------------
// إعدادات كل حالة — مصدر الحقيقة الوحيد لربط الإطارات بالحالات
//   bodyAnim : مفتاح أنيميشن الجسم
//   eyes/mouth : إطار التعبير الافتراضي للحالة
//   blink    : هل يعمل الرمش التلقائي؟ (مع مضاعف سرعة اختياري)
//   pose     : أي مرساة وجه تُستخدم (stand/sit)
//   motion   : الحركة الإجرائية المصاحبة (تستهدف rig فقط)
//   revertAfterMs : حالة مؤقتة ترتد تلقائياً للحالة السابقة
// ---------------------------------------------------------------------------
const STATE_CONFIG = Object.freeze({
  [BabyStates.IDLE]: {
    bodyAnim: 'baby-idle',      eyes: EYES.OPEN,     mouth: MOUTH.SMILE,
    blink: true,  pose: 'stand', motion: 'breathe'
  },
  [BabyStates.SIT]: {
    bodyAnim: 'baby-sit',       eyes: EYES.OPEN,     mouth: MOUTH.NEUTRAL,
    blink: true,  pose: 'sit',   motion: 'breathe'
  },
  [BabyStates.BATH_IDLE]: {
    bodyAnim: 'baby-bath-idle', eyes: EYES.OPEN,     mouth: MOUTH.SMILE,
    blink: true,  pose: 'sit',   motion: 'sway'
  },
  [BabyStates.SOAP_REACTION]: {
    bodyAnim: 'baby-bath-idle', eyes: EYES.SPARKLE,  mouth: MOUTH.GIGGLE,
    blink: 'burst', pose: 'sit', motion: 'hop',
    revertAfterMs: 1600
  },
  [BabyStates.WASHING]: {
    bodyAnim: 'baby-washing',   eyes: EYES.HAPPY,    mouth: MOUTH.SMILE,
    blink: false, pose: 'sit',   motion: 'sway'
  },
  [BabyStates.LAUGHING]: {
    bodyAnim: 'baby-laughing',  eyes: EYES.HAPPY,    mouth: MOUTH.LAUGH_OPEN,
    blink: false, pose: 'sit',   motion: 'bounce'
  },
  [BabyStates.RINSING]: {
    bodyAnim: 'baby-rinsing',   eyes: EYES.SQUEEZED, mouth: MOUTH.OOH,
    blink: false, pose: 'sit',   motion: 'shiver'
  },
  [BabyStates.DRYING]: {
    bodyAnim: 'baby-drying',    eyes: EYES.HALF,     mouth: MOUTH.RELAXED,
    blink: { speedMultiplier: 2 }, pose: 'sit', motion: 'slowSway'
  }
});

// =============================================================================
// الكلاس الرئيسي
// =============================================================================
class BabyAnimationController {

  /**
   * @param {Phaser.Scene} scene  المشهد المالك
   * @param {number} x            موضع نقطة مقعد الطفل (أسفل-وسط)
   * @param {number} y
   * @param {object} [opts]
   * @param {number} [opts.scale=1]              مقياس العرض
   * @param {string} [opts.initialState='SIT']   الحالة الابتدائية
   */
  constructor(scene, x, y, opts = {}) {
    this.scene = scene;
    this.events = new Phaser.Events.EventEmitter(); // 'statechange', 'blink'

    this._state = null;
    this._prevState = null;
    this._stateTweens = [];   // Tweens إجرائية خاصة بالحالة الحالية
    this._blinkTimer = null;  // مؤقّت الرمش التلقائي
    this._revertTimer = null; // مؤقّت ارتداد الحالات المؤقتة
    this._destroyed = false;

    // --- بناء الـ Container -------------------------------------------------
    // root: يتعامل معه المشهد (position/scale/depth/mask)
    // rig : تستهدفه الحركات الإجرائية حتى لا تتعارض مع تحكم المشهد
    this.root = scene.add.container(x, y);
    this.rig = scene.add.container(0, 0);
    this.root.add(this.rig);

    // الجسم: Origin أسفل-وسط => (x, y) هي نقطة مقعد/قدمي الطفل
    this.bodySprite = scene.add.sprite(0, 0, 'baby_body_sit', 0)
      .setOrigin(0.5, 1);

    // طبقتا الوجه فوق الجسم مباشرة
    this.eyesSprite = scene.add.sprite(0, 0, 'baby_face_eyes', EYES.OPEN)
      .setOrigin(0.5, 0.5);
    this.mouthSprite = scene.add.sprite(0, 0, 'baby_face_mouth', MOUTH.NEUTRAL)
      .setOrigin(0.5, 0.5);

    this.rig.add([this.bodySprite, this.eyesSprite, this.mouthSprite]);

    if (opts.scale) this.root.setScale(opts.scale);

    this.setState(opts.initialState || BabyStates.SIT);
  }

  // ===========================================================================
  // تحميل الأصول وتسجيل الأنيميشنات (static — تُستدعى من المشهد)
  // ===========================================================================

  /** تُستدعى داخل preload() الخاصة بالمشهد. */
  static preload(scene, basePath = 'public/assets/baby/') {
    const BODY = { frameWidth: 512, frameHeight: 512 };

    scene.load.setPath(basePath);

    // تحميل فقط إذا لم يكن المفتاح موجوداً (يتخطى PlaceholderAssets المولّدة)
    const sheet = (key, file, cfg) => {
      if (!scene.textures.exists(key)) scene.load.spritesheet(key, file, cfg);
    };

    // أوراق الجسم (وجه فارغ + رأس ثابت الموضع — انظر الـ Manifest)
    sheet('baby_body_idle',      'baby_body_idle.png',      BODY);
    sheet('baby_body_sit',       'baby_body_sit.png',       BODY);
    sheet('baby_body_bath_idle', 'baby_body_bath_idle.png', BODY);
    sheet('baby_body_washing',   'baby_body_washing.png',   BODY);
    sheet('baby_body_laughing',  'baby_body_laughing.png',  BODY);
    sheet('baby_body_rinsing',   'baby_body_rinsing.png',   BODY);
    sheet('baby_body_drying',    'baby_body_drying.png',    BODY);

    // ورقتا الوجه
    sheet('baby_face_eyes',  'baby_face_eyes.png',  { frameWidth: 128, frameHeight: 64 });
    sheet('baby_face_mouth', 'baby_face_mouth.png', { frameWidth: 128, frameHeight: 96 });

    scene.load.setPath(''); // إعادة المسار لوضعه الافتراضي
  }

  /** تُستدعى مرة واحدة داخل create() قبل إنشاء أي Controller. آمنة للتكرار. */
  static registerAnimations(scene) {
    const defs = [
      { key: 'baby-idle',      tex: 'baby_body_idle',      end: 3, fps: 6,  yoyo: true  },
      { key: 'baby-sit',       tex: 'baby_body_sit',       end: 1, fps: 3,  yoyo: true  },
      { key: 'baby-bath-idle', tex: 'baby_body_bath_idle', end: 5, fps: 8,  yoyo: false },
      { key: 'baby-washing',   tex: 'baby_body_washing',   end: 5, fps: 10, yoyo: false },
      { key: 'baby-laughing',  tex: 'baby_body_laughing',  end: 3, fps: 10, yoyo: true  },
      { key: 'baby-rinsing',   tex: 'baby_body_rinsing',   end: 1, fps: 4,  yoyo: true  },
      { key: 'baby-drying',    tex: 'baby_body_drying',    end: 3, fps: 6,  yoyo: true  }
    ];

    defs.forEach((d) => {
      if (scene.anims.exists(d.key)) return;
      scene.anims.create({
        key: d.key,
        frames: scene.anims.generateFrameNumbers(d.tex, { start: 0, end: d.end }),
        frameRate: d.fps,
        yoyo: d.yoyo,
        repeat: -1
      });
    });
  }

  // ===========================================================================
  // آلة الحالات
  // ===========================================================================

  /**
   * الانتقال إلى حالة جديدة.
   * @param {string} state  إحدى قيم BabyStates
   * @param {object} [opts]
   * @param {number} [opts.revertAfterMs]  تجاوز مدة الارتداد للحالات المؤقتة
   */
  setState(state, opts = {}) {
    if (this._destroyed) return this;

    const cfg = STATE_CONFIG[state];
    if (!cfg) {
      console.warn(`[BabyAnimationController] حالة غير معروفة: ${state}`);
      return this;
    }
    if (state === this._state) return this;

    // --- تنظيف الحالة السابقة ----------------------------------------------
    this._clearStateTweens();
    this._clearTimer('_revertTimer');
    this._clearTimer('_blinkTimer');

    this._prevState = this._state;
    this._state = state;

    // --- 1) جسم: تشغيل أنيميشن الإطارات ------------------------------------
    this.bodySprite.play(cfg.bodyAnim);

    // --- 2) وجه: تعبير الحالة + موضع المرساة --------------------------------
    this._applyFaceAnchor(cfg.pose);
    this.setExpression(cfg.eyes, cfg.mouth);

    // --- 3) رمش ---------------------------------------------------------------
    if (cfg.blink === 'burst') {
      this._blinkBurst(cfg.eyes);          // رمشة مزدوجة ثم تعبير الحالة
    } else if (cfg.blink) {
      const mult = (typeof cfg.blink === 'object') ? cfg.blink.speedMultiplier : 1;
      this._scheduleBlink(mult || 1);
    }

    // --- 4) الحركة الإجرائية المصاحبة ----------------------------------------
    this._startMotion(cfg.motion);

    // --- 5) حالة مؤقتة؟ جدولة الارتداد ---------------------------------------
    const revertMs = opts.revertAfterMs || cfg.revertAfterMs;
    if (revertMs) {
      const fallback = this._prevState || BabyStates.BATH_IDLE;
      this._revertTimer = this.scene.time.delayedCall(revertMs, () => {
        this.setState(fallback);
      });
    }

    this.events.emit('statechange', state, this._prevState);
    return this;
  }

  getState() { return this._state; }

  // ===========================================================================
  // نظام تعبيرات الوجه
  // ===========================================================================

  /** تبديل إطاري العينين والفم مباشرة (EYES.* / MOUTH.*). */
  setExpression(eyesFrame, mouthFrame) {
    if (this._destroyed) return this;
    if (eyesFrame !== undefined && eyesFrame !== null) {
      this.eyesSprite.setFrame(eyesFrame);
    }
    if (mouthFrame !== undefined && mouthFrame !== null) {
      this.mouthSprite.setFrame(mouthFrame);
    }
    return this;
  }

  /** رمشة واحدة فورية ثم العودة لتعبير الحالة الحالية. */
  triggerBlink() {
    if (this._destroyed) return this;
    const restoreFrame = STATE_CONFIG[this._state].eyes;
    this.eyesSprite.setFrame(EYES.CLOSED);
    this.scene.time.delayedCall(110, () => {
      if (!this._destroyed) this.eyesSprite.setFrame(restoreFrame);
    });
    this.events.emit('blink');
    return this;
  }

  /** رمش تلقائي عشوائي (2–5 ثوانٍ بين الرمشات، مقسومة على المضاعف). */
  _scheduleBlink(speedMultiplier = 1) {
    const delay = Phaser.Math.Between(2000, 5000) / speedMultiplier;
    this._blinkTimer = this.scene.time.delayedCall(delay, () => {
      if (this._destroyed) return;
      this.triggerBlink();
      this._scheduleBlink(speedMultiplier); // إعادة الجدولة
    });
  }

  /** رمشة مزدوجة سريعة (لتفاعل الصابون) تنتهي بتعبير الحالة. */
  _blinkBurst(finalEyesFrame) {
    const t = this.scene.time;
    const seq = [
      [0,   EYES.CLOSED], [100, finalEyesFrame],
      [220, EYES.CLOSED], [320, EYES.HAPPY]
    ];
    seq.forEach(([at, frame]) => {
      t.delayedCall(at, () => {
        if (!this._destroyed) this.eyesSprite.setFrame(frame);
      });
    });
  }

  /** تموضع العينين والفم حسب وضعية الجسم (وقوف/جلوس). */
  _applyFaceAnchor(pose) {
    const a = FACE_ANCHORS[pose] || FACE_ANCHORS.sit;
    this.eyesSprite.setPosition(a.eyes.x, a.eyes.y);
    this.mouthSprite.setPosition(a.mouth.x, a.mouth.y);
  }

  // ===========================================================================
  // الحركات الإجرائية (Tweens على rig فقط — لا تمس root)
  // ===========================================================================

  _startMotion(motion) {
    const add = (cfg) => {
      this._stateTweens.push(this.scene.tweens.add(cfg));
    };

    // تصفير وضع rig قبل أي حركة جديدة
    this.rig.setPosition(0, 0).setScale(1).setAngle(0);

    switch (motion) {
      case 'breathe':   // تنفس: تمدد عمودي خفيف
        add({ targets: this.rig, scaleY: 1.02, duration: 1400,
              yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        break;

      case 'sway':      // تمايل لطيف يمين/يسار
        add({ targets: this.rig, angle: { from: -1.5, to: 1.5 }, duration: 1600,
              yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        break;

      case 'slowSway':  // تمايل استرخاء بطيء جداً (التنشيف)
        add({ targets: this.rig, angle: { from: -1, to: 1 }, duration: 2600,
              yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        break;

      case 'bounce':    // ارتداد الضحك
        add({ targets: this.rig, y: -14, duration: 180,
              yoyo: true, repeat: -1, ease: 'Quad.easeOut' });
        break;

      case 'hop':       // قفزة فرح واحدة (تفاعل الصابون)
        add({ targets: this.rig, y: -22, duration: 200,
              yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
        break;

      case 'shiver':    // رجفة أفقية دقيقة (الشطف)
        add({ targets: this.rig, x: { from: -2, to: 2 }, duration: 90,
              yoyo: true, repeat: -1, ease: 'Linear' });
        break;
    }
  }

  _clearStateTweens() {
    this._stateTweens.forEach((tw) => tw && tw.remove());
    this._stateTweens = [];
    this.rig.setPosition(0, 0).setScale(1).setAngle(0);
  }

  _clearTimer(name) {
    if (this[name]) { this[name].remove(false); this[name] = null; }
  }

  // ===========================================================================
  // اختصارات تفاعلية جاهزة لمنطق اللعب القادم
  // ===========================================================================

  /** يُستدعى عندما يقترب الصابون من الطفل. */
  onSoapNear() { return this.setState(BabyStates.SOAP_REACTION); }

  /** ضحك لمدة محددة ثم ارتداد تلقائي للحالة السابقة. */
  laugh(durationMs = 2000) {
    return this.setState(BabyStates.LAUGHING, { revertAfterMs: durationMs });
  }

  // ===========================================================================
  // تفويضات للمشهد (موضع/مقياس/عمق/Mask) — تمر كلها عبر root
  // ===========================================================================

  setPosition(x, y) { this.root.setPosition(x, y); return this; }
  setScale(s)       { this.root.setScale(s);       return this; }
  setDepth(d)       { this.root.setDepth(d);       return this; }
  setMask(mask)     { this.root.setMask(mask);     return this; }
  getContainer()    { return this.root; }

  // ===========================================================================
  // تنظيف كامل
  // ===========================================================================
  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._clearStateTweens();
    this._clearTimer('_blinkTimer');
    this._clearTimer('_revertTimer');
    this.events.removeAllListeners();
    this.root.destroy(true); // يدمر rig وكل الـ Sprites
  }
}

// إتاحة الكلاس والثوابت كموديول أو كسكربت عادي
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BabyAnimationController, BabyStates, EYES, MOUTH };
}
if (typeof window !== 'undefined') {
  window.BabyAnimationController = BabyAnimationController;
  window.BabyStates = BabyStates;
}
