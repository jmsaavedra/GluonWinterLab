# GluonWinterLab
Software + Hardware for the Gluon Winter Lab 2016 in Ghent, Belgium

### Timelapse Raspberry Pi nodejs app

__Pre-requisites__
- debian wheezy OS on RPi
- NodeJS v10.32
- gphoto2
- pm2


__Installation__

* __Update packages__
  * `$ sudo apt-get update`
  * `$ sudo apt-get upgrade`
  * `$ sudo apt-get install tightvncserver`
  * `$ vncserver :1 #to start VNC`
* __Install Git__
  * `$ sudo apt-get install git`
* __Install Node__ `v0.10.39` via [nvm](https://github.com/creationix/nvm)
  * `$ sudo apt-get install build-essential libssl-dev`
  * `$ sudo apt-get install curl`
  * `$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.30.2/install.sh | sh`
  * `$ source ~/.profile`
  * `$ nvm install 0.10.39`    #crucial for gphoto2
  * `$ nvm use 0.10.39`
  * `$ nvm alias default 0.10.39`
  * `$ nvm use default`
  * `$ node -v`               #check that install worked
* __Install gphoto2__
  * `$ sudo apt-get install libgphoto2-2-dev`
  * `$ sudo reboot`            #quick reboot
* __Clone repo__ (first `$ cd` to correct folder)
  * `$ git clone https://github.com/jmsaavedra/volvox-microsoft.git`
* __Install package modules__
  * `$ npm install`
* __AuthKeys.js__
  * manually copy AuthKeys.js into the root folder (this is shared privately)
* __Install PM2__
  * `$ npm install pm2 -g`
  * `$ pm2 startup`            #follow directions if there is a reply from pm2!
  * `$ pm2 start startup.json` #run the app with pm2 startup script
  * `$ pm2 save`               #save this process to the startup scripts
  * `$ pm2 logs`               #tail console logs

### Mobile Sensor Hardware Design

### p5js Data Apps
