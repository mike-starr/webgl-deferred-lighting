# A deferred renderer in TypeScript and WebGL 2.0

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
I created a basic rendering framework based on a scene graph, which the renderer traverses using the visitor pattern once per pass.*

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

### G-Pass

### Light


### Composite


\* In 15 years as a software engineer I've never seen the proper version of that pattern used; this seemed like a good time to try.