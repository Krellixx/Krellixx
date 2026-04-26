import os
import json

# Fetch input from GitHub Issue
title = os.getenv("ISSUE_TITLE", "").lower()

with open("state.json", "r") as f:
    state = json.load(f)

# Handle Invasion Logic
colors = ["#ff0055", "#00ff41", "#00e5ff", "#ffff00", "#ff00ff"] # Random "conquer" colors
import random
new_color = random.choice(colors)

if "invade:" in title:
    sector = title.split(":")[-1]
    if sector in state:
        state[sector] = new_color

# Handle Theme Change Logic
if "color:" in title:
    hex_val = title.split(":")[-1].replace("#", "")
    if len(hex_val) == 6:
        state["theme"] = hex_val

with open("state.json", "w") as f:
    json.dump(state, f)

# Generate the High-Tech SVG Map
# Each rect represents a continent in this stylized tech-grid
svg_content = f'''
<svg width="900" height="300" viewBox="0 0 900 300" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="900" height="300" fill="#0a0a0a"/>
  <text x="20" y="40" fill="#{state["theme"]}" font-family="monospace" font-size="20">NETWORK_MAP_VIEW</text>
  
  <rect x="50"  y="80" width="180" height="100" fill="{state["na"]}" rx="5"/> <text x="60" y="105" fill="white" font-family="monospace">N.AMERICA</text>
  <rect x="80"  y="190" width="120" height="80"  fill="{state["sa"]}" rx="5"/> <text x="90" y="215" fill="white" font-family="monospace">S.AMERICA</text>
  <rect x="280" y="70"  width="150" height="90"  fill="{state["eu"]}" rx="5"/> <text x="290" y="95" fill="white" font-family="monospace">EUROPE</text>
  <rect x="300" y="170" width="140" height="110" fill="{state["af"]}" rx="5"/> <text x="310" y="195" fill="white" font-family="monospace">AFRICA</text>
  <rect x="480" y="60"  width="280" height="140" fill="{state["as"]}" rx="5"/> <text x="490" y="85" fill="white" font-family="monospace">ASIA</text>
  <rect x="550" y="210" width="120" height="70"  fill="{state["oc"]}" rx="5"/> <text x="560" y="235" fill="white" font-family="monospace">OCEANIA</text>
  
  <path d="M0 290 H900" stroke="#{state["theme"]}" stroke-width="2"/>
</svg>
'''

with open("map.svg", "w") as f:
    f.write(svg_content)
