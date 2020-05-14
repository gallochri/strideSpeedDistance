const DEBUG = false;

const stripeSpeedDistance = require('./strideSpeedDistance');
const SSD = new stripeSpeedDistance.StrideSpeedDistance();

const speedMeter = require('./speedMeter');
const SM = new speedMeter.speedMeter(7);

const start = Date.now();
let prevTime = 0;
let distance = 0;
let calories = 0;

// TODO Fake cadence
const cadence = 180;            //  Stride/minute
// TODO Calorie calculation
const fakeCalories = 10;        //  calories per stride

function a() {
    const millis = Date.now() - start;
    const deltaTime = millis - prevTime;
    prevTime = millis;
    let speed = parseFloat(SM.getSpeed());

    /* DATA Page 1: Main Format
        Page 1 is the main data page for stride based speed and distance monitors.
        All SDMs shall send this page at a minimum rate of 2Hz.
        Most fields in this message are optional with the exception of bytes 0 and 6.
     */

    // Byte 2   Time - Integer sec  rollover 256
    let time_int = Math.floor(millis/1000) % 256;

    // Byte 1   Time - Fractional 1/200 sec
    let time_fractional = Math.floor((millis - (time_int*1000))/5);

    // Byte 3   Distance - Integer m rollover 256
    // TODO if distance is set Zwift will use it for speed calculation.
	let deltaDistance = speed*1000/3600000*deltaTime;
	if (isNaN(deltaDistance)){
		deltaDistance = 0;
	}
	distance += deltaDistance;
    let distance_int = Math.floor(distance) % 256;

    // Byte 4 - 4bit Distance - Fractional 1/16m
    let distance_fractional = Math.floor(((distance - distance_int)*1000)/62.5);
    let distance_fractional_bin = distance_fractional.toString(2);
    distance_fractional_bin = 0;    // Set to 0x00 when unused
    distance_fractional_bin = "0000".substr(distance_fractional_bin.length) + distance_fractional_bin;

    // Byte 4 - 4bit Instantaneous Speed-Integer m/s
    let speed_integer_bin = (Math.floor(speed*1000/3600)).toString(2);
    speed_integer_bin = "0000".substr(speed_integer_bin.length) + speed_integer_bin;

    // Bte 4 Distance - Fractional 1/16m + Instantaneous Speed-Integer m/s
    let byte4dec = parseInt(distance_fractional_bin + speed_integer_bin, 2).toString(10);

    // Byte 5 Speed - Fractional 1/256 m/s
    let speed_integer = Math.floor(speed*1000/3600);
    let speed_fractional = Math.floor((((speed*1000/3600)-speed_integer)*1000)/3.90625);

    // Byte 6 Stride Count REQUIRED incremented once for every two footfalls. rollover 256
    let stride = Math.floor((cadence / 2 / 60 / 1000) * millis) % 256;

    /* Data Page 3: Calories
    Data Page 3 follows the Page 2 Base Template format, and adds a field for calories.
    Most fields in this message are optional, however, if this data page is used,
    the calories (byte 6) field must be set.
     */

    // Byte 3 Cadence - Integer Measure of strides accumulated in time. Spm
    let cadence_int = Math.floor(cadence);

    // Byte 4 - 4bit Fractional cadence 1/16 Spm (first 4 bytes)
    let cadence_frac = Math.floor(((cadence-cadence_int)*1000)/62.5);
    let cadence_frac_bin = cadence_frac.toString(2);
    cadence_frac_bin = "0000".substr(cadence_frac_bin.length) + cadence_frac_bin;

    // Byte 4  Fractional cadence + Instantaneous Speed-Integer m/s
    let byte4dec2 = parseInt(cadence_frac_bin + speed_integer_bin, 2).toString(10);

    // Byte 6 Accumulated calories
    calories = (calories + fakeCalories) % 256;

    if (DEBUG){
        console.log(
            "T_frac:%s\t T_int:%s\t D_int:%s\t D_frac:%s\t Speed:%s\t S_int:%s\t S_frac:%s\t SC:%s\t Cadence:%s\t Calories: %s",
            time_fractional, time_int, distance_int, distance_fractional_bin, speed, speed_integer, speed_fractional,
            stride, cadence_int, calories);
    }

    SSD.broadcast(time_fractional, time_int, distance_int, byte4dec, speed_fractional, stride, cadence_int, byte4dec2, calories);
    // setTimeout(a,248); // 4.028Hz = 32768 / Period(8134)
    setTimeout(a,496);  // 2.056Hz minimum rate, comment for 4 Hz rate
}

a();
