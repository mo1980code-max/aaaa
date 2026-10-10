# نظام تحريك الطفل — قائمة الـ Spritesheets والإطارات (Animation Manifest)

**الكلاس:** `BabyAnimationController` (`src/animation/BabyAnimationController.js`)
**المسار:** `public/assets/baby/` — PNG شفافة (WebP اختياري بنفس الأسماء).
**البنية:** Container من ثلاث طبقات مركّبة: **جسم** (Spritesheet لكل حالة) + **عينان** + **فم** (ورقتا تعبيرات مشتركتان).

> ⚠️ **قاعدة ذهبية للرسام:** جميع إطارات أوراق الجسم تُرسم **بوجه فارغ** (بدون عينين/فم)،
> ومع **ثبات موضع الرأس** عبر كل إطارات الورقة الواحدة — لأن طبقتي العينين والفم
> تُركَّبان فوق الجسم في إحداثيات ثابتة لكل حالة.

---

## 1) أوراق الجسم (Body Spritesheets) — إطار واحد = 512×512 px

| الملف | Texture Key | عدد الإطارات | أبعاد الورقة | مفتاح الأنيميشن | FPS | Loop | وصف الحركة |
|---|---|---|---|---|---|---|---|
| `baby_body_idle.png` | `baby_body_idle` | 4 (أفقي 0→3) | 2048×512 | `baby-idle` | 6 | yoyo ∞ | وقوف + تنفس (صدر يعلو ويهبط) |
| `baby_body_sit.png` | `baby_body_sit` | 2 | 1024×512 | `baby-sit` | 3 | yoyo ∞ | جلوس هادئ + تنفس خفيف |
| `baby_body_bath_idle.png` | `baby_body_bath_idle` | 6 | 3072×512 | `baby-bath-idle` | 8 | ∞ | جلوس + تحريك اليدين على سطح الماء |
| `baby_body_washing.png` | `baby_body_washing` | 6 | 3072×512 | `baby-washing` | 10 | ∞ | فرك الذراعين/البطن بحركة دائرية |
| `baby_body_laughing.png` | `baby_body_laughing` | 4 | 2048×512 | `baby-laughing` | 10 | yoyo ∞ | اهتزاز الكتفين + رفع اليدين |
| `baby_body_rinsing.png` | `baby_body_rinsing` | 2 | 1024×512 | `baby-rinsing` | 4 | yoyo ∞ | انكماش الكتفين لأعلى (ماء يتدفق) |
| `baby_body_drying.png` | `baby_body_drying` | 4 | 2048×512 | `baby-drying` | 6 | yoyo ∞ | تمايل استرخاء بطيء داخل المنشفة |

## 2) ورقتا الوجه (Face Spritesheets)

### `baby_face_eyes.png` — Key: `baby_face_eyes` — إطار 128×64 px (ورقة 768×64، 6 إطارات)

| Index | الاسم البرمجي | الوصف |
|---|---|---|
| 0 | `EYES.OPEN` | عينان مفتوحتان عاديتان |
| 1 | `EYES.HALF` | نصف مغمضتين (استرخاء/نعاس) |
| 2 | `EYES.CLOSED` | مغمضتان (إطار الرمش) |
| 3 | `EYES.HAPPY` | قوسان سعيدان ∩∩ (ضحك) |
| 4 | `EYES.SQUEEZED` | معصورتان بقوة >< (شطف الماء) |
| 5 | `EYES.SPARKLE` | مفتوحتان مع لمعة (حماس/مفاجأة سارة) |

### `baby_face_mouth.png` — Key: `baby_face_mouth` — إطار 128×96 px (ورقة 768×96، 6 إطارات)

| Index | الاسم البرمجي | الوصف |
|---|---|---|
| 0 | `MOUTH.NEUTRAL` | فم محايد صغير |
| 1 | `MOUTH.SMILE` | ابتسامة مغلقة |
| 2 | `MOUTH.LAUGH_OPEN` | فم مفتوح ضاحك (أسنان لبنية/لسان) |
| 3 | `MOUTH.OOH` | فم دائري O (شطف/مفاجأة) |
| 4 | `MOUTH.RELAXED` | ابتسامة استرخاء ناعمة |
| 5 | `MOUTH.GIGGLE` | ضحكة مكتومة مفتوحة قليلاً |

---

## 3) جدول الحالات: ربط الجسم + التعبير + الحركة الإجرائية

| الحالة | أنيميشن الجسم | العينان | الفم | رمش تلقائي | حركة إجرائية (Tween) | ملاحظات |
|---|---|---|---|---|---|---|
| `IDLE` | `baby-idle` | OPEN | SMILE | ✅ | تنفس (scaleY) | وقوف خارج الحوض |
| `SIT` | `baby-sit` | OPEN | NEUTRAL | ✅ | تنفس خفيف | جلوس داخل الحوض قبل الماء |
| `BATH_IDLE` | `baby-bath-idle` | OPEN | SMILE | ✅ | تمايل خفيف (angle) | الحالة الافتراضية داخل الحوض |
| `SOAP_REACTION` | `baby-bath-idle` | SPARKLE → رمشة مزدوجة → HAPPY | GIGGLE | ✅ (burst) | قفزة فرح صغيرة (y) | مؤقتة — ترتد تلقائياً للحالة السابقة بعد ~1.6 ث |
| `WASHING` | `baby-washing` | HAPPY | SMILE | ❌ | تمايل متوسط | أثناء الفرك بالرغوة |
| `LAUGHING` | `baby-laughing` | HAPPY | LAUGH_OPEN | ❌ | ارتداد (bounce y) | يمكن تمرير مدة ثم ترتد تلقائياً |
| `RINSING` | `baby-rinsing` | SQUEEZED | OOH | ❌ | رجفة أفقية دقيقة (x) | عينان معصورتان طوال تدفق الماء |
| `DRYING` | `baby-drying` | HALF | RELAXED | ✅ (بطيء) | تمايل بطيء جداً | تعبير الاسترخاء بعد الحمام |

## 4) مراسي الوجه (Face Anchors) — إحداثيات نسبية لنقطة مقعد الطفل (Origin 0.5, 1)

| وضعية الجسم | مركز العينين (x, y) | مركز الفم (x, y) |
|---|---|---|
| وقوف (`IDLE`) | (0, −418) | (0, −352) |
| جلوس (كل الحالات الأخرى) | (0, −306) | (0, −240) |

> هذه القيم ثوابت قابلة للمعايرة في `FACE_ANCHORS` داخل الكلاس بعد استلام الرسوم النهائية.
