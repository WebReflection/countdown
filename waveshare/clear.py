#!/usr/bin/env python3

from waveshare_epd import epd2in13
inky_display = epd2in13.EPD()
inky_display.init(inky_display.lut_full_update)
inky_display.Clear(0xFF)
