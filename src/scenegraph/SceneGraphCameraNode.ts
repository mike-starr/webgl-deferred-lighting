import SceneGraphNode from "./SceneGraphNode";
import SceneGraphVisitor from "./SceneGraphVisitor";
import Camera from "../engine/Camera";

export default class SceneGraphCameraNode implements SceneGraphNode {

    constructor(private readonly camera: Camera) {
    }

    accept(visitor: SceneGraphVisitor): void {
    }
}