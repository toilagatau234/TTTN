---
# Design Tokens Spec
# See: https://github.com/google-labs-code/design.md

colors:
  brand:
    primary: "#ec4899" # Premium Pink / Rose
    secondary: "#f472b6"
    soft: "#fff1f2"
    accent: "#fbcfe8"
  studio:
    fuchsia: "#c026d3" # Fuchsia-600
    rose: "#e11d48" # Rose-600
    soft-bg: "linear-gradient(to bottom right, #fdf2f8, #fff1f2, #fdf4ff)"
  nature:
    primary: "#88a82a" # Green / Organic
    secondary: "#a3b960"
    soft: "#f7fee7"
    button-bg: "#edffc5"
    button-text: "#2f5d3a"
  neutral:
    50: "#f0f3f8" # Cool gray-blue
    100: "#e4e9f2"
    200: "#cbd5e1"
    300: "#94a3b8"
    400: "#64748b"
    500: "#475569"
    600: "#334155"
    700: "#1e293b"
    800: "#0f172a"
    900: "#020617"
  navy:
    700: "#111c44" # Admin deep navy
    800: "#0b1437"
    title: "#2B3674"
  ui:
    background: "#ffffff"
    admin-bg: "#F4F7FE"
    gradient-start: "#fff0f5"
    gradient-end: "#f0fff4"

typography:
  fonts:
    sans: "'Plus Jakarta Sans', 'system-ui', sans-serif"
    heading: "'Plus Jakarta Sans', sans-serif"
  sizes:
    xs: "10px"
    sm: "13px"
    base: "15px"
    lg: "18px"
    xl: "20px"
    "2xl": "24px"
    "3xl": "30px"
    "5xl": "48px"
  weights:
    normal: 400
    medium: 500
    semibold: 600
    bold: 700
    black: 900

spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"

radii:
  sm: "10px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  "2xl": "24px"
  "3xl": "32px"
  full: "9999px"

shadows:
  premium: "0 10px 40px -10px rgba(17, 28, 68, 0.08), 0 4px 12px -5px rgba(17, 28, 68, 0.04)"
  hover: "0 20px 50px -10px rgba(17, 28, 68, 0.12), 0 10px 20px -8px rgba(17, 28, 68, 0.05)"
  glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)"

motion:
  duration:
    fast: "300ms"
    medium: "500ms"
    slow: "800ms"
    banner: "1s"
  easing:
    standard: "ease"
    in-out: "ease-in-out"
    premium-jump: "cubic-bezier(0.34, 1.56, 0.64, 1)"
    smooth-slide: "cubic-bezier(0.16, 1, 0.3, 1)"

---

# Rosee Design System

## Visual Identity
Rosee is a floral e-commerce platform that balances **natural elegance** with **modern sophistication**. The design system is split into two distinct experiences: a soft, romantic consumer storefront and a structured, high-contrast administrative dashboard.

### Core Principles
1.  **Organic Softness**: Use of large border radii (24px), soft pastel backgrounds, and rounded typography (Plus Jakarta Sans) to mirror the natural shapes of flowers.
2.  **Premium Depth**: Subtle "Premium" shadows and glassmorphism effects create a sense of layering and high-end quality without overwhelming the content.
3.  **Lively Interaction**: Micro-animations (floating flowers, hover glows, and scale-rotations) make the interface feel "alive" and interactive.
4.  **Clarity & Structure**: The Admin panel uses a cooler, navy-based palette to emphasize data clarity and professional control.

## Color Palette

### Brand & Nature
The consumer-facing site is anchored by **Rose Pink** (`brand`) and **Organic Green** (`nature`). 
- **Pink** is used for emotional highlights, prices, and calls to action.
- **Green** represents freshness and sustainability, used for secondary actions like "Add to Cart".
- **Gradients** transition softly between light pink and mint green, creating an airy, garden-like atmosphere.

### Admin Navy
The administrative interface uses a deep **Navy** hierarchy. 
- Primary text and headers use `#2B3674`, providing strong contrast against the cool `#F4F7FE` background.
- Brand accents in admin use a professional **Blue/Indigo** gradient rather than the romantic pink.

### Studio Fuchsia
The "Hydrangea Studio" AI experience introduces **Fuchsia** and **Rose** gradients to emphasize the "magic" of AI. It uses even larger border radii (32px) and glassmorphism to differentiate the cutting-edge AI features from the standard shop.

## Typography
**Plus Jakarta Sans** is the soul of the system. 
- It is a geometric sans-serif with a friendly, open feel.
- High-weight titles (`black` 900) are used for brand impact.
- Generous line-heights and letter-spacing ensure readability in both poetic product descriptions and dense data tables.

## Components & Effects

### The Product Card
The flagship component of the store. It features:
- **Floating Effect**: On hover, the card rises (`translateY(-10px)`) and gains a deeper shadow.
- **Dynamic Glow**: A radial gradient "glow" appears behind the flower image on hover.
- **Interactive Action**: A button group slides up from the bottom, revealing "Buy Now" and "Add to Cart" options only when needed.

### Glassmorphism
Used in the Admin Header and premium UI elements. 
- Combines `white/70` backgrounds with `backdrop-blur-xl`.
- Creates a modern "Apple-esque" feel that feels light and unobstructed.

## Motion & Delight
Delight is baked into the experience through:
- **Falling Flowers**: A background animation of falling petals creates a serene, thematic environment.
- **Floating Banners**: Hero images bob gently as if floating on water.
- **Spring Hover**: Product images use a "Premium Jump" easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`) to scale and rotate slightly, giving a playful response to user intent.


tôi muốn sửa lại trang web này. tôi muốn bố cục sẽ có 1 phần để người dùng trò chuyện với AI. 1 phần chính sẽ là hiển thì hình ảnh của giỏ hoa mà người dùng muốn tạo, và có thêm 1 mục hiển thị danh sách các sản phẩm được bốc tách từ người dùng yêu cầu mà AI sẽ dùng để tạo giỏ hoa. 