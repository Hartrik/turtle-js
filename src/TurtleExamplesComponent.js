import { DomBuilder } from "./DomBuilder.js";

import EXAMPLE_1 from "../assets/example-01.turtle";
import EXAMPLE_2 from "../assets/example-02.turtle";
import EXAMPLE_3 from "../assets/example-03.turtle";
import EXAMPLE_4 from "../assets/example-04.turtle";
import EXAMPLE_5 from "../assets/example-05.turtle";
import EXAMPLE_6 from "../assets/example-06.turtle";
import EXAMPLE_7 from "../assets/example-07.turtle";
import EXAMPLE_8 from "../assets/example-08.turtle";

import EXAMPLE_1_IMAGE from "../assets/example-01.png";
import EXAMPLE_2_IMAGE from "../assets/example-02.png";
import EXAMPLE_3_IMAGE from "../assets/example-03.png";
import EXAMPLE_4_IMAGE from "../assets/example-04.png";
import EXAMPLE_5_IMAGE from "../assets/example-05.png";
import EXAMPLE_6_IMAGE from "../assets/example-06.png";
import EXAMPLE_7_IMAGE from "../assets/example-07.png";
import EXAMPLE_8_IMAGE from "../assets/example-08.png";

/**
 * @requires jQuery
 *
 * @author Patrik Harag
 * @version 2023-04-08
 */
export class TurtleExamplesComponent {

    #firstExample = null;
    #selectedNode = null;

    /** @type function(string) */
    #loadFunction;

    constructor(loadFunction) {
        this.#loadFunction = loadFunction;
    }

    createNode() {
        let panel = DomBuilder.div({ class: 'turtle-graphics-examples-component' });

        let exampleList1 = [
                [EXAMPLE_5, EXAMPLE_5_IMAGE],
                [EXAMPLE_8, EXAMPLE_8_IMAGE],
                [EXAMPLE_1, EXAMPLE_1_IMAGE],
                [EXAMPLE_7, EXAMPLE_7_IMAGE],
        ];

        let exampleList2 = [
                [EXAMPLE_6, EXAMPLE_6_IMAGE],
                [EXAMPLE_2, EXAMPLE_2_IMAGE],
                [EXAMPLE_3, EXAMPLE_3_IMAGE],
                [EXAMPLE_4, EXAMPLE_4_IMAGE],
        ];

        for (let list of [exampleList1, exampleList2]) {
            let listNode = DomBuilder.div({class: 'example-list'});
            panel.append(listNode);

            for (let [example, image] of list) {

                let container = DomBuilder.div({ class: 'example-image' });

                let img = DomBuilder.element('img', { src: image });
                img.on('click', () => {
                    if (this.#selectedNode !== null) {
                        this.#selectedNode.removeClass('selected');
                    }
                    this.#selectedNode = container;
                    this.#selectedNode.addClass('selected');
                    this.#loadFunction(example);
                });

                container.append(img);
                listNode.append(container);

                if (this.#firstExample === null) {
                    this.#firstExample = img;
                }
            }
        }
        return panel;
    }

    selectFirst() {
        this.#firstExample.click();
    }
}
