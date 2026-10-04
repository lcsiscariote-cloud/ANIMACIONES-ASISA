"""Renderiza dist/anim.html → MP4 vertical 1080×1920 (JPEG por cuadro, mucho más rápido que PNG con grano).
Uso: python3 assets/render_mp4.py [salida.mp4]"""
import base64, subprocess, sys, shutil, tempfile, time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parent.parent
out = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / 'dist/asisa_ahorita.mp4')
FPS = 30; tmp = Path(tempfile.mkdtemp(prefix='asisa_'))
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 540, 'height': 960})
    pg.on('pageerror', lambda e: print('ERR', e))
    pg.goto((ROOT / 'dist/anim.html').as_uri() + '?capture'); pg.wait_for_function('window.__anim'); pg.wait_for_timeout(1500)
    dur = pg.evaluate('window.__anim.duration'); n = round(dur * FPS); t0 = time.time()
    for i in range(n):
        d = pg.evaluate(f'(async()=>{{ await window.__anim.seek({i / FPS}); return window.__anim.canvas.toDataURL("image/jpeg", .94); }})()')
        (tmp / f'f{i:05d}.jpg').write_bytes(base64.b64decode(d.split(',')[1]))
        if i % 60 == 0: print(f'  {i}/{n}  {time.time() - t0:.0f}s', flush=True)
    wavb64 = pg.evaluate('window.__anim.renderAudio()'); (tmp / 'a.wav').write_bytes(base64.b64decode(wavb64)); b.close()
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', str(tmp / 'f%05d.jpg'), '-i', str(tmp / 'a.wav'),
                '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'slow', '-tune', 'animation', '-c:a', 'aac', '-b:a', '192k',
                '-movflags', '+faststart', '-shortest', str(out)], check=True)
shutil.copy(tmp / 'a.wav', out.with_suffix('.wav')); shutil.rmtree(tmp, ignore_errors=True)
print('listo:', out, out.stat().st_size // 1024, 'KB')
