import SceneGraphNode from "./SceneGraphNode";
import SceneGraphVisitor from "./SceneGraphVisitor";
import GBuffer from "../renderer/GBuffer";

export default class SceneGraphGPassNode extends SceneGraphNode {

    constructor(public readonly gBuffer: GBuffer,
        children: SceneGraphNode[] = []) {
        super(children);
    }

    accept(visitor: SceneGraphVisitor): void {
        visitor.beginGPass(this);

        super.accept(visitor);

        visitor.endGPass();
    }
}