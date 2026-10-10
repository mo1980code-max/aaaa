// =============================================================================
// BathScene — غرفة الاستحمام | Baby Care World
// -----------------------------------------------------------------------------
// نطاق هذا الملف (هذه الخطوة حصراً):
//   1) preload : تحميل أصول الحمام وفق الـ Manifest (docs/bath-assets-manifest.md)
//   2) create  : بناء طبقات المشهد بترتيب عمق صارم (Depth Sorting)
//   3) Geometry Mask : قصّ جسم الطفل عند قاع/حافة الحوض الداخلية
//      حتى يبدو "جالساً داخل الحوض" ولا يتسرّب جسده أسفل الواجهة الأمامية.
//
// ترتيب الطبقات (من الخلف إلى الأمام):
//   Background → Bathtub Back → Water Surface → Baby → Bathtub Front → UI/Faucet
//
// ملاحظة: لا يوجد هنا أي منطق للصابون/الماء/التفاعل — فقط المشهد والطبقات والـ Mask.
// =============================================================================

class BathScene extends Phaser.Scene {

  constructor() {
    super({ key: 'BathScene' });

    // --- ثوابت العمق: مصدر الحقيقة الوحيد لترتيب الطبقات -------------------
    this.DEPTHS = Object.freeze({
      BACKGROUND: 0,   // خلفية الحمام (جدار + أرضية)
      TUB_BACK:   10,  // الجدار الخلفي الداخلي للحوض
      WATER:      20,  // سطح الماء (شبه شفاف، خلف الطفل)
      BABY:       30,  // الطفل — بين الماء والواجهة الأمامية => "داخل" الحوض
      TUB_FRONT:  40,  // الواجهة الأمامية للحوض (تغطي أسفل جسم الطفل)
      PROPS_UI:   50   // الصنبور، الدش، المنشفة، الصابون، وأي UI لاحقاً
    });
  }

  // ===========================================================================
  // PRELOAD — تحميل الأصول (المفاتيح مطابقة للـ Manifest حرفياً)
  // ===========================================================================
  preload() {
    // أصول مؤقتة مولّدة بالكود (تطوير/معاينة) — لا تمس المفاتيح الموجودة،
    // وعند توفر ملفات PNG الحقيقية تُحمَّل هي بدلاً منها.
    if (typeof PlaceholderAssets !== 'undefined') {
      PlaceholderAssets.install(this);
    }

    this.load.setPath('public/assets/bathroom/');

    // تحميل فقط إذا لم يكن المفتاح موجوداً (يتخطى الـ Placeholders المولّدة)
    const img = (key, file) => {
      if (!this.textures.exists(key)) this.load.image(key, file);
    };

    img('bath_bg',         'bath_bg.png');         // 1920×1080 معتمة
    img('tub_back',        'tub_back.png');        // 1200×420  شفافة
    img('water_surface',   'water_surface.png');   // 1100×220  شفافة
    img('tub_front',       'tub_front.png');       // 1240×380  شفافة
    img('faucet',          'faucet.png');          // 220×260   شفافة
    img('shower_head',     'shower_head.png');     // 260×320   شفافة
    img('soap_bar',        'soap_bar.png');        // 160×120   شفافة
    img('towel',           'towel.png');           // 300×260   شفافة
    img('bubble_particle', 'bubble_particle.png'); // 64×64     شفافة

    // أوراق تحريك الطفل (جسم + عينان + فم) — انظر docs/baby-animation-manifest.md
    // يتطلب تضمين src/animation/BabyAnimationController.js قبل هذا الملف.
    if (typeof BabyAnimationController !== 'undefined') {
      BabyAnimationController.preload(this);
    } else if (!this.textures.exists('baby_boy')) {
      // Fallback: صورة ثابتة إذا لم يكن نظام التحريك مضمَّناً
      this.load.setPath('public/assets/characters/');
      this.load.image('baby_boy', 'baby-boy.svg');
      this.load.setPath('');
    }
  }

