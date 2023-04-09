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
 * @version 2023-04-08
 * @author Patrik Harag
 */
class Builder {

    #csrfParameterName;
    #csrfToken;

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
        if (!this.#csrfParameterName) {
            throw 'CSRF parameter name not set';
        }
        if (!this.#csrfToken) {
            throw 'CSRF token not set';
        }
        return new Context(this.#csrfParameterName, this.#csrfToken);
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

        return [
            examplesComponent.createNode(),
            turtleComponent.createNode(),
            messageContainer,
        ];
    }

    buildPublishPanel() {
        if (this.#tmpTurtleComponent === null) {
            throw 'Illegal state exception';
        }

        let context = this.#createContext();
        let publishComponent = new TurtlePublishComponent(context, this.#tmpTurtleComponent);
        return publishComponent.createNode();
    }

    buildGallery() {
        let context = this.#createContext();
        let galleryComponent = new TurtleGalleryComponent(context);
        return galleryComponent.createNode();
    }
}
