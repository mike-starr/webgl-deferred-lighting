import SceneGraphVisitor from "./SceneGraphVisitor"

export default class SceneGraphNode {

    constructor(public readonly children: SceneGraphNode[]) {
    }

    accept(visitor: SceneGraphVisitor): void {
        for (const child of this.children) {
            child.accept(visitor);
        }
    }
};