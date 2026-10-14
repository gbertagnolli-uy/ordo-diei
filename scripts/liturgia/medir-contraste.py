# Mide el contraste (WCAG) del texto blanco sobre las fotos de las horas con el velo del Breviarium.
# Uso: dejar hora_<Hora>.jpg en el directorio actual y correr `python3 medir-contraste.py`. (Lane 147)
from PIL import Image
import sys
def lin(c):
    c/=255.0
    return c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
def alpha(t,a0,a1):
    if t<=0.4: return a0+(a1-a0)*(t/0.4)
    if t<=0.8: return a1*(1-(t-0.4)/0.4)
    return 0.0
def medir(a0,a1,zona=(0.0,0.55),ancho=0.65):
    res={}
    for h in ['Matutinum','Laudes','Prima','Tertia','Sexta','Nona','Vespera','Completorium']:
        im=Image.open(f'hora_{h}.jpg').convert('RGB').resize((250,100))
        W,H=im.size; px=im.load(); ls=[]
        for y in range(int(H*(1-zona[1])),int(H*(1-zona[0]))):
            t=1-(y+0.5)/H; al=alpha(t,a0,a1)
            for x in range(int(W*ancho)):
                r,g,b=px[x,y]; r,g,b=[v*(1-al) for v in (r,g,b)]
                ls.append(0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b))
        ls.sort(); p95=ls[int(len(ls)*0.95)]; mx=ls[-1]
        res[h]=(round(1.05/(p95+0.05),2), round(1.05/(mx+0.05),2))
    return res
if __name__=='__main__':
    a0,a1=float(sys.argv[1]),float(sys.argv[2])
    for h,(c95,cmax) in medir(a0,a1).items(): print(h,'contraste p95',c95,'peor pixel',cmax)
