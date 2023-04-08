import { DomBuilder } from "./DomBuilder.js";
import { ServerApi } from "./ServerApi.js";
import { TurtleComponent } from "./TurtleComponent.js";

/**
 * @requires jQuery
 *
 * @author Patrik Harag
 * @version 2022-10-17
 */
export class TurtleGalleryComponent {

    #context;
    #rootNode;
    #enableAdminButtons = false;

    constructor(context, rootNode) {
        this.#context = context;
        this.#rootNode = rootNode;
    }

    enableAdminButtons() {
        this.#enableAdminButtons = true;
    }

    createNode() {
        let panel = DomBuilder.div({ class: 'turtle-graphics-gallery-component' });

        ServerApi.fetchExamples(this.#context).then(images => {
            // shuffle
            images = images.sort(() => Math.random() - 0.5);

            // build gallery
            let row = 0;
            for (let i = 0; i < images.length; i++) {
                if (row % 2 === 0 && i + 1 < images.length) {
                    let img1 = images[i];
                    i++;
                    let img2 = images[i];

                    let rowNode = DomBuilder.div({ class: 'row d-flex justify-content-center'} );
                    panel.append(rowNode);

                    let containerNode1 = DomBuilder.div({ class: 'col-md-6'} );
                    rowNode.append(containerNode1);
                    this.#initTurtleGraphics(img1, containerNode1);

                    let containerNode2 = DomBuilder.div({ class: 'col-md-6'} );
                    rowNode.append(containerNode2);
                    this.#initTurtleGraphics(img2, containerNode2);
                } else {
                    let img1 = images[i];

                    let rowNode = DomBuilder.div({ class: 'row d-flex justify-content-center'} );
                    panel.append(rowNode);

                    let containerNode = DomBuilder.div({ class: 'col-md-10'} );
                    rowNode.append(containerNode);

                    this.#initTurtleGraphics(img1, containerNode);
                }

                row++;
            }
        }).catch(reason => {
            console.log(reason);
            panel.append($('<p><strong>Cannot load examples</strong></p>'));
        });

        this.#rootNode.append(panel);
    }

    #initTurtleGraphics(image, parent) {
        let component = new TurtleComponent(this.#context, image.code);
        component.setCanvasSize(900, 400);
        component.setEditorSize(900, 300);
        component.setCollapsed(true);
        component.setDrawCursor(false);

        if (this.#enableAdminButtons) {
            let context = this.#context;
            component.addAction('_Update', function() {
                ServerApi.updateExample(context, image.id, component.getText()).then(value => {
                    alert("Updated");
                }).catch(reason => {
                    alert("Request failed");
                    console.log(reason);
                })
            });
            component.addAction('_Delete', function() {
                ServerApi.deleteExample(context, image.id).then(value => {
                    alert("Deleted");
                }).catch(reason => {
                    alert("Request failed");
                    console.log(reason);
                })
            });
        }

        parent.append(component.createNode());
        component.initialize();
    }
}
