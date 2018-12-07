import SceneGraphNode from "./SceneGraphNode";
import SceneGraphVisitor from "./SceneGraphVisitor";

export default class SceneGraphGBufferNode extends SceneGraphNode {

    constructor(children: SceneGraphNode[] = []) {
        super(children);
    }

    accept(visitor: SceneGraphVisitor): void {
        visitor.beginGBufferPass();

        super.accept(visitor);

        visitor.endGBufferPass();
    }
}