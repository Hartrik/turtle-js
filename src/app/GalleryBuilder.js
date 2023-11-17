import {TurtleGalleryComponent} from "../TurtleGalleryComponent";
import {ContextBuilder} from "./ContextBuilder";

/**
 *
 * @version 2023-11-17
 * @author Patrik Harag
 */
export class GalleryBuilder {

    #contextBuilder;
    #csrfParameterName;
    #csrfToken;

    setCsrf(csrfParameterName, csrfToken) {
        this.#csrfParameterName = csrfParameterName;
        this.#csrfToken = csrfToken;
        return this;
    }

    build() {
        let context = ContextBuilder.create(this.#csrfParameterName, this.#csrfToken);
        let galleryComponent = new TurtleGalleryComponent(context);
        let node = galleryComponent.createNode();
        return node[0];
    }
}