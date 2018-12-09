import SceneGraphNode from "./SceneGraphNode";
import SceneGraphVisitor from "./SceneGraphVisitor";
import Renderable from "../Renderer/Renderable";

export default class SceneGraphMeshNode extends SceneGraphNode {

    constructor(private readonly renderable: Renderable, children: SceneGraphNode[] = []) {
        super(children);
    }

    accept(visitor: SceneGraphVisitor): void {
        visitor.renderRenderable(this.renderable)

        super.accept(visitor);
    }
}