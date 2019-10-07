#!/usr/bin/env python3

# retrieve the message to write via sys.argv
import sys
message = sys.argv[1]

# initialize the display
from inky import InkyPHAT
inky_display = InkyPHAT("black")
inky_display.set_border(inky_display.WHITE)

# initialize the "canvas"
from PIL import Image, ImageFont, ImageDraw
img = Image.new("P", (inky_display.WIDTH, inky_display.HEIGHT))
draw = ImageDraw.Draw(img)

# initialize the font
from font_fredoka_one import FredokaOne
font = ImageFont.truetype(FredokaOne, 42)

# draw text on the display after rotating it 180
# to keep the board charging from the top
# so that it's easier to put it on a desk
w, h = font.getsize(message)
x = (inky_display.WIDTH / 2) - (w / 2)
y = (inky_display.HEIGHT / 2) - (h / 2)
draw.text((x, y), message, inky_display.BLACK, font)
inky_display.set_image(img.rotate(180))
inky_display.show()
