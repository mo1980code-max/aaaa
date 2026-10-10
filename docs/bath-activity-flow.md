# دورة حياة نشاط الاستحمام — BathActivityManager

**الملف:** `src/systems/BathActivityManager.js`
**النمط:** State Machine خطية صارمة — لا قفز، لا اختصار، لا رجوع.

```
ENTER_BATH ──100%──▶ FILL_WATER ──100%──▶ APPLY_SOAP ──100%──▶ RINSE ──100%──▶ DRY ──100%──▶ COMPLETE
```

## 1) جدول الأطوار

| الطور | التفاعل المغذّي للتقدم | المدة الدنيا | سقف الحدث الواحد | سقف/ثانية | الزمن الأدنى الفعلي* | حالة الطفل |
|---|---|---|---|---|---|---|
| `ENTER_BATH` | سحب الطفل وإفلاته داخل الحوض | 0.8 ث | 100 | 100 | 0.8 ث | `SIT` |
| `FILL_WATER` | ضغط مستمر على الصنبور | 4 ث | 2.5 | 25 | 4 ث | `BATH_IDLE` |
| `APPLY_SOAP` | فرك الصابون فوق الجسم (حركات سحب) | 5 ث | 4 | 20 | 5 ث | `WASHING` |
| `RINSE` | ضغط مستمر على رأس الدش فوق الرغوة | 4 ث | 2.5 | 25 | 4 ث | `RINSING` |
| `DRY` | مسح المنشفة ذهاباً وإياباً | 3.5 ث | 5 | 30 | 3.5 ث | `DRYING` |
| `COMPLETE` | — (ختامي) | — | — | — | — | `LAUGHING` |

\* الزمن الأدنى الفعلي = الأكبر من (المدة الدنيا) و(100 ÷ سقف/ثانية) — حتى مع إدخال مثالي متواصل.

## 2) واجهة الإشارات (Events)

| الحدث | الحمولة | الاستخدام |
|---|---|---|
| `start` | — | بدء النشاط |
| `phase:enter` | `(phase, { label, interaction, babyState, index, total })` | تحديث عنوان المرحلة + تبديل حالة الطفل + تفعيل أداة التفاعل الصحيحة فقط |
| `progress` | `(phase, value0to100, acceptedDelta)` | تحريك شريط التقدم (UI Progress Bar) |
| `progress:rejected` | `(phase, reason, attemptedDelta)` | تجاهل/تسجيل محاولات غير صالحة (`wrong_phase`, `rate_limited`, `invalid_delta`, `phase_not_active`, `terminal_phase`) |
| `phase:complete` | `(phase)` | وميض احتفالي قصير قبل الانتقال |
| `activity:complete` | `({ reward: { hygiene: 60, happiness: 15, coins: 25 }, durationMs })` | تطبيق المكافأة على عدّادات اللعبة — **المصدر الوحيد لرفع النظافة** |

## 3) ضمانات منع الاختصار (Anti-Cheat)

1. **حقول خاصة `#private`** — `#progress` و`#phaseIndex` غير قابلة للقراءة أو الكتابة من خارج الكلاس؛ القراءة عبر getters فقط.
2. **بوابة وحيدة:** `reportProgress(phaseId, delta)` ترفض أي `phaseId` غير الطور الحالي — لا يمكن تغذية طور مستقبلي.
3. **قصّ ثلاثي لكل استدعاء:** `min(delta, maxDeltaPerEvent, token-bucket budget, المتبقي حتى 100)` — النقر المحموم لا يتجاوز سقف/ثانية.
4. **مدة دنيا لكل طور:** حتى لو بلغ التقدم 100% نظرياً، لا يُعتمد الاكتمال قبل انقضاء `minDurationMs`.
5. **لا Setter للتقدم ولا Skip للأطوار:** `tryAdvance()` تفشل ما لم يكن الطور مكتملاً (`#phaseFinalized`).
6. **مكافأة أحادية:** `#rewardGranted` يضمن إطلاق `activity:complete` مرة واحدة، ولا مسار يصل إلى `COMPLETE` إلا بعبور الأطوار الخمسة بالكامل.
7. **إعدادات مجمّدة:** `PHASE_ORDER` و`PHASE_CONFIG` و`ACTIVITY_REWARD` كلها `Object.freeze`.
8. **ساعة اللعبة:** الحسابات تستخدم `scene.time.now` (تتوقف مع pause) لا ساعة النظام.

## 4) مثال ربط UI (الخطوة القادمة)

```js
const activity = new BathActivityManager(this);

activity.on('phase:enter', (phase, info) => {
  ui.setTitle(info.label);
  ui.setStep(info.index + 1, info.total);
  babyController.setState(info.babyState);
});
activity.on('progress', (_phase, value) => ui.setProgress(value));
activity.on('activity:complete', ({ reward }) => gameState.applyReward(reward));

activity.start();

// من منطق الإدخال فقط — مثال: أثناء الضغط المستمر على الصنبور (كل إطار):
// activity.reportProgress(BathPhases.FILL_WATER, (delta / 1000) * 25);
```
