// =============================================================================
// BathActivityManager — دورة حياة نشاط الاستحمام | Baby Care World
// -----------------------------------------------------------------------------
// State Machine صارمة وخطية لإدارة أطوار الاستحمام:
//
//   ENTER_BATH → FILL_WATER → APPLY_SOAP → RINSE → DRY → COMPLETE
//
// مبادئ التصميم (مقاومة الغش / الاختصار):
//   1) التقدم (#progress) حقل خاص (Private Field) — لا يمكن تعديله من خارج الكلاس.
//   2) لا يوجد أي API يرفع التقدم إلى 100 أو يقفز بين الأطوار مباشرة:
//        - reportProgress() هي البوابة الوحيدة، وتقبل الطور الحالي فقط.
//        - كل استدعاء مقيَّد بسقف لكل حدث (maxDeltaPerEvent)
//          وبميزانية زمنية Token-Bucket (maxPerSecond)
//          وبحدٍّ أدنى لمدة الطور (minDurationMs).
//        => ضغطة واحدة لا تضيف أكثر من بضع نقاط مهما تكررت بسرعة.
//   3) tryAdvance() لا تنجح إلا إذا اكتمل الطور فعلياً (100% + المدة الدنيا).
//   4) المكافأة تُمنح مرة واحدة فقط عند COMPLETE (#rewardGranted).
//   5) كل جداول الإعداد مجمّدة (Object.freeze).
//
// واجهة الإشارات (EventEmitter):
//   'start'              ()                          بدء النشاط
//   'phase:enter'        (phase, info)               دخول طور جديد (info: label/index/total/babyState/interaction)
//   'progress'           (phase, value, delta)       تحدّث التقدم 0..100 — لربط شريط التقدم
//   'progress:rejected'  (phase, reason, attempted)  محاولة مرفوضة (طور خاطئ/تجاوز سقف/قيمة غير صالحة)
//   'phase:complete'     (phase)                     اكتمال شروط الطور الحالي
//   'activity:complete'  ({ reward, durationMs })    اكتمال النشاط كاملاً + حمولة المكافأة
// =============================================================================

// ---------------------------------------------------------------------------
// الأطوار وترتيبها الصارم
// ---------------------------------------------------------------------------
const BathPhases = Object.freeze({
  ENTER_BATH: 'ENTER_BATH',
  FILL_WATER: 'FILL_WATER',
  APPLY_SOAP: 'APPLY_SOAP',
  RINSE:      'RINSE',
  DRY:        'DRY',
  COMPLETE:   'COMPLETE'
});

const PHASE_ORDER = Object.freeze([
  BathPhases.ENTER_BATH,
  BathPhases.FILL_WATER,
  BathPhases.APPLY_SOAP,
  BathPhases.RINSE,
  BathPhases.DRY,
  BathPhases.COMPLETE
]);

