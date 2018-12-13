import SceneGraphNode from "./SceneGraphNode";
import SceneGraphVisitor from "./SceneGraphVisitor";

export default class SceneGraphNormalPassNode extends SceneGraphNode {

    accept(visitor: SceneGraphVisitor): void {
        visitor.beginNormalPass();

        super.accept(visitor);

        visitor.endNormalPass();
    }
}