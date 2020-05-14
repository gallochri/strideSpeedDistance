'use strict';
const DEBUG = false;

const Ant = require('../../ant-plus');
const stick = new Ant.GarminStick3();

let StrideSpeedDistance = function () {
    const channel = 0;
    const deviceId = 1;
    stick.on('startup', function () {
        console.log('StartUp');
        console.log('Stick Max Channels:', stick.maxChannels);
        console.log('Stick can Scan:', stick.canScan);
        stick.write(Ant.Messages.assignChannel(channel, 'transmit'));
        stick.write(Ant.Messages.setDevice(channel, deviceId, 124, 1));
        stick.write(Ant.Messages.setFrequency(channel, 57));
        stick.write(Ant.Messages.setPeriod(channel, 8134));
        stick.write(Ant.Messages.openChannel(channel));
        console.log('Stride speed and cadence sensor started');
    });
    stick.on('shutdown', function () { console.log('ANT+ shutdown'); });

    if (!stick.open()) {
        console.log('ANT+ USB stick not found!');
    }

    this.stick = stick;
    this.channel = channel;
    this.event_count = 0;
};

StrideSpeedDistance.prototype.broadcast = function (time_fractional, time_int, distance_int, byte4dec, speed_fractional,
                                                    stride, cadence_int, byte4dec2, calories) {
    this.event_count++;
    
    // Page 1 optional Bytes
    time_fractional = 0x00;                             // 1 Set to 0x00 when unused
    time_int = 0x00;                                    // 2 Set to 0x00 when unused
    distance_int = 0x00;                                // 3 Set to 0x00 when unused
    // Byte 4 is optional set to 0x00 in start.js
    // speed_fractional = 0x00;                            // 5 Set to 0x00 when unused

    let pag1 = [];
    pag1.push(this.channel);                            // channel
    pag1.push(0x01);                                    // 0 Data Page Number
    pag1.push(time_fractional);                         // 1 Time Fractional (1/200 sec)
    pag1.push(time_int);                                // 2 Time Integer (sec)
    pag1.push(distance_int);                            // 3 Distance Integer (m)
    pag1.push(byte4dec);                                // 4 Distance Fractional (1/16 m) + Instantaneous Speed Integer (m/s)
    pag1.push(speed_fractional);                        // 5 Instantaneous Speed Fractional (1/256 m/s)
    pag1.push(stride);                                  // 6 Stride count
    pag1.push(0x00);                                    // 7 Update Latency (1/32 sec)

    let pag2 = [];
    pag2.push(this.channel);                            // channel
    pag2.push(0x02);                                    // 0 Data Page Number
    pag2.push(0xFF);                                    // 1 Reserved
    pag2.push(0xFF);                                    // 2 Reserved
    pag2.push(cadence_int);                             // 3 Cadence Integer Stride per minute
    pag2.push(byte4dec2);                               // 4 Cadence fractional + Instantaneous Speed - Integer
    pag2.push(speed_fractional);                        // 5 Instantaneous Speed Fractional (1/256 m/s)
    pag2.push(calories);                                // 6 Accumulated calories
    pag2.push(0x80);                                    // 7 Status 10 00 00 00

    this.stick.write(Ant.Messages.buildMessage(pag1, 0x4E)); //ANT_BROADCAST_DATA
    this.stick.write(Ant.Messages.buildMessage(pag2, 0x4E)); //ANT_BROADCAST_DATA

    if (DEBUG){
        console.log("Event: %s \t Stride Count: %s \t Distance Integer: %s m \t Time Integer: \t",
            this.event_count, stride, distance_int,time_int);
        console.log(Ant.Messages.buildMessage(pag1, 0x4E));
        console.log(Ant.Messages.buildMessage(pag2, 0x4E));
    }
}

module.exports.StrideSpeedDistance = StrideSpeedDistance;
