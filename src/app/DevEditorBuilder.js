import {DomBuilder} from "../DomBuilder";
import {TurtleComponent} from "../TurtleComponent";
import {TurtleExamplesComponent} from "../TurtleExamplesComponent";
import {Analytics} from "../Analytics";
import {TurtlePublishComponent} from "../TurtlePublishComponent";
import {ContextBuilder} from "./ContextBuilder";

/**
 *
 * @version 2023-11-17
 * @author Patrik Harag
 */
export class DevEditorBuilder {

    #contextBuilder;
    #csrfParameterName;
    #csrfToken;

    #dialogAnchor = null;

    #publish = false;

    setCsrf(csrfParameterName, csrfToken) {
        this.#csrfParameterName = csrfParameterName;
        this.#csrfToken = csrfToken;
        return this;
    }

    enablePublish() {
        this.#publish = true;
        return this;
    }

    build() {
        let context = ContextBuilder.create(this.#csrfParameterName, this.#csrfToken);
        let turtleComponent = new TurtleComponent(context, '');
        let examplesComponent = new TurtleExamplesComponent((code) => turtleComponent.setText(code));
        let messageContainer = DomBuilder.div();

        let publish = null;
        if (this.#publish) {
            let publishComponent = new TurtlePublishComponent(context, turtleComponent);
            publish = publishComponent.createNode();
        }

        setTimeout(() => {
            turtleComponent.setCanvasSize(690, 400);
            turtleComponent.setEditorSize(690, 300);
            turtleComponent.initialize();
            examplesComponent.selectFirst();
            Analytics.triggerFeatureUsed(Analytics.FEATURE_APP_INITIALIZED);
        });

        let node = DomBuilder.div(null, [
            examplesComponent.createNode(),
            turtleComponent.createNode(),
            messageContainer,
            publish
        ]);

        return node[0];
    }
}