import { vec3 } from "gl-matrix";
import Renderable from "../renderer/Renderable";

export default interface LightVolume extends Renderable {
    readonly color: vec3;
    readonly ambientIntensity: number;
}