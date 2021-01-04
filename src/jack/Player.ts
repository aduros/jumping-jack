//
// Jumping Jack
// by Bruno Garcia <b@aduros.com>

import CircleShape from "box2d/collision/shapes/CircleShape";
import PolygonShape from "box2d/collision/shapes/PolygonShape";
import Vec2 from "box2d/common/math/Vec2";
import Fixture from "box2d/dynamics/Fixture";
import FixtureDef from "box2d/dynamics/FixtureDef";
import EzScene from "ez/EzScene";
import CreatorObject from "kit/creator/CreatorObject";
import ObjectSprite from "kit/creator/ObjectSprite";
import PropertyBag from "kit/creator/PropertyBag";
import Sprite from "kit/display/Sprite";
import Entity from "kit/Entity";
import Key from "kit/input/Key";
import Box2D from "kit/physics/Box2D";
import PhysicsBody from "kit/physics/PhysicsBody";
import System from "kit/System";
import Value from "kit/util/Value";

import { CharacterFacing } from "./CharacterFacing";
import { WalkState } from "./WalkState";

/** Our bold hero. */
export default class Player extends CreatorObject
{
    /** The maximum run speed. */
    maxVelocity :number = 200;

    /** The impulse applied when jumping. */
    jumpStrength :number = 10;

    /** The amount of time to apply impulse when jumping. */
    jumpTime :number = 0.2;

    /** The amount of time the player is stunned. */
    stunTime :number = 2;

    /** The number of lives the player starts with. */
    startingLives :integer = 3;

    /** Whether the player is initially facing left or right. */
    facing :CharacterFacing = CharacterFacing.Left;

    onStart () {
        var box2d = this.owner.getFromParents(Box2D);
        var sprite = this.owner.get(Sprite);

        // Undo the y-anchor
        sprite.y._ -= sprite.anchorY._;
        sprite.anchorY._ = 0;

        // Create and add a PhysicsBody from this creator object
        var physics = box2d.createPhysics();
        this.owner.add(physics);

        // Setup separate Box2D fixtures for the feet and torso
        var body = physics.body;
        var width = box2d.toMeters(this.info.width);
        var height = box2d.toMeters(this.info.height);
        var footRadius = Math.min(height/2, width/2);
        var torsoHeight = Math.max(height - footRadius, footRadius);

        var torsoDef = new FixtureDef();
        torsoDef.shape = PolygonShape.asOrientedBox(width/2 - box2d.toMeters(0.5), torsoHeight/2,
            new Vec2(0, torsoHeight/2));
        torsoDef.density = 1 / (width*torsoHeight);
        this._torsoFixture = body.createFixture(torsoDef);

        var circle = new CircleShape(footRadius);
        circle.setLocalPosition(new Vec2(0, torsoHeight));
        var feetDef = new FixtureDef();
        feetDef.shape = circle;
        this._feetFixture = body.createFixture(feetDef);

        body.setBullet(true);
        body.setFixedRotation(true);
        body.setSleepingAllowed(false);

        // Update the scale when the current facing changes
        var origScaleX = sprite.scaleX._;
        this._facingLeft = new Value<boolean>(this.facing == CharacterFacing.Left, (facingLeft, _) => {
            sprite.scaleX._ = origScaleX * (facingLeft == (this.facing != CharacterFacing.Left) ? -1 : 1);
        });

        // Update the animation when properties change
        var updateAnimation = () => {
            if (!this._stunned._ && this._grounded._) {
                var objectSprite = this.owner.get(ObjectSprite);
                if (objectSprite != null) {
                    objectSprite.loop(this._walking._ ? "walking" : "idle", false);
                }
            }
        };
        this._walking = new Value(false, (a,b) => updateAnimation());
        this._grounded = new Value(false, (a,b) => updateAnimation());
        this._stunned = new Value(false, (a,b) => updateAnimation());
        this._jumping = new Value(false);

        // Update the UI when lives change
        this._lives = new Value(this.startingLives);
        this._lives.watch((lives,_) => {
            var bag = this.owner.getFromParents(PropertyBag);
            bag.set("lives", lives);
        });

        this.connect1(System.keyboard.down, event => {
            switch (event.key) {
            case Key.Left:
                this.setWalkState(WalkState.Left);
                break;
            case Key.Right:
                this.setWalkState(WalkState.Right);
                break;
            case Key.Up:
                this.setJumpState(true);
                break;
            default:
            }
        });
        this.connect1(System.keyboard.up, event => {
            switch (event.key) {
            case Key.Left: case Key.Right:
                this.setWalkState(WalkState.None);
                break;
            case Key.Up:
                this.setJumpState(false);
                break;
            default:
            }
        });
    }

