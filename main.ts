///////////////////////
//###################//
//##               ##//
//##  ledstrip.ts  ##//
//##               ##//
//###################//
///////////////////////

enum NeopixelMode {
    GRB = 1,
    RGBW = 2,
    RGB = 3
}

namespace Ledstrip {

    export class Device {

        pin: DigitalPin
        max: number
        mode: NeopixelMode
        buffer: Buffer
        size: number
        bright: number = 10

        constructor(pin: DigitalPin, leds: number, mode: NeopixelMode) {
            this.pin = pin
            this.max = leds - 1
            this.mode = mode
            this.size = leds * (mode == NeopixelMode.RGBW ? 4 : 3)
            this.buffer = pins.createBuffer(this.size)
        }

        show() {
            light.sendWS2812Buffer(this.buffer, this.pin)
        }

        setPixelRGB(offset: number, red: number, green: number, blue: number, white: number = 0): void {
            offset *= (this.mode == NeopixelMode.RGBW ? 4 : 3)
            switch (this.mode) {
                case NeopixelMode.GRB:
                    this.buffer[offset + 0] = Math.floor(green * this.bright / 100)
                    this.buffer[offset + 1] = Math.floor(red * this.bright / 100);
                    this.buffer[offset + 2] = Math.floor(blue * this.bright / 100);
                    break;
                case NeopixelMode.RGB:
                    this.buffer[offset + 0] = Math.floor(red * this.bright / 100);
                    this.buffer[offset + 1] = Math.floor(green * this.bright / 100);
                    this.buffer[offset + 2] = Math.floor(blue * this.bright / 100);
                    break;
                case NeopixelMode.RGBW:
                    this.buffer[offset + 0] = Math.floor(red * this.bright / 100);
                    this.buffer[offset + 1] = Math.floor(green * this.bright / 100);
                    this.buffer[offset + 2] = Math.floor(blue * this.bright / 100);
                    this.buffer[offset + 3] = Math.floor(white * this.bright / 100);
                    break;
            }
        }

        setPixelColor(pixel: number, color: Color, white: number = 0): void {
            if (pixel < 0 || pixel >= this.max)
                return;
            let rgb = fromColor(color)
            let red = (rgb >> 16) & 0xFF;
            let green = (rgb >> 8) & 0xFF;
            let blue = (rgb) & 0xFF;
            this.setPixelRGB(pixel, red, green, blue, white)
        }

        setRGB(red: number, green: number, blue: number, white: number = 0) {
            for (let i = 0; i < this.max; ++i)
                this.setPixelRGB(i, red, green, blue, white)
        }

        setColor(color: Color, white: number = 0) {
            let rgb = fromColor(color)
            let red = (rgb >> 16) & 0xFF;
            let green = (rgb >> 8) & 0xFF;
            let blue = (rgb) & 0xFF;
            for (let i = 0; i < 8; ++i)
                this.setPixelRGB(i, red, green, blue, white)
        }

        setClear(): void {
            this.buffer.fill(0, 0, this.size);
        }

        setBrightness(brightness: number) {
            if (brightness < 0) brightness = 0
            if (brightness > 100) brightness = 100
            // small steps at low brightness and big steps at high brightness
            brightness = (brightness ^ 2 / 100)
            this.bright = brightness
        }

        setRotate(rotation: Rotate): void {
            let offset = (this.mode == NeopixelMode.RGBW ? 4 : 3)
            if (rotation == Rotate.Clockwise)
                this.buffer.rotate(-offset, 0, this.size)
            else
                this.buffer.rotate(offset, 0, this.size)
        }

        rainbow(rotation: Rotate, pace: Pace = Pace.Normal) {
            if (rotation == Rotate.Clockwise) {
                this.setPixelColor(0, Color.Red)
                this.setPixelColor(1, Color.Orange)
                this.setPixelColor(2, Color.Yellow)
                this.setPixelColor(3, Color.Green)
                this.setPixelColor(4, Color.Blue)
                this.setPixelColor(5, Color.Indigo)
                this.setPixelColor(6, Color.Violet)
                this.setPixelColor(7, Color.Purple)
            }
            else {
                this.setPixelColor(7, Color.Red)
                this.setPixelColor(6, Color.Orange)
                this.setPixelColor(5, Color.Yellow)
                this.setPixelColor(4, Color.Green)
                this.setPixelColor(3, Color.Blue)
                this.setPixelColor(2, Color.Indigo)
                this.setPixelColor(1, Color.Violet)
                this.setPixelColor(0, Color.Purple)
            }
            this.show()
            basic.pause(pace)
            pace = (pace + 1) * 75
            for (let i = 0; i < this.max; i++) {
                this.setRotate(rotation)
                this.show()
                basic.pause(pace)
            }
        }

