import $ from "jquery";

/**
 *
 * @author Patrik Harag
 * @version 2021-04-07
 */
// TODO: (?) allow argument list without parenthesis
// TODO: text - T("hello")
// TODO: stroke pattern - P("dotted"), P("dashed"), P(10, 5)...
// TODO: colors using string - B("red")...
// TODO: bezier curve (B)
// TODO: introduce optimizing painter - merge sequences like DDD, M(10)M(50, 20)...
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

        let painter = new SVGPainter(this.canvasNode, this.canvasNode.width(), this.canvasNode.height());
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

/**
 *
 * @author Patrik Harag
 * @version 2021-04-04
 */
class TurtleCodeParser {

    code;
    position;

    logger;

    constructor(code, logger) {
        this.code = code.toUpperCase();
        this.position = 0;
        this.logger = logger;
    }

    parse() {
        let commands = [];
        while (this.position < this.code.length) {
            let command = this._readCommand();
            if (command != null) {
                commands.push(command);
            }
        }
        return commands;
    }

    _readCommand() {
        let c = this.code.charAt(this.position);
        switch (c) {
            case '#':
                this.position++;
                this._skipLine();
                break;
            case '+':
                this.position++;
                let angleIncArg = this._parseNumberParameter(this._readParameters(), null);
                return angleIncArg !== null ? TurtleCommands.angleInc(angleIncArg) : TurtleCommands.ANGLE_PLUS;
            case '-':
                this.position++;
                let angleDecArg = this._parseNumberParameter(this._readParameters(), null);
                return angleDecArg !== null ? TurtleCommands.angleDec(angleDecArg) : TurtleCommands.ANGLE_MINUS;
            case 'A':
                this.position++;
                let angleArg = this._parseNumberParameter(this._readParameters(), TurtleContext.DEFAULT_ANGLE);
                return TurtleCommands.angleAbsolute(angleArg);
            case 'D':
                this.position++;
                let drawArgs = this._parseNumberParameters(this._readParameters(), 0);
                if (drawArgs.length === 0) {
                    return TurtleCommands.DRAW;
                } else if (drawArgs.length === 1) {
                    return TurtleCommands.move(drawArgs[0], true);
                } else {
                    return TurtleCommands.moveAbsolute(drawArgs[0], drawArgs[1], true);
                }
            case 'M':
                this.position++;
                let moveArgs = this._parseNumberParameters(this._readParameters(), 0);
                if (moveArgs.length === 0) {
                    return TurtleCommands.MOVE;
                } else if (moveArgs.length === 1) {
                    return TurtleCommands.move(moveArgs[0], false);
                } else {
                    return TurtleCommands.moveAbsolute(moveArgs[0], moveArgs[1], false);
                }
            case 'H':
                this.position++;
                return TurtleCommands.MOVE_HOME;
            case '[':
                this.position++;
                return TurtleCommands.PUSH_POSITION;
            case ']':
                this.position++;
                return TurtleCommands.POP_POSITION;
            case 'S':
                this.position++;
                let stepArg = this._parseNumberParameter(this._readParameters(), TurtleContext.DEFAULT_STEP);
                return TurtleCommands.setStep(stepArg);
            case 'C':
                this.position++;
                let colorArgs = this._parseColorParameter(this._readParameters());
                return TurtleCommands.color(colorArgs[0], colorArgs[1], colorArgs[2], colorArgs[3]);
            case 'W':
                this.position++;
                return TurtleCommands.strokeWidth(this._parseNumberParameter(this._readParameters(), 1));
            case 'E':
                this.position++;
                return TurtleCommands.END_PATH;
            case 'Z':
                this.position++;
                return TurtleCommands.CLOSE_PATH;
            case 'F':
                this.position++;
                return TurtleCommands.FILL_PATH;
            case 'B':
                this.position++;
                let bgColorArgs = this._parseColorParameter(this._readParameters());
                return TurtleCommands.background(bgColorArgs[0], bgColorArgs[1], bgColorArgs[2], bgColorArgs[3]);
            case 'R':
                this.position++;
                let repeatN = this._parseIntegerParameter(this._readParameters(), 0);
                let repeatBody = this._readBody();
                return (repeatBody !== null) ? TurtleCommands.repeat(repeatN, repeatBody) : null;
            case '?':
                this.position++;
                let condExp = this._parseNumberParameter(this._readParameters(), 0);
                let condBody = this._readBody();
                if (condBody !== null) {
                    return TurtleCommands.condition(condExp, condBody);
                } else {
                    this.logger.logError('?: Body expected');
                    return null;
                }
            case '@':
                this.position++;
                let procName = this._readIdentifier();
                let procArgs = this._readParameters();
                let procBody = this._readBody();
                if (procName != null) {
                    return (procBody !== null)
                            ? TurtleCommands.defineProcedure(procName, this._parseProcedureParameters(procArgs), procBody)
                            : TurtleCommands.executeProcedure(procName, this._parseNumberParameters(procArgs, 0));
                } else {
                    this.logger.logError('@: Procedure name not set');
                    return null;
                }
            case '!':
                this.position++;
                let recLimit = this._parseIntegerParameter(this._readParameters(), TurtleContext.DEFAULT_RECURSION_LIMIT);
                return TurtleCommands.setRecursionLimit(recLimit);
            case '$':
                this.position++;
                let variableName = this._readIdentifier();
                let variableValue = this._parseNumberParameter(this._readParameters(), null);
                if (variableName != null) {
                    if (variableValue != null) {
                        return TurtleCommands.setVariable(variableName, variableValue);
                    } else {
                        this.logger.logError('$: Variable value not set');
                    }
                } else {
                    this.logger.logError('$: Variable name not set');
                }
                return null;
            default:
                this.position++;
                if (TurtleParserUtils.isWhitespaceChar(c)) {
                    // ignore
                } else {
                    this.logger.logError('Unknown command: ' + c);
                }
        }
        return null;
    }

