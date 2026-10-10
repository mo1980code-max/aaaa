// =============================================================================
// PlaceholderAssets — أصول مؤقتة مولّدة بالكود (للتطوير والمعاينة فقط)
// -----------------------------------------------------------------------------
// يولّد كل Textures غرفة الحمام + أوراق تحريك الطفل عبر Canvas 2D
// بنفس المفاتيح والأبعاد المحددة في:
//   docs/bath-assets-manifest.md + docs/baby-animation-manifest.md
// بحيث يعمل المشهد كاملاً قبل وصول الرسوم النهائية.
// عند وضع ملفات PNG الحقيقية في public/assets/ ستُستخدم تلقائياً
// (التوليد يحدث فقط إذا كان المفتاح غير موجود، والتحميل يتخطى الموجود).
// =============================================================================

const PlaceholderAssets = {

  /** تُستدعى في بداية preload() قبل أوامر التحميل. */
  install(scene) {
    const tm = scene.textures;
    const mk = (key, w, h, draw) => {
      if (tm.exists(key)) return;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      tm.addCanvas(key, c);
    };
    const mkSheet = (key, fw, fh, frames, drawFrame) => {
      if (tm.exists(key)) return;
      const c = document.createElement('canvas');
      c.width = fw * frames; c.height = fh;
      const ctx = c.getContext('2d');
      for (let i = 0; i < frames; i++) {
        ctx.save(); ctx.translate(i * fw, 0);
        ctx.beginPath(); ctx.rect(0, 0, fw, fh); ctx.clip();
        drawFrame(ctx, i, fw, fh);
        ctx.restore();
      }
      const tex = tm.addCanvas(key, c);
      for (let i = 0; i < frames; i++) tex.add(i, 0, i * fw, 0, fw, fh);
    };

    // ========================== أصول الغرفة ================================
    mk('bath_bg', 1920, 1080, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#cdeefb'); g.addColorStop(0.62, '#aadcf2'); g.addColorStop(0.63, '#8fcbe8'); g.addColorStop(1, '#79b9dc');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 4;        // بلاط
      for (let i = 0; i <= w; i += 160) { x.beginPath(); x.moveTo(i, h * 0.63); x.lineTo(i, h); x.stroke(); }
      for (let j = h * 0.63; j <= h; j += 110) { x.beginPath(); x.moveTo(0, j); x.lineTo(w, j); x.stroke(); }
      x.fillStyle = 'rgba(255,255,255,0.5)'; this._rr(x, 1480, 120, 330, 240, 24); // نافذة
      x.fillStyle = 'rgba(135,206,235,0.8)'; this._rr(x, 1500, 140, 290, 200, 16);
    });

    mk('tub_back', 1200, 420, (x) => {
      x.fillStyle = '#e8f6fb'; this._rr(x, 20, 30, 1160, 370, 70);
      x.fillStyle = 'rgba(120,170,200,0.35)'; this._rr(x, 50, 70, 1100, 310, 60); // ظل داخلي
    });

    mk('water_surface', 1100, 220, (x, w, h) => {
      x.fillStyle = 'rgba(120,205,245,0.9)';
      x.beginPath(); x.ellipse(w / 2, h / 2, w / 2 - 8, h / 2 - 10, 0, 0, Math.PI * 2); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = 6;
      for (let i = 0; i < 5; i++) { x.beginPath(); x.ellipse(160 + i * 200, 80 + (i % 2) * 50, 56, 14, 0, 0, Math.PI); x.stroke(); }
    });

    mk('tub_front', 1240, 380, (x) => {
      x.fillStyle = '#ffffff'; this._rr(x, 10, 10, 1220, 310, 80);
      x.fillStyle = '#ffd9e8'; this._rr(x, 10, 150, 1220, 90, 40);               // شريط زخرفي
      x.fillStyle = '#cfd8dc';                                                    // أرجل
      this._rr(x, 150, 320, 90, 55, 18); this._rr(x, 1000, 320, 90, 55, 18);
      x.fillStyle = 'rgba(0,0,0,0.06)'; this._rr(x, 10, 10, 1220, 50, 40);        // حافة علوية
    });

    mk('faucet', 220, 260, (x) => {
      x.fillStyle = '#b0bec5';
      this._rr(x, 90, 120, 44, 130, 16);                                          // عمود
      x.fillStyle = '#90a4ae';
      this._rr(x, 30, 60, 160, 56, 26);                                           // ذراع أفقي
      this._rr(x, 30, 96, 48, 70, 16);                                            // فوهة
      x.fillStyle = '#eceff1'; x.beginPath(); x.arc(160, 44, 30, 0, Math.PI * 2); x.fill(); // مقبض
    });

    mk('shower_head', 260, 320, (x) => {
      x.fillStyle = '#90a4ae'; this._rr(x, 112, 10, 34, 150, 14);                 // ذراع
      x.fillStyle = '#b0bec5'; x.beginPath(); x.ellipse(130, 210, 95, 62, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#78909c';
      for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) {                   // ثقوب
        x.beginPath(); x.arc(70 + i * 24, 230 + r * 22, 5, 0, Math.PI * 2); x.fill();
      }
    });

    mk('soap_bar', 160, 120, (x) => {
      x.fillStyle = '#f48fb1'; x.beginPath(); x.ellipse(80, 60, 72, 48, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.65)'; x.beginPath(); x.ellipse(58, 42, 26, 13, -0.5, 0, Math.PI * 2); x.fill();
    });

    mk('towel', 300, 260, (x) => {
      x.fillStyle = '#90a4ae'; this._rr(x, 10, 10, 280, 22, 10);                  // قضيب
      x.fillStyle = '#ffb74d'; this._rr(x, 50, 26, 200, 210, 18);                 // منشفة
      x.fillStyle = '#ff9800'; this._rr(x, 50, 150, 200, 26, 8); this._rr(x, 50, 195, 200, 26, 8);
    });

    mk('bubble_particle', 64, 64, (x) => {
      const g = x.createRadialGradient(26, 24, 4, 32, 32, 30);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.55, 'rgba(225,245,255,0.55)');
      g.addColorStop(1, 'rgba(190,230,250,0.15)');
      x.fillStyle = g; x.beginPath(); x.arc(32, 32, 29, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.95)'; x.beginPath(); x.ellipse(22, 19, 8, 5, -0.6, 0, Math.PI * 2); x.fill();
    });

    mk('star_particle', 64, 64, (x) => {
      x.fillStyle = '#FFD54F'; x.strokeStyle = '#FFA000'; x.lineWidth = 3;
      x.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 28 : 12;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        x[i === 0 ? 'moveTo' : 'lineTo'](32 + r * Math.cos(a), 32 + r * Math.sin(a));
      }
      x.closePath(); x.fill(); x.stroke();
    });

    // ===================== أوراق جسم الطفل (512×512/إطار) ===================
    const SHEETS = [
      ['baby_body_idle',      4, 'stand', 'idle'],
      ['baby_body_sit',       2, 'sit',   'sit'],
      ['baby_body_bath_idle', 6, 'sit',   'paddle'],
      ['baby_body_washing',   6, 'sit',   'scrub'],
      ['baby_body_laughing',  4, 'sit',   'bounce'],
      ['baby_body_rinsing',   2, 'sit',   'shrug'],
      ['baby_body_drying',    4, 'sit',   'wrap']
    ];
    SHEETS.forEach(([key, frames, pose, variant]) => {
      mkSheet(key, 512, 512, frames, (x, i) => this._drawBaby(x, pose, variant, i, frames));
    });

    // ========================= ورقتا الوجه ==================================
    mkSheet('baby_face_eyes', 128, 64, 6, (x, i) => this._drawEyes(x, i));
    mkSheet('baby_face_mouth', 128, 96, 6, (x, i) => this._drawMouth(x, i));
  },

  // --------------------------------------------------------------------------
  // أدوات رسم داخلية
  // --------------------------------------------------------------------------
  _rr(x, px, py, w, h, r) {
    x.beginPath();
    x.moveTo(px + r, py);
    x.arcTo(px + w, py, px + w, py + h, r);
    x.arcTo(px + w, py + h, px, py + h, r);
    x.arcTo(px, py + h, px, py, r);
    x.arcTo(px, py, px + w, py, r);
    x.closePath(); x.fill();
  },

  /** جسم الطفل بوجه فارغ ورأس ثابت الموضع (قاعدة الـ Manifest الذهبية). */
  _drawBaby(x, pose, variant, i, frames) {
    const t = (i / frames) * Math.PI * 2;      // طور الحركة
    const SKIN = '#ffd9b3', SUIT = '#aed9f7', HAIR = '#8d6e63';
    const stand = pose === 'stand';
    const headY = stand ? 112 : 206;           // يطابق FACE_ANCHORS (ثابت عبر الإطارات)
    const bob = variant === 'bounce' ? Math.sin(t) * 10 : 0;
    const shrug = variant === 'shrug' ? -10 : 0;

    // الجذع
    x.fillStyle = variant === 'wrap' ? '#ffb74d' : SUIT;  // ملفوف بالمنشفة عند التجفيف
    const torsoY = (stand ? 190 : 288) + shrug + bob;
    const torsoH = stand ? 250 : 184 + (variant === 'idle' ? Math.sin(t) * 4 : 0);
    this._rr(x, 256 - 110, torsoY, 220, torsoH, 60);

    // الساقان (وقوفاً فقط — جالساً تُخفيهما مياه الحوض وخط القص)
    if (stand) {
      x.fillStyle = SKIN;
      this._rr(x, 256 - 86, 420, 62, 86, 28);
      this._rr(x, 256 + 24, 420, 62, 86, 28);
    }

    // الذراعان — هما مسرح الحركة الأساسي
    x.strokeStyle = SKIN; x.lineWidth = 52; x.lineCap = 'round';
    const sy = torsoY + 46;
    let a = 0, lift = 0;
    if (variant === 'paddle') a = Math.sin(t) * 28;
    if (variant === 'scrub') a = Math.cos(t) * 36;
    if (variant === 'bounce') lift = -70;
    if (variant === 'shrug' || variant === 'wrap') lift = -8;
    x.beginPath(); x.moveTo(256 - 100, sy); x.lineTo(256 - 165 + a, sy + 86 + lift); x.stroke();
    x.beginPath(); x.moveTo(256 + 100, sy); x.lineTo(256 + 165 - a, sy + 86 + lift); x.stroke();

    // الرأس (ثابت — لا يتأثر بالحركة حتى تلتصق طبقات الوجه)
    x.fillStyle = SKIN;
    x.beginPath(); x.arc(256, headY, stand ? 78 : 82, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(256 - 80, headY + 6, 18, 0, Math.PI * 2); x.fill();  // أذنان
    x.beginPath(); x.arc(256 + 80, headY + 6, 18, 0, Math.PI * 2); x.fill();
    x.strokeStyle = HAIR; x.lineWidth = 10;                                    // خصلة شعر
    x.beginPath(); x.arc(256, headY - 74, 22, Math.PI * 0.9, Math.PI * 1.9); x.stroke();
    x.fillStyle = 'rgba(244,143,177,0.45)';                                    // خدان
    x.beginPath(); x.arc(256 - 52, headY + 28, 14, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(256 + 52, headY + 28, 14, 0, Math.PI * 2); x.fill();
  },

  _drawEyes(x, i) {
    const L = 40, R = 88, Y = 32;
    const openEye = (cx, pupil = true, big = false) => {
      x.fillStyle = '#fff'; x.beginPath(); x.ellipse(cx, Y, big ? 17 : 15, big ? 19 : 17, 0, 0, Math.PI * 2); x.fill();
      if (pupil) { x.fillStyle = '#4e342e'; x.beginPath(); x.arc(cx, Y + 2, 8, 0, Math.PI * 2); x.fill(); }
    };
    x.strokeStyle = '#4e342e'; x.lineWidth = 6; x.lineCap = 'round';
    switch (i) {
      case 0: openEye(L); openEye(R); break;                                    // OPEN
      case 1: openEye(L); openEye(R);                                           // HALF
        x.fillStyle = '#ffd9b3'; x.fillRect(L - 18, Y - 20, 36, 18); x.fillRect(R - 18, Y - 20, 36, 18); break;
      case 2:                                                                    // CLOSED
        [L, R].forEach(c => { x.beginPath(); x.arc(c, Y - 4, 13, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke(); }); break;
      case 3:                                                                    // HAPPY ∩∩
        [L, R].forEach(c => { x.beginPath(); x.arc(c, Y + 6, 13, 1.15 * Math.PI, 1.85 * Math.PI); x.stroke(); }); break;
      case 4:                                                                    // SQUEEZED ><
        [[L, 1], [R, -1]].forEach(([c, d]) => {
          x.beginPath(); x.moveTo(c - 12 * d, Y - 10); x.lineTo(c + 10 * d, Y); x.lineTo(c - 12 * d, Y + 10); x.stroke();
        }); break;
      case 5: openEye(L, true, true); openEye(R, true, true);                   // SPARKLE
        x.fillStyle = '#fff';
        [L, R].forEach(c => { x.beginPath(); x.arc(c - 5, Y - 5, 4, 0, Math.PI * 2); x.fill(); }); break;
    }
  },

  _drawMouth(x, i) {
    const C = 64, Y = 42;
    x.strokeStyle = '#4e342e'; x.lineWidth = 6; x.lineCap = 'round';
    switch (i) {
      case 0: x.beginPath(); x.moveTo(C - 12, Y + 6); x.lineTo(C + 12, Y + 6); x.stroke(); break;      // NEUTRAL
      case 1: x.beginPath(); x.arc(C, Y - 4, 20, 0.2 * Math.PI, 0.8 * Math.PI); x.stroke(); break;      // SMILE
      case 2:                                                                                           // LAUGH_OPEN
        x.fillStyle = '#7b2c3b'; x.beginPath(); x.arc(C, Y, 26, 0, Math.PI); x.closePath(); x.fill();
        x.fillStyle = '#ef7d8e'; x.beginPath(); x.ellipse(C, Y + 14, 14, 9, 0, Math.PI, 0); x.fill(); break;
      case 3: x.fillStyle = '#7b2c3b'; x.beginPath(); x.ellipse(C, Y + 4, 12, 16, 0, 0, Math.PI * 2); x.fill(); break; // OOH
      case 4: x.beginPath(); x.arc(C, Y, 15, 0.25 * Math.PI, 0.75 * Math.PI); x.stroke(); break;        // RELAXED
      case 5: x.fillStyle = '#7b2c3b'; x.beginPath(); x.ellipse(C, Y + 4, 16, 10, 0, 0, Math.PI); x.fill(); break;     // GIGGLE
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlaceholderAssets;
}
if (typeof window !== 'undefined') {
  window.PlaceholderAssets = PlaceholderAssets;
}
