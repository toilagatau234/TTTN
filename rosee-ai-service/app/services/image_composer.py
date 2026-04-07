import os
import random
from PIL import Image, ImageDraw, ImageColor
from io import BytesIO
import base64

# Simple fixed layouts
LAYOUTS = {
    "round": {
        "main_positions": [(200, 200), (280, 160), (120, 160), (200, 100)],
        "sub_positions": [(160, 240), (240, 240), (100, 200), (300, 200), (150, 120), (250, 120), (200, 50)],
        "basket_box": (100, 250, 300, 350)
    },
    "tall": {
        "main_positions": [(200, 150), (200, 220), (200, 80)],
        "sub_positions": [(160, 120), (240, 120), (160, 180), (240, 180), (160, 240), (240, 240)],
        "basket_box": (150, 280, 250, 380)
    }
}

COLORS = {
    "red": "#FF4D4D",
    "pink": "#FF99CC",
    "white": "#FFFFFF",
    "yellow": "#FFD700",
    "purple": "#9933CC",
    "blue": "#3399FF",
    "orange": "#FF9933",
    "green": "#66CC66" # usually leaves
}

def create_flower_layer(size, positions, color_name, is_main=True, randomness=True):
    layer = Image.new("RGBA", size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(layer)
    
    color_hex = COLORS.get(color_name.lower(), "#CCCCCC")
    radius = 35 if is_main else 20
    
    for x, y in positions:
        # Add slight randomness
        ox = random.randint(-10, 10) if randomness else 0
        oy = random.randint(-10, 10) if randomness else 0
        fx, fy = x + ox, y + oy
        
        # Draw a simple flower (circle with a center)
        bbox = [fx - radius, fy - radius, fx + radius, fy + radius]
        draw.ellipse(bbox, fill=color_hex, outline="#333333", width=2)
        
        # Center of flower
        center_radius = radius // 3
        center_bbox = [fx - center_radius, fy - center_radius, fx + center_radius, fy + center_radius]
        draw.ellipse(center_bbox, fill="#333333" if is_main else "#555555")
        
    return layer

def compose_flower_basket(layout_type: str = "round", 
                          main_color: str = "red", 
                          sub_color: str = "white",
                          basket_color: str = "#8B4513",
                          add_randomness: bool = True) -> Image.Image:
    """
    Composes an image of a flower basket using Pillow.
    Layers: Background -> Basket -> Sub Flowers -> Main Flowers -> Decoration
    """
    layout = LAYOUTS.get(layout_type.lower(), LAYOUTS["round"])
    size = (400, 400)
    
    # 1. Background layer
    img = Image.new("RGBA", size, (245, 245, 240, 255))
    
    # 2. Basket layer
    basket_layer = Image.new("RGBA", size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(basket_layer)
    bx1, by1, bx2, by2 = layout["basket_box"]
    draw.rectangle([bx1, by1, bx2, by2], fill=basket_color, outline="#5C2E0B", width=4)
    # Add some basket weaving lines
    for y in range(by1 + 10, by2, 20):
        draw.line([bx1, y, bx2, y], fill="#5C2E0B", width=2)
    img = Image.alpha_composite(img, basket_layer)
    
    # 3. Sub flowers layer
    sub_layer = create_flower_layer(
        size, layout["sub_positions"], sub_color, is_main=False, randomness=add_randomness
    )
    img = Image.alpha_composite(img, sub_layer)
    
    # 4. Main flowers layer
    main_layer = create_flower_layer(
        size, layout["main_positions"], main_color, is_main=True, randomness=add_randomness
    )
    img = Image.alpha_composite(img, main_layer)
    
    # 5. Decoration/Leaves (optional, skipping complex draw for now, just some green ellipses)
    dec_layer = Image.new("RGBA", size, (255, 255, 255, 0))
    draw_dec = ImageDraw.Draw(dec_layer)
    for _ in range(5):
        lx = random.randint(100, 300)
        ly = random.randint(100, 250)
        draw_dec.polygon([(lx, ly), (lx+15, ly-10), (lx+30, ly), (lx+15, ly+10)], fill="#228B22")
    
    # Put decoration behind main flowers but front of sub? Or just combine. 
    # Let's just put it at very top as small leaves.
    img = Image.alpha_composite(img, dec_layer)

    return img

def image_to_base64(img: Image.Image) -> str:
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode('utf-8')

if __name__ == "__main__":
    # Test generation
    img = compose_flower_basket("round", "pink", "white")
    img.save("sample_round.png")
    img2 = compose_flower_basket("tall", "red", "yellow")
    img2.save("sample_tall.png")
    print("Generated sample_round.png and sample_tall.png")
