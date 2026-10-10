#!/usr/bin/env python3
"""
معالجة صور غرفة الاستحمام (Baby Care World) — تفريغ الخلفيات وقص الأقنعة.

يعدّل الملفات الثلاثة التالية في assets/images/ (الأصل محفوظ في سجل Git):

  1) soap.png           تفريغ الخلفية البيضاء مع حماية رغوة الصابون.
                        الرغوة البيضاء لها نفس لون الخلفية (254–255)، لذلك:
                        - تُحسب الخلفية كمنطقة بيضاء متصلة بحواف الصورة فقط؛
                        - تُستثنى من الخلفية منطقة مغلقة حول الصابون والرغوة
                          (إغلاق مورفولوجي بنصف قطر كبير) حتى لا تتسرب الخلفية
                          إلى داخل فقاعات الرغوة عبر الفجوات بين حدودها.

  2) baby_standing.png  قص الطفل الموجود على اليسار فقط (من أصل ثلاثة أطفال)،
                        وتفريغ خلفيته، كصورة مفردة مقصوصة على حدود الطفل.

  3) bathtub_front.png  قناع الواجهة الأمامية فقط: يُحذف كل ما فوق حافة
                        الواجهة الزرقاء (الحافة الوردية الداخلية والبجعة/البطة)
                        ليبقى الإطار الأمامي والأرجل، وتبقى المساحة الداخلية
                        شفافة لظهور الطفل وسطح الماء خلفها.
                        الأبعاد لا تتغير (578×432) حتى يبقى موضع العرض في اللعبة.

التشغيل (يحتاج Pillow و SciPy):
    python3 tools/process_bath_images.py
"""

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / 'assets' / 'images'

WHITE_THRESHOLD = 243      # قناة دنيا >= هذه القيمة تعتبر "أبيض" (خلفية)
SOAP_PROTECT_RADIUS = 45   # نصف قطر الإغلاق لحماية الرغوة (بكسل)


def border_connected(mask):
    """يعيد المنطقة المتصلة بحواف الصورة فقط من القناع المعطى."""
    lab, _ = ndimage.label(mask)
    edge_ids = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    edge_ids = edge_ids[edge_ids != 0]
    return np.isin(lab, edge_ids)


def disk(r):
    yy, xx = np.ogrid[-r:r + 1, -r:r + 1]
    return (xx * xx + yy * yy) <= r * r


# ---------------------------------------------------------------------------
# 1) soap.png
# ---------------------------------------------------------------------------
def process_soap():
    path = IMG / 'soap.png'
    rgb = np.array(Image.open(path).convert('RGB'))
    mn = rgb.min(axis=2)

    bg_flood = border_connected(mn >= WHITE_THRESHOLD)
    foreground = ~bg_flood
    # حماية الرغوة: كل ما يقع داخل الغلاف المغلق للصابون+الرغوة لا يُحذف
    protect = ndimage.binary_closing(foreground, structure=disk(SOAP_PROTECT_RADIUS))
    protect = ndimage.binary_fill_holes(protect | foreground)
    background = bg_flood & ~protect

    alpha = np.where(background, 0, 255).astype(np.uint8)
    out = np.dstack([rgb, alpha])
    Image.fromarray(out, 'RGBA').save(path, optimize=True)
    print(f'soap.png: خلفية مفرغة {background.mean() * 100:.1f}%')


# ---------------------------------------------------------------------------
# 2) baby_standing.png — الطفل الأيسر فقط
# ---------------------------------------------------------------------------
def process_baby_standing():
    path = IMG / 'baby_standing.png'
    src = np.array(Image.open(path).convert('RGBA'))
    h, w = src.shape[:2]

    # حدّ الطفل الأيسر: قبل بداية الطفل الأوسط (تقدّر من تحليل الأعمدة: 19–208 / 220–448 / 461–643)
    # نأخذ نطاقاً آمناً يتوقف عند منتصف الفجوة الأولى
    split_x = 214
    region = src[:, :split_x].copy()

    rgb = region[..., :3]
    alpha_in = region[..., 3]
    mn = rgb.min(axis=2)
    # الخلفية: شفافة أصلاً، أو بيضاء متصلة بالحواف
    background = (alpha_in < 10) | border_connected((mn >= WHITE_THRESHOLD) & (alpha_in >= 10))
    foreground = ~background

    # أكبر مكوّن متصل = الطفل نفسه (يستبعد أي بقايا من الطفل الأوسط)
    lab, n = ndimage.label(foreground)
    if n == 0:
        raise SystemExit('لم يُعثر على الطفل الأيسر')
    sizes = ndimage.sum(foreground, lab, index=range(1, n + 1))
    keep = lab == (int(np.argmax(sizes)) + 1)
    keep = ndimage.binary_fill_holes(keep)

    ys, xs = np.where(keep)
    margin = 4
    y0, y1 = max(0, ys.min() - margin), min(h, ys.max() + 1 + margin)
    x0, x1 = max(0, xs.min() - margin), min(split_x, xs.max() + 1 + margin)

    crop = region[y0:y1, x0:x1].copy()
    crop_keep = keep[y0:y1, x0:x1]
    crop[..., 3] = np.where(crop_keep, np.where(crop[..., 3] < 10, 255, crop[..., 3]), 0)
    # الحواف الشفافة الداخلية تُبقى كما هي؛ الخلفية المفرّغة صارت alpha=0
    Image.fromarray(crop, 'RGBA').save(path, optimize=True)
    print(f'baby_standing.png: قُصّ إلى {crop.shape[1]}×{crop.shape[0]} (الطفل الأيسر)')


# ---------------------------------------------------------------------------
# 3) bathtub_front.png — الإطار الأمامي والأرجل فقط
# ---------------------------------------------------------------------------
def process_bathtub_front():
    path = IMG / 'bathtub_front.png'
    src = np.array(Image.open(path).convert('RGBA')).astype(int)
    h, w = src.shape[:2]
    r, g, b, a = src[..., 0], src[..., 1], src[..., 2], src[..., 3]

    # جسم الواجهة الزرقاء: أزرق واضح وسط الصورة (يحدد حافة الواجهة العلوية)
    blue_body = (a > 128) & (b > r + 30) & (g > r + 20)

    keep = np.zeros((h, w), dtype=bool)
    for x in range(w):
        col = np.where(blue_body[:, x])[0]
        if col.size == 0:
            continue
        top = col[0]              # أول بكسل أزرق مباشرة (بدون هامش يسمح ببقايا الوردي)
        keep[max(0, top):, x] = True

    # الأرجل والإطار: كل ما تحت الحافة الزرقاء يبقى كما هو (بما فيه الأبيض للأرجل)
    new_alpha = np.where(keep, a, 0).astype(np.uint8)
    out = np.array(Image.open(path).convert('RGBA'))
    out[..., 3] = new_alpha
    Image.fromarray(out, 'RGBA').save(path, optimize=True)
    removed = (a > 0).sum() - (new_alpha > 0).sum()
    print(f'bathtub_front.png: أُزيل {removed} بكسل من الداخل/الفوق')


if __name__ == '__main__':
    process_soap()
    process_baby_standing()
    process_bathtub_front()
