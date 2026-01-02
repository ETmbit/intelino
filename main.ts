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
            if (pixel < 0 || pixel >= 8)
                return;
            let rgb = fromColor(color)
            let red = (rgb >> 16) & 0xFF;
            let green = (rgb >> 8) & 0xFF;
            let blue = (rgb) & 0xFF;
            this.setPixelRGB(pixel, red, green, blue, white)
        }

        setRGB(red: number, green: number, blue: number, white: number = 0) {
            for (let i = 0; i < 8; ++i)
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

///////////////////////
//###################//
//##               ##//
//##  intelino.ts  ##//
//##               ##//
//###################//
///////////////////////

let elementHandler: prmhandler

radio.onReceivedNumber(function (key: number) {
    if (elementHandler) elementHandler(key)
})

//% color="#FFCC00" icon="\uf238"
//% block="Intelino"
//% block.loc.nl="Intelino"
namespace Intelino {

    // per gate there are 2 positions of max 3 leds each
    let leds: Ledstrip.Device[] = []
    leds.push(Ledstrip.create(DigitalPin.P0, 6))
    leds.push(Ledstrip.create(DigitalPin.P1, 6))
    leds.push(Ledstrip.create(DigitalPin.P2, 6))
    leds.push(Ledstrip.create(DigitalPin.P13, 6))
    leds.push(Ledstrip.create(DigitalPin.P14, 6))
    leds.push(Ledstrip.create(DigitalPin.P15, 6))

    export enum Id {
        //% block="1"
        //% block.loc.nl="1"
        Id1 = 1,
        //% block="2"
        //% block.loc.nl="2"
        Id2 = 2,
        //% block="3"
        //% block.loc.nl="3"
        Id3 = 3,
        //% block="4"
        //% block.loc.nl="4"
        Id4 = 4,
        //% block="5"
        //% block.loc.nl="5"
        Id5 = 5,
        //% block="6"
        //% block.loc.nl="6"
        Id6 = 6,
        //% block="7"
        //% block.loc.nl="7"
        Id7 = 7,
        //% block="8"
        //% block.loc.nl="8"
        Id8 = 8,
        //% block="9"
        //% block.loc.nl="9"
        Id9 = 9,
        //% block="10"
        //% block.loc.nl="10"
        Id10 = 10,
        //% block="11"
        //% block.loc.nl="11"
        Id11 = 11,
        //% block="12"
        //% block.loc.nl="12"
        Id12 = 12,
    }

    export enum Gate {
        //% block="gate A"
        //% block.loc.nl="poort A"
        Gate1,
        //% block="gate B"
        //% block.loc.nl="poort B"
        Gate2,
        //% block="gate C"
        //% block.loc.nl="poort C"
        Gate3,
        //% block="gate D"
        //% block.loc.nl="poort D"
        Gate4,
        //% block="gate E"
        //% block.loc.nl="poort E"
        Gate5,
        //% block="gate F"
        //% block.loc.nl="poort 7"
        Gate6,
    }

    export enum Position {
        //% block="line I"
        //% block.loc.nl="lijn I"
        Position1,
        //% block="line II"
        //% block.loc.nl="lijn II"
        Position2,
    }

    export enum Type {
        //% block="speed control"
        //% block.loc.nl="snelheidsregelaar"
        Speed,
        //% block="stopping place"
        //% block.loc.nl="halte"
        Wait,
        //% block="switch to the left"
        //% block.loc.nl="wissel naar links"
        SwitchLeft,
        //% block="switch to the right"
        //% block.loc.nl="wissel naar rechts"
        SwitchRight,
        //% block="uncoupler"
        //% block.loc.nl="ontkoppelaar"
        Uncouple,
        //% block="uturn"
        //% block.loc.nl="omkering"
        Uturn,
    }

    export enum State {
        //% block="off"
        //% block.loc.nl="uit"
        Inactive = 0,
        //% block="on"
        //% block.loc.nl="aan"
        Active = 1,
        //% block="normal"
        //% block.loc.nl="normaal"
        Normal = 2,
        //% block="slow"
        //% block.loc.nl="langzaam"
        Slow = 1,
        //% block="fast"
        //% block.loc.nl="snel"
        Fast = 3,
        //% block="short"
        //% block.loc.nl="kort"
        Short = 1,
        //% block="long"
        //% block.loc.nl="lang"
        Long = 3,
        //% block="bent"
        //% block.loc.nl="afslaan"
        Bent = 1,
        //% block="straight ahead"
        //% block.loc.nl="rechtdoor"
        Straight = 2,
    }

    interface Element {
        id: number
        type: Type
        state: State
        gate: Gate
        position: Position
        offset: number
        reverse: boolean
    }
    let elements: Element[] = []

    function setPixelOffset(gate: Gate) {
        let typcnt = [3, 3, 1, 1, 1, 1] // number of pixels per element type
        let offset = 0
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].gate == gate && elements[i].position == Position.Position1) {
                offset = typcnt[elements[i].type]
                break
            }
        }
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].gate == gate && elements[i].position == Position.Position2) {
                elements[i].offset = offset
                break
            }
        }
    }

    function setSpeed(gate: Gate, pixel: number, state: State, reverse: boolean) {
        leds[gate].setPixelColor(pixel, Color.Black)
        leds[gate].setPixelColor(pixel + 1, Color.Black)
        leds[gate].setPixelColor(pixel + 2, Color.Black)
        if (reverse) {
            switch (state) {
                // no individual break after the next cases
                case State.Fast: leds[gate].setPixelColor(pixel, Color.Green)
                case State.Normal: leds[gate].setPixelColor(pixel + 1, Color.Green)
                case State.Slow: leds[gate].setPixelColor(pixel + 2, Color.Green)
                    break
            }
        }
        else {
            switch (state) {
                // no individual break after the next cases
                case State.Fast: leds[gate].setPixelColor(pixel + 2, Color.Green)
                case State.Normal: leds[gate].setPixelColor(pixel + 1, Color.Green)
                case State.Slow: leds[gate].setPixelColor(pixel, Color.Green)
                    break
            }
        }
        leds[gate].show()
    }

    function setWait(gate: Gate, pixel: number, state: State, reverse: boolean) {
        leds[gate].setPixelColor(pixel, Color.Black)
        leds[gate].setPixelColor(pixel + 1, Color.Black)
        leds[gate].setPixelColor(pixel + 2, Color.Black)
        if (reverse) {
            switch (state) {
                // no individual break after the next cases
                case State.Long: leds[gate].setPixelColor(pixel, Color.Red)
                case State.Normal: leds[gate].setPixelColor(pixel + 1, Color.Red)
                case State.Short: leds[gate].setPixelColor(pixel + 2, Color.Red)
                    break
            }
        }
        else {
            switch (state) {
                // no individual break after the next cases
                case State.Long: leds[gate].setPixelColor(pixel + 2, Color.Red)
                case State.Normal: leds[gate].setPixelColor(pixel + 1, Color.Red)
                case State.Short: leds[gate].setPixelColor(pixel, Color.Red)
                    break
            }
        }
        leds[gate].show()
    }

    function setSwitchLeft(gate: Gate, pixel: number, state: State) {
        switch (state) {
            case State.Inactive:
                leds[gate].setPixelColor(pixel, Color.Black)
                break
            case State.Bent:
                leds[gate].setPixelColor(pixel, Color.Red)
                break
            case State.Straight:
                leds[gate].setPixelColor(pixel, Color.Green)
                break
        }
        leds[gate].show()
    }

    function setSwitchRight(gate: Gate, pixel: number, state: State) {
        switch (state) {
            case State.Inactive:
                leds[gate].setPixelColor(pixel, Color.Black)
                break
            case State.Bent:
                leds[gate].setPixelColor(pixel, Color.Blue)
                break
            case State.Straight:
                leds[gate].setPixelColor(pixel, Color.Green)
                break
        }
        leds[gate].show()

    }

    function setUncouple(gate: Gate, pixel: number, state: State) {
        switch (state) {
            case State.Inactive:
                leds[gate].setPixelColor(pixel, Color.Black)
                break
            case State.Active:
                leds[gate].setPixelColor(pixel, Color.Yellow)
                break
        }
        leds[gate].show()
    }

    function setUturn(gate: Gate, pixel: number, state: State) {
        switch (state) {
            case State.Inactive:
                leds[gate].setPixelColor(pixel, Color.Black)
                break
            case State.Active:
                leds[gate].setPixelColor(pixel, Color.Blue)
                break
        }
        leds[gate].show()
    }

    function getNextState(type: Type, state: State): State {
        state += 1
        switch (type) {
            case Type.Speed: if (state < State.Slow || state > State.Fast)
                state = State.Slow
                break
            case Type.Wait: if (state < State.Short || state > State.Long)
                state = State.Short
                break
            case Type.SwitchLeft:
            case Type.SwitchRight: if (state < State.Bent || state > State.Straight)
                state = State.Bent
                break
            case Type.Uncouple:
            case Type.Uturn: if (state < State.Inactive || state > State.Active)
                state = State.Inactive
                break
            default: state = State.Inactive
        }
        return state
    }

    function getId(id: number): number {
        let i: number
        for (i = 0; i < elements.length; i++)
            if (elements[i].id == id) break
        if (i == elements.length)
            elements.push({
                id: id, type: Type.Speed, state: State.Inactive, gate: Gate.Gate1,
                position: Position.Position1, offset: 0, reverse: false
            })
        return i
    }

    //% color="#FF8800"
    //% blockId=onElementBlock
    //% block="when receiving key"
    //% block.loc.nl="wanneer knop wordt ontvangen"
    export function onElement(code: (id: number) => void): void {
        elementHandler = code
    }

    //% subcategory="Bediening"
    //% block="set uturn %id to state %state"
    //% block.loc.nl="zet omkeren %id in stand %state"
    export function idUturn(id: Id, state: State) {
        let i = getId(id)
        setUturn(elements[i].gate, elements[i].offset, elements[i].state)
    }

    //% subcategory="Bediening"
    //% block="set uncouple %id to state %state"
    //% block.loc.nl="zet loskoppelen %id in stand %state"
    export function idUncouple(id: Id, state: State) {
        let i = getId(id)
        setUncouple(elements[i].gate, elements[i].offset, elements[i].state)
    }

    //% subcategory="Bediening"
    //% block="set pause %id to state %state"
    //% block.loc.nl="zet pauzeer %id in stand %state"
    export function idWait(id: Id, state: State) {
        let i = getId(id)
        setWait(elements[i].gate, elements[i].offset, elements[i].state, elements[i].reverse)
    }

    //% subcategory="Bediening"
    //% block="set speed %id to state %state"
    //% block.loc.nl="zet snelheid %id in stand %state"
    export function idSpeed(id: Id, state: State) {
        let i = getId(id)
        setSpeed(elements[i].gate, elements[i].offset, elements[i].state, elements[i].reverse)
    }

    //% subcategory="Bediening"
    //% block="set switch %id to state %state"
    //% block.loc.nl="zet wissel %id in stand %state"
    export function idSwitch(id: Id, state: State) {
        let i = getId(id)
        if (elements[i].type == Type.SwitchLeft)
            setSwitchLeft(elements[i].gate, elements[i].offset, elements[i].state)
        else
            setSwitchRight(elements[i].gate, elements[i].offset, elements[i].state)
    }

    //% block="set %id to state %state"
    //% block.loc.nl="zet %id in stand %state"
    export function idState(id: Id, state: State) {
        let i = getId(id)
        elements[i].state = state
        switch (elements[i].type) {
            case Type.Speed:
                setSpeed(elements[i].gate, elements[i].offset, elements[i].state, elements[i].reverse)
                break
            case Type.Wait:
                setWait(elements[i].gate, elements[i].offset, elements[i].state, elements[i].reverse)
                break
            case Type.SwitchLeft:
                setSwitchLeft(elements[i].gate, elements[i].offset, elements[i].state)
                break
            case Type.SwitchRight:
                setSwitchRight(elements[i].gate, elements[i].offset, elements[i].state)
                break
            case Type.Uncouple:
                setUncouple(elements[i].gate, elements[i].offset, elements[i].state)
                break
            case Type.Uturn:
                setUturn(elements[i].gate, elements[i].offset, elements[i].state)
                break
        }
    }

    //% block="set %id to the next state"
    //% block.loc.nl="zet %id in de volgende stand"
    export function idNextState(id: Id) {
        let i = getId(id)
        elements[i].state = getNextState(elements[i].type, elements[i].state)
        switch (elements[i].type) {
            case Type.Speed:
                setSpeed(elements[i].gate, elements[i].offset, elements[i].state, elements[i].reverse)
                break
            case Type.Wait:
                setWait(elements[i].gate, elements[i].offset, elements[i].state, elements[i].reverse)
                break
            case Type.SwitchLeft:
                setSwitchLeft(elements[i].gate, elements[i].offset, elements[i].state)
                break
            case Type.SwitchRight:
                setSwitchRight(elements[i].gate, elements[i].offset, elements[i].state)
                break
            case Type.Uncouple:
                setUncouple(elements[i].gate, elements[i].offset, elements[i].state)
                break
            case Type.Uturn:
                setUturn(elements[i].gate, elements[i].offset, elements[i].state)
                break
        }
    }

    //% block="turn all codes in opposite direction"
    //% block.loc.nl="draai alle codes in omgekeerde richting"
    function idInvertAll() {
        for (let i = 0; i < elements.length; i++) {
            elements[i].reverse = !elements[i].reverse
            idState(elements[i].id, elements[i].state)
        }
    }

    //% block="turn %id in opposite direction"
    //% block.loc.nl="draai %id in omgekeerde richting"
    function idInvert(id: Id) {
        let i = getId(id)
        elements[i].reverse = !elements[i].reverse
        idState(id, elements[i].state)
    }

    //% block="attach %id to gate %gate, line %position"
    //% block.loc.nl="verbind %id met poort %gate, lijn %position"
    export function idConnect(id: Id, gate: Gate, position: Position) {
        let i = getId(id)
        elements[i].gate = gate
        elements[i].position = position
        setPixelOffset(gate)
    }

    //% block="make %id to be a %type"
    //% block.loc.nl="maak van %id een %type"
    export function idType(id: Id, type: Type) {
        let i = getId(id)
        elements[i].type = type
        setPixelOffset(elements[i].gate)
    }
}
