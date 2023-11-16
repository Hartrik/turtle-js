import {TurtleCommands} from "./TurtleCommands";
import {TurtleContext} from "./TurtleContext";
import {TurtleParserUtils} from "./TurtleParserUtils";
import {TurtleExpressionParser} from "./TurtleExpressionParser";

/**
 *
 * @author Patrik Harag
 * @version 2021-04-04
 */
export class TurtleCodeParser {

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