    stun () {
        if (this._stunned._) {
            return; // Already stunned
        }

        // Play a particle animation
        var assets = this.owner.getAssetsFromParents();
        var emitter = assets.getParticleSystem("particles/explode").createEmitter();
        emitter.complete.connect(() => emitter.owner.dispose());

        var sceneSprite = this.owner.getSceneSpriteFromParents();
        var sprite = this.owner.get(Sprite);
        emitter.setXY(sprite.x._, sprite.y._);
        sceneSprite.content.addChild(new Entity().add(emitter));

        // Stun and lose a life
        this.setWalkState(WalkState.None);
        this.setJumpState(false);
        this._stunElapsed = 0;
        this._stunned._ = true;
        --this._lives._;

        var objectSprite = this.owner.get(ObjectSprite);
        objectSprite.loop("stun");
    }

    onUpdate (dt :number) {
        this._grounded._ = this.isGrounded();
        if (this._grounded._) {
            this._airElapsed = 0;
        } else {
            this._airElapsed += dt;
        }

        if (this._stunned._) {
            this._stunElapsed += dt;
            if (this._stunElapsed >= this.stunTime) {
                if (this._lives._ > 0) {
                    this._stunned._ = false;
                } else {
                    System.nextFrame(() => {
                        var director = this.owner.getDirectorFromParents();
                        director.unwindToScene(new EzScene("Loss"));
                    });
                }
            }
        }

        var physics = this.owner.get(PhysicsBody);
        var body = physics.body;

        var friction = this._grounded._ ? (this._walking._ ? 0.2 : 10) : 0;
        var fixture = body.getFixtureList();
        while (fixture != null) {
            fixture.setFriction(friction);
            fixture = fixture.getNext();
        }

        var vel = body.getLinearVelocity();
        var maxVelocityMeters = physics.box2d.toMeters(this.maxVelocity);
        switch (this._walkState) {
        case WalkState.Left:
            if (vel.x > -maxVelocityMeters) {
                body.applyImpulse(new Vec2(this._grounded._ ? -1 : -0.5, 0), body.getPosition());
            }
            break;
        case WalkState.Right:
            if (vel.x < maxVelocityMeters) {
                body.applyImpulse(new Vec2(this._grounded._ ? 1 : 0.5, 0), body.getPosition());
            }
            break;
        case WalkState.None:
            // Do nothing
        }

        var vel = body.getLinearVelocity();
        if (this._jumping._ && this._airElapsed < this.jumpTime) {
            vel.y = 0; // Stop vertical velocity
            body.applyImpulse(new Vec2(0, -this.jumpStrength), body.getPosition());
            if (!this._stunned._ && this._grounded._) {
                var objectSprite = this.owner.get(ObjectSprite);
                if (objectSprite != null) {
                    objectSprite.loop("idle").play("jump");
                }
                // jumped.emit();
            }
        }
    }

    setWalkState (state :WalkState) {
        // Turn off controls while stunned
        if (this._stunned._) {
            return;
        }

        switch (state) {
        case WalkState.Left:
            this._walking._ = true;
            this._facingLeft._ = true;
            break;
        case WalkState.Right:
            this._walking._ = true;
            this._facingLeft._ = false;
            break;
        case WalkState.None:
            this._walking._ = false;
            break;
        }
        this._walkState = state;
    }

    setJumpState (jumping :boolean) {
        // Turn off controls while stunned
        if (this._stunned._) {
            return;
        }

        this._jumping._ = jumping;
    }

    private isGrounded () {
        var feetBody = this._feetFixture.getBody();
        var world = feetBody.getWorld();

        var circle :CircleShape = this._feetFixture.getShape() as CircleShape;

        var contact = world.getContactList();
        while (contact != null) {
            if (contact.isTouching() && !contact.isSensor() && contact.isEnabled() &&
                    (contact.getFixtureA() == this._feetFixture || contact.getFixtureB() == this._feetFixture)) {

                var pos = feetBody.getPosition();
                var threshold = pos.y + circle.getLocalPosition().y + circle.getRadius()/2;

                // If anything is touching the bottom of the feet, we're grounded
                var manifold = contact.getWorldManifold();
                var points = manifold.getPoints();
                for (var ii = 0; ii < contact.getManifold().getPointCount(); ++ii) {
                    if (points[ii].y > threshold) {
                        return true;
                    }
                }
            }
            contact = contact.getNext();
        }

        return false;
    }

    private isFacing (facing :CharacterFacing) {
        return this._facingLeft._ == (facing == CharacterFacing.Left);
    }

    private _feetFixture :Fixture;
    private _torsoFixture :Fixture;

    private _airElapsed :number = 0;

    private _walkState :WalkState = WalkState.None;

    private _facingLeft :Value<boolean>;
    private _walking :Value<boolean>;
    private _grounded :Value<boolean>;

    private _jumping :Value<boolean>;

    private _stunned :Value<boolean>;
    private _stunElapsed :number = 0;

    private _lives :Value<integer>;
}