// ---------------------------------------------------------------------------
// إعدادات كل طور:
//   interaction      : نوع التفاعل الذي يغذّي التقدم (توثيقي + للتحقق في UI)
//   minDurationMs    : لا يُعتبر الطور مكتملاً قبل مضي هذه المدة منذ دخوله
//   maxDeltaPerEvent : أقصى نقاط يقبلها استدعاء reportProgress واحد
//   maxPerSecond     : أقصى نقاط في الثانية (Token-Bucket) — يحدد الحد الأدنى
//                      الفعلي لزمن الطور حتى مع إدخال مثالي (100/maxPerSecond)
//   babyState        : حالة BabyAnimationController الموافقة للطور
// ---------------------------------------------------------------------------
const PHASE_CONFIG = Object.freeze({
  [BathPhases.ENTER_BATH]: Object.freeze({
    label: 'ضع الطفل في الحوض بلطف',
    interaction: 'drag_baby_to_tub',   // سحب الطفل وإفلاته داخل الحوض
    minDurationMs: 800,
    maxDeltaPerEvent: 100,             // إفلات صحيح واحد = اكتمال الخطوة
    maxPerSecond: 100,
    babyState: 'SIT'
  }),
  [BathPhases.FILL_WATER]: Object.freeze({
    label: 'افتح الصنبور واملأ الحوض',
    interaction: 'hold_faucet',        // ضغط مستمر — تُستدعى reportProgress كل إطار
    minDurationMs: 4000,
    maxDeltaPerEvent: 2.5,
    maxPerSecond: 25,                  // => 4 ثوانٍ كحد أدنى فعلي
    babyState: 'BATH_IDLE'
  }),
  [BathPhases.APPLY_SOAP]: Object.freeze({
    label: 'افرك الطفل بالصابون لتكوين الرغوة',
    interaction: 'drag_soap_scrub',    // كل حركة فرك فوق الجسم = نقاط قليلة
    minDurationMs: 5000,
    maxDeltaPerEvent: 4,
    maxPerSecond: 20,                  // => 5 ثوانٍ كحد أدنى فعلي
    babyState: 'WASHING'
  }),
  [BathPhases.RINSE]: Object.freeze({
    label: 'اشطف الرغوة برأس الدش',
    interaction: 'hold_shower',        // ضغط مستمر فوق مناطق الرغوة
    minDurationMs: 4000,
    maxDeltaPerEvent: 2.5,
    maxPerSecond: 25,
    babyState: 'RINSING'
  }),
  [BathPhases.DRY]: Object.freeze({
    label: 'جفّف الطفل بالمنشفة',
    interaction: 'rub_towel',          // مسح المنشفة ذهاباً وإياباً
    minDurationMs: 3500,
    maxDeltaPerEvent: 5,
    maxPerSecond: 30,
    babyState: 'DRYING'
  }),
  [BathPhases.COMPLETE]: Object.freeze({
    label: 'أحسنت! الطفل نظيف وسعيد',
    interaction: null,
    terminal: true,
    babyState: 'LAUGHING'
  })
});

// مكافأة النشاط — تُمنح مرة واحدة فقط عند COMPLETE
const ACTIVITY_REWARD = Object.freeze({
  hygiene: 60,      // رفع عدّاد النظافة
  happiness: 15,    // سعادة إضافية
  coins: 25         // عملات اللعبة
});

// =============================================================================
// الكلاس الرئيسي
// =============================================================================
class BathActivityManager extends Phaser.Events.EventEmitter {

  // --- حالة داخلية خاصة: لا سبيل للوصول إليها أو تعديلها من الخارج ----------
  #scene;
  #phaseIndex = -1;          // لم يبدأ بعد
  #progress = 0;             // 0..100 للطور الحالي
  #budget = 0;               // ميزانية Token-Bucket المتاحة حالياً
  #phaseStartedAt = 0;       // زمن دخول الطور (ساعة اللعبة)
  #lastReportAt = 0;         // آخر استدعاء reportProgress
  #phaseFinalized = false;   // الطور الحالي استوفى كل شروطه
  #started = false;
  #finished = false;
  #rewardGranted = false;
  #pendingTimer = null;      // مؤقّت داخلي (مهلة الحد الأدنى / تأخير الانتقال)
  #autoAdvance;
  #advanceDelayMs;

  /**
   * @param {Phaser.Scene} scene
   * @param {object} [opts]
   * @param {boolean} [opts.autoAdvance=true]   الانتقال تلقائياً بعد اكتمال الطور
   * @param {number}  [opts.advanceDelayMs=700] مهلة قصيرة قبل الانتقال (لإظهار الاحتفال)
   */
  constructor(scene, opts = {}) {
    super();
    this.#scene = scene;
    this.#autoAdvance = opts.autoAdvance !== false;
    this.#advanceDelayMs = opts.advanceDelayMs ?? 700;
  }

  // ===========================================================================
  // قراءات آمنة (Read-Only) — للمشهد وواجهة المستخدم
  // ===========================================================================

  /** الطور الحالي (أو null قبل البدء). */
  get phase() {
    return this.#phaseIndex >= 0 ? PHASE_ORDER[this.#phaseIndex] : null;
  }

