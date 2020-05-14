const DEBUG = false;

const speedMeter = function (SensorPin){
    const gpio = require('rpi-gpio');
    
    const treadmillLength = 293;   //cm
    
    let watchDog = 0;
    let timePrev;
    let speed = 0;
    let prevSpeed = 0;

    gpio.setup(7, gpio.DIR_IN, gpio.EDGE_FALLING);	// Pin used on raspberry pi for sensor

    gpio.on('change', function (channel, value) {
        let timeDelta = Date.now() - timePrev;
        speed = ((((1000 / timeDelta) * 3600) * treadmillLength) / 100000).toFixed(1);
        timePrev = Date.now();
        watchDog = 0;
    });

    this.getSpeed = function () {
        if (watchDog === 0){
            watchDog = 2;
        } else if ( watchDog >= 2 && watchDog <= 20) {
            watchDog++;
            speed = prevSpeed;
        } else if (watchDog > 20 && watchDog < 30) {
            speed = (speed / 2).toFixed(1);
	    watchDog++;
        } else if (watchDog > 29) {
            speed = 0;
        }
        if (speed > 20){
            speed = prevSpeed;
        }
        if (DEBUG){
            console.log("PrevSpeed: %s Speed: %s Watchdog: %s", prevSpeed, speed, watchDog);
        }
        prevSpeed = speed;
        return speed;
    }
};
module.exports.speedMeter = speedMeter;
