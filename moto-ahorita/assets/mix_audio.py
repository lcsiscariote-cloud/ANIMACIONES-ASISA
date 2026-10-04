"""Mezcla muestras reales CC0 (sonidos/, paquete uisfx) sobre la base de audio sintetizada ?lite y
remezcla el audio del MP4 sin volver a renderizar el video.
Uso: python3 assets/mix_audio.py   (requiere dist/anim.html, dist/asisa_ahorita.mp4, ffmpeg, Playwright, numpy)"""
import base64, subprocess, sys, tempfile
from pathlib import Path
import numpy as np
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parent.parent; SR = 44100; DUR = 20.0
tmp = Path(tempfile.mkdtemp(prefix='mix_'))

# 1) base sintetizada (modo lite)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 540, 'height': 960})
    pg.goto((ROOT / 'dist/anim.html').as_uri() + '?capture&lite'); pg.wait_for_function('window.__anim'); pg.wait_for_timeout(1200)
    (tmp / 'base.wav').write_bytes(base64.b64decode(pg.evaluate('window.__anim.renderAudio()'))); b.close()

def load(path):
    out = tmp / (Path(path).stem + '.f32')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(path), '-f', 'f32le', '-ac', '2', '-ar', str(SR), str(out)], check=True)
    return np.fromfile(out, dtype='<f4').reshape(-1, 2)
base = load(tmp / 'base.wav'); mix = np.zeros((int(SR * DUR), 2), dtype=np.float32); mix[:len(base)] += base[:len(mix)]

def put(t, name, gain=1.0, pan=0.0, rate=1.0, hp=None):
    s = load(ROOT / 'sonidos' / f'{name}.mp3')
    if rate != 1.0:                                   # cambio de tono por remuestreo
        n = int(len(s) / rate); idx = np.linspace(0, len(s) - 1, n); s = np.stack([np.interp(idx, np.arange(len(s)), s[:, c]) for c in (0, 1)], 1)
    l, r = np.sqrt(.5 * (1 - pan)), np.sqrt(.5 * (1 + pan)); s = s * np.array([l, r]) * gain * 1.4
    i = int(t * SR); e = min(len(mix), i + len(s))
    if i < len(mix): mix[i:e] += s[:e - i].astype(np.float32)

# 2) cues: (segundo, muestra, ganancia, pan, tono)
CUES = [
  # gancho / abandono: golpes de texto
  (0.00, 'cinematic_drop', .55, 0, .9), (2.00, 'cinematic_drop', .8, 0, .85), (2.50, 'rubber_drop', .6, 0, .9), (3.50, 'rubber_drop', .6, 0, .85),
  (4.50, 'rubber_drop', .65, 0, .8), (5.50, 'cinematic_drop', .7, 0, .8),
  (0.15, 'studio_typing', .25, .2, 1.0),
  # barridos de marca
  (6.80, 'cinematic_swipe', .5, .6, 1.0), (9.80, 'studio_swipe', .55, .5, .9), (13.80, 'cinematic_swipe', .55, .6, 1.0), (19.60, 'studio_swipe', .5, .4, .8),
  # llegada
  (7.50, 'cinematic_drop', .9, 0, .8), (7.52, 'studio_level-up', .35, 0, 1.0), (8.00, 'mechanical_check', .3, -.4, .9),
  # refacciones: cada pieza encaja (clic mecánico + nota ascendente real)
  (10.25, 'cinematic_drop', .7, 0, .85),
  (10.50, 'mechanical_lock', .9, .4, 1.0), (11.00, 'mechanical_lock', .9, -.4, .93), (11.50, 'mechanical_snap', .9, .1, 1.0),
  (12.00, 'studio_snap', .9, -.2, .9), (12.50, 'mechanical_lock', .9, 0, 1.08),
  (10.50, 'studio_check', .35, .4, 1.0), (11.00, 'studio_check', .35, -.4, 1.12), (11.50, 'studio_check', .35, .1, 1.26), (12.00, 'studio_check', .35, -.2, 1.5), (12.50, 'studio_check', .35, 0, 1.68),
  # pintura nueva + remate
  (13.00, 'studio_level-up', .7, 0, 1.0), (13.50, 'cinematic_complete', .8, 0, 1.0), (13.50, 'glass_success', .35, 0, 1.0),
  # cierre
  (14.00, 'cinematic_achievement', 1.0, 0, 1.0), (14.50, 'rubber_snap', .6, 0, .9), (15.20, 'studio_snap', .6, 0, 1.0),
  (16.50, 'cinematic_drop', .8, 0, .85), (16.52, 'cinematic_level-up', .5, 0, 1.0), (17.00, 'cinematic_lock', .8, 0, .9), (17.02, 'glass_notification', .45, .1, 1.0),
  (17.50, 'glass_notification', .2, -.5, 1.4), (18.10, 'glass_notification', .2, .5, 1.6), (18.70, 'glass_notification', .2, 0, 1.3),
]
for c in CUES: put(*c)
np.array(mix, dtype='<f4').tofile(tmp / 'mix.f32')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', str(tmp / 'mix.f32'),
                '-af', 'highpass=f=35,loudnorm=I=-14:TP=-1.5:LRA=9,afade=t=in:d=0.008,afade=t=out:st=19.99:d=0.008', '-ar', '48000', str(tmp / 'final.wav')], check=True)
src = ROOT / 'dist/asisa_ahorita.mp4'; out = ROOT / 'dist/asisa_ahorita_v2.mp4'
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(src), '-i', str(tmp / 'final.wav'), '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', str(out)], check=True)
print('listo:', out, out.stat().st_size // 1024, 'KB')
