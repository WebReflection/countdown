# countdown

A [pimoroni b/w Inky pHAT](https://pimoroni.com/inkyphat) working time tracker, based on [Raspbian Buster Lite](https://www.raspberrypi.org/downloads/raspbian/), running on a [Raspberry Pi Zero](https://www.raspberrypi.org/products/raspberry-pi-zero/)/[Zero W](https://www.raspberrypi.org/products/raspberry-pi-zero-w/), powered by NodeJS and Python 3.

![time tracker example](./time-tracker-pi-zero.jpg)


## How Does It Work

  * once plugged in for the first time, it will start a countdown
  * if unplugged before the countdown is finished, it pauses (will start from that same time next boot)
  * if unplugged after the countdown is finished, it resets itself (will start from scratch next boot/working day)


#### When Is It Safe To Unplug ?

If the countdown is finished, i.e. the screen is blinking, it's always safe to unplug the Raspberry Pi Zero/W.

However, to pause it, it's best to wait after next minute update, as any filesystem operation would be done by that time.

Theoretically, you must be quite unlucky to unplug it in a breaking way, but don't worry, the code is super defensive about it so that in the worst case scenario you'll just have a timer starting from scratch.


#### How to reset the timer ?

Just let it reach its end, or SSH into your pi and remove the `~/countdown.json` file.

Reboot, and you'll be good to go again.


## How To Install

Burn the _Raspbian Buster Lite_ ISO to any SD card.

Boot the Pi Zero and login with user `pi` and pass `raspberry`.

Optionally change the default password via `sudo passwd pi`

Use `sudo raspi-config` to eventually connect to the network (Zero W only) and then [enable auto login](https://www.opentechguides.com/how-to/article/raspberry-pi/134/raspbian-jessie-autologin.html), but also [SSH if you'd like to connect there](https://www.raspberrypi.org/documentation/remote-access/ssh/) remotely.

Update the OS via `sudo apt-get update` and then `sudo apt-get upgrade`, then type the following in console:

```sh
curl https://get.pimoroni.com/inkyphat | bash
```

Follow the instructions, and feel free to type `y` to any question, but it'll take long time to set all things up.

Install latest NodeJS for the Pi Zero/W via:

```sh
wget -O - https://raw.githubusercontent.com/sdesalas/node-pi-zero/master/install-node-v.last.sh | bash
```

Download both js and python scripts and make them executable:

```sh
curl -LO https://webreflection.github.io/countdown/countdown.js
curl -LO https://webreflection.github.io/countdown/countdown.py

chmod a+x countdown.js
chmod a+x countdown.py
```

Add the following content at the end of your `~/.bashrc` file:

```sh
# start countdown on login
if [[ -z $DISPLAY && $XDG_VTNR -eq 1 ]]; then
  # feel free to pass a number of hours to countdown
  # or any string such as '01:30' to count 1 hour and a half
  ~/countdown.js 8 # as in 8 hours time tracker countdown
fi
```

Reboot.
