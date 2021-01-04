//
// Jumping Jack
// by Bruno Garcia <b@aduros.com>

import Graphics from "kit/display/Graphics";
import Sprite from "kit/display/Sprite";

import Floor from "./Floor";

/** Renders a Floor, with its gaps. */
export default class FloorSprite extends Sprite
{
    constructor (floor :Floor) {
        super();
        this._floor = floor;
    }

    draw (g :Graphics) {
        const COLOR = 0xffebcd;

        var width = this._floor.info.width;
        var height = this._floor.info.height;

        // Draw rectangles around all the gaps
        var x = 0.0;
        for (var gap of this._floor.getGaps()) {
            if (gap.x > x) {
                g.fillRect(COLOR, x, 0, gap.x-x, height);
            }
            x = gap.x + gap.width;
        }
        if (width > x) {
            g.fillRect(COLOR, x, 0, width-x, height);
        }
    }

    private _floor :Floor;
}
