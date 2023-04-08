import { TurtleComponent } from "../TurtleComponent.js";
import { Context } from "../Context.js";
import { Analytics } from "../Analytics.js";


export function builder() {
    return new Builder();
}

/**
 *
 * @version 2023-04-08
 * @author Patrik Harag
 */
class Builder {

    #csrfParameterName;
    #csrfToken;

    #example = '';

    setCsrf(csrfParameterName, csrfToken) {
        this.#csrfParameterName = csrfParameterName;
        this.#csrfToken = csrfToken;
        return this;
    }

    setExample(code) {
        this.#example = code;
        return this;
    }

    build() {
        if (!this.#csrfParameterName) {
            throw 'CSRF parameter name not set';
        }
        if (!this.#csrfToken) {
            throw 'CSRF token not set';
        }
        let context = new Context(this.#csrfParameterName, this.#csrfToken);

        let turtleComponent = new TurtleComponent(context, this.#example);
        setTimeout(() => {
            turtleComponent.initialize();
            Analytics.triggerFeatureUsed(Analytics.FEATURE_APP_INITIALIZED);
        });
        return turtleComponent.createNode();
    }
}
