import SceneGraphNode from "./SceneGraphNode";
import SceneGraphVisitor from "./SceneGraphVisitor";

export default class SceneGraphMeshNode extends SceneGraphNode {

    constructor(private readonly texture: WebGLTexture,
        private readonly textureIndex: GLenum,
        children: SceneGraphNode[] = []) {
        super(children);
    }

    accept(visitor: SceneGraphVisitor): void {
        visitor.bindTexture(this.texture, this.textureIndex);

        super.accept(visitor);
    }
}