#!/usr/bin/env python3
"""
توليد صور PNG بديلة (Placeholders) لرسومات الحمّام في Baby Care World.

تُكتب الصور إلى assets/images/ بنفس أسماء الملفات التي تحمّلها game.js،
ليتم استبدالها لاحقاً بالرسومات النهائية دون تغيير أي كود.

الأحجام = 2× حجم العرض الفعلي في اللعبة (setDisplaySize) لتبقى الصور واضحة
عند التكبير. لا تُغيّر أحجام العرض في الكود عند استبدال الصور.

التشغيل (يحتاج Pillow):
    python3 tools/make_bath_placeholders.py
"""

from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / 'assets' / 'images'


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

    def rr(self, x, y, w, h, r, fill):
        self.d.rounded_rectangle(self._box(x, y, w, h), radius=r * self.k, fill=fill)

    def ell(self, x, y, w, h, fill):
        self.d.ellipse(self._box(x, y, w, h), fill=fill)

    def circ(self, cx, cy, r, fill):
        self.ell(cx - r, cy - r, 2 * r, 2 * r, fill)

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
    make_shower()
    make_soap()
    make_towel()
