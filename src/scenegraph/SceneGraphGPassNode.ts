import SceneGraphNode from "./SceneGraphNode";
import SceneGraphVisitor from "./SceneGraphVisitor";
import GBufferTextures from "../renderer/GBufferTextures";

export default class SceneGraphGPassNode extends SceneGraphNode {

    constructor(public readonly frameBuffer: WebGLFramebuffer,
        public readonly gBufferTextures: GBufferTextures,
        children: SceneGraphNode[] = []) {
        super(children);
    }

    accept(visitor: SceneGraphVisitor): void {
        visitor.beginGPass(this);

        super.accept(visitor);

        visitor.endGPass();
    }
}