import SceneGraphVisitor from "./SceneGraphVisitor";

export default interface SceneGraphNode {
    accept(visitor: SceneGraphVisitor): void;
};