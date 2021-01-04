//
// Jumping Jack
// by Bruno Garcia <b@aduros.com>

/** A gap in a floor. */
export default class Gap
{
    x :number = 0;
    width :number = 200;
    vel :number = 400;

    invertDirection () {
        this.vel = -this.vel;
    }
}
