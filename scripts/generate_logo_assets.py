import math
import shutil
import base64
from io import BytesIO
from PIL import Image, ImageDraw, ImageFilter

src_path = r"C:\Users\janan\.gemini\antigravity-ide\brain\1f488a51-c78e-4980-ada5-e88ed7ccc3cb\.user_uploaded\media_1792243883913.png"
raw_img = Image.open(src_path).convert("RGBA")
w, h = raw_img.size

# 1. Save original copy to public/images/greennext-logo-original.png
dest_original = r"e:\Janani Sri\internship\Greennext\greennext-digital-infrastructure-main\public\images\greennext-logo-original.png"
shutil.copyfile(src_path, dest_original)
print("1. Copied original to public/images/greennext-logo-original.png")

# 2. Extract transparent full logo
# Uniform background color analysis
bg_r, bg_g, bg_b = 15.1, 24.3, 38.7
d_min = 5.0
d_max = 28.0

transparent_full = Image.new("RGBA", (w, h))

for y in range(h):
    for x in range(w):
        r, g, b, _ = raw_img.getpixel((x, y))
        dist = math.sqrt((r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2)
        if dist <= d_min:
            transparent_full.putpixel((x, y), (0, 0, 0, 0))
        elif dist >= d_max:
            transparent_full.putpixel((x, y), (r, g, b, 255))
        else:
            t = (dist - d_min) / (d_max - d_min)
            alpha_f = t * t * (3.0 - 2.0 * t)
            ur = max(0, min(255, int((r - (1.0 - alpha_f) * bg_r) / max(alpha_f, 0.05))))
            ug = max(0, min(255, int((g - (1.0 - alpha_f) * bg_g) / max(alpha_f, 0.05))))
            ub = max(0, min(255, int((b - (1.0 - alpha_f) * bg_b) / max(alpha_f, 0.05))))
            alpha = max(0, min(255, int(alpha_f * 255.0)))
            transparent_full.putpixel((x, y), (ur, ug, ub, alpha))

bbox = transparent_full.getbbox()
print(f"Full logo bbox: {bbox}")

# Crop to tight bounding box with 6px vertical padding, 4px horizontal padding
pad_y = 6
pad_x = 4
cropped_w = (bbox[2] - bbox[0]) + 2 * pad_x
cropped_h = (bbox[3] - bbox[1]) + 2 * pad_y

logo_tight = Image.new("RGBA", (cropped_w, cropped_h), (0, 0, 0, 0))
logo_tight.paste(transparent_full.crop(bbox), (pad_x, pad_y))

dest_logo = r"e:\Janani Sri\internship\Greennext\greennext-digital-infrastructure-main\public\images\greennext-logo.png"
logo_tight.save(dest_logo, "PNG", optimize=True)
dest_logo_webp = r"e:\Janani Sri\internship\Greennext\greennext-digital-infrastructure-main\public\images\greennext-logo.webp"
logo_tight.save(dest_logo_webp, "WEBP", quality=95)
print(f"2. Saved primary logo to {dest_logo} ({logo_tight.size}) and webp")

# 3. Extract symbol alone
# Symbol ends at x = 220
symbol_area = (bbox[0], bbox[1], 222, bbox[3])
symbol_crop = transparent_full.crop(symbol_area)
symbol_bbox = symbol_crop.getbbox()
symbol_tight = symbol_crop.crop(symbol_bbox)

# Add minimal 4px padding
sym_w, sym_h = symbol_tight.size
symbol_final = Image.new("RGBA", (sym_w + 8, sym_h + 8), (0, 0, 0, 0))
symbol_final.paste(symbol_tight, (4, 4))

dest_symbol = r"e:\Janani Sri\internship\Greennext\greennext-digital-infrastructure-main\public\images\greennext-symbol.png"
symbol_final.save(dest_symbol, "PNG", optimize=True)
dest_symbol_webp = r"e:\Janani Sri\internship\Greennext\greennext-digital-infrastructure-main\public\images\greennext-symbol.webp"
symbol_final.save(dest_symbol_webp, "WEBP", quality=95)
print(f"3. Saved symbol to {dest_symbol} ({symbol_final.size}) and webp")

# 4. Light background variant
# Where the white word 'Next' is darkened to deep slate #0F172A
logo_light = logo_tight.copy()
for y in range(logo_light.height):
    for x in range(logo_light.width):
        r, g, b, a = logo_light.getpixel((x, y))
        if a > 10:
            # Check if this pixel is part of the white "Next" text (x > symbol and high brightness)
            # In "Next", r > 180 and g > 180 and b > 180
            if x > 500 and r > 150 and g > 150 and b > 150:
                # Darken to #0F172A while keeping alpha
                dark_r = 15
                dark_g = 23
                dark_b = 42
                logo_light.putpixel((x, y), (dark_r, dark_g, dark_b, a))

dest_logo_light = r"e:\Janani Sri\internship\Greennext\greennext-digital-infrastructure-main\public\images\greennext-logo-light.png"
logo_light.save(dest_logo_light, "PNG", optimize=True)
print("4. Saved light background variant to public/images/greennext-logo-light.png")

# 5. Favicons and Application Icons
# Create dark rounded squircle icons
def make_branded_icon(size, corner_radius_ratio=0.22, padding_ratio=0.14):
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # Draw rounded dark background #0B0F17 with border #1E293B
    draw = ImageDraw.Draw(canvas)
    radius = int(size * corner_radius_ratio)
    draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=radius, fill=(11, 15, 23, 255), outline=(30, 41, 59, 255), width=max(1, size // 32))
    
    # Inner symbol
    inner_max = int(size * (1 - 2 * padding_ratio))
    sym_copy = symbol_tight.copy()
    sym_copy.thumbnail((inner_max, inner_max), Image.Resampling.LANCZOS)
    
    paste_x = (size - sym_copy.width) // 2
    paste_y = (size - sym_copy.height) // 2
    canvas.paste(sym_copy, (paste_x, paste_y), sym_copy)
    return canvas

# Multi-resolution ICO
ico_canvas_16 = make_branded_icon(16, corner_radius_ratio=0.18, padding_ratio=0.08)
ico_canvas_32 = make_branded_icon(32, corner_radius_ratio=0.20, padding_ratio=0.10)
ico_canvas_48 = make_branded_icon(48, corner_radius_ratio=0.22, padding_ratio=0.12)
ico_canvas_64 = make_branded_icon(64, corner_radius_ratio=0.22, padding_ratio=0.14)

dest_ico = r"e:\Janani Sri\internship\Greennext\greennext-digital-infrastructure-main\public\favicon.ico"
ico_canvas_32.save(
    dest_ico,
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
)
print("5. Saved public/favicon.ico")

# 16x16, 32x32, 180x180, 192x192, 512x512 PNGs
dest_fav32 = r"e:\Janani Sri\internship\Greennext\greennext-digital-infrastructure-main\public\favicon-32x32.png"
ico_canvas_32.save(dest_fav32, "PNG")

dest_fav16 = r"e:\Janani Sri\internship\Greennext\greennext-digital-infrastructure-main\public\favicon-16x16.png"
ico_canvas_16.save(dest_fav16, "PNG")

apple_icon = make_branded_icon(180, corner_radius_ratio=0.22, padding_ratio=0.15)
dest_apple = r"e:\Janani Sri\internship\Greennext\greennext-digital-infrastructure-main\public\apple-touch-icon.png"
apple_icon.save(dest_apple, "PNG")

pwa_192 = make_branded_icon(192, corner_radius_ratio=0.22, padding_ratio=0.15)
dest_192 = r"e:\Janani Sri\internship\Greennext\greennext-digital-infrastructure-main\public\images\greennext-icon-192.png"
pwa_192.save(dest_192, "PNG")

pwa_512 = make_branded_icon(512, corner_radius_ratio=0.22, padding_ratio=0.15)
dest_512 = r"e:\Janani Sri\internship\Greennext\greennext-digital-infrastructure-main\public\images\greennext-icon-512.png"
pwa_512.save(dest_512, "PNG")

print("6. Saved PNG favicon sizes and apple-touch-icon")

# 7. Generate public/favicon.svg
# Embed high-res symbol base64 inside SVG with SVG rounded squircle container
sym_buffer = BytesIO()
symbol_tight.save(sym_buffer, format="PNG")
sym_b64 = base64.b64encode(sym_buffer.getvalue()).decode("ascii")

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="GreenNext Logo">
  <title>GreenNext</title>
  <rect width="64" height="64" rx="14" fill="#0B0F17" stroke="#1E293B" stroke-width="1.5"/>
  <image href="data:image/png;base64,{sym_b64}" x="9" y="9" width="46" height="46" preserveAspectRatio="xMidYMid meet" />
</svg>
'''
dest_svg = r"e:\Janani Sri\internship\Greennext\greennext-digital-infrastructure-main\public\favicon.svg"
with open(dest_svg, "w", encoding="utf-8") as f:
    f.write(svg_content)
print("7. Saved public/favicon.svg")

# 8. Generate OpenGraph Banner (1200x630)
og_img = Image.new("RGBA", (1200, 630), (7, 10, 14, 255))
# Subtle glowing accent at center
draw_og = ImageDraw.Draw(og_img)

# Paste centered logo
logo_og = logo_tight.copy()
# Target width: 680px
og_logo_w = 680
og_logo_h = int(logo_tight.height * (og_logo_w / logo_tight.width))
logo_og = logo_og.resize((og_logo_w, og_logo_h), Image.Resampling.LANCZOS)

paste_og_x = (1200 - og_logo_w) // 2
paste_og_y = (630 - og_logo_h) // 2 - 30

og_img.paste(logo_og, (paste_og_x, paste_og_y), logo_og)

dest_og = r"e:\Janani Sri\internship\Greennext\greennext-digital-infrastructure-main\public\images\greennext-og-image.png"
og_img.save(dest_og, "PNG", optimize=True)
print("8. Saved public/images/greennext-og-image.png")
