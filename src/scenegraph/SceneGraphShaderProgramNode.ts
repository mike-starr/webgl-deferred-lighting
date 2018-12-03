import SceneGraphNode from "./SceneGraphNode";
import SceneGraphVisitor from "./SceneGraphVisitor";
import ShaderProgram from "../engine/ShaderProgram";

export default class SceneGraphShaderProgramNode extends SceneGraphNode {

    constructor(private readonly shaderProgram: ShaderProgram, children: SceneGraphNode[] = []) {
        super(children);
    }

    accept(visitor: SceneGraphVisitor): void {
        visitor.pushShaderProgram(this.shaderProgram);

        super.accept(visitor);

        visitor.popShaderProgram();
    }
}