  // ===========================================================================
  // CREATE — بناء الطبقات + الـ Geometry Mask
  // ===========================================================================
  create() {
    const W = this.scale.width;   // 1920 (دقة اللعبة المرجعية)
    const H = this.scale.height;  // 1080

    // -------------------------------------------------------------------------
    // 1) تخطيط الحوض: كل الإحداثيات مشتقة من نقطة مرجعية واحدة (مركز الحوض)
    //    حتى يسهل تحريك الحوض كله لاحقاً بتغيير قيمتين فقط.
    // -------------------------------------------------------------------------
    const tub = {
      centerX: W * 0.50,          // منتصف الشاشة أفقياً
      centerY: H * 0.70,          // الثلث السفلي من المشهد
      waterLevelOffset: -60,      // سطح الماء أعلى مركز الحوض قليلاً
      rimOffset: -150             // الحافة العلوية الداخلية للواجهة الأمامية
    };

    // خط القص: الحافة العلوية الداخلية لـ tub_front.
    // كل بكسل من جسم الطفل تحت هذا الخط لن يُرسم (يُقص بالـ Mask)،
    // ثم تغطي الواجهة الأمامية منطقة القطع فيبدو الجسم غاطساً داخل الحوض.
    const clipLineY = tub.centerY + tub.rimOffset + 190; // ≈ قاع الحوض المرئي

    // -------------------------------------------------------------------------
    // 2) الطبقة 0 — الخلفية
    // -------------------------------------------------------------------------
    this.bg = this.add.image(W / 2, H / 2, 'bath_bg')
      .setDisplaySize(W, H)
      .setDepth(this.DEPTHS.BACKGROUND);

    // -------------------------------------------------------------------------
    // 3) الطبقة 10 — الجدار الخلفي للحوض
    // -------------------------------------------------------------------------
    this.tubBack = this.add.image(tub.centerX, tub.centerY, 'tub_back')
      .setOrigin(0.5, 0.5)
      .setDepth(this.DEPTHS.TUB_BACK);

    // -------------------------------------------------------------------------
    // 4) الطبقة 20 — سطح الماء (خلف الطفل، شبه شفاف)
    // -------------------------------------------------------------------------
    this.waterSurface = this.add.image(
      tub.centerX,
      tub.centerY + tub.waterLevelOffset,
      'water_surface'
    )
      .setOrigin(0.5, 0.5)
      .setAlpha(0.75)                       // يُرى الجسد الغاطس من خلاله
      .setDepth(this.DEPTHS.WATER);

    // -------------------------------------------------------------------------
    // 5) Geometry Mask — قصّ جسم الطفل عند قاع الحوض
    // -------------------------------------------------------------------------
    // مستطيل غير مرئي يغطي كل ما *فوق* خط القص؛ ما تحته لا يُرسم من الطفل،
    // فلا يتسرّب جسده بصرياً أسفل الحوض أو خلف أرجله.
    const maskShape = this.make.graphics({ add: false }); // لا يُضاف لقائمة العرض
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, 0, W, clipLineY);
    this.babyMask = maskShape.createGeometryMask();

    // -------------------------------------------------------------------------
    // 6) الطبقة 30 — الطفل (داخل الحوض بصرياً) عبر نظام التحريك
    // -------------------------------------------------------------------------
    if (typeof BabyAnimationController !== 'undefined') {
      BabyAnimationController.registerAnimations(this);

      this.babyController = new BabyAnimationController(
        this,
        tub.centerX,
        clipLineY - 40,                     // نقطة مقعد الطفل (Origin 0.5, 1)
        { scale: 0.55, initialState: BabyStates.BATH_IDLE }
      );
      this.babyController
        .setDepth(this.DEPTHS.BABY)
        .setMask(this.babyMask);            // الـ Mask يُطبَّق على الـ Container كاملاً
    } else {
      // Fallback: صورة ثابتة بنفس الموضع والعمق والـ Mask
      const babyKey = this.registry.get('selectedBabyKey') || 'baby_boy';
      this.baby = this.add.image(tub.centerX, clipLineY - 40, babyKey)
        .setOrigin(0.5, 1)
        .setScale(0.55)
        .setDepth(this.DEPTHS.BABY)
        .setMask(this.babyMask);
    }

    // -------------------------------------------------------------------------
    // 7) الطبقة 40 — الواجهة الأمامية للحوض (تغطي منطقة القص)
    // -------------------------------------------------------------------------
    this.tubFront = this.add.image(
      tub.centerX,
      tub.centerY + 30,                     // أقرب للكاميرا => أخفض قليلاً
      'tub_front'
    )
      .setOrigin(0.5, 0.5)
      .setDepth(this.DEPTHS.TUB_FRONT);

    // -------------------------------------------------------------------------
    // 8) الطبقة 50 — الصنبور / الدش / المنشفة / الصابون (بدون أي تفاعل بعد)
    // -------------------------------------------------------------------------
    this.faucet = this.add.image(
      tub.centerX + 520,                    // على الحافة اليمنى للحوض
      tub.centerY - 230,
      'faucet'
    )
      .setOrigin(0.5, 0.5)
      .setDepth(this.DEPTHS.PROPS_UI);

