import SceneGraphNode from "./SceneGraphNode";
import SceneGraphVisitor from "./SceneGraphVisitor";
import { mat4 } from "gl-matrix";

export default class SceneGraphTransformNode extends SceneGraphNode {

    constructor(private readonly transform: mat4, children: SceneGraphNode[] = []) {
        super(children);
    }

    accept(visitor: SceneGraphVisitor): void {
        visitor.pushWorldMatrix(this.transform);

        super.accept(visitor);

        visitor.popWorldMatrix();
    }
}