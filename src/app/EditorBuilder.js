import { TurtleComponent } from "../TurtleComponent.js";
import { TurtleAdminToolsComponent } from "../TurtleAdminToolsComponent.js";
import { Analytics } from "../Analytics.js";
import { ServerApi } from "../ServerApi.js";
import { ContextBuilder } from "./ContextBuilder";

/**
 *
 * @version 2023-11-17
 * @author Patrik Harag
 */
export class EditorBuilder {

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
        let context = ContextBuilder.create(this.#csrfParameterName, this.#csrfToken);

        let turtleComponent = new TurtleComponent(context, this.#example);
        turtleComponent.setCanvasSize(null, Math.max(Math.trunc(window.innerHeight * 0.7), 400));
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

        return node[0];
    }
}
