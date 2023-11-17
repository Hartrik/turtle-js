import {DomBuilder} from "../DomBuilder";
import {Context} from "../Context";

export class ContextBuilder {

    static create(csrfParameterName, csrfToken) {
        const dialogAnchor = DomBuilder.div({ class: 'turtle-graphics-dialog-anchor' });
        document.body.prepend(dialogAnchor[0]);

        if (csrfParameterName === undefined) {
            throw 'CSRF parameter name not set';
        }
        if (csrfToken === undefined) {
            throw 'CSRF token not set';
        }

        return new Context(dialogAnchor, csrfParameterName, csrfToken);
    }
}