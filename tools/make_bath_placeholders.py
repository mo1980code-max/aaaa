#!/usr/bin/env python3
"""
توليد صور PNG بديلة (Placeholders) لرسومات الحمّام في Baby Care World.

تُكتب الصور إلى assets/images/ بنفس أسماء الملفات التي تحمّلها game.js
(BATH_IMAGES)، ليتم استبدالها لاحقاً بالرسومات النهائية دون تغيير أي كود.

الأحجام = 2× حجم العرض الفعلي في اللعبة (setDisplaySize) لتبقى الصور واضحة
عند التكبير. لا تُغيّر أحجام العرض في الكود عند استبدال الصور.

الملفات:
    bathroom_bg.png     خلفية الحمام كاملة
    bathtub_back.png    الجزء الخلفي من الحوض (يُعرض فوق الطفل من الأسفل بالمسك)
    bathtub_front.png   الواجهة الأمامية للحوض (تغطي أسفل الطفل والماء)
    baby_standing.png   الطفل واقفاً خارج الحوض (قبل السحب)
    baby_character.png  الطفل جالساً داخل الحوض (بعد الإفلات)
    shower.png          رأس الدش
    soap.png            الصابون والرغوة
    towel.png           المنشفة (زينة فقط)
    bubble_particle.png جزيء فقاعة الصابون (يُعرض بأحجام مختلفة)
    water_surface.png   شريحة سطح الماء (تُمدّ أفقياً بعرض الحوض)

التشغيل (يحتاج Pillow):
    python3 tools/make_bath_placeholders.py
"""

from pathlib import Path
from math import sin, pi
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / 'assets' / 'images'

SKIN = (255, 224, 189, 255)
HAIR = (93, 64, 55, 255)
SHIRT = (79, 195, 247, 255)
SHOE = (2, 119, 189, 255)
DARK = (62, 39, 35, 255)
WHITE = (255, 255, 255, 255)
CHEEK = (255, 171, 145, 190)
MOUTH = (233, 30, 99, 255)


class Space:
    """لوحة رسم بإحداثيات تصميم (design units) تُحوَّل إلى بكسلات الصورة النهائية.

    الرسم يتم بدقة مضاعفة (supersampling) ثم يُصغَّر بـ LANCZOS لنعومة الحواف.
    """

    def __init__(self, design_w, design_h, tex_w, tex_h, ss=3):
        self.ss = ss
        self.tex_w, self.tex_h = tex_w, tex_h
        self.img = Image.new('RGBA', (tex_w * ss, tex_h * ss), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.img)
        self.sx = tex_w * ss / design_w
        self.sy = tex_h * ss / design_h
        self.k = (self.sx + self.sy) / 2

    def _box(self, x, y, w, h):
        return [x * self.sx, y * self.sy, (x + w) * self.sx, (y + h) * self.sy]

    def _pt(self, p):
        return (p[0] * self.sx, p[1] * self.sy)

    def rr(self, x, y, w, h, r, fill):
        self.d.rounded_rectangle(self._box(x, y, w, h), radius=r * self.k, fill=fill)

    def ell(self, x, y, w, h, fill):
        self.d.ellipse(self._box(x, y, w, h), fill=fill)

    def circ(self, cx, cy, r, fill):
        self.ell(cx - r, cy - r, 2 * r, 2 * r, fill)

    def arc(self, x, y, w, h, start, end, fill, width):
        self.d.arc(self._box(x, y, w, h), start, end, fill=fill, width=max(1, int(width * self.k)))

    def poly(self, points, fill):
        self.d.polygon([self._pt(p) for p in points], fill=fill)

    def line(self, points, fill, width):
        self.d.line([self._pt(p) for p in points], fill=fill, width=max(1, int(width * self.k)), joint='curve')

    def clear_below(self, design_y):
        """يمسح كل ما تحت خط التصميم (للفصل بين الجزء الخلفي والأمامي للحوض)."""
        self.img.paste((0, 0, 0, 0), (0, int(design_y * self.sy), self.img.width, self.img.height))

    def clear_above(self, design_y):
        self.img.paste((0, 0, 0, 0), (0, 0, self.img.width, int(design_y * self.sy)))

    def save(self, name):
        out = self.img.resize((self.tex_w, self.tex_h), Image.LANCZOS)
        out.save(OUT / name, optimize=True)
        print(f'wrote {name}  ({self.tex_w}x{self.tex_h})')


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(len(a)))


