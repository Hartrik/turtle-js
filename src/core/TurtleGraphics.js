import {TurtleLogger} from "./TurtleLogger";
import {TurtleSVGPainter} from "./TurtleSVGPainter";
import {TurtleTerminatedError} from "./TurtleTerminatedError";
import {TurtleContext} from "./TurtleContext";
import {TurtleCommands} from "./TurtleCommands";
import {TurtleCodeParser} from "./TurtleCodeParser";

/**
 *
 * @author Patrik Harag
 * @version 2021-04-07
 */
export class TurtleGraphics {

    canvasNode;  // jquery dom node
    drawCursor = false;
    maxCommands = 1_000_000;
    logHandler = (msg, severity) => console.log(severity + ": " + msg);

    constructor(svgNode) {
        this.canvasNode = svgNode;
    }

    setDrawCursor(drawCursor) {
        this.drawCursor = drawCursor;
    }

    setMaxCommands(maxCommands) {
        this.maxCommands = maxCommands;
    }

    setLogHandler(callback) {
        this.logHandler = callback;
    }

    draw(code) {
        let logger = new TurtleLogger(this.logHandler);

        let parser = new TurtleCodeParser(code, logger);
        let commands = parser.parse();

        let painter = new TurtleSVGPainter(this.canvasNode, this.canvasNode.width(), this.canvasNode.height());
        painter.clean();

        let turtleContext = new TurtleContext(painter, logger, this.maxCommands);
        turtleContext.setColor(0, 0, 0, 1);
        turtleContext.setStrokeWidth(1);

        let program = TurtleCommands.block(commands);
        try {
            program(turtleContext);
        } catch (e) {
            if (e instanceof TurtleTerminatedError) {
                // command limit exceeded
                logger.logError(e.message)
            } else {
                throw e;
            }
        }

        if (this.drawCursor) {
            turtleContext.maxCommands = Number.MAX_VALUE;
            TurtleCommands.DRAW_CURSOR(turtleContext);
        }

        painter.flush();
    }
}
