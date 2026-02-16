/*
File:      github.com/ETmbit/intelino.ts
Copyright: ETmbit, 2026

License:
This file is part of the ETmbit extensions for MakeCode for micro:bit.
It is free software and you may distribute it under the terms of the
GNU General Public License (version 3 or later) as published by the
Free Software Foundation. The full license text you find at
https://www.gnu.org/licenses.

Disclaimer:
ETmbit extensions are distributed without any warranty.

Dependencies:
ETmbit/general
*/

///////////////////
//  INCLUDE      //
//  ledstrip.ts  //
///////////////////

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

///////////////////
//  END INCLUDE  //
///////////////////


let trackHandler: numhandler

let track1Handler: handler
let track2Handler: handler
let track3Handler: handler
let track4Handler: handler
let track5Handler: handler
let track6Handler: handler
let track7Handler: handler
let track8Handler: handler
let track9Handler: handler
let track10Handler: handler
let track11Handler: handler
let track12Handler: handler

let buttonUpHandler: handler
let buttonDownHandler: handler

let ALTUP = false
let ALTDOWN = false
const BUTTONUP = 98
const BUTTONDOWN = 99

enum Gate {
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

enum Position {
    //% block="I"
    //% block.loc.nl="I"
    Position1,
    //% block="II"
    //% block.loc.nl="II"
    Position2,
}

enum TrackId {
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

enum SwitchType {
    //% block="to the left"
    //% block.loc.nl="naar links"
    SwitchLeft = 0,
    //% block="to the right"
    //% block.loc.nl="naar rechts"
    SwitchRight = 1,
}

enum TrackType {
    //% block="speed"
    //% block.loc.nl="snelheid"
    Speed = 2,
    //% block="stopping place"
    //% block.loc.nl="halte"
    Pause = 3,
    //% block="uncoupler"
    //% block.loc.nl="ontkoppelaar"
    Uncouple = 4,
    //% block="uturn"
    //% block.loc.nl="omkering"
    Uturn = 5,
}

enum SwitchState {
    //% block="off"
    //% block.loc.nl="uit"
    Inactive = 0,
    //% block="straight ahead"
    //% block.loc.nl="rechtdoor"
    Straight = 1,
    //% block="bent"
    //% block.loc.nl="afslaan"
    Bent = 2,
}

enum TrackState {
    //% block="off"
    //% block.loc.nl="uit"
    Inactive = 0,
    //% block="slow"
    //% block.loc.nl="langzaam"
    Slow = 1,
    //% block="normal speed"
    //% block.loc.nl="normale snelheid"
    SNormal = 2,
    //% block="fast"
    //% block.loc.nl="snel"
    Fast = 3,
    //% block="short pause"
    //% block.loc.nl="korte pauze"
    Short = 4,
    //% block="normal pause"
    //% block.loc.nl="normale pauze"
    PNormal = 5,
    //% block="long pause"
    //% block.loc.nl="lange pauze"
    Long = 6,
    //% block="uncouple"
    //% block.loc.nl="ontkoppelen"
    Uncouple = 7,
    //% block="uturn"
    //% block.loc.nl="omkeren"
    Uturn = 8,
}

function handleRemote(msg: string) {
    let track = +msg
    ALTUP = false
    ALTDOWN = false
    if (track < 90) {
        if (track > 24) {
            ALTDOWN = true
            track -= 24
        }
        else
            if (track > 12) {
                ALTUP = true
                track -= 12
            }
    }
    if (trackHandler) trackHandler(track)
    switch (track) {
        case TrackId.Id1: if (track1Handler) track1Handler(); break;
        case TrackId.Id2: if (track2Handler) track2Handler(); break;
        case TrackId.Id3: if (track3Handler) track3Handler(); break;
        case TrackId.Id4: if (track4Handler) track4Handler(); break;
        case TrackId.Id5: if (track5Handler) track5Handler(); break;
        case TrackId.Id6: if (track6Handler) track6Handler(); break;
        case TrackId.Id7: if (track7Handler) track7Handler(); break;
        case TrackId.Id8: if (track8Handler) track8Handler(); break;
        case TrackId.Id9: if (track9Handler) track9Handler(); break;
        case TrackId.Id10: if (track10Handler) track10Handler(); break;
        case TrackId.Id11: if (track11Handler) track11Handler(); break;
        case TrackId.Id12: if (track12Handler) track12Handler(); break;
        case BUTTONUP: if (buttonUpHandler) buttonUpHandler(); break;
        case BUTTONDOWN: if (buttonDownHandler) buttonDownHandler(); break;
    }
}
General.registerMessageHandler("IR", handleRemote)

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

