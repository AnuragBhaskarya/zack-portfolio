import re

with open('index.html', 'r') as f:
    html = f.read()

# Extract the left and right hero tracks
left_match = re.search(r'(<div class="hero-bg-container left-bg".*?</div>\s*</div>\s*</div>)', html, re.DOTALL)
right_match = re.search(r'(<div class="hero-bg-container right-bg".*?</div>\s*</div>\s*</div>)', html, re.DOTALL)

bg_html = '<div class="admin-animated-bg">\n' + left_match.group(1) + '\n' + right_match.group(1) + '\n</div>'

with open('admin.html', 'r') as f:
    admin_html = f.read()

# Inject right after <body>
admin_html = admin_html.replace('<body>', '<body>\n' + bg_html)

with open('admin.html', 'w') as f:
    f.write(admin_html)

print("Injected background HTML successfully.")
