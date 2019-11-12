#!/usr/bin/env node

// ISC License
//
// Copyright (c) 2019, Andrea Giammarchi, @WebReflection
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
// REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
// AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
// LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
// OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
// PERFORMANCE OF THIS SOFTWARE.

// This version uses an image instead of text
// sudo pacman -S --needed graphicsmagick ghostscript xorg-fonts-type1
// curl -LO https://archibold.io/benja/fonts/n019003l.pfb
// sudo mv n019003l.pfb /usr/share/fonts/Type1/
// cd ~/
// npm i --save gm png-to-lcd

const Oled = require('oled-js');
const {RaspiIO} = require('raspi-io');
const five = require('johnny-five');
const gm = require('gm');
const pngtolcd = require('png-to-lcd');

const {join} = require('path');
const {readFile, writeFile, unlink} = require('fs');
const {exec} = require('child_process');

const HOME = '/home/alarm';
const COUNTDOWN = join(HOME, 'app', 'countdown.json');
const WELCOME = join(HOME, 'app', 'MESSAGE.txt');
const IMAGE = join(HOME, 'app', 'message.png');

const {stringify, parse} = JSON;
const {abs, ceil, pow} = Math;
const {error} = console;

const board = new five.Board({io: new RaspiIO});
const options = {
  width: 128,
  height: 32,
  address: 0x3c
};

const ready = new Promise(resolve => {
  board.on('ready', () => {
    resolve(new Oled(board, five, options));
  });
});

const b10 = num => abs(parseInt(num, 10));

const hoursToMS = hours => hours * 60 * 60 * 1000;

const minutesToMS = minutes => minutes * 60 * 1000;

const readableTime = date => [
  ten(date.getUTCHours()),
  ten(date.getUTCMinutes())
].join(':');

const saveCounter = countdown => new Promise(resolve => {
  writeFile(COUNTDOWN, stringify(countdown), err => {
    if (err) {
      error(err);
      resolve(countdown);
    } else {
      exec('sync', err => {
        if (err)
          error(err);
        resolve(countdown);
      });
    }
  });
});

const showTime = value => ready.then(oled => new Promise(resolve => {
  gm(options.width, options.height, '#000000')
    .fill('#FFFFFF')
    .fontSize(24)
    .antialias(false)
    .drawText(0, 0, value, 'Center')
    .flip()
    .flop()
    .monochrome()
    .write(IMAGE, err => {
      if (err)
        setTimeout(resolve, 1500);
      else {
        pngtolcd(IMAGE, false, (err, bitmap) => {
          setTimeout(resolve, 1500);
          if (!err) {
            oled.buffer = bitmap;
            oled.update();
          }
        });
      }
    });
}));

const ten = i => `0${i}`.slice(-2);

const timeToMS = time => {
  const [hours, minutes] = ''.split.call(time, ':');
  return hoursToMS(b10(hours)) + minutesToMS(b10(minutes || 0));
};

// time tracker logic
const onReady = countdown => {
  // show the current time with *_* "face" to indicate
  // the reboot was successful
  showTime('*_* ' + readableTime(countdown.date));
  // update the timer per each minute
  const i = setInterval(
    () => {
      const {date} = countdown;
      // drop a minute from the date
      date.setUTCMinutes(date.getUTCMinutes() - 1);
      // if time is over, as in 0 hours and 0 minutes
      if ((date.getUTCHours() + date.getUTCMinutes()) == 0) {
        // clear the minutes interval
        clearInterval(i);
        // alternate messages
        let alternate = 0;
        const now = Date.now();
        // remove the json file, will start from scratch next boot
        unlink(COUNTDOWN, function blink() {
          // blink every 2 seconds with x_x "face", "ENOUGH", or negative time
          // to indicate time is over and "face" is not happy anymore
          let message = '';
          switch (alternate++ % 4) {
            case 0:
              message = 'x_x';
              break;
            case 1:
            case 3:
              message = '--- ' + readableTime(new Date(new Date - now));
              break;
            case 2:
              message = 'ENOUGH';
              break;
          }
          showTime(message, () => {
            // don't assign this timeout as the only thing to do
            // at this point is to disconnect the timer and start
            // the next working day from zero
            setTimeout(blink, SCREEN_DELAY);
          });
        });
      }
      else {
        saveCounter(countdown).then(() => {
          // show current time with ^_^ "face"
          showTime('^_^ ' + readableTime(date));
        });
      }
    },
    minutesToMS(1)
  );
};

const startCounter = time => {
  const date = new Date(timeToMS(time));
  // grab countdown json file, if any
  readFile(COUNTDOWN, (err, data) => {
    // no file found, start from date
    if (err)
      saveCounter({time, date}).then(onReady);
    else {
      // file found, try to parse it (avoid corrupted files)
      try {
        const result = parse(data.toString());
        // if the total time is the same as previous run
        if (result.time == time)
          // start from last saved date
          Promise.resolve({time, date: new Date(result.date)}).then(onReady);
        else
          // otherwise start from scratch
          saveCounter({time, date}).then(onReady);
      }
      // if json was corrupted (i.e. unplugged while saving)
      catch (o_O) {
        // start from scratch
        saveCounter({time, date}).then(onReady);
      }
    }
  });
};

readFile(WELCOME, (err, data) => {
  // accepts an argument or it starts from 8 hours
  const time = process.argv[2] || 8;
  if (err)
    startCounter(time);
  else {
    showTime(data.toString()).then(() => {
      setTimeout(startCounter, 3500, time);
    });
  }
});