    interface Track {
        id: number
        type: number
        state: number
        gate: number
        position: number
        offset: number
        reverse: boolean
    }
    let tracks: Track[] = []

    function setSwitchColor(track: Track) {
        switch (track.state) {
            case SwitchState.Bent:
                leds[track.gate].setPixelColor(track.offset,
                    track.type == SwitchType.SwitchLeft ? Color.Red : Color.Blue)
                break
            case SwitchState.Straight:
                leds[track.gate].setPixelColor(track.offset, Color.Green)
                break
            default:
                leds[track.gate].setPixelColor(track.offset, Color.Black)
        }
        leds[track.gate].show()
    }

    function setTrackColor(track: Track) {
        leds[track.gate].setPixelColor(track.offset, Color.Black)
        leds[track.gate].setPixelColor(track.offset + 1, Color.Black)
        leds[track.gate].setPixelColor(track.offset + 2, Color.Black)

        if (track.state == TrackState.Inactive) {
            leds[track.gate].show()
            return
        }

        let color: Color
        switch (track.type) {
            case TrackType.Speed: color = Color.Green; break;
            case TrackType.Pause: color = Color.Red; break;
            case TrackType.Uncouple: color = Color.Yellow; break;
            case TrackType.Uturn: color = Color.Blue; break;
            default: color = Color.Black;
        }

        let pixel: number[] = (track.reverse ?
            [track.offset + 2, track.offset + 1, track.offset] :
            [track.offset, track.offset + 1, track.offset + 2])

        switch (track.state) {
            case TrackState.Fast:
            case TrackState.Long:
                leds[track.gate].setPixelColor(pixel[2], color)
            case TrackState.SNormal:
            case TrackState.PNormal:
                leds[track.gate].setPixelColor(pixel[1], color)
            case TrackState.Slow:
            case TrackState.Short:
            case TrackState.Uncouple:
            case TrackState.Uturn:
                leds[track.gate].setPixelColor(pixel[0], color)
        }
        leds[track.gate].show()
    }

    function setPixelOffset(gate: Gate) {
        let typcnt = [1, 1, 3, 3, 1, 1] // number of pixels per SwitchType/TrackType
        let offset = 0
        for (let i = 0; i < tracks.length; i++) {
            if (tracks[i].gate == gate && tracks[i].position == Position.Position1) {
                offset = typcnt[tracks[i].type]
                break
            }
        }
        for (let i = 0; i < tracks.length; i++) {
            if (tracks[i].gate == gate && tracks[i].position == Position.Position2) {
                tracks[i].offset = offset
                break
            }
        }
        for (let i = 0; i < tracks.length; i++) {
            if (tracks[i].gate == gate) {
                if (tracks[i].type == SwitchType.SwitchLeft ||
                    tracks[i].type == SwitchType.SwitchRight)
                    setSwitchColor(tracks[i])
                else
                    setTrackColor(tracks[i])
            }
        }
        leds[gate].show()
    }

    function getId(id: number): number {
        let i: number
        for (i = 0; i < tracks.length; i++)
            if (tracks[i].id == id) break
        if (i == tracks.length)
            tracks.push({ id: id, type: 0, state: 0, gate: 0, position: 0, offset: 0, reverse: false })
        return i
    }

    function trackType(state: TrackState): TrackType {
        switch (state) {
            case TrackState.Slow:
            case TrackState.SNormal:
            case TrackState.Fast: return TrackType.Speed
            case TrackState.Short:
            case TrackState.PNormal:
            case TrackState.Long: return TrackType.Pause
            case TrackState.Uncouple: return TrackType.Uncouple
            case TrackState.Uturn: return TrackType.Uturn
        }
        return TrackType.Speed
    }

    function nextTrackType(type: TrackType): TrackType {
        type += 1
        if (type > TrackType.Uturn) type = TrackType.Speed
        return type
    }

    function nextTrackState(type: TrackType, state: TrackState): TrackState {
        let test: TrackState
        if (state) {
            state += 1
            switch (type) {
                case TrackType.Speed: test = TrackState.Fast; break;
                case TrackType.Pause: test = TrackState.Long; break;
                case TrackType.Uncouple: test = TrackState.Uncouple; break;
                case TrackType.Uturn: test = TrackState.Uturn; break;
                default: state = 0
            }
            if (state > test) state = 0
        }
        else {
            switch (type) {
                case TrackType.Speed: state = TrackState.Slow; break;
                case TrackType.Pause: state = TrackState.Short; break;
                case TrackType.Uncouple: state = TrackState.Uncouple; break;
                case TrackType.Uturn: state = TrackState.Uturn; break;
                default: state = 0
            }
        }
        return state
    }

