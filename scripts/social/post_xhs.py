#!/usr/bin/env python3
"""Generate cover images for XHS posts"""
import json, os

POSTS_FILE = "/Users/brianzhibo/openclaw/yangcun/realworldclaw/content/xhs-posts.json"
IMG_DIR = "/Users/brianzhibo/openclaw/yangcun/realworldclaw/scripts/xhs_covers"

def load_json(path):
    with open(path) as f:
        return json.load(f)

def generate_cover(title, output_path):
    """Generate a simple cover image with PIL"""
    from PIL import Image, ImageDraw, ImageFont
    
    W, H = 1080, 1440
    img = Image.new('RGB', (W, H), '#FF4D4F')  # 小红书品牌红
    draw = ImageDraw.Draw(img)
    
    # Try system fonts
    font_size = 64
    try:
        font = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", font_size)
    except:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/STHeiti Light.ttc", font_size)
        except:
            font = ImageFont.load_default()
    
    # Word wrap
    lines = []
    chars_per_line = 12
    for i in range(0, len(title), chars_per_line):
        lines.append(title[i:i+chars_per_line])
    
    total_h = len(lines) * (font_size + 20)
    y = (H - total_h) // 2
    
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        tw = bbox[2] - bbox[0]
        x = (W - tw) // 2
        draw.text((x, y), line, fill='white', font=font)
        y += font_size + 20
    
    # Add branding
    small_font_size = 36
    try:
        small_font = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", small_font_size)
    except:
        small_font = font
    draw.text((W//2 - 120, H - 120), "RealWorldClaw", fill='#FFFFFF99', font=small_font)
    
    img.save(output_path, quality=95)
    print(f"Generated: {output_path}")

def main():
    os.makedirs(IMG_DIR, exist_ok=True)
    posts = load_json(POSTS_FILE)[:2]
    for post in posts:
        path = os.path.join(IMG_DIR, f"cover_{post['id']}.jpg")
        generate_cover(post['title'], path)
        print(f"  Cover for post {post['id']}: {path}")

if __name__ == "__main__":
    main()
