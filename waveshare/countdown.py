#!/usr/bin/env python3

# ISC License
#
# Copyright (c) 2019, Andrea Giammarchi, @WebReflection
#
# Permission to use, copy, modify, and/or distribute this software for any
# purpose with or without fee is hereby granted, provided that the above
# copyright notice and this permission notice appear in all copies.
#
# THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
# REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
# AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
# INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
# LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
# OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
# PERFORMANCE OF THIS SOFTWARE.

import random

import os
import sys
sys.path.insert(1, os.path.realpath('./node_modules/filebus/python'))

# initialize the display
from waveshare_epd import epd2in13
epaper = epd2in13.EPD()

# they defined width and height upside down ^_^;;
width=epaper.height
height=epaper.width

# initialize the "canvas"
from PIL import Image, ImageFont, ImageDraw

# initialize the font
from font_fredoka_one import FredokaOne
font = ImageFont.truetype(FredokaOne, 42)

# initiate the FileBus channel
from filebus import FileBus

def ready(value = None):
  print('ready')
  epaper.init(epaper.lut_full_update)
  epaper.Clear(0xFF)
  epaper.init(epaper.lut_partial_update)
  fb.send('ready', random.random())

def update(message = ''):
  print('update: ' + message);
  w, h = font.getsize(message)
  x = (width - w) / 2
  y = (height - h) / 2
  img = Image.new("P", (width, height), 255)
  draw = ImageDraw.Draw(img)
  draw.text((x, y), message, font = font, fill = 0)
  epaper.display(epaper.getbuffer(img.rotate(180)))
  fb.send('update', random.random())

# use .js as channel input, and .python as channel output
fb = FileBus('.js', '.python')
fb.on('ready', ready)
fb.on('update', update)
fb.send('initialize', random.random())
