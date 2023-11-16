import {TurtleParserUtils} from "./TurtleParserUtils";

/**
 * Expression parser. Expression = e.g. 2+(1/2)
 *
 * @author Patrik Harag
 * @version 2021-04-04
 */
export class TurtleExpressionParser {

    static TOKEN_NUMBER = 0;
    static TOKEN_VARIABLE = 1;
    static TOKEN_OPERATOR = 2;
    static TOKEN_OPENING_BRACKET = 3;
    static TOKEN_CLOSING_BRACKET = 4;

    static ASSOCIATIVITY_LEFT = 0;
    static ASSOCIATIVITY_RIGHT = 1;

    static UNARY_OPERATORS = new Map([
        // logical
        {char: '!', priority: 14, associativity: this.ASSOCIATIVITY_RIGHT, operands: 1, eval: (a) => (a === 0) ? 1 : 0},

        // number
        {char: '+', priority: 14, associativity: this.ASSOCIATIVITY_RIGHT, operands: 1, eval: (a) => a},
        {char: '-', priority: 14, associativity: this.ASSOCIATIVITY_RIGHT, operands: 1, eval: (a) => -a},
        {
            char: '\u{221A}',
            priority: 13,
            associativity: this.ASSOCIATIVITY_RIGHT,
            operands: 1,
            eval: (a) => Math.sqrt(a)
        },
        {
            char: '\u{221B}',
            priority: 13,
            associativity: this.ASSOCIATIVITY_RIGHT,
            operands: 1,
            eval: (a) => Math.pow(a, 1 / 3)
        },
        {
            char: '\u{B2}',
            priority: 13,
            associativity: this.ASSOCIATIVITY_LEFT,
            operands: 1,
            eval: (a) => Math.pow(a, 2)
        },
        {
            char: '\u{B3}',
            priority: 13,
            associativity: this.ASSOCIATIVITY_LEFT,
            operands: 1,
            eval: (a) => Math.pow(a, 3)
        },
    ].map(op => [op.char, op]));

    static BINARY_OPERATORS = new Map([
        // logical
        {
            char: '|',
            priority: 1,
            associativity: this.ASSOCIATIVITY_LEFT,
            operands: 2,
            eval: (a, b) => (a !== 0 || b !== 0) ? 1 : 0
        },
        {
            char: '&',
            priority: 2,
            associativity: this.ASSOCIATIVITY_LEFT,
            operands: 2,
            eval: (a, b) => (a !== 0 && b !== 0) ? 1 : 0
        },
        {
            char: '=',
            priority: 3,
            associativity: this.ASSOCIATIVITY_LEFT,
            operands: 2,
            eval: (a, b) => (a === b) ? 1 : 0
        },
        {
            char: '\u{2260}',
            priority: 3,
            associativity: this.ASSOCIATIVITY_LEFT,
            operands: 2,
            eval: (a, b) => (a !== b) ? 1 : 0
        },
        {char: '<', priority: 4, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => (a < b) ? 1 : 0},
        {
            char: '\u{2264}',
            priority: 4,
            associativity: this.ASSOCIATIVITY_LEFT,
            operands: 2,
            eval: (a, b) => (a <= b) ? 1 : 0
        },
        {char: '>', priority: 4, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => (a > b) ? 1 : 0},
        {
            char: '\u{2265}',
            priority: 4,
            associativity: this.ASSOCIATIVITY_LEFT,
            operands: 2,
            eval: (a, b) => (a >= b) ? 1 : 0
        },

        // number
        {char: '+', priority: 10, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => a + b},
        {char: '-', priority: 10, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => a - b},
        {char: '*', priority: 11, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => a * b},
        {char: '\u{D7}', priority: 11, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => a * b},
        {char: '/', priority: 11, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => a / b},
        {char: '\u{F7}', priority: 11, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => a / b},
        {char: '%', priority: 11, associativity: this.ASSOCIATIVITY_LEFT, operands: 2, eval: (a, b) => a % b},
        {char: '^', priority: 12, associativity: this.ASSOCIATIVITY_RIGHT, operands: 2, eval: (a, b) => Math.pow(a, b)}
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
                        case '!':
                            op = '\u{2260}';
                            break;
                        case '>':
                            op = '\u{2265}';
                            break;
                        case '<':
                            op = '\u{2264}';
                            break;
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
        }
        if (stack.length === 1) {
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