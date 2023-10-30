import { Context } from "../Context.js";
import { DomBuilder } from "../DomBuilder.js";
import { TurtleComponent } from "../TurtleComponent.js";
import { TurtleExamplesComponent } from "../TurtleExamplesComponent.js";
import { TurtlePublishComponent } from "../TurtlePublishComponent.js";
import { TurtleGalleryComponent } from "../TurtleGalleryComponent.js";
import { Analytics } from "../Analytics.js";


export function builder() {
    return new Builder();
}

/**
 *
 * @version 2023-10-30
 * @author Patrik Harag
 */
class Builder {

    #csrfParameterName;
    #csrfToken;

    #dialogAnchor = null;

    #admin = false;

    #tmpTurtleComponent = null;

    setCsrf(csrfParameterName, csrfToken) {
        this.#csrfParameterName = csrfParameterName;
        this.#csrfToken = csrfToken;
        return this;
    }

    enableAdminControls() {
        this.#admin = true;
        return this;
    }

    #createContext() {
        if (this.#dialogAnchor === null) {
            this.#dialogAnchor = DomBuilder.div({ class: 'turtle-graphics-dialog-anchor' });
            document.body.prepend(this.#dialogAnchor[0]);
        }
        if (!this.#csrfParameterName) {
            throw 'CSRF parameter name not set';
        }
        if (!this.#csrfToken) {
            throw 'CSRF token not set';
        }
        return new Context(this.#dialogAnchor, this.#csrfParameterName, this.#csrfToken);
    }

    buildFullEditor() {
        let context = this.#createContext();
        let turtleComponent = new TurtleComponent(context, '');
        let examplesComponent = new TurtleExamplesComponent((code) => turtleComponent.setText(code));
        let messageContainer = DomBuilder.div();

        setTimeout(() => {
            turtleComponent.setCanvasSize(690, 400);
            turtleComponent.setEditorSize(690, 300);
            turtleComponent.initialize();
            examplesComponent.selectFirst();
            Analytics.triggerFeatureUsed(Analytics.FEATURE_APP_INITIALIZED);
        });

        this.#tmpTurtleComponent = turtleComponent;

        let node = DomBuilder.div(null, [
            examplesComponent.createNode(),
            turtleComponent.createNode(),
            messageContainer,
        ]);
        return node[0];
    }

    buildPublishPanel() {
        if (this.#tmpTurtleComponent === null) {
            throw 'Illegal state exception';
        }

        let context = this.#createContext();
        let publishComponent = new TurtlePublishComponent(context, this.#tmpTurtleComponent);
        let node = publishComponent.createNode();
        return node[0];
    }

    buildGallery() {
        let context = this.#createContext();
        let galleryComponent = new TurtleGalleryComponent(context);
        let node = galleryComponent.createNode();
        return node[0];
    }
}
