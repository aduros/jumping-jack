//
// Jumping Jack
// by Bruno Garcia <b@aduros.com>

import CreatorAction from "kit/creator/CreatorAction";
import Entity from "kit/Entity";

import Floor from "./Floor";
import Gap from "./Gap";

/** Adds a gap to the target floor, randomly on either the left or right side. */
export default class AddGapToFloor extends CreatorAction
{
    onRun (target :Entity) {
        var floor = target.get(Floor);
        var gap = new Gap();

        var movingRight = (Math.random() > 0.5);
        if (movingRight) {
            // Position on left and prepend
            gap.x = -gap.width;
            floor.getGaps().unshift(gap);

        } else {
            // Position on right and append
            gap.x = floor.info.width;
            gap.vel = -gap.vel;
            floor.getGaps().push(gap);
        }
    }
}
