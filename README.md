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

I've glossed over a fair bit in that overview, which I'll remedy below with a more detailed description.

## Details

### The Framework

Before we can implement any kind of rendering algorithm, some sort of graphics pipeline abstraction is required. The system needs to understand what it's trying to render: what a mesh, shader, camera, and light is, how to get vertex positions and other attributes into buffers, how to map those buffers to shader variables, get shader uniforms populated correctly, etc.

I've gone with a minimal approach using a (quasi) scene graph, which the renderer class traverses using the visitor pattern.* Each node either contains an element to render or switches some state in the renderer (i.e. current camera, world transform, pass type, etc.).

When the renderer encounters a [renderable](src/renderer/Renderable.ts) element (like a mesh or light volume), it inspects the shader attached to that element and attempts to fill in all its attributes and uniforms - from either the mesh data itself or more global state (current camera, world transform, etc.).

The shaders themselves are defined as [inline strings](src/shaders/Shaders.ts), followed by a [code-level description](src/shaders/ShaderDescription.ts) of their attributes and uniforms, which the renderer uses to determine what data each shader needs.

It's a simple model that works well enough for the purposes of demonstrating the deferred algorithm, but probably would not scale much beyond that.

### G-Buffer Setup

Now that we have a framework for creating geometry, associating it with a shader, and rendering it an organized way, we can start implementing the specifics of the deferred algorithm - the first step of which is to create the render targets that our initial geometry pass will use as outputs, collectively called the g-buffer.







### Light

### Composite


\* In 15 years as a software engineer I've never actually used the proper version of that pattern; this seemed like a good time to try.