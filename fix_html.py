import re

with open('admin.html', 'r') as f:
    html = f.read()

# Remove the admin-animated-bg div completely
html = re.sub(r'<div class="admin-animated-bg">.*?</div>\n\s*<!-- Login Overlay -->', '<!-- Login Overlay -->', html, flags=re.DOTALL)

with open('admin.html', 'w') as f:
    f.write(html)
