import SceneGraphNode from "./SceneGraphNode";
import SceneGraphVisitor from "./SceneGraphVisitor";

export default class SceneGraphGBufferNode extends SceneGraphNode {

    constructor(public readonly frameBuffer: WebGLFramebuffer,
        public readonly diffuseTarget: WebGLTexture,
        public readonly positionTarget: WebGLTexture,
        public readonly normalTarget: WebGLTexture,
        public readonly depthTarget: WebGLTexture,
        children: SceneGraphNode[] = []) {
        super(children);
    }

    accept(visitor: SceneGraphVisitor): void {
        visitor.beginGBufferPass(this);

        super.accept(visitor);

        visitor.endGBufferPass();
    }
}