import { vec3 } from "gl-matrix";
import Renderable from "../renderer/Renderable";

export default interface LightVolume extends Renderable {
    color: vec3;
}