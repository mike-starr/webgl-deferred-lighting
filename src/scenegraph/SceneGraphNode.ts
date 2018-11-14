import SceneGraphVisitor from "./SceneGraphVisitor"

export default abstract class SceneGraphNode {

    constructor(protected readonly children: SceneGraphNode[]) {
    }

    abstract accept(visitor: SceneGraphVisitor): void;
};