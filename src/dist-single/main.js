import { TurtleComponent } from "../TurtleComponent.js";
import { TurtleAdminToolsComponent } from "../TurtleAdminToolsComponent.js";
import { Context } from "../Context.js";
import { Analytics } from "../Analytics.js";
import { ServerApi } from "../ServerApi.js";


export function builder() {
    return new Builder();
}

/**
 *
 * @version 2023-04-09
 * @author Patrik Harag
 */
class Builder {

    #csrfParameterName;
    #csrfToken;

    #admin = false;

    #example = '';
    #imageId = null;

    setCsrf(csrfParameterName, csrfToken) {
        this.#csrfParameterName = csrfParameterName;
        this.#csrfToken = csrfToken;
        return this;
    }

    setExample(code) {
        this.#example = code;
        this.#imageId = null;
        return this;
    }

    setPublishedImageId(id) {
        this.#imageId = id;
        this.#example = '';
        return this;
    }

    enableAdminControls() {
        this.#admin = true;
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
        let node = turtleComponent.createNode();

        setTimeout(() => {
            turtleComponent.initialize();

            if (this.#imageId !== null) {
                ServerApi.getImage(context, this.#imageId).then(image => {
                    turtleComponent.setText(image.code);
                    Analytics.triggerFeatureUsed(Analytics.FEATURE_APP_INITIALIZED);

                    // enable admin tools
                    if (this.#imageId !== null && this.#admin) {
                        let adminToolsComponent = new TurtleAdminToolsComponent(context, image, turtleComponent);
                        node.append(adminToolsComponent.createNode());
                    }
                }).catch(reason => {
                    console.log(reason);
                });
            } else {
                // done
                Analytics.triggerFeatureUsed(Analytics.FEATURE_APP_INITIALIZED);
            }
        });

        return node;
    }
}
