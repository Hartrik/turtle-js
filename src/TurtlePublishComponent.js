import { DomBuilder } from "./DomBuilder.js";
import { ServerApi } from "./ServerApi.js";

/**
 * @requires jQuery
 *
 * @author Patrik Harag
 * @version 2023-04-08
 */
export class TurtlePublishComponent {

    #context;
    #messageContainer;
    #turtleComponent;

    constructor(context, messageContainer, turtleComponent) {
        this.#context = context;
        this.#messageContainer = messageContainer;
        this.#turtleComponent = turtleComponent;
    }

    createNode() {
        let panel = DomBuilder.div({ class: 'turtle-graphics-publish-component' });

        let button = DomBuilder.link('Publish', { class: 'btn btn-secondary' }, (e) => {
            this.#showDialog(() => {
                this.#messageContainer.append(DomBuilder.div({ class: 'alert alert-success', role: 'alert' }, [
                    DomBuilder.par(null, 'Published successfully')
                ]));
                panel.hide();
            })
        });
        panel.append(button);

        return panel;
    }

    #showDialog(onSuccess) {
        if (confirm('Are you sure that your creation is unique? Your IP address will be logged.')) {
            this.#send(onSuccess);
        }
    }

    #send(onSuccess) {
        let code = this.#turtleComponent.getText();
        code = code.trim();
        if (code.length > 1023) {
            alert("Code is too long!");
            return;
        }

        ServerApi.postGift(this.#context, code).then(value => {
            onSuccess();
        }).catch(reason => {
            alert('Publishing failed');
            console.log(reason);
        });
    }
}