    this.showerHead = this.add.image(
      tub.centerX - 560,
      tub.centerY - 480,                    // معلّق على الجدار أعلى يسار الحوض
      'shower_head'
    )
      .setOrigin(0.5, 0.5)
      .setDepth(this.DEPTHS.PROPS_UI);

    this.towel = this.add.image(
      W - 220,
      H * 0.38,                             // حامل مناشف على الجدار يميناً
      'towel'
    )
      .setOrigin(0.5, 0.5)
      .setDepth(this.DEPTHS.PROPS_UI);

    this.soap = this.add.image(
      tub.centerX + 540,
      tub.centerY + 170,                    // على حافة/رف بجانب الحوض
      'soap_bar'
    )
      .setOrigin(0.5, 0.5)
      .setDepth(this.DEPTHS.PROPS_UI + 5);  // فوق بقية الأدوات لأنه سيُسحب لاحقاً

    // -------------------------------------------------------------------------
    // 9) دورة حياة النشاط — BathActivityManager (src/systems/BathActivityManager.js)
    //    الربط هنا: طور النشاط ⇄ حالة تحريك الطفل + إشارات جاهزة للـ UI.
    //    (ربط أدوات الإدخال الفعلية — سحب الصابون/ضغط الصنبور — في الخطوة القادمة؛
    //     التقدم لا يُغذَّى إلا عبر activity.reportProgress من تلك الأدوات.)
    // -------------------------------------------------------------------------
    if (typeof BathActivityManager !== 'undefined' && this.babyController) {
      this.bathActivity = new BathActivityManager(this);

      // تعليمة المرحلة + شريط تقدم بسيط (أعلى الشاشة)
      this._phaseLabel = this.add.text(W / 2, 64, '', {
        fontSize: '42px', fontFamily: 'Arial', color: '#ffffff',
        stroke: '#4a90b8', strokeThickness: 8
      }).setOrigin(0.5).setDepth(this.DEPTHS.PROPS_UI + 20);
      this._progressBg = this.add.rectangle(W / 2, 120, 620, 26, 0xffffff, 0.45)
        .setDepth(this.DEPTHS.PROPS_UI + 20);
      this._progressFill = this.add.rectangle(W / 2 - 306, 120, 0, 18, 0x4fc3f7, 1)
        .setOrigin(0, 0.5).setDepth(this.DEPTHS.PROPS_UI + 21);

      // دخول طور جديد => تبديل حالة الطفل + تعليمة المرحلة
      this.bathActivity.on('phase:enter', (phase, info) => {
        this._phaseLabel.setText(info.label || '');
        this._progressFill.width = 0;
        if (phase === 'ENTER_BATH') {
          this._beginEnterBath();             // سحب الطفل إلى الحوض يدوياً
        } else if (info.babyState && BabyStates[info.babyState]) {
          this.babyController.setState(BabyStates[info.babyState]);
        }
      });

      // تحدّث التقدم => شريط التقدم
      this.bathActivity.on('progress', (_phase, value) => {
        this._progressFill.width = 612 * (value / 100);
      });

      // اكتمال النشاط => الاحتفال + المصدر الوحيد لمكافأة النظافة
      this.bathActivity.on('activity:complete', ({ reward }) => {
        this._celebrate(reward);
      });

      // -----------------------------------------------------------------------
      // 10) التفاعلات الحركية الحقيقية — الصابون/الفرك + الماء/الدش
      //     (src/interactions/SoapInteraction.js + WaterInteraction.js)
      //     كلاهما يغذي التقدم حصراً عبر bathActivity.reportProgress().
      // -----------------------------------------------------------------------
      // منطقة جسم الطفل (Hit Area) — بيضاوي حول جذع الطفل الجالس داخل الحوض
      this.babyHitArea = new Phaser.Geom.Ellipse(
        tub.centerX,            // مركز الطفل أفقياً
        clipLineY - 160,        // منتصف الجذع تقريباً فوق خط القص
        380,                    // عرض يغطي الجذع والذراعين
        340                     // ارتفاع من الرأس حتى سطح الماء
      );

      // نقاط مرجعية لطور ENTER_BATH (سحب الطفل إلى الحوض)
      this._babySeat = { x: tub.centerX, y: clipLineY - 40 };            // مقعده داخل الحوض
      this._enterStart = { x: W * 0.16, y: H * 0.88 };                   // وقوفه على الأرضية
      this._tubZone = new Phaser.Geom.Ellipse(tub.centerX, tub.centerY - 60, 1150, 560);

      if (typeof SoapInteraction !== 'undefined') {
        this.soapInteraction = new SoapInteraction(this, {
          soap: this.soap,
          activity: this.bathActivity,
          babyController: this.babyController,
          hitArea: this.babyHitArea,
          mask: this.babyMask,                    // الرغوة تُقص عند قاع الحوض أيضاً
          foamDepth: this.DEPTHS.BABY + 2         // فوق الطفل، تحت واجهة الحوض
        });
      }

      if (typeof WaterInteraction !== 'undefined' && this.soapInteraction) {
        this.waterInteraction = new WaterInteraction(this, {
          faucet: this.faucet,
          showerHead: this.showerHead,
          waterSurface: this.waterSurface,
          activity: this.bathActivity,
          foam: this.soapInteraction,             // لخفض الرغوة أثناء الشطف
          babyHitArea: this.babyHitArea,
          streamDepth: this.DEPTHS.PROPS_UI - 5   // بين واجهة الحوض والأدوات
        });
      }

      if (typeof TowelInteraction !== 'undefined') {
        this.towelInteraction = new TowelInteraction(this, {
          towel: this.towel,
          activity: this.bathActivity,
          babyController: this.babyController,
          hitArea: this.babyHitArea,
          fxDepth: this.DEPTHS.PROPS_UI - 5
        });
      }

      this.bathActivity.start(); // يبدأ من ENTER_BATH (بعد تهيئة التفاعلات)
    }

