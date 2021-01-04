//
// Jumping Jack
// by Bruno Garcia <b@aduros.com>

import EzApp from "ez/EzApp";
import Component from "kit/Component";

/** The main component class. */
export default class Main extends Component
{
    /** Called when the component is started. */
    onStart () {
        var app = new EzApp("Title");
        this.owner.add(app);
    }
}
