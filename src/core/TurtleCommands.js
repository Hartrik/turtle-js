import {TurtleContextScope} from "./TurtleContextScope";

/**
 *
 * @author Patrik Harag
 * @version 2021-04-07
 */
export class TurtleCommands {
    static MOVE = TurtleCommands.move(null, false);
    static DRAW = TurtleCommands.move(null, true);
    static MOVE_HOME = TurtleCommands.moveAbsolute(0, 0, false);
    static PUSH_POSITION = (context) => context.pushPosition();
    static POP_POSITION = (context) => context.popPosition();
    static ANGLE_PLUS = TurtleCommands.angleInc(null);
    static ANGLE_MINUS = TurtleCommands.angleDec(null);
    static END_PATH = (context) => context.endPath();
    static CLOSE_PATH = (context) => context.closePath();
    static FILL_PATH = (context) => context.fillPath();

    static setStep(nExp) {
        return (context) => context.setStep(this._eval(nExp, context));
    }

    static move(nExp, penDown) {
        return (context) => context.move(this._eval(nExp, context), penDown);
    }

    static moveAbsolute(xExp, yExp, penDown) {
        return (context) => context.moveAbsolute(this._eval(xExp, context), this._eval(yExp, context), penDown);
    }

    static angleInc(nExp) {
        return (context) => context.angleInc(this._eval(nExp, context));
    }

    static angleDec(nExp) {
        return (context) => context.angleDec(this._eval(nExp, context));
    }

    static angleAbsolute(nExp) {
        return (context) => context.setAngle(this._eval(nExp, context));
    }

    static strokeWidth(nExp) {
        return (context) => {
            return context.setStrokeWidth(this._eval(nExp, context));
        };
    }

    static color(rExp, gExp, bExp, aExp = 1) {
        return (context) => context.setColor(
            this._eval(rExp, context),
            this._eval(gExp, context),
            this._eval(bExp, context),
            this._eval(aExp, context));
    }

    static background(rExp, gExp, bExp, aExp = 1) {
        return (context) => context.setBackgroundColor(
            this._eval(rExp, context),
            this._eval(gExp, context),
            this._eval(bExp, context),
            this._eval(aExp, context));
    }

    static block(bodyCommands) {
        return (context) => {
            bodyCommands.forEach(command => {
                command(context);
            });
        };
    }

    static condition(condExp, bodyCommands) {
        let executable = TurtleCommands.block(bodyCommands);
        return (context) => {
            let n = this._eval(condExp, context);
            if (n !== 0) {
                executable(context);
            }
        };
    }

    static repeat(nExp, bodyCommands) {
        let executable = TurtleCommands.block(bodyCommands);
        return (context) => {
            let n = this._eval(nExp, context);
            let scope = new TurtleContextScope();
            for (let i = 0; i < n; i++) {
                scope.variables.set('$IT', i);
                context.executeWithScope(executable, scope);
            }
        };
    }

    static defineProcedure(name, args, bodyCommands) {
        let executable = TurtleCommands.block(bodyCommands);
        return (context) => {
            context.defineProcedure(name, args, executable);
        };
    }

    static executeProcedure(name, argExps) {
        return (context) => {
            let evaluatedArgs = argExps.map(e => this._eval(e, context));
            context.executeProcedure(name, evaluatedArgs);
        };
    }

    static setRecursionLimit(nExp) {
        return (context) => {
            context.setRecursionLimit(this._eval(nExp, context));
        };
    }

    static setVariable(name, valueExp) {
        return (context) => {
            context.setVariable(name, this._eval(valueExp, context));
        };
    }

    static DRAW_CURSOR = (context) => {
        context.setColor(0, 200, 0, 0.6);
        context.setStrokeWidth(1);

        const scale = 0.6;
        context.angleInc(90);
        context.move(10 * scale, true);
        context.angleInc(-120);
        context.move(20 * scale, true);
        context.angleInc(-120);
        context.move(20 * scale, true);
        context.angleInc(-120);
        context.move(10 * scale, true);
        context.angleInc(-90);
        context.move(16 * scale, true);
    };

    static _eval(expression, context) {
        if (expression === null) {
            return null;  // valid for D, M...
        }
        if (typeof expression === 'function') {
            return expression(context);
        }
        if (typeof expression === 'number') {
            return expression;
        }
        throw "Unsupported expression type: " + expression;
    }
}