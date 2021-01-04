//
// Jumping Jack
// by Bruno Garcia <b@aduros.com>

import GroupAction from "kit/creator/GroupAction";
import { LayerInfo } from "kit/creator/SceneInfo";
import Entity from "kit/Entity";

/** Action that picks a random object from the given layer and runs a sequence on it. */
export default class PickRandom extends GroupAction
{
    layer :LayerInfo;

    onRunAsync (target :Entity) {
        var sceneSprite = this.owner.getSceneSpriteFromParents();

        var objects = this.layer.objects;
        var choice = objects[Integer(Math.random()*objects.length)];
        var entity = sceneSprite.objects.get(choice);
        return (entity != null) ? this.runSubActions(entity) : null;
    }
}
