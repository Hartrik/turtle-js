import { DomBuilder } from "./DomBuilder.js";
import { ServerApi } from "./ServerApi.js";

/**
 *
 * @author Patrik Harag
 * @version 2023-04-09
 */
export class TurtleAdminToolsComponent {

    #context;
    #image;
    #turtleComponent;

    constructor(context, image, turtleComponent) {
        this.#context = context;
        this.#image = image;
        this.#turtleComponent = turtleComponent;
    }

    createNode() {
        return DomBuilder.div({ class: 'turtle-graphics-admin-tools-component' }, [
            this.#createInfo(),
            this.#createButtonPanel()
        ]);
    }

    #createInfo() {
        return DomBuilder.par(null, [
            DomBuilder.element('strong', null, 'Created: '),
            DomBuilder.span(new Date(this.#image.created).toDateString()),
            DomBuilder.element('br'),
            DomBuilder.element('strong', null, 'Verified: '),
            DomBuilder.span(this.#image.verified),
            DomBuilder.element('br'),
            DomBuilder.element('strong', null, 'Owner: '),
            DomBuilder.span(this.#image.owner),
            DomBuilder.element('br'),
            DomBuilder.element('strong', null, 'Owner IP: '),
            DomBuilder.span(this.#image.ownerIP),
            DomBuilder.element('br')
        ]);
    }

    #createButtonPanel() {
        let buttons = DomBuilder.div({ class: 'turtle-graphics-button-panel' });

        buttons.append(DomBuilder.button('Update', { class: 'btn btn-warning' }, () => {
            ServerApi.updateImage(this.#context, this.#image.id, this.#turtleComponent.getText()).then(value => {
                alert("Updated");
            }).catch(reason => {
                alert("Request failed");
                console.log(reason);
            })
        }));

        if (!this.#image.verified) {
            buttons.append(DomBuilder.button('Verify', { class: 'btn btn-warning' }, () => {
                ServerApi.updateImage(this.#context, this.#image.id, null, true).then(value => {
                    alert("Updated");
                }).catch(reason => {
                    alert("Request failed");
                    console.log(reason);
                })
            }));
        }

        buttons.append(DomBuilder.button('Delete', { class: 'btn btn-danger' }, () => {
            ServerApi.deleteImage(this.#context, this.#image.id).then(value => {
                alert("Deleted");
            }).catch(reason => {
                alert("Request failed");
                console.log(reason);
            });
        }));

        return buttons;
    }
}
