/**
 *
 * @author Patrik Harag
 * @version 2021-04-02
 */
export class TurtleParserUtils {

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