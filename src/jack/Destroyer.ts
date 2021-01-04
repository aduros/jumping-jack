//
// Jumping Jack
// by Bruno Garcia <b@aduros.com>

import BodyType from "box2d/dynamics/BodyType";
import CreatorObject from "kit/creator/CreatorObject";
import Box2D from "kit/physics/Box2D";

/** A hitbox that destroys whatever it touches. */
export default class Destroyer extends CreatorObject
{
    onStart () {
        var box2d = this.owner.getFromParents(Box2D);

        // Create and add a PhysicsBody from this creator object
        var physics = box2d.createObject(this.info);
        this.owner.add(physics);

        physics.body.setType(BodyType.StaticBody);

        physics.beginContact.connect(contact => {
            contact.setSensor(true);

            var other = physics.getContactOther(contact);
            if (other != null) {
                other.owner.dispose();
            }
        });
    }
}
