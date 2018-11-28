import SceneGraphNode from "./SceneGraphNode";
import SceneGraphVisitor from "./SceneGraphVisitor";
import Camera from "../engine/Camera";

export default class SceneGraphCameraNode extends SceneGraphNode {

    constructor(private readonly camera: Camera, children: SceneGraphNode[] = []) {
        super(children);
    }

    accept(visitor: SceneGraphVisitor): void {
        visitor.pushProjectionViewMatrix(this.camera.projectionViewMatrix);

        for (const child of this.children) {
            child.accept(visitor);
        }

        visitor.popProjectionViewMatrix();
    }
}