import SceneGraphNode from "./SceneGraphNode";
import SceneGraphVisitor from "./SceneGraphVisitor";

export default class SceneGraphLightPassNode extends SceneGraphNode {

    accept(visitor: SceneGraphVisitor): void {
        visitor.beginLightPass(this);

        super.accept(visitor);

        visitor.endLightPass();
    }
}