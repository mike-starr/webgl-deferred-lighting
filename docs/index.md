# A deferred renderer in TypeScript and WebGL 2.0

## Demos
[Christmas Tree](https://mike-starr.github.io/webgl-experiments/examples/holiday/index.html)

[150 Point Lights](https://mike-starr.github.io/webgl-experiments/examples/bigbang/index.html)

## Why?
Several years ago, I read a [SIGGRAPH paper](https://developer.amd.com/wordpress/media/2013/01/Chapter05-Filion-StarCraftII.pdf) detailing Stacraft 2's deferred renderer. I thought it'd be neat to implement something similar, both as an exercise in learning WebGL and a general graphics programming refresh.

## Overview
At a high level, deferred rendering aims to overcome scaling issues with lights in the conventional graphics pipeline, which generally performs a lighting computation once per pixel (or vertex) per light in the scene.

In the deferred model implemented here, the rendering pipeline is split into three (main) passes:
* The initial geometry pass renders information (position, normals, diffuse color, depth) about all opaque geomery in the scene into multiple render targets (called the g-buffer). Any emissive terms are renderered to a fifth target, which I'm calling the accumulation buffer - a name I either read somewhere or made up.
* Those g-buffer targets are then used as texture inputs into the second (lighting) pass, where each light in the scene - represented by a bounding mesh - is rendered into the accumulation target, blending additively with any color present there from prior pass. Lighting calculations are done once per pixel each light shape touches, sampling from the normal, texture and color g-buffer textures as required.
* Finally, the accumulation buffer is rendered as a full-screen quad, on top of which any 2D elements are rendered.

Because the lights are rendered as shapes and lighting calculations done only once per pixel each shape covers (less after a stencil-based optimization), the pipeline as a whole scales much better as more lights are added to the scene - linearly on the size of the light instead of linearly on the number of pixels or vertices.

## Details

### Framework
I created a basic rendering framework based on a scene graph, which the renderer traverses using the visitor pattern once per pass.<sup>*</sup>

When the renderer encounters a [renderable](src/renderer/Renderable.ts) element (like a mesh or light volume), it inspects the shader attached to that element and attempts to fill in all its attributes and uniforms - from either the mesh data itself or more global state (current camera, world transform, etc.).

The shaders themselves are defined as [inline strings](src/shaders/Shaders.ts), followed by a [code-level description](src/shaders/ShaderDescription.ts) of their attributes and uniforms, which the renderer uses to determine what data each shader needs.

It's a simple model that works well enough for the purposes of demonstrating the deferred algorithm, but probably would not scale much beyond that.

### G-Buffer

The g-buffer is composed of four separate render targets, all the same dimension as the main framebuffer. This implementation uses the following setup:

Target | Format | X        | Y           | Z  | W |
| - | - | - |-------------| -----| --- |
Position | RGBA32F| position.x | position.y | position.z | specular intensity |
Normal | RGBA32F| normal.x | normal.y | normal.z | specular power |
Diffuse | RGB8| diffuse.r | diffuse.g | diffuse.b | N/A |

WebGL requires the `EXT_color_buffer_float` extension to be enabled for floating point textures to be used as color attachments.

The fourth target - the depth/stencil buffer - uses the DEPTH24_STENCIL8 format; the 8 stencil bits are used to implement an optimization during the lighting pass (described later) that avoids performing lighting calculations for pixels outside the light volumes.

The fifth 'accumulation' target is created in the same format as the diffuse target. This is the target the lighting pass will use as final output; in the g-pass, it accumulates ambient and emissive lighting terms.

### Geometry Pass
In the initial render pass - the geometry pass, all opaque geometry is rendered into the g-buffer targets. The shaders are extremely simple, as their only function is to transform positions/normals into world space, then populate the g-buffer targets with that and other material information.

VS main:
```
gl_Position = uProjectionViewMatrix * uWorldMatrix * aVertexPosition;
vWorldPosition = uWorldMatrix * aVertexPosition;
vNormal = uWorldMatrix * vec4(aVertexNormal, 0.0);
```

FS main:
```
fragPosition = vec4(vWorldPosition.xyz, uMaterial.specularIntensity);
fragNormal = vec4(vNormal.xyz, uMaterial.specularPower);
fragDiffuse = vec4(uMaterial.diffuseColor.xyz, 1.0);
fragAccumulation = vec4(uMaterial.emissiveColor.xyz, 1.0);
```

Example g-buffer, from the [Christmas Tree](https://mike-starr.github.io/webgl-experiments/examples/holiday/index.html) demo:

#### Diffuse
![Diffuse](https://mike-starr.github.io/webgl-experiments/diffuse_target.png)

#### Position
![Position](https://mike-starr.github.io/webgl-experiments/position_target.png)

#### Normal
![Normal](https://mike-starr.github.io/webgl-experiments/normal_target.png)

#### Depth
![Depth](https://mike-starr.github.io/webgl-experiments/depth_target.png)

### Lighting
The lighting pass renders a bounding mesh to the accumulation target for each light in the scene (spheres for point lights, boxes for directional lights), reading from the g-buffer textures to compute lighting on each fragment. Overlapping lights blend additively.

To avoid performing lighting calculation on pixels outside a light's bounding volume - which will occur when an object is either fully in front of or behind the light volume, the light is first rendered with a no-op fragment shader and the stencil operation set up as follows:

* For back-facing triangles that fail the depth test, increment the value in the stencil buffer.
* For front-facing triangles that fail the depth test, decrement the value in the stencil buffer.

The net effect of these operations results in a non-zero value written to the stencil buffer when the depth value is between the front and back face of the light volume (i.e., the light volume may affect this pixel in world space.).

After stenciling, the light is rendered again with the stencil function enabled and set up to fail if the stencil buffer value is zero. To avoid problems when the camera is inside the light volume, front faces are culled instead of back faces and the depth test is disabled - it was essentially done in the stencil test anyway.

To illustrate the effect of the stencil optimization, in the following screenshots I've modified the light volume fragment shader to highlight all pixels where a lighting calculation occurs. The highlight moves from red to yellow as the number of overlapping lights increases.

#### Without Stencil
![NoStencil](https://mike-starr.github.io/webgl-experiments/stencil_disabled.png)

#### With Stencil
![Stencil](https://mike-starr.github.io/webgl-experiments/stencil_enabled.png)

#### Point Light Attenuation
When creating an attenuation model for the point light volumes, I noticed that using the standard 1 / d<sup>2</sup> formula results in a long fall-off to neglible light values - meaning the point light volumes would need to be relatively large to look right.

To avoid light volumes that were so large they'd nearly cover the entire screen - and therefore defeat the purpose of deferring the light pass - I switched to a method that takes the light radius as input and computes a smooth attenuation to zero at the extent of the volume (described [here](http://framebunker.com/blog/lighting-2-attenuation/)).

#### Non-Uniformly Scaled Point Lights
Conventionally, for point lights, the world-space light radius is passed into the light volume fragment shader and used to calculate attenuation. In this model, the lights are represented as a sphere with the intensity attenuating to zero at the radius. Because they're represented as geometry, they can be scaled, rotated and translated just as any other component of the scene graph.

But because they can be scaled - and non-uniformly - the conventional model of passing the light radius to the shader is more complicated. I found it non trivial to compute attenuation in world space using a non-uniformly scaled sphere.

To work around this complication, I transform the position and normal from the g-buffer into the light volume's reference frame using its inverse world matrix, calculated on CPU. Then I do the lighting calculations as normal with an attenuation range of 1.0. There's some performance overhead (two additional mat4 by vec4 multiplications), but it allows point lights to be scaled into non-spherical shapes.

### Composite
The final pass renders the accumulation target as a full-screen quad (orthographically), then renders any 2D elements on top of that - in the examples, the g-buffer targets are rendered on the left side of the screen as textured quads.

### References / Resources
OGLDev Tutorials: http://ogldev.atspace.co.uk/index.html

Lighting attenuation: http://framebunker.com/blog/lighting-2-attenuation/

Starcraft 2 Effects & Techniques, SIGGRAPH 2008: https://developer.amd.com/wordpress/media/2013/01/Chapter05-Filion-StarCraftII.pdf

Mozilla Hacks - WebGL Deferred Shading: https://hacks.mozilla.org/2014/01/webgl-deferred-shading/

WebGL 2 Examples: https://github.com/tsherif/webgl2examples

---

\* In 15 years as a software engineer I've never seen the proper version of that pattern used; seemed like a good time to try.