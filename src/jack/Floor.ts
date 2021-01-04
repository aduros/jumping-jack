//
// Jumping Jack
// by Bruno Garcia <b@aduros.com>

import BodyType from "box2d/dynamics/BodyType";
import CreatorObject from "kit/creator/CreatorObject";
import Box2D from "kit/physics/Box2D";

import FloorSprite from "./FloorSprite";
import Gap from "./Gap";
import Player from "./Player";

/** A single level of floor, which can contain multiple gaps. */
export default class Floor extends CreatorObject
{
    onStart () {
        var box2d = this.owner.getFromParents(Box2D);

        // Create and add a PhysicsBody from this creator object
        var physics = box2d.createObject(this.info);
        this.owner.add(physics);

        physics.body.setType(BodyType.StaticBody);

        physics.preSolve.connect((contact, oldManifold) => {
            var other = physics.getContactOther(contact);
            var player = other.owner.get(Player);
            if (player == null) {
                return; // Ignore non-players
            }

            var numPoints = contact.getManifold().getPointCount();
            if (numPoints > 0) {
                var worldManifold = contact.getWorldManifold();
                var worldPoints = worldManifold.getPoints();

                for (var ii = 0; ii < numPoints; ++ii) {
                    var worldPoint = worldPoints[ii];
                    var x = box2d.toPixels(worldPoint.x);

                    if (this.hasGap(x)) {
                        // The player has touched a gap, disable the contact to allow them to pass
                        contact.setEnabled(false);

                        // If they were falling, also stun them
                        var falling = other.body.getLinearVelocity().y > 0;
                        if (falling) {
                            player.stun();
                        }

                        return;
                    }
                }
            }
        });

        // FloorSprite handles the display of this Floor
        var sprite = new FloorSprite(this);
        this.info.transformSprite(sprite);
        this.owner.add(sprite);
    }

    onUpdate (dt) {
        // Shift all the gaps based on their velocity, and handle collisions
        var prevGap :Gap = null;
        for (var ii = 0; ii < this._gaps.length; ++ii) {
            var gap = this._gaps[ii];

            gap.x += gap.vel*dt;

            if (prevGap != null) {
                if (prevGap.vel > 0 && gap.vel < 0 && prevGap.x+prevGap.width >= gap.x) {
                    // Bump with another gap, sending both in opposite directions
                    prevGap.invertDirection();
                    gap.invertDirection();
                }
            }

            if ((gap.vel > 0 && gap.x > this.info.width) || (gap.vel < 0 && gap.x+gap.width < 0)) {
                // Handle the gap going off-screen
                this._gaps.splice(ii--, 1);
            }

            prevGap = gap;
        }
    }

    hasGap (x :number) :boolean {
        for (var gap of this._gaps) {
            if (gap.x < x) {
                if (gap.x+gap.width > x) {
                    return true;
                }
            } else {
                break;
            }
        }
        return false;
    }

    @inline getGaps () {
        return this._gaps;
    }

    // All the gaps in this floor, sorted by x
    private _gaps :Array<Gap> = [];
}
