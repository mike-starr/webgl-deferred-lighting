import SceneGraphNode from "./SceneGraphNode";
import SceneGraphVisitor from "./SceneGraphVisitor";
import Renderable from "../Renderer/Renderable";

export default class SceneGraphLightNode extends SceneGraphNode {

    constructor(private readonly renderable: Renderable, children: SceneGraphNode[] = []) {
        super(children);
    }

    accept(visitor: SceneGraphVisitor): void {
        visitor.renderLight(this.renderable)

        super.accept(visitor);
    }
}