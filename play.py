import os
import random

# 1. The Math Paradox Logic
# We force the "Dimension" based on a hidden calculation or random seed
title = os.getenv("ISSUE_TITLE", "").lower()

# 2. 100 Dimensions Generator (Simplified for code block, but logic is there)
# We create a list of 100 different themes
themes = [
    {"bg": "000", "font": "Courier", "color": "0f0", "name": "Matrix_Glitch"},
    {"bg": "fff", "font": "Helvetica", "color": "000", "name": "Minimal_Void"},
    {"bg": "f0f", "font": "Impact", "color": "ff0", "name": "Cyber_Punk"},
    # ...Imagine 97 more variations here
]

# Pick a dimension based on the number the user "stopped" at
try:
    choice = int(title.split(":")[-1]) % 100
except:
    choice = random.randint(0, 99)

dim = themes[choice]

# 3. Generate the "Masterpiece" UI
new_readme = f"""
# 🌀 DIMENSION SHIFTED: {dim['name']}
<img src="https://capsule-render.vercel.app/render?type=glitch&color={dim['bg']}&text=DIMENSION_{choice}&fontColor={dim['color']}" width="100%"/>

## 🧩 THE PARADOX
I knew you would land here. The calculation predicted dimension **{choice}**.

### 🎰 RESET REALITY
[ 🌀 SPIN THE MULTIVERSE AGAIN ](https://github.com/Krellixx/Krellixx/issues/new?title=stop:random)
"""

with open("README.md", "w") as f:
    f.write(new_readme)
