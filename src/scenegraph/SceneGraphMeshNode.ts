import SceneGraphNode from "./SceneGraphNode";
import SceneGraphVisitor from "./SceneGraphVisitor";

export default class SceneGraphMeshNode extends SceneGraphNode {

    constructor(private readonly mesh: any, children: SceneGraphNode[] = []) {
        super(children);
    }

    accept(visitor: SceneGraphVisitor): void {
        visitor.renderMesh();

        for (const child of this.children) {
            child.accept(visitor);
        }
    }
}