    function nextState(state: TrackState): TrackState {
        state += 1
        if (state > TrackState.Uturn) state = TrackState.Inactive
        return state
    }

    //% color="#FF8800"
    //% block="when pressing number %id"
    //% block.loc.nl="wanneer op nummer %id wordt gedrukt"
    export function onTrackId(id: TrackId, code: () => void): void {
        switch (id) {
            case TrackId.Id1: track1Handler = code; break;
            case TrackId.Id2: track2Handler = code; break;
            case TrackId.Id3: track3Handler = code; break;
            case TrackId.Id4: track4Handler = code; break;
            case TrackId.Id5: track5Handler = code; break;
            case TrackId.Id6: track6Handler = code; break;
            case TrackId.Id7: track7Handler = code; break;
            case TrackId.Id8: track8Handler = code; break;
            case TrackId.Id9: track9Handler = code; break;
            case TrackId.Id10: track10Handler = code; break;
            case TrackId.Id11: track11Handler = code; break;
            case TrackId.Id12: track12Handler = code; break;
        }
    }

    //% color="#FF8800"
    //% block="when the lower button is pressed"
    //% block.loc.nl="wanneer op de onderste knop wordt gedrukt"
    export function onButtonDown(code: () => void): void {
        buttonDownHandler = code
    }

    //% color="#FF8800"
    //% block="when the upper button is pressed"
    //% block.loc.nl="wanneer op de bovenste knop wordt gedrukt"
    export function onButtonUp(code: () => void): void {
        buttonUpHandler = code
    }

    //% block="pressed together with the lower button"
    //% block.loc.nl="samen met de onderste knop ingedrukt"
    export function isAltDown(): boolean {
        return ALTDOWN
    }

    //% block="pressed together with the upper button"
    //% block.loc.nl="samen met de bovenste knop ingedrukt"
    export function isAltUp(): boolean {
        return ALTUP
    }

    //% block="the lower button"
    //% block.loc.nl="de onderste knop"
    export function buttonDown(): number {
        return BUTTONDOWN
    }

    //% block="the upper button"
    //% block.loc.nl="de bovenste knop"
    export function buttonUp(): number {
        return BUTTONUP
    }

    //% block="set all tracks in opposite direction"
    //% block.loc.nl="zet alle baanvakken in omgekeerde richting"
    export function invertAllTracks() {
        for (let i = 0; i < tracks.length; i++) {
            if (tracks[i].type != SwitchType.SwitchLeft && tracks[i].type != SwitchType.SwitchRight) {
                tracks[i].reverse = !tracks[i].reverse
                setTrackColor(tracks[i])
            }
        }
    }

    //% block="set track %id in opposite direction"
    //% block.loc.nl="zet baanvak %id in omgekeerde richting"
    export function invertTrack(id: TrackId) {
        let i = getId(id)
        if (tracks[i].type != SwitchType.SwitchLeft && tracks[i].type != SwitchType.SwitchRight) {
            tracks[i].reverse = !tracks[i].reverse
            setTrackColor(tracks[i])
        }
    }

    //% block="change track %id into a next type"
    //% block.loc.nl="zet baanvak %id om in een volgend type"
    export function shiftType(id: TrackId) {
        let i = getId(id)
        if (tracks[i].type != SwitchType.SwitchLeft && tracks[i].type != SwitchType.SwitchRight) {
            tracks[i].type = nextTrackType(tracks[i].type)
            setPixelOffset(tracks[i].gate)
            switch (tracks[i].type) {
                case TrackType.Speed: tracks[i].state = TrackState.SNormal; break;
                case TrackType.Pause: tracks[i].state = TrackState.PNormal; break;
                case TrackType.Uncouple: tracks[i].state = TrackState.Uncouple; break;
                case TrackType.Uturn: tracks[i].state = TrackState.Uturn; break;
            }
            setTrackColor(tracks[i])
        }
    }

    //% block="set number %id to a next state"
    //% block.loc.nl="zet nummer %id in een volgende stand"
    export function shiftState(id: TrackId) {
        let i = getId(id)
        if (tracks[i].type == SwitchType.SwitchLeft || tracks[i].type == SwitchType.SwitchRight) {
            tracks[i].state = (tracks[i].state == SwitchState.Bent ? SwitchState.Straight : SwitchState.Bent)
            setSwitchColor(tracks[i])
        }
        else {
            let state = tracks[i].state + 1
            switch (tracks[i].type) {
                case TrackType.Speed:
                    if (state > TrackState.Fast) state = TrackState.Slow;
                    break;
                case TrackType.Pause:
                    if (state > TrackState.Long) state = TrackState.Short;
                    break;
                case TrackType.Uncouple:
                    state = (state > TrackState.Uncouple ? TrackState.Inactive : TrackState.Uncouple)
                    break;
                case TrackType.Uturn:
                    state = (state > TrackState.Uturn ? TrackState.Inactive : TrackState.Uturn)
                    break;
            }
            tracks[i].state = state
            setTrackColor(tracks[i])
        }
    }