    _readIdentifier() {
        let buffer = "";

        let finalizeAndGetResult = () => {
            return buffer ? buffer : null;
        };

        while (this.position < this.code.length) {
            let c = this.code.charAt(this.position);

            if (TurtleParserUtils.isWhitespaceChar(c)) {
                if (buffer) {
                    return finalizeAndGetResult();
                } else {
                    // ignore whitespace before
                    this.position++;
                }
            }

            if (TurtleParserUtils.isIdentifierChar(c)) {
                this.position++;
                buffer += c;
            } else {
                return finalizeAndGetResult();
            }
        }
        return finalizeAndGetResult();
    }

    _parseColorParameter(params) {
        // returns rgba as array
        let colorArgs = this._parseNumberParameters(params, null).filter(v => v !== null);

        if (colorArgs.length === 1) {
            // gray
            colorArgs.push(colorArgs[0]);
            colorArgs.push(colorArgs[0]);
        }

        while (colorArgs.length < 3) {
            colorArgs.push(0);
        }

        // add alpha if not set
        if (colorArgs.length === 3) {
            colorArgs.push(1);
        }
        return colorArgs;
    }

    _parseNumberParameter(parameters, defaultValue) {
        if (parameters.length > 0) {
            let expressionParser = new TurtleExpressionParser(parameters[0], this.logger);
            return expressionParser.parse(defaultValue);
        } else {
            return defaultValue;
        }
    }

    _parseNumberParameters(parameters, defaultValue) {
        return parameters.map(p => {
            let expressionParser = new TurtleExpressionParser(p, this.logger);
            return expressionParser.parse(defaultValue);
        });
    }

    _parseIntegerParameter(parameters, defaultValue) {
        if (parameters.length > 0) {
            let expressionParser = new TurtleExpressionParser(parameters[0], this.logger);
            let val = expressionParser.parse(defaultValue);
            return Math.floor(val);
        } else {
            return defaultValue;
        }
    }

    _parseProcedureParameters(parameters) {
        let result = [];
        parameters.forEach(p => {
            if (TurtleParserUtils.isIdentifier(p)) {
                if (p.charAt(0) === '$') {
                    p = p.substring(1);
                }
                result.push(p);
            } else {
                this.logger.logError("Not an identifier: " + p);
                result.push(null);  // will be there for correct order, but cannot be accessed
            }
        });
        return result;
    }

