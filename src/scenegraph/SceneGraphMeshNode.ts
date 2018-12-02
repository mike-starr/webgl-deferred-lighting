import SceneGraphNode from "./SceneGraphNode";
import SceneGraphVisitor from "./SceneGraphVisitor";
import Mesh from "../Mesh/Mesh";

export default class SceneGraphMeshNode extends SceneGraphNode {

    constructor(private readonly mesh: Mesh, children: SceneGraphNode[] = []) {
        super(children);
    }

    accept(visitor: SceneGraphVisitor): void {
        visitor.renderMesh(this.mesh);

        for (const child of this.children) {
            child.accept(visitor);
        }
    }
}