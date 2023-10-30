/**
 *
 * @version 2023-10-30
 * @author Patrik Harag
 */
export class Context {

    dialogAnchor;

    csrfParameterName;
    csrfToken;

    constructor(dialogAnchor, csrfParameterName, csrfToken) {
        this.dialogAnchor = dialogAnchor;
        this.csrfParameterName = csrfParameterName;
        this.csrfToken = csrfToken;
    }
}