        snake(color: Color, rotation: Rotate, pace: Pace = Pace.Normal) {
            let rgb = fromColor(color)
            let red = (rgb >> 16) & 0xFF;
            let green = (rgb >> 8) & 0xFF;
            let blue = (rgb) & 0xFF;
            this.setClear();
            this.show()
            pace = (pace + 1) * 75
            for (let i = this.max; i >= 0; i--) {
                if (rotation == Rotate.Clockwise)
                    this.setPixelRGB(this.max - i, red, green, blue)
                else
                    this.setPixelRGB(i, red, green, blue)
                this.show()
                basic.pause(pace)
            }
            this.show()
            for (let i = this.max - 1; i >= 0; i--) {
                if (rotation == Rotate.Clockwise)
                    this.setPixelRGB(this.max - i, 0, 0, 0)
                else
                    this.setPixelRGB(i, 0, 0, 0)
                this.show()
                basic.pause(pace)
            }
            if (rotation == Rotate.Clockwise)
                this.setPixelRGB(0, 0, 0, 0)
            else
                this.setPixelRGB(this.max, 0, 0, 0)
            this.show()
            basic.pause(pace)
        }
    }

    export function create(pin: DigitalPin, leds: number, mode: NeopixelMode = NeopixelMode.GRB): Device {
        let device = new Device(pin, leds, mode)
        return device
    }
}


/////////////////////
//#################//
//##             ##//
//## intelino.ts ##//
//##             ##//
//#################//
/////////////////////

// IMPORTANT NOTE:
// A CONTROLLER MUST AND MAY ONLY CALL setController
// A HUB MAY NEVER CALL setController

enum Switch {
    Straight = 0,
    Left = 1,
    Right = 2,
}

enum Uncouple {
    On = 3,
    Off = 4,
}
enum Speed {
    Fast = 5,
    Normal = 6,
    Slow = 7,
}

enum Pause {
    Long = 8,
    Normal = 9,
    Short = 10,
}

enum Led {
    L1,
    L2,
    L3,
    L4,
    L5,
    L6,
    L7,
    L8,
    L9,
    L10,
    L11,
    L12,
}

enum Port {
    P1,
    P2,
    P3,
    P4,
}

enum Controller {
    C1,
    C2,
    C3,
    C4,
    C5,
    C6,
    C7,
    C8,
    C9,
    C10,
    C11,
    C12,
    C13,
    C14,
    C15,
    C16,
    C17,
    C18,
    C19,
    C20,
}

let PORT1: Ledstrip.Device
let PORT2: Ledstrip.Device
let PORT3: Ledstrip.Device
let PORT4: Ledstrip.Device

let CONTROLLERID: Controller = 0

interface Service {
    _id: number
    _controller: number
    _port: number
    _firstled: number
    _state: number
}

const dummy: Service = {_id: 0, _controller: 0, _port: 0, _firstled: 0, _state: 0}

let CONTROLLER: Service[] = []

// states:      15 (3xSwitch, 2xUncouple, 3xSpeed, 3xPause, 4xReserved)
// led bases:   0, 15, ..., 180 (12 leds per port)
// port bases:  0, 200, 400, 600 (4 ports per hub)
// hub bases:   0, 1000, 2000, 3000, ..., 19000 (20 hubs)

function msgBase(id: number): number {
    let base: number
    for (let i = 0; i < CONTROLLER.length; i++)
        if (CONTROLLER[i]._id == id) {
            base = CONTROLLER[i]._controller * 1000 +
                (CONTROLLER[i]._port * 200 + CONTROLLER[i]._firstled) * 15
            return base
        }
    return 0
}

function msgService(msg: number): Service {
    let service: Service = dummy
    service._id = 0
    service._controller = Math.floor(msg / 1000)
    msg = msg - service._controller * 1000
    service._port = Math.floor(msg / 200)
    msg = msg - service._port * 200
    service._firstled = Math.floor(msg / 15)
    service._state = msg - service._firstled * 15
    return service
}

//% color="#FFC90E" icon="\uf207"
//% block="Intelino"
//% block.loc.nl="Intelino"
namespace Intelino {