def make_background():
    W, H = 1920, 1080
    sp = Space(W, H, W, H, ss=1)
    floor_y = int(H * 0.74)
    top, wall_bottom = (230, 250, 253, 255), (191, 234, 245, 255)
    for y in range(floor_y):
        sp.d.line([(0, y), (W, y)], fill=lerp(top, wall_bottom, y / floor_y))
    # بلاط الجدار (خفيف)
    for x in range(0, W + 1, 160):
        sp.d.line([(x, 0), (x, floor_y)], fill=(255, 255, 255, 40), width=3)
    for y in range(0, floor_y + 1, 110):
        sp.d.line([(0, y), (W, y)], fill=(255, 255, 255, 40), width=3)
    # الأرضية
    sp.d.rectangle([0, floor_y, W, H], fill=(168, 221, 224, 255))
    for x in range(0, W + 1, 160):
        sp.d.line([(x, floor_y), (x, H)], fill=(255, 255, 255, 90), width=4)
    for y in range(floor_y, H + 1, 110):
        sp.d.line([(0, y), (W, y)], fill=(255, 255, 255, 90), width=4)
    # خط الإطار الفاصل بين الجدار والأرض
    sp.d.rectangle([0, floor_y - 6, W, floor_y + 6], fill=(255, 255, 255, 110))
    # بقع ضوء ناعمة
    sp.d.ellipse([220 - 92, 245 - 92, 220 + 92, 245 + 92], fill=(255, 255, 255, 56))
    sp.d.ellipse([W - 230 - 74, 255 - 74, W - 230 + 74, 255 + 74], fill=(255, 255, 255, 56))
    sp.save('bathroom_bg.png')


def make_tub_parts():
    # تصميم الحوض بالوحدات الأصلية (360×230) ثم تكبيره إلى 1180×756 (= 2× العرض 590×378)
    def tub(sp):
        sp.rr(0, 42, 360, 170, 28, (158, 158, 158, 255))          # الجسم الخارجي
        sp.rr(16, 56, 328, 126, 22, (224, 247, 250, 255))         # التجويف الداخلي
        sp.rr(0, 42, 360, 12, 12, (255, 255, 255, 70))            # حافة لامعة
        sp.rr(16, 56, 328, 10, 5, (120, 170, 190, 60))            # ظل داخلي أعلى التجويف
        sp.rr(0, 190, 360, 22, 10, (0, 0, 0, 34))                 # ظل الواجهة السفلية
        sp.rr(294, 2, 18, 38, 8, (176, 190, 197, 255))            # ماسورة الصنبور
        sp.circ(303, 31, 17, (176, 190, 197, 255))                # مقبض الصنبور

    back = Space(360, 230, 1180, 756)
    tub(back)
    back.clear_below(118)   # الجزء الخلفي: حتى حافة الحوض (ما فوق خط الماء/الواجهة)
    back.save('bathtub_back.png')

    front = Space(360, 230, 1180, 756)
    tub(front)
    front.clear_above(118)  # الواجهة الأمامية: تغطي أسفل جسم الطفل
    front.save('bathtub_front.png')


