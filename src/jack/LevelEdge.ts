//
// Jumping Jack
// by Bruno Garcia <b@aduros.com>

import Vec2 from "box2d/common/math/Vec2";
import BodyType from "box2d/dynamics/BodyType";
import CreatorObject from "kit/creator/CreatorObject";
import Box2D from "kit/physics/Box2D";

import Player from "./Player";

/** A hitbox that warps the player to the other edge when touched. */
export default class LevelEdge extends CreatorObject
{
    /** The other level edge the player should wrap to. */
    otherEdge :LevelEdge;

    onStart () {
        var box2d = this.owner.getFromParents(Box2D);

        // Create and add a PhysicsBody from this creator object
        var physics = box2d.createObject(this.info);
        this.owner.add(physics);

        physics.body.setType(BodyType.StaticBody);

        physics.beginContact.connect(contact => {
            contact.setEnabled(false);

            if (!this._wrapEnabled) {
                return;
            }

            var other = physics.getContactOther(contact);
            var player = other.owner.get(Player);
            if (player != null) {
                var currentPos = other.body.getPosition();

                // Set the new X-coord to be the same as the other edge
                var newPos = new Vec2(box2d.toMeters(this.otherEdge.info.x), currentPos.y);

                // Disable the other edge's wrapping to prevent a feedback loop
                this.otherEdge._wrapEnabled = false;

                // Defer because we can't change body positions inside of a contact listener
                box2d.defer(() => {
                    other.body.setPosition(newPos);
                    other.resetTransform();
                });
            }
        });

        physics.endContact.connect(contact => {
            this._wrapEnabled = true;
        });
    }

    private _wrapEnabled = true;
}
