import { vec4 } from "gl-matrix";

export default interface Material {
    diffuseColor: vec4;
    emissiveColor: vec4;
    specularIntensity: number;
    specularPower: number;
}