    //% block="set track %id to state %state"
    //% block.loc.nl="zet baanvak %id in stand %state"
    export function setTrackState(id: TrackId, state: TrackState) {
        let i = getId(id)
        if (state == TrackState.Inactive)
            tracks[i].state = state
        else {
            let type = trackType(state)
            if (type != tracks[i].type) {
                tracks[i].type = type
                setPixelOffset(tracks[i].gate)
                tracks[i].state = state
            }
        }
        setTrackColor(tracks[i])
    }

    //% block="set switch %id to state %state"
    //% block.loc.nl="zet wissel %id in stand %state"
    export function setSwitchState(id: TrackId, state: SwitchState) {
        let i = getId(id)
        tracks[i].state = state
        setSwitchColor(tracks[i])
    }

    //% subcategory="Met parameter"
    //% block="change track %id into a next type"
    //% block.loc.nl="zet baanvak %id om in een volgend type"
    //% id.min=1 id.max=12 id.defl=1
    export function shiftTypePrm(id: number) {
        shiftType(id)
    }

    //% subcategory="Met parameter"
    //% block="set track %id in opposite direction"
    //% block.loc.nl="zet baanvak %id in omgekeerde richting"
    //% id.min=1 id.max=12 id.defl=1
    export function invertTrackPrm(id: number) {
        invertTrack(id)
    }

    //% subcategory="Met parameter"
    //% block="set number %id to a next state"
    //% block.loc.nl="zet nummer %id in een volgende stand"
    //% id.min=1 id.max=12 id.defl=1
    export function shiftStatePrm(id: number) {
        shiftState(id)
    }

    //% subcategory="Met parameter"
    //% block="set track %id to state %state"
    //% block.loc.nl="zet baanvak %id in stand %state"
    //% id.min=1 id.max=12 id.defl=1
    export function setTrackStatePrm(id: number, state: TrackState) {
        setTrackState(id, state)
    }

    //% subcategory="Met parameter"
    //% block="set switch %id to state %state"
    //% block.loc.nl="zet wissel %id in stand %state"
    //% id.min=1 id.max=12 id.defl=1
    export function setSwitchStatePrm(id: number, state: SwitchState) {
        setSwitchState(id, state)
    }

    //% subcategory="Met parameter"
    //% block="number %id is a switch"
    //% block.loc.nl="nummer %id is een wissel"
    //% id.min=1 id.max=12 id.defl=1
    export function isSwitchPrm(id: number) {
        let i = getId(id)
        return (tracks[i].type == SwitchType.SwitchLeft ||
            tracks[i].type == SwitchType.SwitchRight)
    }

    //% color="#FF8800"
    //% subcategory="Met parameter"
    //% block="when pressing number"
    //% block.loc.nl="bij het indrukken van nummer"
    //% draggableParameters="id"
    export function onTrackPrm(code: (id: number) => void): void {
        trackHandler = code
    }

    //% subcategory="Bij opstarten"
    //% block="connect %id as a %type to %gate %position"
    //% block.loc.nl="verbind %id als %type met %gate %position"
    //% inlineInputMode=inline
    export function connectTrack(id: TrackId, type: TrackType, gate: Gate, position: Position) {
        let i = getId(id)
        tracks[i].gate = gate
        tracks[i].position = position
        tracks[i].type = type
        tracks[i].reverse = false
        switch (type) {
            case TrackType.Speed: tracks[i].state = TrackState.SNormal; break;
            case TrackType.Pause: tracks[i].state = TrackState.Short; break;
            case TrackType.Uncouple: tracks[i].state = TrackState.Uncouple; break;
            case TrackType.Uturn: tracks[i].state = TrackState.Uturn; break;
        }
        setPixelOffset(tracks[i].gate)
        setTrackColor(tracks[i])
    }

    //% subcategory="Bij opstarten"
    //% block="connect %id as a switch %type to %gate %position"
    //% block.loc.nl="verbind %id als wissel %type met %gate %position"
    //% inlineInputMode=inline
    export function connectSwitch(id: TrackId, type: SwitchType, gate: Gate, position: Position) {
        let i = getId(id)
        tracks[i].gate = gate
        tracks[i].position = position
        tracks[i].type = type
        tracks[i].reverse = false
        tracks[i].state = SwitchState.Bent
        setPixelOffset(tracks[i].gate)
        setSwitchColor(tracks[i])
    }
}
