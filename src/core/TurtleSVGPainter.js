import $ from "jquery";

/**
 *
 * @author Patrik Harag
 * @version 2021-03-05
 */
export class TurtleSVGPainter {

    static PRECISION = 2;

    static FLUSH_MODE_NONE = 0;
    static FLUSH_MODE_CLOSE = 1;
    static FLUSH_MODE_FILL = 2;

    svgNode;
    width;
    height;

    pathBuffer = "";
    pathBufferLastX = null;
    pathBufferLastY = null;
    color = null;
    strokeWidth = null;

    // jquery dom node

    constructor(svgNode, width, height) {
        this.svgNode = svgNode;
        this.width = width;
        this.height = height;
    }

    clean() {
        this.svgNode.empty();
    }

    setBackgroundColor(r, g, b, a = 1) {
        this.flush();
        this.svgNode.append($(document.createElementNS("http://www.w3.org/2000/svg", "rect")).attr({
            width: "100%",
            height: "100%",
            fill: `rgb(${r}, ${g}, ${b}, ${a})`
        }));
    }

    setColor(r, g, b, a = 1) {
        this.flush();
        this.color = `rgb(${r}, ${g}, ${b}, ${a})`;
    }

    setStrokeWidth(n) {
        this.flush();
        this.strokeWidth = n;
    }

    drawLine(x1, y1, x2, y2) {
        if (!(x1 === this.pathBufferLastX && y1 === this.pathBufferLastY)) {
            this.pathBuffer += `M${x1.toFixed(TurtleSVGPainter.PRECISION)} ${y1.toFixed(TurtleSVGPainter.PRECISION)} `;
        }
        this.pathBuffer += `L${x2.toFixed(TurtleSVGPainter.PRECISION)} ${y2.toFixed(TurtleSVGPainter.PRECISION)} `;

        this.pathBufferLastX = x2;
        this.pathBufferLastY = y2;
    }

    flush(closeMode) {
        if (this.pathBuffer) {
            if (this.color === null || this.strokeWidth === null) {
                throw "Mandatory parameter(s) not set";
            }

            let fill = 'none';
            if (closeMode !== undefined) {
                if (closeMode === TurtleSVGPainter.FLUSH_MODE_CLOSE) {
                    this.pathBuffer += "Z";
                } else if (closeMode === TurtleSVGPainter.FLUSH_MODE_FILL) {
                    fill = this.color;
                }
            }

            this.svgNode.append($(document.createElementNS("http://www.w3.org/2000/svg", "path")).attr({
                d: this.pathBuffer,
                style: `fill: ${fill}; stroke: ${this.color}; stroke-width: ${this.strokeWidth}`
            }));

            this.pathBuffer = "";
            this.pathBufferLastX = null;
            this.pathBufferLastY = null;
        }
    }
}