    _readParameters() {
        let args = [];

        let bracketFound = 0;
        let buffer = "";

        let finalizeAndGetResult = () => {
            buffer = buffer.trim();
            if (buffer) {
                args.push(buffer);
            }
            if (bracketFound) {
                this.logger.logWarning('Enclosing ) not found');
            }
            return args;
        };

        while (this.position < this.code.length) {
            let c = this.code.charAt(this.position);
            switch (c) {
                case '(':
                    this.position++;
                    bracketFound++;
                    if (bracketFound > 1) {
                        // nested parenthesis
                        buffer += c;
                    }
                    break;
                case ')':
                    this.position++;
                    bracketFound--;
                    if (bracketFound === 0) {
                        // enclosing parenthesis found
                        return finalizeAndGetResult();
                    } else if (bracketFound === -1) {
                        // error - ) without (
                        return finalizeAndGetResult();
                    } else {
                        // nested parenthesis
                        buffer += c;
                        break;
                    }
                case ',':
                    this.position++;
                    if (bracketFound === 1) {
                        buffer = buffer.trim();
                        if (buffer) {
                            args.push(buffer);
                        }
                        buffer = "";
                    } else if (bracketFound > 1) {
                        // nested ,
                        buffer += c;
                        break;
                    } else {
                        // error - , before (
                        return finalizeAndGetResult();
                    }
                    break;
                case '{':
                case '}':
                case '\n':  // we don't want to break whole program because of one parenthesis
                    // terminated
                    return finalizeAndGetResult();
                default:
                    if (bracketFound) {
                        // inside parenthesis
                        this.position++;
                        buffer += c;
                    } else {
                        if (TurtleParserUtils.isWhitespaceChar(c)) {
                            // whitespace before {
                            this.position++;
                        } else {
                            // no parameters
                            return finalizeAndGetResult();
                        }
                    }
                    break;
            }
        }

        return finalizeAndGetResult();
    }

    _readBody() {
        let bracketFound = 0;
        let buffer = "";

        let finalizeAndGetResult = () => {
            if (bracketFound || buffer) {
                if (bracketFound) {
                    this.logger.logWarning('Enclosing } not found');
                }
                if (buffer) {
                    // TODO: parse directly, without buffer
                    //  - TurtleCodeParser with boundaries
                    //  = efficiency + better logging (line numbers)
                    let parser = new TurtleCodeParser(buffer, this.logger);
                    return parser.parse();
                } else {
                    return [];
                }
            } else {
                return null;
            }
        };

        while (this.position < this.code.length) {
            let c = this.code.charAt(this.position);
            switch (c) {
                case '{':
                    this.position++;
                    bracketFound++;
                    if (bracketFound > 1) {
                        // nested bracket
                        buffer += c;
                    }
                    break;
                case '}':
                    this.position++;
                    bracketFound--;
                    if (bracketFound === 0) {
                        // enclosing bracket found
                        return finalizeAndGetResult();
                    } else if (bracketFound === -1) {
                        // error - } without {
                        return finalizeAndGetResult();
                    } else {
                        // nested bracket
                        buffer += c;
                        break;
                    }
                default:
                    if (bracketFound) {
                        this.position++;
                        buffer += c;
                    } else {
                        if (TurtleParserUtils.isWhitespaceChar(c)) {
                            // whitespace before {
                            this.position++;
                        } else {
                            // no body
                            return finalizeAndGetResult();
                        }
                    }
                    break;
            }
        }

        return finalizeAndGetResult();
    }

    _skipLine() {
        while (this.position < this.code.length) {
            let c = this.code.charAt(this.position++);
            if (c === '\n') {
                break;
            }
        }
    }
}

/**
 * Expression parser. Expression = e.g. 2+(1/2)
 *
 * @author Patrik Harag
 * @version 2021-04-04
 */
class TurtleExpressionParser {

    static TOKEN_NUMBER = 0;
    static TOKEN_VARIABLE = 1;
    static TOKEN_OPERATOR = 2;
    static TOKEN_OPENING_BRACKET = 3;
    static TOKEN_CLOSING_BRACKET = 4;

    static ASSOCIATIVITY_LEFT = 0;
    static ASSOCIATIVITY_RIGHT = 1;

