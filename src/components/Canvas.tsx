import * as React from "react";

//export interface HelloProps { compiler: string; framework: string; }

// 'HelloProps' describes the shape of props.
// State is never set so we use the '{}' type.
export default class Canvas extends React.Component<{}, {}> {
    render() {
        return <canvas ref="webgl-canvas" width={800} height={600}></canvas>;
    }
}