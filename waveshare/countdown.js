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
const {exec} = require('child_process');
const {readFile, watch, writeFile, unlink} = require('fs');

// constants
const COUNTDOWN = 'countdown.json';
const PYTHON = 'countdown.txt';
const SCREEN_DELAY = 3000;
const {stringify, parse} = JSON;
const {abs} = Math;
const {error} = console;

// utils
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

const showTime = value => new Promise(resolve => {
  writeFile(PYTHON, value, err => {
    if (err)
      error(err);
    resolve();
  });
});

const ten = i => `0${i}`.slice(-2);

const timeToMS = time => {
  const [hours, minutes] = ''.split.call(time, ':');
  return hoursToMS(b10(hours)) + minutesToMS(b10(minutes || 0));
};

// time tracker logic
const onReady = countdown => {
  // show the current time with *_* "face" to indicate
  // the reboot was successful
  showTime('*_* ' + readableTime(countdown.date))
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
        // remove the json file, will start from scratch next boot
        unlink(COUNTDOWN, function blink(visible) {
          // blink every 2 seconds with x_x "face" or "ENOUGH"
          // to indicate time is over and "face" is not happy anymore
          showTime(visible ? 'x_x' : 'ENOUGH').then(
            () => {
              // don't assign this timeout as the only thing to do
              // at this point is to disconnect the timer and start
              // the next working day from zero
              setTimeout(blink, SCREEN_DELAY, !visible);
            }
          );
        });
      }
      else {
        saveCounter(countdown).then(() => {
          // show current time with ^_^ "face"
          showTime('^_^ ' + readableTime(date))
        });
      }
    },
    minutesToMS(1)
  );
};

const startCounter = (time, welcome) => {
  const date = new Date(timeToMS(time));
  const count = () => {
    // grab countdown json file, if any
    readFile(COUNTDOWN, (err, data) => {
      // no file found, start from date
      if (err)
        saveCounter({time, date}).then(onReady);
      else {
        // file found, try to parse it (avoid corrupted files)
        try {
          const result = parse(data);
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
  if (welcome)
    showTime(welcome).then(() => setTimeout(count, SCREEN_DELAY * 2));
  else
    count();
};

// wait for Python signal
const watcher = watch('.', {recursive: true}, (event, fileName) => {
  if (fileName == PYTHON) {
    watcher.close();
    setTimeout(
      startCounter,
      SCREEN_DELAY,
      process.argv[2] || 8,
      ''.trim.call(process.argv[3] || '')
    );
  }
});