    //% block="attach IC %id to: controller %controller, port %port, led %firstled"
    //% block.loc.nl="wijs IC %id toe aan: controller %controller, poort %port, led %firstled"
    //% port.min=1 port.max=4 firstled.min=1 firstled.max=12
    export function addController(id: number, controller: Controller, port: Port, firstled: Led) {
        CONTROLLER.push( {_id: id, _controller: controller,
                            _port: port, _firstled: firstled, _state: -1})
    }

    //% block="uncoupling at IC %id is: %state "
    //% block.loc.nl="ontkoppeling bij IC %id is: %state"
    export function trainUngear(id: number, state: Uncouple) {
        radio.sendNumber(msgBase(id) + state)
    }

    //% block="speed at IC %id is: %speed "
    //% block.loc.nl="snelheid bij IC %id is: %speed"
    export function trainSpeed(id: number, speed: Speed) {
        radio.sendNumber(msgBase(id) + speed)
    }

    //% block="stop at IC %id is: %speed "
    //% block.loc.nl="stop bij IC %id is: %speed"
    export function trackPause(id: number, time: Pause) {
        radio.sendNumber(msgBase(id) + time)
    }

    //% block="switch at IC %id is: %speed "
    //% block.loc.nl="wissel bij IC %id is: %speed"
    export function trackSwitch(id: number, direction: Switch) {
basic.showNumber(msgBase(id) + direction)
        radio.sendNumber(msgBase(id) + direction)
    }
}

// CONTROLLER CODE
// A CONTROLLER MUST AND MAY ONLY CALL setController

function setController(controller: Controller) {
    CONTROLLERID = controller
    PORT1 = Ledstrip.create(DigitalPin.P20, 25)
    PORT2 = Ledstrip.create(DigitalPin.P0, 25)
    PORT3 = Ledstrip.create(DigitalPin.P1, 25)
    PORT4 = Ledstrip.create(DigitalPin.P2, 25)
    PORT1.setClear(); PORT1.show()
    PORT2.setClear(); PORT1.show()
    PORT3.setClear(); PORT1.show()
    PORT4.setClear(); PORT1.show()
}

messageHandler = (msg: number) => {
    if (!CONTROLLERID) return
    let service = msgService(msg)
    let color: Color
    let leds = 1
    let maxleds = 1
basic.showNumber(CONTROLLERID)
basic.showNumber(service._controller)
    if (service._controller == CONTROLLERID) {
        switch (service._state) {
            case Switch.Straight: color = Color.Green; break;
            case Switch.Left: color = Color.Red; break;
            case Switch.Right: color = Color.Blue; break;
            case Uncouple.On: color = Color.Yellow; break;
            case Uncouple.Off: color = Color.Black; break;
            case Speed.Fast:
            case Speed.Normal:
            case Speed.Slow: color = Color.Green; maxleds = 3; break;
            case Pause.Long:
            case Pause.Normal:
            case Pause.Short: color = Color.Red; maxleds = 3; break;
        }
        switch (service._state) {
            case Speed.Fast:
            case Pause.Long: leds = 3; break;
            case Speed.Normal:
            case Pause.Normal: leds = 2; break;
        }
        switch (service._port) {
            case 0:
                    for (let i = 0; i < leds; i++)
                        PORT1.setPixelColor(service._firstled + i, color)
                    for (let i = leds; i < maxleds; i++)
                        PORT1.setPixelColor(service._firstled + i, Color.Black)
                    PORT1.show()
                    break;
            case 1: 
                    for (let i = 0; i < leds; i++)
                        PORT2.setPixelColor(service._firstled + i, color)
                    for (let i = leds; i < maxleds; i++)
                        PORT2.setPixelColor(service._firstled + i, Color.Black)
                    PORT2.show()
                    break;
            case 2:
                    for (let i = 0; i < leds; i++)
                        PORT3.setPixelColor(service._firstled + i, color)
                    for (let i = leds; i < maxleds; i++)
                        PORT3.setPixelColor(service._firstled + i, Color.Black)
                    PORT3.show()
                    break;
            case 3:
                    for (let i = 0; i < leds; i++)
                        PORT4.setPixelColor(service._firstled + i, color)
                    for (let i = leds; i < maxleds; i++)
                        PORT4.setPixelColor(service._firstled + i, Color.Black)
                    PORT4.show()
                    break;
        }
    }
}
