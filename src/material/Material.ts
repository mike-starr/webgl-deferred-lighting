import { vec3 } from "gl-matrix";

export default interface Material {
    diffuseColor: vec3;
    emissiveColor: vec3;
    specularIntensity: number;
    specularPower: number;
}