    static UNARY_OPERATORS = new Map([
        // logical
        { char: '!', priority: 14, associativity: this.ASSOCIATIVITY_RIGHT, operands: 1, eval: (a) => (a === 0) ? 1 : 0 },

        // number
        { char: '+', priority: 14, associativity: this.ASSOCIATIVITY_RIGHT, operands: 1, eval: (a) => a },
        { char: '-', priority: 14, associativity: this.ASSOCIATIVITY_RIGHT, operands: 1, eval: (a) => -a },
        { char: '\u{221A}', priority: 13, associativity: this.ASSOCIATIVITY_RIGHT, operands: 1, eval: (a) => Math.sqrt(a) },
        { char: '\u{221B}', priority: 13, associativity: this.ASSOCIATIVITY_RIGHT, operands: 1, eval: (a) => Math.pow(a, 1/3) },
        { char: '\u{B2}', priority: 13, associativity: this.ASSOCIATIVITY_LEFT, operands: 1, eval: (a) => Math.pow(a, 2) },
        { char: '\u{B3}', priority: 13, associativity: this.ASSOCIATIVITY_LEFT, operands: 1, eval: (a) => Math.pow(a, 3) },
    ].map(op => [op.char, op]));

    static BINARY_OPERATORS = new Map([
        // logical
        { char: '|', priority: 1, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => (a !== 0 || b !== 0) ? 1 : 0},
        { char: '&', priority: 2, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => (a !== 0 && b !== 0) ? 1 : 0},
        { char: '=', priority: 3, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => (a === b) ? 1 : 0},
        { char: '\u{2260}', priority: 3, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => (a !== b) ? 1 : 0},
        { char: '<', priority: 4, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => (a < b) ? 1 : 0 },
        { char: '\u{2264}', priority: 4, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => (a <= b) ? 1 : 0 },
        { char: '>', priority: 4, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => (a > b) ? 1 : 0},
        { char: '\u{2265}', priority: 4, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => (a >= b) ? 1 : 0},

        // number
        { char: '+', priority: 10, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => a + b },
        { char: '-', priority: 10, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => a - b },
        { char: '*', priority: 11, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => a * b },
        { char: '\u{D7}', priority: 11, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => a * b },
        { char: '/', priority: 11, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => a / b },
        { char: '\u{F7}', priority: 11, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => a / b },
        { char: '%', priority: 11, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => a % b },
        { char: '^', priority: 12, associativity: this.ASSOCIATIVITY_RIGHT, operands: 2, eval: (a, b) => Math.pow(a, b) }
    ].map(op => [op.char, op]));

    expression;
    position;
    variableFound;

    logger;

    unreadToken = null;
    lastToken = null;

    constructor(expression, logger) {
        this.expression = expression;
        this.position = 0;
        this.variableFound = false;
        this.logger = logger;
    }

    parse(def) {
        let tokensInRPN = this._shuntingYard();

        let result;
        if (this.variableFound) {
            // return function
            result = (context) => {
                return this.evalAST(tokensInRPN, context);
            }
        } else {
            // eval now
            result = this.evalAST(tokensInRPN);
        }
        return result !== null ? result : def;
    }

    /**
     * Convert from infix to reverse polish notation
     */
    _shuntingYard() {
        let out = [];
        let stack = [];
        let peek = () => stack[stack.length - 1];

        let token = null;
        while ((token = this._nextTokenProcessed()) != null) {
            if (token[0] === TurtleExpressionParser.TOKEN_OPERATOR) {
                let head = null;
                while (stack.length > 0 && ((head = peek())[0] === TurtleExpressionParser.TOKEN_OPERATOR)) {
                    if ((token[1].associativity === TurtleExpressionParser.ASSOCIATIVITY_LEFT
                                && token[1].priority - head[1].priority <= 0)
                            || (token[1].associativity === TurtleExpressionParser.ASSOCIATIVITY_RIGHT
                                && token[1].priority - head[1].priority < 0)) {
                        out.push(stack.pop());
                    } else {
                        break;
                    }
                }
                stack.push(token);
            } else if (token[0] === TurtleExpressionParser.TOKEN_OPENING_BRACKET) {
                stack.push(token);
            } else if (token[0] === TurtleExpressionParser.TOKEN_CLOSING_BRACKET) {
                while (stack.length > 0 && (peek()[0] !== TurtleExpressionParser.TOKEN_OPENING_BRACKET)) {
                    out.push(stack.pop());
                }
                stack.pop();
            } else {
                out.push(token);
            }
        }

        while (stack.length > 0) {
            out.push(stack.pop());
        }

        // we have to filter empty tokens that might appear
        out = out.filter(Boolean);

        return out;
    }