  /** تقدم الطور الحالي 0..100. */
  get progress() { return this.#progress; }

  /** هل استوفى الطور الحالي كل شروطه؟ */
  isPhaseComplete() { return this.#phaseFinalized; }

  /** هل انتهى النشاط كاملاً؟ */
  isFinished() { return this.#finished; }

  /** لقطة مجمّدة لحالة النشاط — مناسبة لرسم شريط التقدم والعنوان. */
  getSnapshot() {
    const phase = this.phase;
    const cfg = phase ? PHASE_CONFIG[phase] : null;
    return Object.freeze({
      phase,
      label: cfg ? cfg.label : '',
      interaction: cfg ? cfg.interaction : null,
      progress: this.#progress,
      phaseIndex: Math.max(0, this.#phaseIndex),
      totalPhases: PHASE_ORDER.length,
      phaseComplete: this.#phaseFinalized,
      finished: this.#finished
    });
  }

  // ===========================================================================
  // بدء النشاط
  // ===========================================================================
  start() {
    if (this.#started || this.#finished) return this;
    this.#started = true;
    this.emit('start');
    this.#enterPhase(0);
    return this;
  }

  // ===========================================================================
  // البوابة الوحيدة لرفع التقدم
  // ===========================================================================
  /**
   * إبلاغ عن تقدم ناتج عن تفاعل حقيقي (سحب/ضغط مستمر/فرك).
   * تُستدعى من منطق الإدخال في المشهد كل إطار أو عند كل حركة.
   *
   * @param {string} phaseId  يجب أن يطابق الطور الحالي — أي طور آخر يُرفض
   * @param {number} rawDelta النقاط المطلوب إضافتها (ستُقصّ وفق القيود)
   * @returns {number} النقاط المقبولة فعلياً (0 إذا رُفضت)
   */
  reportProgress(phaseId, rawDelta) {
    // --- حراسة المدخلات -----------------------------------------------------
    if (!this.#started || this.#finished || this.#phaseFinalized) {
      return this.#reject(phaseId, 'phase_not_active', rawDelta);
    }
    if (phaseId !== this.phase) {
      return this.#reject(phaseId, 'wrong_phase', rawDelta);
    }
    const cfg = PHASE_CONFIG[phaseId];
    if (cfg.terminal) {
      return this.#reject(phaseId, 'terminal_phase', rawDelta);
    }
    const delta = Number(rawDelta);
    if (!Number.isFinite(delta) || delta <= 0) {
      return this.#reject(phaseId, 'invalid_delta', rawDelta);
    }

    // --- Token-Bucket: تجديد الميزانية حسب الزمن الفعلي المنقضي --------------
    const now = this.#scene.time.now;
    const elapsedSec = Math.max(0, (now - this.#lastReportAt) / 1000);
    this.#lastReportAt = now;
    this.#budget = Math.min(
      cfg.maxPerSecond,                                   // سقف الميزانية المخزنة
      this.#budget + cfg.maxPerSecond * elapsedSec        // التجديد بمرور الوقت
    );

    // --- قصّ القيمة وفق كل القيود -------------------------------------------
    const accepted = Math.min(
      delta,
      cfg.maxDeltaPerEvent,       // سقف الاستدعاء الواحد
      this.#budget,               // سقف المعدل الزمني
      100 - this.#progress        // لا تجاوز فوق 100
    );

    if (accepted <= 0) {
      return this.#reject(phaseId, 'rate_limited', rawDelta);
    }

    this.#budget -= accepted;
    this.#progress = Math.min(100, this.#progress + accepted);
    this.emit('progress', phaseId, this.#progress, accepted);

    // --- فحص اكتمال الطور ----------------------------------------------------
    if (this.#progress >= 100) this.#checkPhaseCompletion();

    return accepted;
  }

  // ===========================================================================
  // الانتقال — لا ينجح أبداً قبل اكتمال الطور فعلياً
  // ===========================================================================
  /**
   * طلب الانتقال للطور التالي (للاستخدام عندما autoAdvance=false).
   * @returns {boolean} true إذا تم الانتقال
   */
  tryAdvance() {
    if (!this.#started || this.#finished) return false;
    if (!this.#phaseFinalized) return false;     // ❌ الطور لم يكتمل => لا انتقال
    this.#advance();
    return true;
  }

  // ===========================================================================
  // الداخليات
  // ===========================================================================

  #enterPhase(index) {
    this.#phaseIndex = index;
    this.#progress = 0;
    this.#phaseFinalized = false;
    this.#phaseStartedAt = this.#scene.time.now;
    this.#lastReportAt = this.#phaseStartedAt;
    // ميزانية ابتدائية صغيرة: أول استدعاء لا يتجاوز سقف الحدث الواحد
    const cfg = PHASE_CONFIG[this.phase];
    this.#budget = Math.min(cfg.maxDeltaPerEvent || 0, cfg.maxPerSecond || 0);

    this.emit('phase:enter', this.phase, Object.freeze({
      label: cfg.label,
      interaction: cfg.interaction,
      babyState: cfg.babyState,
      index,
      total: PHASE_ORDER.length
    }));

    // الطور الختامي: منح المكافأة وإنهاء النشاط
    if (cfg.terminal) this.#finishActivity();
  }

  /** التقدم بلغ 100 — تحقق من شرط المدة الدنيا قبل اعتماد الاكتمال. */
  #checkPhaseCompletion() {
    const cfg = PHASE_CONFIG[this.phase];
    const elapsed = this.#scene.time.now - this.#phaseStartedAt;

    if (elapsed >= cfg.minDurationMs) {
      this.#finalizePhase();
    } else {
      // بلغ 100% أسرع من المسموح نظرياً — ننتظر استيفاء المدة الدنيا
      this.#clearPendingTimer();
      this.#pendingTimer = this.#scene.time.delayedCall(
        cfg.minDurationMs - elapsed,
        () => this.#finalizePhase()
      );
    }
  }

  #finalizePhase() {
    if (this.#phaseFinalized || this.#finished) return;
    this.#phaseFinalized = true;
    this.#clearPendingTimer();
    this.emit('phase:complete', this.phase);

    if (this.#autoAdvance) {
      this.#pendingTimer = this.#scene.time.delayedCall(
        this.#advanceDelayMs,
        () => this.#advance()
      );
    }
  }

  #advance() {
    if (this.#finished) return;
    this.#clearPendingTimer();
    const next = this.#phaseIndex + 1;
    if (next >= PHASE_ORDER.length) return; // لا يحدث عملياً (COMPLETE ختامي)
    this.#enterPhase(next);
  }

  #finishActivity() {
    if (this.#finished) return;
    this.#finished = true;

    // المكافأة تُمنح مرة واحدة فقط — ولا يوجد أي مسار آخر يصل هنا
    // سوى عبور الأطوار الخمسة كاملةً بتقدم 100% لكل منها.
    if (!this.#rewardGranted) {
      this.#rewardGranted = true;
      this.emit('activity:complete', Object.freeze({
        reward: ACTIVITY_REWARD,
        durationMs: this.#scene.time.now - this.#activityStartGuess()
      }));
    }
  }

  #activityStartGuess() {
    // زمن البدء التقريبي = زمن دخول الطور الحالي ناقص مجموع المدد الدنيا السابقة
    // (قيمة توثيقية للتحليلات فقط — لا تؤثر على المنطق)
    return this.#phaseStartedAt;
  }

  #reject(phaseId, reason, attempted) {
    this.emit('progress:rejected', phaseId, reason, attempted);
    return 0;
  }

  #clearPendingTimer() {
    if (this.#pendingTimer) {
      this.#pendingTimer.remove(false);
      this.#pendingTimer = null;
    }
  }

  // ===========================================================================
  // تنظيف
  // ===========================================================================
  destroy() {
    this.#clearPendingTimer();
    this.removeAllListeners();
    this.#scene = null;
  }
}

// إتاحة الكلاس والثوابت كموديول أو كسكربت عادي
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BathActivityManager, BathPhases, PHASE_ORDER, PHASE_CONFIG, ACTIVITY_REWARD };
}
if (typeof window !== 'undefined') {
  window.BathActivityManager = BathActivityManager;
  window.BathPhases = BathPhases;
}
