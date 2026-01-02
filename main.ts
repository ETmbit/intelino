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

let key1Handler: handler
let key2Handler: handler
let key3Handler: handler
let key4Handler: handler
let key5Handler: handler
let key6Handler: handler
let key7Handler: handler
let key8Handler: handler
let key9Handler: handler
let key10Handler: handler
let key11Handler: handler
let key12Handler: handler

let buttonUpHandler: handler
let buttonDownHandler: handler

let ALTUP = false
let ALTDOWN = false
const BUTTONUP = 98
const BUTTONDOWN = 99

radio.onReceivedNumber(function (key: number) {
basic.showNumber(key)
    ALTUP = false
    ALTDOWN = false
    if (key < 90) {
        if (key > 24) {
            ALTUP = true
            key -= 24
        }
        else
        if (key > 12) {
            ALTDOWN = true
            key -= 12
        }
    }
if (ALTUP) basic.showArrow(ArrowNames.North)
if (ALTDOWN) basic.showArrow(ArrowNames.South)
    if (elementHandler) elementHandler(key)
    switch (key) {
        case Intelino.Id.Id1: if (key1Handler) key1Handler(); break;
        case Intelino.Id.Id2: if (key2Handler) key2Handler(); break;
        case Intelino.Id.Id3: if (key3Handler) key3Handler(); break;
        case Intelino.Id.Id4: if (key4Handler) key4Handler(); break;
        case Intelino.Id.Id5: if (key5Handler) key5Handler(); break;
        case Intelino.Id.Id6: if (key6Handler) key6Handler(); break;
        case Intelino.Id.Id7: if (key7Handler) key7Handler(); break;
        case Intelino.Id.Id8: if (key8Handler) key8Handler(); break;
        case Intelino.Id.Id9: if (key9Handler) key9Handler(); break;
        case Intelino.Id.Id10: if (key10Handler) key10Handler(); break;
        case Intelino.Id.Id11: if (key11Handler) key11Handler(); break;
        case Intelino.Id.Id12: if (key12Handler) key12Handler(); break;
        case BUTTONUP: if (buttonUpHandler) buttonUpHandler(); break;
        case BUTTONDOWN: if (buttonDownHandler) buttonDownHandler(); break;
    }
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
        //% block="A"
        //% block.loc.nl="A"
        Gate1,
        //% block="B"
        //% block.loc.nl="B"
        Gate2,
        //% block="C"
        //% block.loc.nl="C"
        Gate3,
        //% block="D"
        //% block.loc.nl="D"
        Gate4,
        //% block="E"
        //% block.loc.nl="E"
        Gate5,
        //% block="F"
        //% block.loc.nl="F"
        Gate6,
    }

    export enum Position {
        //% block="I"
        //% block.loc.nl="I"
        Position1,
        //% block="II"
        //% block.loc.nl="II"
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
    //% block="when receiving update of"
    //% block.loc.nl="bij een update van"
    //% draggableParameters="id"
    export function onElement(code: (id: number) => void): void {
        elementHandler = code
    }

    //% color="#FF8800"
    //% subcategory="Directe bediening"
    //% block="when receiving update of %id"
    //% block.loc.nl="bij een update van %id"
    export function onKey(id: Id, code: () => void): void {
        switch (id) {
            case Id.Id1: key1Handler = code; break;
            case Id.Id2: key2Handler = code; break;
            case Id.Id3: key3Handler = code; break;
            case Id.Id4: key4Handler = code; break;
            case Id.Id5: key5Handler = code; break;
            case Id.Id6: key6Handler = code; break;
            case Id.Id7: key7Handler = code; break;
            case Id.Id8: key8Handler = code; break;
            case Id.Id9: key9Handler = code; break;
            case Id.Id10: key10Handler = code; break;
            case Id.Id11: key11Handler = code; break;
            case Id.Id12: key12Handler = code; break;
        }
    }

    //% color="#FF8800"
    //% subcategory="Directe bediening"
    //% block="when lower yellow key is pressed"
    //% block.loc.nl="wanneer op de onderste gele knop gedrukt"
    export function onButtonDown(code: () => void): void {
        buttonDownHandler = code
    }

    //% color="#FF8800"
    //% subcategory="Directe bediening"
    //% block="when upper yellow key is pressed"
    //% block.loc.nl="wanneer op de bovenste gele knop gedrukt"
    export function onButtonUp(code: () => void): void {
        buttonUpHandler = code
    }

    //% block="together with the yellow upper button"
    //% block.loc.nl="samen met de bovenste gele knop"
    export function isAltUp(): boolean {
        return ALTUP
    }

    //% block="together with the yellow lower button"
    //% block.loc.nl="samen met de onderste gele knop"
    export function isAltDown(): boolean {
        return ALTDOWN
    }

    //% block="the yellow upper button"
    //% block.loc.nl="de bovenste gele knop"
    export function buttonUp(): number {
        return BUTTONUP
    }

    //% block="the yellow lower button"
    //% block.loc.nl="de onderste gele knop"
    export function buttonDown(): number {
        return BUTTONDOWN
    }

    //% subcategory="Directe bediening"
    //% block="set uturn %id to state %state"
    //% block.loc.nl="zet omkeren %id in stand %state"
    export function idUturn(id: Id, state: State) {
        let i = getId(id)
        setUturn(elements[i].gate, elements[i].offset, elements[i].state)
    }

    //% subcategory="Directe bediening"
    //% block="set uncouple %id to state %state"
    //% block.loc.nl="zet loskoppelen %id in stand %state"
    export function idUncouple(id: Id, state: State) {
        let i = getId(id)
        setUncouple(elements[i].gate, elements[i].offset, elements[i].state)
    }

    //% subcategory="Directe bediening"
    //% block="set pause %id to state %state"
    //% block.loc.nl="zet pauzeer %id in stand %state"
    export function idWait(id: Id, state: State) {
        let i = getId(id)
        setWait(elements[i].gate, elements[i].offset, elements[i].state, elements[i].reverse)
    }

    //% subcategory="Directe bediening"
    //% block="set speed %id to state %state"
    //% block.loc.nl="zet snelheid %id in stand %state"
    export function idSpeed(id: Id, state: State) {
        let i = getId(id)
        setSpeed(elements[i].gate, elements[i].offset, elements[i].state, elements[i].reverse)
    }

    //% subcategory="Directe bediening"
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
    //% id.min=1 id.max=12 id.defl=1
    export function idState(id: number, state: State) {
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

    //% block="set %id to a next state"
    //% block.loc.nl="zet %id in een volgende stand"
    //% id.min=1 id.max=12 id.defl=1
    export function idNextState(id: number) {
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
    export function idInvertAll() {
        for (let i = 0; i < elements.length; i++) {
            elements[i].reverse = !elements[i].reverse
            idState(elements[i].id, elements[i].state)
        }
    }

    //% block="turn %id in opposite direction"
    //% block.loc.nl="draai %id in omgekeerde richting"
    export function idInvert(id: Id) {
        let i = getId(id)
        elements[i].reverse = !elements[i].reverse
        idState(id, elements[i].state)
    }

    //% block="attach %id to %gate %position"
    //% block.loc.nl="verbind %id met %gate %position"
    export function idConnect(id: Id, gate: Gate, position: Position) {
        let i = getId(id)
        elements[i].gate = gate
        elements[i].position = position
        elements[i].state = State.Inactive
        setPixelOffset(gate)
    }

    //% block="make %id to be a %type"
    //% block.loc.nl="maak van %id een %type"
    export function idType(id: Id, type: Type) {
        let i = getId(id)
        elements[i].type = type
        switch (type) {
            case Type.Speed: elements[i].state = State.Normal; break;
            case Type.Wait: elements[i].state = State.Short; break;
            case Type.SwitchLeft: elements[i].state = State.Bent; break;
            case Type.SwitchRight: elements[i].state = State.Bent; break;
            case Type.Uncouple: elements[i].state = State.Active; break;
            case Type.Uturn: elements[i].state = State.Active; break;
        }
        setPixelOffset(elements[i].gate)
        idState(id, elements[i].state)
    }
}
