/**
 *
 * @version 2022-03-12
 * @author Patrik Harag
 */
export class Context {

    csrfParameterName;
    csrfToken;

    constructor(csrfParameterName, csrfToken) {
        this.csrfParameterName = csrfParameterName;
        this.csrfToken = csrfToken;
    }
}
