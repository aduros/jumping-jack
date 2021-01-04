//
// Jumping Jack
// by Bruno Garcia <b@aduros.com>

import BodyType from "box2d/dynamics/BodyType";
import EzScene from "ez/EzScene";
import CreatorObject from "kit/creator/CreatorObject";
import Box2D from "kit/physics/Box2D";

import Player from "./Player";

/** The end goal that wins the game. */
export default class Goal extends CreatorObject
{
    onStart () {
        var box2d = this.owner.getFromParents(Box2D);

        // Create and add a PhysicsBody from this creator object
        var physics = box2d.createObject(this.info);
        this.owner.add(physics);

        physics.body.setType(BodyType.StaticBody);

        physics.beginContact.connect(contact => {
            contact.setSensor(true);

            // If we started touching a Player, go to Win.scene
            var other = physics.getContactOther(contact);
            var player = other.owner.get(Player);
            if (player != null) {
                var director = this.owner.getDirectorFromParents();
                director.unwindToScene(new EzScene("Win"));
            }
        });
    }
}
