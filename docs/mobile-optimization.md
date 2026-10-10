# تكييف غرفة الاستحمام لهواتف Android (هدف 30–60 FPS)

**الملفات:** `src/config/MobileGameConfig.js` + `bath.html`

## 1) اللمس ومنع سلوك المتصفح الافتراضي

| الطبقة | الآلية |
|---|---|
| Phaser | `input.touch.capture = true` → `preventDefault` داخلي على أحداث اللمس |
| CSS | `touch-action: none` + `overscroll-behavior: none` + `user-select: none` على `html, body` |
| JS | مستمعات `touchmove / gesturestart / dblclick` بـ `{ passive: false }` + `preventDefault` (حزام أمان لـ iOS Safari) |
| Viewport | `maximum-scale=1.0, user-scalable=no, viewport-fit=cover` |
| أخرى | `disableContextMenu: true` + `activePointers: 3` للمس المتعدد + `smoothFactor: 0.2` لتنعيم الفرك |

## 2) الشاشات العريضة والتجاوب

- دقة منطقية ثابتة **1920×1080** مع `Phaser.Scale.FIT` + `CENTER_BOTH` — كل إحداثيات المشاهد تبقى صحيحة على أي شاشة.
- الوضع الطولي: Overlay «أدر هاتفك 📱» عبر `@media (orientation: portrait)`، مع محاولة `screen.orientation.lock('landscape')` عند أول لمسة (حيث تدعمها المنصة).
- إيقاف حلقة اللعبة عند إخفاء التبويب (`game.loop.sleep/wake`) لتوفير البطارية.

## 3) ميزانية الأداء — نظام Quality Tiers

`BathQuality` يكشف مستوى الجهاز (الأنوية + الذاكرة + DPR) ويقنّن المؤثرات؛ **كل أنظمة التفاعل تقرأه تلقائياً**:

| الإعداد | low | mid | high |
|---|---|---|---|
| فقاعات لكل حدث فرك | 1 | 2 | 2 |
| رذاذ الدش (دفعة / فاصل ms) | 2 / 60 | 3 / 40 | 4 / 28 |
| سقف فقاعات الرغوة الدائمة | 16 | 26 | 40 |
| `maxAliveParticles` لكل باعث | 60 | 120 | 200 |
| `antialias` | ❌ | ✅ | ✅ |
| نجوم الاحتفال | 10 | 16 | 24 |

إجراءات إضافية مدمجة:
- `fps: { target: 60, min: 30, smoothStep: true }` — منطق اللعبة لا ينزل تحت خطوة 30.
- `roundPixels: true` + `powerPreference: 'high-performance'` + `batchSize: 2048` + Canvas معتم.
- الجسيمات تُطلق **فقط** عند تقدم مقبول (`accepted > 0`) — لا باعث يعمل في الخلفية بلا سبب.
- الاحتفال النهائي = 3 دفعات `explode()` صغيرة بدل انفجار واحد ثقيل.
- أصول بلا شفافية (الخلفية) قابلة للتصدير WebP لتقليل ذاكرة GPU والتحميل.

## 4) المعاينة

`bath.html` تشغّل الغرفة كاملة بأصول Placeholder مولّدة بالكود (`src/dev/PlaceholderAssets.js`) — عند وضع ملفات PNG الحقيقية في `public/assets/` تُستخدم تلقائياً دون أي تعديل كود.
