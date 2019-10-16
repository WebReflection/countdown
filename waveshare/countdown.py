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

# initialize the display
from waveshare_epd import epd2in13
inky_display = epd2in13.EPD()

# they defined width and height upside down ^_^;;
width=inky_display.height
height=inky_display.width

# initialize the "canvas"
from PIL import Image, ImageFont, ImageDraw

# initialize the font
from font_fredoka_one import FredokaOne
font = ImageFont.truetype(FredokaOne, 42)

# watch countdown.txt file changes
import inotify.adapters

def _main():
  i = inotify.adapters.Inotify()
  i.add_watch('.')
  state = 0
  with open('countdown.txt', 'w'):
    pass
  for event in i.event_gen(yield_nones=False):
    (_, type_names, path, filename) = event
    if type_names[0] == 'IN_CLOSE_WRITE':
      fd = open('countdown.txt', 'r')
      message = fd.readline().strip()
      fd.close()
      if len(message) == 0:
        if state == 0:
          state = 1
          inky_display.init(inky_display.lut_full_update)
          inky_display.Clear(0xFF)
      else:
        if state == 1:
          state = 2
          inky_display.init(inky_display.lut_partial_update)
        w, h = font.getsize(message)
        x = (width - w) / 2
        y = (height - h) / 2
        img = Image.new("P", (width, height), 255)
        draw = ImageDraw.Draw(img)
        draw.text((x, y), message, font = font, fill = 0)
        inky_display.display(inky_display.getbuffer(img.rotate(180)))

if __name__ == '__main__':
  _main()