    _nextTokenProcessed() {
        // handles various exceptions
        // - unary x binary plus minus resolution
        // - missing multiplication sign
        // - <= >= !=

        if (this.unreadToken !== null) {
            this.lastToken = this.unreadToken;
            this.unreadToken = null;
            return this.lastToken;
        }

        let token = this._nextToken();
        if (token != null) {

            // handle <= >= !=
            if (token[0] === TurtleExpressionParser.TOKEN_OPERATOR && "!<>".indexOf(token[1].char) >= 0) {
                let nextToken = this._nextToken();
                if (nextToken !== null && nextToken[0] === TurtleExpressionParser.TOKEN_OPERATOR && nextToken[1].char === '=') {
                    let op;
                    switch (token[1].char) {
                        case '!': op = '\u{2260}'; break;
                        case '>': op = '\u{2265}'; break;
                        case '<': op = '\u{2264}'; break;
                        default:
                            throw "Illegal state";
                    }
                    return [TurtleExpressionParser.TOKEN_OPERATOR, TurtleExpressionParser.BINARY_OPERATORS.get(op)];
                } else {
                    // just single !, < or >
                    this.unreadToken = nextToken;
                    this.lastToken = token;
                    return token;
                }
            }

            // handle unary plus, minus
            if ((this.lastToken === null && token[0] === TurtleExpressionParser.TOKEN_OPERATOR)
                    || (this.lastToken !== null && (this.lastToken[0] === TurtleExpressionParser.TOKEN_OPENING_BRACKET
                        || this.lastToken[0] === TurtleExpressionParser.TOKEN_OPERATOR))) {

                let operator = token[1].char;
                if (operator === '-' || operator === '+') {
                    // replace binary operator with unary operator
                    token[1] = TurtleExpressionParser.UNARY_OPERATORS.get(operator);
                    this.lastToken = token;
                    return token;
                }
            }

            // handle missing multiplication sign
            if (this.lastToken !== null) {
                if ((this.lastToken[0] === TurtleExpressionParser.TOKEN_CLOSING_BRACKET
                            || this.lastToken[0] === TurtleExpressionParser.TOKEN_NUMBER
                            || this.lastToken[0] === TurtleExpressionParser.TOKEN_VARIABLE)
                        && (token[0] === TurtleExpressionParser.TOKEN_OPENING_BRACKET
                            || token[0] === TurtleExpressionParser.TOKEN_NUMBER
                            || token[0] === TurtleExpressionParser.TOKEN_VARIABLE)) {

                    // (xxx)(xxx) => (xxx)*(xxx)
                    //   xxx(xxx) =>   xxx*(xxx)
                    //  $xxx(xxx) =>  $xxx*(xxx)
                    //  xxx $xxx  =>   xxx*$xxx
                    //  $xxx $xxx =>  $xxx*$xxx

                    // but not xxx xxx

                    if (!(this.lastToken[0] === TurtleExpressionParser.TOKEN_NUMBER && token[0] === TurtleExpressionParser.TOKEN_NUMBER)) {
                        this.unreadToken = token;
                        this.lastToken = [TurtleExpressionParser.TOKEN_OPERATOR, TurtleExpressionParser.BINARY_OPERATORS.get('*')];
                        return this.lastToken;
                    }
                }
            }
        }

        this.lastToken = token;
        return token;
    }

