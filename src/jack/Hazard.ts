//
// Jumping Jack
// by Bruno Garcia <b@aduros.com>

import BodyType from "box2d/dynamics/BodyType";
import CreatorObject from "kit/creator/CreatorObject";
import Box2D from "kit/physics/Box2D";

import Player from "./Player";

/** A hazard moves left or right and will stun the player if touched. */
export default class Hazard extends CreatorObject
{
    /** The x-velocity of this hazard. */
    speed :number = 20;

    onStart () {
        var box2d = this.owner.getFromParents(Box2D);

        // Create and add a PhysicsBody from this creator object
        var physics = box2d.createObject(this.info);
        this.owner.add(physics);

        physics.body.setType(BodyType.KinematicBody);
        physics.body.getLinearVelocity().set(box2d.toMeters(this.speed), 0);

        physics.beginContact.connect(contact => {
            contact.setSensor(true);

            // If we started touching a Player, stun them
            var other = physics.getContactOther(contact);
            var player = other.owner.get(Player);
            if (player != null) {
                player.stun();
            }
        });
    }
}