def draw_baby(sp, seated):
    """الطفل بتصميم 190×254 (حجم العرض في اللعبة). الجلوس: بلا ساقين، والجزء السفلي يُقصّ بحافة الحوض."""
    sp.ell(38, 20, 114, 80, HAIR)                                    # الشعر خلف الوجه
    if seated:
        sp.rr(50, 112, 90, 130, 30, SHIRT)                           # الجذع داخل الماء
    else:
        sp.rr(52, 112, 86, 92, 26, SHIRT)                            # القميص
        sp.rr(60, 190, 30, 44, 14, SKIN)                             # الساقان
        sp.rr(100, 190, 30, 44, 14, SKIN)
        sp.rr(54, 224, 42, 24, 12, SHOE)                             # الحذاءان
        sp.rr(96, 224, 42, 24, 12, SHOE)
    sp.rr(26, 124, 28, 74, 14, SKIN)                                 # الذراعان
    sp.rr(136, 124, 28, 74, 14, SKIN)
    sp.circ(38, 100, 10, SKIN)                                       # الأذنان
    sp.circ(152, 100, 10, SKIN)
    sp.circ(95, 98, 58, SKIN)                                        # الوجه
    sp.circ(95, 40, 12, HAIR)                                        # خصلة شعر
    sp.circ(76, 100, 9, DARK)                                        # العينان
    sp.circ(114, 100, 9, DARK)
    sp.circ(79, 96, 3, WHITE)
    sp.circ(117, 96, 3, WHITE)
    sp.ell(48, 112, 22, 14, CHEEK)                                   # الخدّان
    sp.ell(120, 112, 22, 14, CHEEK)
    sp.arc(80, 110, 30, 20, 20, 160, MOUTH, 3)                       # الابتسامة


def make_baby():
    sp = Space(190, 254, 380, 508)
    draw_baby(sp, seated=False)
    sp.save('baby_standing.png')

    sp = Space(190, 254, 380, 508)
    draw_baby(sp, seated=True)
    sp.save('baby_character.png')


def make_bubble():
    sp = Space(128, 128, 128, 128)
    sp.circ(64, 64, 60, (200, 240, 255, 70))                         # جسم الفقاعة الشفاف
    sp.arc(6, 6, 116, 116, 0, 360, (255, 255, 255, 200), 5)          # الحافة اللامعة
    sp.ell(26, 22, 28, 16, (255, 255, 255, 230))                     # الانعكاس
    sp.circ(90, 86, 6, (255, 255, 255, 160))
    sp.save('bubble_particle.png')


def make_water_surface():
    # 520×24 بالتصميم = 2× عرض الحوض الداخلي وارتفاع الشريحة في اللعبة
    sp = Space(520, 24, 1040, 48)
    wave = [(x, 9 + 3.5 * sin(x / 520 * 2 * pi * 3)) for x in range(0, 521, 8)]
    sp.poly(wave + [(520, 24), (0, 24)], (178, 235, 247, 150))       # جسم الشريحة
    sp.line(wave, (255, 255, 255, 230), 3)                           # خط الموجة اللامع
    sp.save('water_surface.png')


def make_shower():
    sp = Space(120, 150, 240, 300)
    sp.rr(52, 0, 16, 62, 6, (144, 164, 174, 255))
    sp.ell(12, 64, 96, 56, (176, 190, 197, 255))
    for i in range(5):
        sp.circ(30 + i * 15, 100, 4, (120, 144, 156, 255))
    sp.save('shower.png')


def make_soap():
    sp = Space(90, 66, 288, 212)
    sp.rr(6, 25, 72, 36, 13, (206, 147, 216, 255))
    sp.rr(14, 29, 40, 8, 4, (255, 255, 255, 90))
    sp.circ(61, 15, 11, (255, 255, 255, 200))
    sp.circ(76, 27, 8, (255, 255, 255, 200))
    sp.circ(48, 10, 7, (255, 255, 255, 200))
    sp.save('soap.png')


def make_towel():
    sp = Space(150, 170, 300, 340)
    sp.rr(10, 8, 130, 14, 7, (144, 164, 174, 255))            # قضيب المناشف
    sp.rr(30, 20, 90, 125, 14, (255, 183, 77, 255))           # المنشفة
    sp.rr(30, 118, 90, 14, 6, (255, 152, 0, 255))
    sp.rr(30, 140, 90, 14, 6, (255, 152, 0, 255))
    sp.rr(60, 12, 30, 12, 6, (144, 164, 174, 255))            # حلقة التعليق
    sp.save('towel.png')


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    make_background()
    make_tub_parts()
    make_baby()
    make_bubble()
    make_water_surface()
    make_shower()
    make_soap()
    make_towel()
