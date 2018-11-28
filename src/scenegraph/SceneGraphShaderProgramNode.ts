import SceneGraphNode from "./SceneGraphNode";
import SceneGraphVisitor from "./SceneGraphVisitor";
import ShaderProgram from "../engine/ShaderProgram";

export default class SceneGraphShaderProgramNode extends SceneGraphNode {

    constructor(private readonly shaderProgram: ShaderProgram, children: SceneGraphNode[] = []) {
        super(children);
    }

    accept(visitor: SceneGraphVisitor): void {
        visitor.setShaderProgram(this.shaderProgram);

        for (const child of this.children) {
            child.accept(visitor);
        }
    }
}