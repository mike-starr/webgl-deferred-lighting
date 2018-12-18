import SceneGraphNode from "./SceneGraphNode";
import SceneGraphVisitor from "./SceneGraphVisitor";
import Camera from "../camera/Camera";

export default class SceneGraphCameraNode extends SceneGraphNode {

    constructor(private readonly camera: Camera, children: SceneGraphNode[] = []) {
        super(children);
    }

    accept(visitor: SceneGraphVisitor): void {
        visitor.pushCamera(this.camera);

        super.accept(visitor);

        visitor.popCamera();
    }
}