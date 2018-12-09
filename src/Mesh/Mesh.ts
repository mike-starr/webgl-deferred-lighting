import MeshVertexAttribute from "./MeshVertexAttribute";
import { AttributeName } from "../engine/ShaderDescription";
import MeshIndexBufferDescription from "./MeshIndexBufferDescription";

export default interface Mesh {
    readonly vertexAttributeMap: Map<AttributeName, MeshVertexAttribute>;
    readonly indexBufferDescription: MeshIndexBufferDescription;
}