    _nextToken() {
        while (this.position < this.expression.length) {
            let c = this.expression.charAt(this.position++);

            // process whitespace
            if (TurtleParserUtils.isWhitespaceChar(c)) {
                continue;
            }

            // process number
            if (TurtleParserUtils.isDigitChar(c) || c === '.') {
                let buffer = c;
                let lastDot = (c === '.');

                while (this.position < this.expression.length) {
                    c = this.expression.charAt(this.position++);

                    if (TurtleParserUtils.isDigitChar(c)) {
                        buffer += c;
                        lastDot = false;
                    } else if (c === '.') {
                        if (!lastDot) {
                            buffer += c;
                            lastDot = true;
                        }
                    } else {
                        // unread
                        this.position--;
                        break;
                    }
                }

                // handle nan
                if (lastDot && buffer === '.') {
                    buffer = '0';
                }

                return [TurtleExpressionParser.TOKEN_NUMBER, Number.parseFloat(buffer)];
            }

            // process operator
            let operator = TurtleExpressionParser.BINARY_OPERATORS.get(c);
            if (operator !== undefined) {
                return [TurtleExpressionParser.TOKEN_OPERATOR, operator];
            }
            operator = TurtleExpressionParser.UNARY_OPERATORS.get(c);
            if (operator !== undefined) {
                return [TurtleExpressionParser.TOKEN_OPERATOR, operator];
            }

            // process brackets
            if (c === '(') {
                return [TurtleExpressionParser.TOKEN_OPENING_BRACKET, c];
            } else if (c === ')') {
                return [TurtleExpressionParser.TOKEN_CLOSING_BRACKET, c];
            }

            // process variable
            if (c === '$') {
                let buffer = '';

                while (this.position < this.expression.length) {
                    c = this.expression.charAt(this.position);

                    if (TurtleParserUtils.isIdentifierChar(c)) {
                        this.position++
                        buffer += c;
                    } else {
                        break;
                    }
                }

                if (buffer) {
                    this.variableFound = true;
                    return [TurtleExpressionParser.TOKEN_VARIABLE, buffer];
                } else {
                    this.logger.logError('Empty identifier!');
                    continue;
                }
            }

            // unknown
            this.logger.logError('Unknown expression token: ' + c);
        }

        return null;
    }

    evalAST(tokensInRPN, context = null) {
        let stack = [];

        for (let i = 0; i < tokensInRPN.length; i++) {
            let token = tokensInRPN[i];

            if (token[0] === TurtleExpressionParser.TOKEN_OPERATOR) {
                let result = this._evalOperation(token[1], stack, context);
                if (result !== null) {
                    stack.push([TurtleExpressionParser.TOKEN_NUMBER, result]);
                } else {
                    // not enough values on stack etc., logged already
                    return null;
                }
            } else {
                stack.push(token);
            }
        }

        if (stack.length === 0) {
            // empty expression
            return null;
        } if (stack.length === 1) {
            let result = this._evalValue(stack.pop(), context);

            if (result !== null && !isNaN(result) && isFinite(result)) {
                if (result > 2147483647) {
                    this.logger.logError('Expression result truncated');
                    return 2147483647;
                }
                if (result < -2147483648) {
                    this.logger.logError("Expression result truncated");
                    return -2147483648;
                }
                return result;
            } else {
                this.logger.logError("Expression result is not a number")
                return null;
            }
        } else {
            this.logger.logError("Operator expected")
            return null;
        }
    }

    _evalOperation(operator, stack, context = null) {
        if (stack.length < operator.operands) {
            // not enough values on stack
            this.logger.logError("Not enough operands for " + operator.char);
            return null;
        }

        if (operator.operands === 1) {
            let a = this._evalValue(stack.pop(), context);
            return operator.eval(a);
        } else {
            let b = this._evalValue(stack.pop(), context);
            let a = this._evalValue(stack.pop(), context);
            return operator.eval(a, b);
        }
    }

    _evalValue(token, context = null) {
        if (token[0] === TurtleExpressionParser.TOKEN_NUMBER) {
            return token[1];
        } else if (token[0] === TurtleExpressionParser.TOKEN_VARIABLE) {
            if (context === null) {
                // illegal state
                throw "Context not set";
            }

            let value = context.getVariable(token[1], null);
            if (value !== null) {
                return value;
            } else {
                this.logger.logError("Variable not defined: " + token[1]);
                return 0;
            }
        } else {
            this.logger.logError("Number or variable expected, got: " + token[1]);
            return 0;
        }
    }
}

