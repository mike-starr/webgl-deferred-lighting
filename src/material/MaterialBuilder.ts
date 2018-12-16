import { vec3 } from "gl-matrix";
import Material from "./Material";

export default class MaterialBuilder {

    private diffuseColor: vec3 = vec3.fromValues(1.0, 1.0, 1.0);
    private emissiveColor: vec3 = vec3.fromValues(0.0, 0.0, 0.0);
    private specularIntensity: number = 0.0;
    private specularPower: number = 0.0;

    private static _default = new MaterialBuilder().build();

    public static get default() {
        return this._default;
    }

    public withDiffuseColor(color: vec3): this {
        this.diffuseColor = color;
        return this;
    }

    public withEmissiveColor(color: vec3): this {
        this.emissiveColor = color;
        return this;
    }

    public withSpecularIntensity(intensity: number): this {
        this.specularIntensity = intensity;
        return this;
    }

    public withSpecularPower(power: number): this {
        this.specularPower = power;
        return this;
    }

    public build(): Material {
        return {
            diffuseColor: this.diffuseColor,
            emissiveColor: this.emissiveColor,
            specularIntensity: this.specularIntensity,
            specularPower: this.specularPower
        };
    }
}