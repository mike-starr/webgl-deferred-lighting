import SceneGraphNode from "./SceneGraphNode";
import SceneGraphVisitor from "./SceneGraphVisitor";

export default class SceneGraphLightPassNode extends SceneGraphNode {

    constructor(public readonly frameBuffer: WebGLFramebuffer,
        children: SceneGraphNode[] = []) {
        super(children);
    }

    accept(visitor: SceneGraphVisitor): void {
        visitor.beginLightPass(this);

        super.accept(visitor);

        visitor.endLightPass();
    }
}