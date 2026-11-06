#!/usr/bin/env python3
"""Cria ícones Android do Fall Jump a partir de um desenho original em Pillow.

Uso no CI: python scripts/generate_android_icons.py
Não altera o package name, a chave nem o versionCode.
"""
from pathlib import Path
from math import pi, sin, cos
import re
from PIL import Image, ImageDraw, ImageFilter

SIZE = 768
ROOT = Path(__file__).resolve().parent.parent
RES = ROOT / "android" / "app" / "src" / "main" / "res"


def draw_icon():
    s = SIZE
    background = Image.new("RGBA", (s, s), (240, 247, 250, 255))
    bg = ImageDraw.Draw(background)
    for y in range(s):
        t = y / s
        bg.line((0, y, s, y), fill=(int(242 - 13*t), int(249 - 10*t), int(250 - 7*t), 255))
    # A arte principal é mantida separada para o ícone adaptativo.
    art = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(art, "RGBA")
    # Sombra difusa sobre o fundo e haste vertical clara atrás do disco.
    shadow = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse((132, 590, 643, 748), fill=(36, 66, 84, 55))
    background.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(24)))
    d.rounded_rectangle((356, 108, 436, 662), radius=26, fill=(222, 229, 234, 255))
    d.rounded_rectangle((360, 105, 425, 662), radius=24, fill=(255, 255, 255, 255))
    d.rectangle((376, 120, 387, 650), fill=(242, 245, 247, 255))
    # Disco rosa com borda lateral verde escura, um segmento aberto e centro vazado.
    cx, cy, rx, ry, irx, iry = 396, 527, 276, 133, 89, 47
    n = 96
    for j in range(n):
        a, b = 2*pi*j/n, 2*pi*(j+1)/n
        mid = (a+b)/2
        if 0.38 < mid < 1.02:
            continue
        def pt(theta, rxf, ryf, dy=0):
            return (int(cx+sin(theta)*rxf), int(cy+cos(theta)*ryf+dy))
        outer = [pt(a,rx,ry),pt(b,rx,ry)]
        inner = [pt(b,irx,iry),pt(a,irx,iry)]
        # Lateral visível na parte frontal.
        if cos(mid) > 0:
            d.polygon([outer[0],outer[1],pt(b,rx,ry,27),pt(a,rx,ry,27)], fill=(37, 129, 73, 255))
        tone = max(0, cos(mid))
        pink = (min(255,int(241+12*tone)), int(69+30*tone), int(105+18*tone),255)
        d.polygon(outer+inner, fill=pink)
    # Sementes discretas no disco.
    for k in range(10):
        a = k*2*pi/10+0.11
        if 0.28<a<1.13:
            continue
        x = cx+sin(a)*184
        y = cy+cos(a)*90
        d.ellipse((x-3,y-6,x+3,y+6),fill=(78,39,58,180))
    # Bola verde melancia com reflexo, desenhada na frente da haste.
    ball_box=(298,213,488,403)
    d.ellipse((302,223,492,412),fill=(21,94,47,90))
    d.ellipse(ball_box,fill=(62,174,69,255))
    d.ellipse((321,231,467,365),fill=(83,204,74,255))
    d.ellipse((336,233,391,275),fill=(188,249,136,120))
    mask=Image.new("L",(s,s),0)
    ImageDraw.Draw(mask).ellipse(ball_box,fill=255)
    stripes=Image.new("RGBA",(s,s),(0,0,0,0))
    st=ImageDraw.Draw(stripes,"RGBA")
    for offset in (-58,-29,5,39,71):
        coords=[]
        for q in range(27):
            t=q/26
            y=213+190*t
            x=392+offset*(.65+.40*sin(pi*t))+11*sin(t*pi*1.3+offset/23)
            coords.append((x,y))
        st.line(coords,fill=(18,102,47,170),width=10,joint="curve")
    stripes.putalpha(Image.composite(stripes.getchannel("A"),Image.new("L",(s,s),0),mask))
    art.alpha_composite(stripes)
    background.alpha_composite(art)
    return background, art


def main():
    image, foreground = draw_icon()
    densities={"mdpi":48,"hdpi":72,"xhdpi":96,"xxhdpi":144,"xxxhdpi":192}
    for density, px in densities.items():
        folder=RES / ("mipmap-"+density)
        folder.mkdir(parents=True, exist_ok=True)
        final=image.resize((px,px),Image.Resampling.LANCZOS).convert("RGB")
        final.save(folder/"ic_launcher.png")
        final.save(folder/"ic_launcher_round.png")
        # O centro da imagem é mantido na área segura do ícone adaptativo.
        adaptive=Image.new("RGBA",(px*2,px*2),(0,0,0,0))
        centered=foreground.resize((int(px*1.32),int(px*1.32)),Image.Resampling.LANCZOS)
        adaptive.alpha_composite(centered,((adaptive.width-centered.width)//2,(adaptive.height-centered.height)//2))
        adaptive.save(folder/"ic_launcher_foreground.png")
    anydpi=RES/"mipmap-anydpi-v26"
    anydpi.mkdir(parents=True,exist_ok=True)
    xml='''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/falljump_icon_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
'''
    for name in ("ic_launcher.xml","ic_launcher_round.xml"):
        (anydpi/name).write_text(xml,encoding="utf-8")
    values=RES/"values"
    values.mkdir(parents=True,exist_ok=True)
    (values/"falljump_icon_background.xml").write_text(
        '<resources><color name="falljump_icon_background">#EFF7F9</color></resources>\n',
        encoding="utf-8"
    )
    manifest=ROOT/"android/app/src/main/AndroidManifest.xml"
    source=manifest.read_text(encoding="utf-8")
    found=re.search(r"<activity\b[^>]*>",source,re.S)
    if not found:
        raise RuntimeError("Activity não encontrada no AndroidManifest.xml")
    tag=found.group(0)
    if 'android:screenOrientation' not in tag:
        source=source[:found.start()]+tag[:-1]+' android:screenOrientation="portrait">'+source[found.end():]
        manifest.write_text(source,encoding="utf-8")
    print("Ícones Android gerados e orientação vertical configurada.")


if __name__=="__main__":
    main()
