import cv2, numpy as np, json
S = 6
im = cv2.imread('assets/logo_original.png')   # ejecutar desde la carpeta del proyecto
big = cv2.resize(im, None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC)
big = cv2.GaussianBlur(big, (0,0), 2.2)
hsv = cv2.cvtColor(big, cv2.COLOR_BGR2HSV)
H,Sa,V = hsv[...,0].astype(int), hsv[...,1].astype(int), hsv[...,2].astype(int)
red  = (((H<=9)|(H>=165)) & (Sa>95) & (V>110)).astype(np.uint8)*255
blue = ((H>=92)&(H<=128)&(Sa>90)&(V>90)).astype(np.uint8)*255
k = lambda n: cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(n,n))
red  = cv2.morphologyEx(red,  cv2.MORPH_OPEN, k(5)); blue = cv2.morphologyEx(blue, cv2.MORPH_OPEN, k(5))
h,w = red.shape
split = 385*S
moto = red.copy(); moto[:, :split] = 0
wred = red.copy(); wred[:, split:] = 0
union = cv2.morphologyEx(cv2.bitwise_or(wred, blue), cv2.MORPH_CLOSE, k(41))
white = cv2.dilate(union, k(18))
def smooth(pts, it=2):
    for _ in range(it):
        n=len(pts); out=[]
        for i in range(n):
            a,b=pts[i],pts[(i+1)%n]
            out.append(a*.75+b*.25); out.append(a*.25+b*.75)
        pts=out
    return np.array(pts)
def to_path(mask, eps=1.6, ext_only=False, minarea=60*S*S/20, sm=1):
    mode = cv2.RETR_EXTERNAL if ext_only else cv2.RETR_CCOMP
    cs,_ = cv2.findContours(mask, mode, cv2.CHAIN_APPROX_NONE)
    d=[]
    for c in cs:
        if cv2.contourArea(c) < minarea: continue
        c = cv2.approxPolyDP(c, eps, True)[:,0,:].astype(float)
        if len(c)<3: continue
        c = smooth(list(c), sm)/S
        d.append('M'+' L'.join(f'{x:.2f} {y:.2f}' for x,y in c)+'Z')
    return ''.join(d)
out = dict(w=im.shape[1], h=im.shape[0],
  white=to_path(white, ext_only=True, minarea=2000),
  red=to_path(wred), blue=to_path(blue), moto=to_path(moto, ext_only=False))
json.dump(out, open('assets/logo_paths.json','w'))
print({k:(len(v) if isinstance(v,str) else v) for k,v in out.items()})
# vista previa: blanco / rojo / azul sobre fondo oscuro
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {out['w']} {out['h']}" width="1680" height="{out['h']*3}">
<rect width="100%" height="100%" fill="#0b1630"/>
<path d="{out['white']}" fill="#fff" fill-rule="evenodd"/>
<path d="{out['red']}" fill="#e01428" fill-rule="evenodd"/>
<path d="{out['blue']}" fill="#0d6fc0" fill-rule="evenodd"/>
<path d="{out['moto']}" fill="#e01428" fill-rule="evenodd"/></svg>'''
open('assets/logo_preview.svg','w').write(svg)
