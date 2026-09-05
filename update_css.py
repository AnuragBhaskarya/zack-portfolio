import re

with open('style.css', 'r') as f:
    style_css = f.read()

# Extract hero background CSS
# From /* ===== HERO BACKGROUND (FRAMER ROTATION TECHNIQUE) ===== */
# to the end of that section or just extract what we need.
bg_match = re.search(r'(/\* ===== HERO BACKGROUND.*?)(?:/\* =====|\Z)', style_css, re.DOTALL)
bg_css = bg_match.group(1) if bg_match else ''

# Extract grid background
grid_css = """
/* --- Admin paper-grid background --- */
body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: calc(100% + 40px);
    z-index: -1;
    opacity: 0.12;
    pointer-events: none;
    background-image:
        repeating-linear-gradient(
            0deg,
            transparent, transparent 39px,
            rgba(0, 0, 0, 0.3) 39px, rgba(0, 0, 0, 0.3) 40px
        ),
        repeating-linear-gradient(
            90deg,
            transparent, transparent 39px,
            rgba(0, 0, 0, 0.3) 39px, rgba(0, 0, 0, 0.3) 40px
        );
    animation: gridScrollUp 12s linear infinite;
}

@keyframes gridScrollUp {
    0%   { transform: translateY(0); }
    100% { transform: translateY(-40px); }
}

.admin-animated-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -2;
    overflow: hidden;
    pointer-events: none;
}
.admin-animated-bg .hero-bg-container {
    top: 50%;
}
"""

with open('admin.css', 'a') as f:
    f.write('\n' + grid_css + '\n' + bg_css)

print("Injected CSS successfully.")