/**
 *
 * @author Patrik Harag
 * @version 2021-04-02
 */
class TurtleParserUtils {

    static isWhitespaceChar(c) {
        switch (c) {
            case ' ':
            case '\n':
            case '\r':
            case '\t':
            case '\0':
                return true;
            default:
                return false;
        }
    }

    static isDigitChar(c) {
        return c >= '0' && c <= '9';
    }

    static isIdentifierChar(c) {
        return c.match(/[A-Z$_]/i);
    }

    static isIdentifier(string) {
        if (string.length === 0) {
            return false;  // empty
        }
        if (string.charAt(0) === '$' && string.length === 1) {
            return false;  // empty
        }
        for (let i = 0; i < string.length; i++) {
            let c = string.charAt(i);
            if (!TurtleParserUtils.isIdentifierChar(c)) {
                return false;
            }
        }
        return true;
    }
}

/**
 *
 * @author Patrik Harag
 * @version 2021-04-07
 */
class TurtleCommands {
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
                this._eval(rExp,  context),
                this._eval(gExp,  context),
                this._eval(bExp,  context),
                this._eval(aExp,  context));
    }

    static background(rExp, gExp, bExp, aExp = 1) {
        return (context) => context.setBackgroundColor(
                this._eval(rExp,  context),
                this._eval(gExp,  context),
                this._eval(bExp,  context),
                this._eval(aExp,  context));
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

/**
 *
 * @author Patrik Harag
 * @version 2021-04-07
 */
class TurtleContext {

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
        this.scopeStack = [ new TurtleContextScope() ];
    }

    _onCommand() {
        if (this.commands > this.maxCommands) {
            throw new TurtleTerminatedError("Command limit exceeded, limit=" + this.maxCommands);
        }
        this.commands++;
    }

    getVariable(name, def = null) {
        switch (name) {
            case '$X': return this.x;
            case '$Y': return this.y;
            case '$A': return this.angle;
            case '$S': return this.step;
            case '$WIDTH': return this.width;
            case '$HEIGHT': return this.height;
            case '$RND': return this.random.nextDouble();
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
        this.painter.flush(SVGPainter.FLUSH_MODE_NONE);
    }

    closePath() {
        this._onCommand();
        this.painter.flush(SVGPainter.FLUSH_MODE_CLOSE);
    }

    fillPath() {
        this._onCommand();
        this.painter.flush(SVGPainter.FLUSH_MODE_FILL);
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

/**
 *
 * @author Patrik Harag
 * @version 2021-04-04
 */
class TurtleTerminatedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TurtleTerminatedError';
    }
}

/**
 *
 * @author Patrik Harag
 * @version 2021-04-02
 */
class TurtleContextScope {
    variables = new Map();
}

/**
 *
 * @author Patrik Harag
 * @version 2021-04-07
 */
class TurtleRandom {
    seed = 1;

    nextDouble() {
        // 1993 Park-Miller LCG
        this.seed = Math.imul(48271, this.seed) | 0 % 2147483647;
        return (this.seed & 2147483647) / 2147483648;
    }
}

/**
 *
 * @author Patrik Harag
 * @version 2021-03-05
 */
class SVGPainter {

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
            this.pathBuffer += `M${x1.toFixed(SVGPainter.PRECISION)} ${y1.toFixed(SVGPainter.PRECISION)} `;
        }
        this.pathBuffer += `L${x2.toFixed(SVGPainter.PRECISION)} ${y2.toFixed(SVGPainter.PRECISION)} `;

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
                if (closeMode === SVGPainter.FLUSH_MODE_CLOSE) {
                    this.pathBuffer += "Z";
                } else if (closeMode === SVGPainter.FLUSH_MODE_FILL) {
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

/**
 *
 * @author Patrik Harag
 * @version 2021-04-04
 */
class TurtleLogger {

    logHandler;

    constructor(logHandler) {
        this.logHandler = logHandler;
    }

    logError(msg) {
        this.logHandler(msg, 'ERROR')
    }

    logWarning(msg) {
        this.logHandler(msg, 'WARNING')
    }

    logInfo(msg) {
        this.logHandler(msg, 'INFO')
    }
}
