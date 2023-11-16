/**
 *
 * @author Patrik Harag
 * @version 2021-04-04
 */
export class TurtleTerminatedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TurtleTerminatedError';
    }
}