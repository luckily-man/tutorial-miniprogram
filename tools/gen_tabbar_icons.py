# -*- coding: utf-8 -*-
"""Generate tabBar PNG icons (81x81, RGBA, transparent) with pure stdlib."""
import struct, zlib, os

SIZE = 81
OUT = os.path.join(os.path.dirname(__file__), "..", "images", "tabbar")
os.makedirs(OUT, exist_ok=True)

GRAY = (153, 153, 153, 255)     # #999999
GREEN = (7, 193, 96, 255)       # #07c160 (matches nav bar)


def new_canvas():
    return [[(0, 0, 0, 0) for _ in range(SIZE)] for _ in range(SIZE)]


def set_px(c, x, y, color):
    if 0 <= x < SIZE and 0 <= y < SIZE:
        c[y][x] = color


def fill_rect(c, x0, y0, x1, y1, color):
    for y in range(int(y0), int(y1) + 1):
        for x in range(int(x0), int(x1) + 1):
            set_px(c, x, y, color)


def fill_circle(c, cx, cy, r, color):
    for y in range(int(cy - r), int(cy + r) + 1):
        for x in range(int(cx - r), int(cx + r) + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                set_px(c, x, y, color)


def fill_poly(c, pts, color):
    ys = [p[1] for p in pts]
    ymin, ymax = int(min(ys)), int(max(ys))
    n = len(pts)
    for y in range(ymin, ymax + 1):
        xs = []
        for i in range(n):
            x1, y1 = pts[i]
            x2, y2 = pts[(i + 1) % n]
            if (y1 <= y < y2) or (y2 <= y < y1):
                x = x1 + (y - y1) / (y2 - y1) * (x2 - x1)
                xs.append(x)
        xs.sort()
        for i in range(0, len(xs) - 1, 2):
            for x in range(int(xs[i]), int(xs[i + 1]) + 1):
                set_px(c, x, y, color)


def draw_home(c, color):
    # roof
    fill_poly(c, [(40, 14), (14, 40), (66, 40)], color)
    # body
    fill_rect(c, 22, 40, 58, 66, color)
    # door (cut-out)
    fill_rect(c, 35, 50, 45, 66, (0, 0, 0, 0))


def draw_upload(c, color):
    # arrow head
    fill_poly(c, [(40, 16), (24, 36), (56, 36)], color)
    # shaft
    fill_rect(c, 37, 30, 43, 56, color)
    # base line
    fill_rect(c, 24, 60, 56, 66, color)


def draw_mine(c, color):
    # head
    fill_circle(c, 40, 27, 12, color)
    # shoulders (trapezoid)
    fill_poly(c, [(22, 67), (30, 46), (50, 46), (58, 67)], color)


DRAWERS = {"home": draw_home, "upload": draw_upload, "mine": draw_mine}


def save_png(path, c):
    raw = bytearray()
    for y in range(SIZE):
        raw.append(0)
        for x in range(SIZE):
            raw += bytes(c[y][x])
    comp = zlib.compress(bytes(raw), 9)

    def chunk(typ, data):
        return (struct.pack(">I", len(data)) + typ + data +
                struct.pack(">I", zlib.crc32(typ + data) & 0xffffffff))

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", comp)
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


for name, drawer in DRAWERS.items():
    for suffix, color in (("", GRAY), ("-active", GREEN)):
        c = new_canvas()
        drawer(c, color)
        save_png(os.path.join(OUT, name + suffix + ".png"), c)
        print("written", name + suffix + ".png")
