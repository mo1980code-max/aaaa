// =============================================================================
// MobileGameConfig — إعدادات Phaser للهواتف (Android متوسط المواصفات)
// -----------------------------------------------------------------------------
//   1) BathQuality : كشف مستوى الجهاز (low/mid/high) وتقنين الجسيمات والمؤثرات
//      — تقرأه أنظمة التفاعل (الصابون/الماء/المنشفة) تلقائياً.
//   2) buildBathGameConfig(scenes) : إعداد Phaser كامل:
//      - Scale.FIT + CENTER_BOTH لدقة منطقية ثابتة 1920×1080 على أي شاشة عريضة.
//      - التقاط أحداث اللمس (touch.capture = preventDefault داخل Phaser).
//      - fps target 60 / min 30 مع smoothStep.
//      - WebGL بأولوية أداء + roundPixels + تعطيل antialias على الأجهزة الضعيفة.
// =============================================================================

// ---------------------------------------------------------------------------
// 1) كشف مستوى الجهاز وتقنين الجودة
// ---------------------------------------------------------------------------
const BathQuality = (function () {
  function detectTier() {
    if (typeof navigator === 'undefined') return 'high';
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4;        // غير مدعوم في iOS => 4
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

    if (cores <= 4 || mem <= 2) return 'low';       // أندرويد اقتصادي
    if (cores <= 6 || mem <= 4 || dpr >= 3) return 'mid';
    return 'high';
  }

  const PRESETS = {
    //        فقاعات/حدث | رذاذ/دفعة | فاصل الرذاذ ms | سقف الرغوة | سقف الجزيئات الحية | antialias | نجوم الاحتفال
    low:  { bubbleQuantity: 1, sprayQuantity: 2, sprayFrequency: 60, maxFoamBlobs: 16, maxParticles: 60,  antialias: false, starCount: 10 },
    mid:  { bubbleQuantity: 2, sprayQuantity: 3, sprayFrequency: 40, maxFoamBlobs: 26, maxParticles: 120, antialias: true,  starCount: 16 },
    high: { bubbleQuantity: 2, sprayQuantity: 4, sprayFrequency: 28, maxFoamBlobs: 40, maxParticles: 200, antialias: true,  starCount: 24 }
  };

  const tier = detectTier();
  return Object.freeze(Object.assign({ tier }, PRESETS[tier]));
})();

// ---------------------------------------------------------------------------
// 2) إعداد Phaser الجاهز للهواتف
// ---------------------------------------------------------------------------
/**
 * @param {Array}  scenes            قائمة مشاهد اللعبة
 * @param {object} [overrides]       تجاوزات اختيارية فوق الإعداد الافتراضي
 * @returns {object} Phaser.Types.Core.GameConfig
 */
function buildBathGameConfig(scenes, overrides = {}) {
  const q = BathQuality;

  const config = {
    type: Phaser.AUTO,                      // WebGL مع fallback تلقائي إلى Canvas
    parent: 'game-container',
    backgroundColor: '#bfe8f7',

    // دقة منطقية ثابتة — كل إحداثيات المشاهد مبنية عليها
    width: 1920,
    height: 1080,

    scale: {
      mode: Phaser.Scale.FIT,               // ملاءمة أي شاشة مع حفظ النسبة 16:9
      autoCenter: Phaser.Scale.CENTER_BOTH, // توسيط أفقي/عمودي (أشرطة سوداء عند اللزوم)
      // ملاحظة: قفل الاتجاه الحقيقي يتطلب Fullscreen API —
      // صفحة bath.html تعرض Overlay "أدر هاتفك" في الوضع الطولي.
    },

    render: {
      antialias: q.antialias,               // يُعطَّل على الأجهزة الضعيفة (توفير Fill-rate)
      roundPixels: true,                    // تفادي عينات الكسور بين البكسلات
      powerPreference: 'high-performance',  // طلب GPU الأقوى على الأجهزة المزدوجة
      batchSize: 2048,                      // دفعات رسم أكبر = Draw Calls أقل
      transparent: false,                   // Canvas معتم أسرع في التركيب
      pixelArt: false
    },

    fps: {
      target: 60,                           // الهدف على الأجهزة القادرة
      min: 30,                              // لا تسمح بنزول خطوة الفيزياء/المنطق تحت 30
      smoothStep: true                      // تنعيم delta ضد شقشقة الإطارات
    },

    input: {
      activePointers: 3,                    // لمسات متزامنة (سحب + ضغط إضافي)
      touch: {
        capture: true                       // preventDefault داخلياً => لا تمرير/تكبير للمتصفح
      },
      smoothFactor: 0.2                     // تنعيم حركة المؤشر (فرك أنعم على اللمس)
    },

    disableContextMenu: true,               // لا قائمة يمين/ضغط مطول

    scene: scenes
  };

  return Object.assign(config, overrides);
}

// إتاحة عالمية
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BathQuality, buildBathGameConfig };
}
if (typeof window !== 'undefined') {
  window.BathQuality = BathQuality;
  window.buildBathGameConfig = buildBathGameConfig;
}