    // تنظيف عند مغادرة المشهد
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this._teardownBabyDrag();
      if (this.soapInteraction) { this.soapInteraction.destroy(); this.soapInteraction = null; }
      if (this.waterInteraction) { this.waterInteraction.destroy(); this.waterInteraction = null; }
      if (this.towelInteraction) { this.towelInteraction.destroy(); this.towelInteraction = null; }
      if (this.bathActivity) { this.bathActivity.destroy(); this.bathActivity = null; }
      if (this.babyController) { this.babyController.destroy(); this.babyController = null; }
    });
  }

  // ===========================================================================
  // طور ENTER_BATH — سحب الطفل من الأرضية وإفلاته داخل منطقة الحوض (Drop Zone)
  // -----------------------------------------------------------------------------
  // الطفل نفسه هو الهدف القابل للسحب (لا مقبض وهمي منفصل).
  // لا يُرفع أي تقدم إلا عند الإفلات داخل منطقة الحوض، ولذلك لا يبدأ طور
  // الماء (FILL_WATER) إلا بعد نجاح هذا الطور.
  // ===========================================================================
  _beginEnterBath() {
    const ctrl = this.babyController;
    const baby = ctrl.getContainer();

    // الطفل يقف على الأرضية خارج الحوض: بلا قناع + حالة وقوف
    baby.clearMask();
    ctrl.setPosition(this._enterStart.x, this._enterStart.y);
    ctrl.setState(BabyStates.IDLE);

    // منطقة الإمساك بإحداثيات الحاوية المحلية (قبل المقياس 0.55):
    // الإطار 512×512 للطفل (origin أسفل-وسط) مع فائض صغير للمس.
    const grabArea = new Phaser.Geom.Rectangle(-280, -560, 560, 600);
    baby.setInteractive(grabArea, Phaser.Geom.Rectangle.Contains);
    this.input.setDraggable(baby);
    baby.input.cursor = 'grab';

    this._babyDragTarget = baby;

    // إيقاف أي Tween عودة جارٍ فوراً عند بدء سحب جديد (وإلا يتصارع معه)
    this._onBabyDragStart = (_p, obj) => {
      if (obj === baby) this.tweens.killTweensOf(baby);
    };

    // الطفل يتبع المؤشر فوراً
    this._onBabyDrag = (_p, obj, dragX, dragY) => {
      if (obj === baby) ctrl.setPosition(dragX, dragY);
    };

    this._onBabyDragEnd = (_p, obj) => {
      if (obj !== baby || this.bathActivity.phase !== 'ENTER_BATH') return;

      // نقطة الإفلات = موضع قدم/مقعد الطفل (origin أسفل-وسط)
      if (Phaser.Geom.Ellipse.Contains(this._tubZone, baby.x, baby.y)) {
        // ✅ إفلات صحيح داخل الحوض: جلوس + قناع + إبلاغ الـ State Machine
        this._teardownBabyDrag();
        this.tweens.add({
          targets: baby,
          x: this._babySeat.x, y: this._babySeat.y,
          duration: 300, ease: 'Sine.easeOut',
          onComplete: () => {
            ctrl.setMask(this.babyMask);
            ctrl.setState(BabyStates.SIT);
            this.bathActivity.reportProgress('ENTER_BATH', 100);
          }
        });
      } else {
        // ❌ خارج الحوض: عودة الطفل لنقطة البداية (يبقى قابلاً للسحب)
        this.tweens.add({
          targets: baby,
          x: this._enterStart.x, y: this._enterStart.y,
          duration: 350, ease: 'Back.easeOut'
        });
      }
    };

    this.input.on('dragstart', this._onBabyDragStart);
    this.input.on('drag', this._onBabyDrag);
    this.input.on('dragend', this._onBabyDragEnd);
  }

  /** إزالة مستمعي السحب وتعطيل تفاعل الطفل (بعد نجاح الإفلات أو عند الخروج). */
  _teardownBabyDrag() {
    if (this._onBabyDragStart) this.input.off('dragstart', this._onBabyDragStart);
    if (this._onBabyDrag)      this.input.off('drag', this._onBabyDrag);
    if (this._onBabyDragEnd)   this.input.off('dragend', this._onBabyDragEnd);
    this._onBabyDragStart = this._onBabyDrag = this._onBabyDragEnd = null;

    const target = this._babyDragTarget;
    if (target && target.active && target.input) target.removeInteractive();
    this._babyDragTarget = null;
  }

  // ===========================================================================
  // COMPLETE — نجوم احتفالية + ضحك + تطبيق مكافأة النظافة
  // ===========================================================================
  _celebrate(reward) {
    const W = this.scale.width;
    const q = (typeof window !== 'undefined' && window.BathQuality) ||
              { starCount: 16, maxParticles: 120 };

    // 1) ضحك الطفل
    this.babyController.laugh(3000);

    // 2) نجوم متفجرة فوق الحوض (ثلاث دفعات خفيفة بدل انفجار واحد ثقيل)
    const starKey = this.textures.exists('star_particle') ? 'star_particle' : 'bubble_particle';
    const stars = this.add.particles(0, 0, starKey, {
      speed: { min: 220, max: 540 },
      angle: { min: 220, max: 320 },
      gravityY: 650,
      scale: { start: 0.9, end: 0 },
      rotate: { min: -180, max: 180 },
      lifespan: { min: 900, max: 1500 },
      tint: starKey === 'bubble_particle' ? [0xFFD54F, 0xFFF176] : undefined,
      maxAliveParticles: q.maxParticles,
      emitting: false
    }).setDepth(this.DEPTHS.PROPS_UI + 25);

    const cx = this._babySeat.x;
    const cy = this._babySeat.y - 280;
    stars.explode(q.starCount, cx, cy);
    this.time.delayedCall(350, () => stars.explode(Math.ceil(q.starCount * 0.6), cx - 220, cy - 40));
    this.time.delayedCall(700, () => stars.explode(Math.ceil(q.starCount * 0.6), cx + 220, cy - 40));

    // 3) نص الاحتفال + المكافأة
    const title = this.add.text(W / 2, 300, '🛁 أحسنت! اكتمل الاستحمام ✨', {
      fontSize: '88px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#f06292', strokeThickness: 12
    }).setOrigin(0.5).setDepth(this.DEPTHS.PROPS_UI + 26).setScale(0);
    this.tweens.add({ targets: title, scale: 1, duration: 450, ease: 'Back.easeOut' });

    const line = `النظافة +${reward.hygiene} 🧼    السعادة +${reward.happiness} 💖    +${reward.coins} 🪙`;
    const sub = this.add.text(W / 2, 410, line, {
      fontSize: '46px', fontFamily: 'Arial', color: '#ffffff',
      stroke: '#4a90b8', strokeThickness: 8
    }).setOrigin(0.5).setDepth(this.DEPTHS.PROPS_UI + 26).setAlpha(0);
    this.tweens.add({ targets: sub, alpha: 1, duration: 500, delay: 350 });

    // 4) تطبيق المكافأة على حالة اللعبة — نقطة التكامل الوحيدة مع عدّادات game.js
    const needs = this.registry.get('needs');
    if (needs && typeof needs === 'object') {
      needs.hygiene = Math.min(100, (needs.hygiene || 0) + reward.hygiene);
      needs.happiness = Math.min(100, (needs.happiness || 0) + reward.happiness);
      this.registry.set('needs', needs);
    }
    this.registry.set('lastBathReward', reward);
    this.game.events.emit('bath:reward', reward); // يلتقطها نظام الحفظ/العملات
  }
}

// دعم الاستخدام كموديول أو كسكربت عادي ضمن game.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BathScene;
}
