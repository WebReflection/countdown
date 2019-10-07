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

// modules
const {join} = require('path');
const {exec} = require('child_process');
const {readFile, writeFile, unlink} = require('fs');

// constants
const COUNTDOWN = join(process.env.HOME, 'countdown.json');
const INKY_PHAT = join(process.env.HOME, 'countdown.py');
const {stringify, parse} = JSON;

// utils
const b10 = num => parseInt(num, 10);

const hoursToMS = hours => {
  return hours * 60 * 60 * 1000;
};

const minutesToMS = minutes => {
  return minutes * 60 * 1000;
};

const readableTime = date => [
  ten(date.getUTCHours()),
  ten(date.getUTCMinutes())
].join(':');

const saveCounter = (countdown) => {
  writeFile(COUNTDOWN, stringify(countdown), Object);
  return countdown;
};

const showTime = value => {
  exec(`${INKY_PHAT} '${value}'`, Object);
};

const ten = i => `0${i}`.slice(-2);

const timeToMS = time => {
  const [hours, minutes] = ''.split.call(time, ':');
  return hoursToMS(b10(hours)) + minutesToMS(b10(minutes || 0));
};

// counter logic
const startCounter = time => {
  const date = new Date(timeToMS(time));
  // grab countdown json file, if any
  readFile(COUNTDOWN, (err, data) => {
    let countdown;
    // no file found, start from date
    if (err)
      countdown = saveCounter({time, date});
    else {
      // file found, try to parse it (avoid corrupted files)
      try {
        const result = parse(data);
        // if the total time is the same as previous run
        if (result.time == time)
          // start from last saved date
          countdown = {time, date: new Date(result.date)};
        else
          // otherwise start from scratch
          countdown = saveCounter({time, date});
      }
      // if json was corrupted (i.e. unplugged while saving)
      catch (o_O) {
        // start from scratch
        countdown = saveCounter({time, date});
      }
    }
    // show the current time with *_* "face" to indicate
    // the reboot was successful
    showTime('*_* ' + readableTime(countdown.date));
    // update the timer per each minute
    const i = setInterval(
      () => {
        const {date} = countdown;
        // drop a minute from the date
        date.setUTCMinutes(date.getUTCMinutes() - 1);
        // show current time with ^_^ "face"
        showTime('^_^ ' + readableTime(date));
        // if time is over, as in 0 hours and 0 minutes
        if ((date.getUTCHours() + date.getUTCMinutes()) == 0) {
          // clear the minutes interval
          clearInterval(i);
          // remove the json file, will start from scratch next boot
          unlink(COUNTDOWN, Object);
          // blink every 2 seconds with o_O or O_o "face"
          // to indicate time is over and "face" is not happy anymore
          let visible = true;
          // don't assign this interval as the only thing to do
          // at this point is to disconnect the timer and start
          // the next working day from zero
          setInterval(
            () => {
              if (visible = !visible)
                showTime('o_O 00:00');
              else
                showTime('O_o 00:00');
            },
            2000
          );
        }
        else {
          writeFile(COUNTDOWN, stringify(countdown), Object);
        }
      },
      minutesToMS(1)
    );
  });
};

// accepts an argument or it starts from 8 hours
startCounter(process.argv[2] || 8);
