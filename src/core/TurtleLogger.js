/**
 *
 * @author Patrik Harag
 * @version 2021-04-04
 */
export class TurtleLogger {

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