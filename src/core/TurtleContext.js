import {TurtleRandom} from "./TurtleRandom";
import {TurtleContextScope} from "./TurtleContextScope";
import {TurtleTerminatedError} from "./TurtleTerminatedError";
import {TurtleSVGPainter} from "./TurtleSVGPainter";

/**
 *
 * @author Patrik Harag
 * @version 2021-04-07
 */
export class TurtleContext {

    static DEFAULT_ANGLE = 0;  // deg
    static DEFAULT_ANGLE_INCREMENT = 45;  // deg
    static DEFAULT_STEP = 20;
    static DEFAULT_RECURSION_LIMIT = 100;
    static MAX_RECURSION_LIMIT = 1000;
    static MAX_POSITION_STACK_SIZE = 1000;

    painter;
    logger;
    random;

    maxCommands;
    commands = 0;

    width;
    height;
    xOffset;
    yOffset;

    angleIncrement = TurtleContext.DEFAULT_ANGLE_INCREMENT;  // deg
    angle = TurtleContext.DEFAULT_ANGLE;  // deg
    step = TurtleContext.DEFAULT_STEP;
    x;  // turtle coords (center = 0x0)
    y;  // turtle coords (center = 0x0)

    positionStack = [];

    recursionLimit = TurtleContext.DEFAULT_RECURSION_LIMIT;
    scopeStack;  // index=0 => global
    procedures = new Map();

    constructor(painter, logger, maxCommands) {
        this.painter = painter;
        this.logger = logger;
        this.random = new TurtleRandom();
        this.maxCommands = maxCommands;
        this.width = painter.width;
        this.height = painter.height;
        this.xOffset = Math.floor(this.width / 2);
        this.yOffset = Math.floor(this.height / 2);
        this.x = 0;
        this.y = 0;
        this.scopeStack = [new TurtleContextScope()];
    }

    _onCommand() {
        if (this.commands > this.maxCommands) {
            throw new TurtleTerminatedError("Command limit exceeded, limit=" + this.maxCommands);
        }
        this.commands++;
    }

    getVariable(name, def = null) {
        switch (name) {
            case '$X':
                return this.x;
            case '$Y':
                return this.y;
            case '$A':
                return this.angle;
            case '$S':
                return this.step;
            case '$WIDTH':
                return this.width;
            case '$HEIGHT':
                return this.height;
            case '$RND':
                return this.random.nextDouble();
        }

        for (let i = 0; i < this.scopeStack.length; i++) {
            let val = this.scopeStack[this.scopeStack.length - 1 - i].variables.get(name);
            if (val !== undefined) {
                return val;
            }
        }
        return def;
    }

    // path

    angleInc(n) {
        this._onCommand();
        if (n === null) {
            n = this.angleIncrement;
        }
        this.angle = (this.angle + n) % 360;
    }

    angleDec(n) {
        this._onCommand();
        if (n === null) {
            n = this.angleIncrement;
        }
        this.angle = (this.angle - n) % 360;
    }

    setAngle(n) {
        this._onCommand();
        this.angle = n;
    }

    setStep(n) {
        this._onCommand();
        this.step = n;
    }

    move(step, penDown) {
        this._onCommand();

        if (step === null) {
            step = this.step;
        }

        let startX = this.x;
        let startY = this.y;

        this.x += step * Math.cos(this.angle * Math.PI / 180);
        this.y += step * Math.sin(this.angle * Math.PI / 180);

        if (penDown) {
            this.painter.drawLine(
                this.xOffset + startX, this.yOffset - startY,
                this.xOffset + this.x, this.yOffset - this.y);
        }
    }

    moveAbsolute(x, y, penDown) {
        this._onCommand();

        let startX = this.x;
        let startY = this.y;

        this.x = x;
        this.y = y;

        if (penDown) {
            this.painter.drawLine(
                this.xOffset + startX, this.yOffset - startY,
                this.xOffset + this.x, this.yOffset - this.y);
        }
    }

    pushPosition() {
        this._onCommand();

        if (this.positionStack.length < TurtleContext.MAX_POSITION_STACK_SIZE) {
            this.positionStack.push([this.x, this.y, this.angle])
        } else {
            this.logger.logError("Position stack is full, command ignored");
        }
    }

    popPosition() {
        this._onCommand();

        if (this.positionStack.length > 0) {
            let pos = this.positionStack.pop();
            this.x = pos[0];
            this.y = pos[1];
            this.angle = pos[2];
        } else {
            this.logger.logError("Position stack is empty, command ignored");
        }
    }

    // path modifiers

    setColor(r, g, b, a = 1) {
        this._onCommand();
        this.painter.setColor(r, g, b, a);
    }

    setStrokeWidth(n) {
        this._onCommand();
        this.painter.setStrokeWidth(Math.abs(n));
    }

    endPath() {
        this._onCommand();
        this.painter.flush(TurtleSVGPainter.FLUSH_MODE_NONE);
    }

    closePath() {
        this._onCommand();
        this.painter.flush(TurtleSVGPainter.FLUSH_MODE_CLOSE);
    }

    fillPath() {
        this._onCommand();
        this.painter.flush(TurtleSVGPainter.FLUSH_MODE_FILL);
    }

    // other

    setBackgroundColor(r, g, b, a = 1) {
        this._onCommand();
        this.painter.setBackgroundColor(r, g, b, a);
    }

    defineProcedure(name, args, exe) {
        this._onCommand();
        this.procedures.set(name, {
            arguments: args,
            executable: exe
        });
    }

    executeProcedure(name, values) {
        this._onCommand();
        let procedureEntry = this.procedures.get(name);
        if (procedureEntry === undefined) {
            this.logger.logError('Procedure not defined: ' + name)
        } else {
            if ((this.scopeStack.length - 1) < this.recursionLimit) {
                let procedureScope = new TurtleContextScope();
                for (let i = 0; i < procedureEntry.arguments.length; i++) {
                    let value = i < values.length ? values[i] : 0;
                    let argName = procedureEntry.arguments[i];
                    if (argName !== null) {
                        procedureScope.variables.set(argName, value);
                    }
                }
                this.executeWithScope(procedureEntry.executable, procedureScope);
            }
        }
    }

    executeWithScope(command, scope) {
        this._onCommand();
        this.scopeStack.push(scope);
        command(this);
        this.scopeStack.pop();
    }

    setRecursionLimit(n) {
        this._onCommand();
        this.recursionLimit = Math.min(n, TurtleContext.MAX_RECURSION_LIMIT);
    }

    setVariable(name, value) {
        this._onCommand();
        this.scopeStack[0].variables.set(name, value)
    }
}