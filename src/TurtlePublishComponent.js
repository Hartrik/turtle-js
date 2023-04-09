import { DomBuilder } from "./DomBuilder.js";
import { ServerApi } from "./ServerApi.js";
import { Analytics } from "./Analytics.js";

/**
 * @requires jQuery
 *
 * @author Patrik Harag
 * @version 2023-04-09
 */
export class TurtlePublishComponent {

    #context;
    #turtleComponent;

    #dialogAnchor;

    constructor(context, turtleComponent) {
        this.#context = context;
        this.#turtleComponent = turtleComponent;
    }

    createNode() {
        let panel = DomBuilder.div({ class: 'turtle-graphics-publish-component' });
        this.#dialogAnchor = panel;

        let buttonPanel = DomBuilder.div();
        let button = DomBuilder.link('Publish', { class: 'btn btn-secondary' }, (e) => {
            this.#showDialog((id) => {
                let link = ServerApi.getImageUrl(id);

                panel.append(DomBuilder.div({ class: 'alert alert-success', role: 'alert' }, [
                    DomBuilder.par(null, 'Published successfully'),
                    DomBuilder.par(null, [
                        DomBuilder.span('Permanent link: '),
                        DomBuilder.element('a', { href: link, target: '_blank' }, link)
                    ])
                ]));
                buttonPanel.hide();
            })
        });
        buttonPanel.append(button);
        panel.append(buttonPanel);
        return panel;
    }

    #showDialog(onSuccess) {
        let dialog = new DomBuilder.BootstrapDialog();
        dialog.setHeaderContent('Publish');
        dialog.setBodyContent([
            DomBuilder.par(null, 'Are you sure that your creation is unique?'),
            DomBuilder.par(null, 'Your IP address will be logged.')
        ]);
        dialog.addSubmitButton('Confirm', () => this.#send(onSuccess));
        dialog.addCloseButton('Close');
        dialog.show(this.#dialogAnchor);
    }

    #send(onSuccess) {
        let code = this.#turtleComponent.getText();
        code = code.trim();
        if (code.length > 1023) {
            this.#showErrorDialog('Code is too long!');
            return;
        }

        ServerApi.postImage(this.#context, code).then(value => {
            onSuccess(value.id);
            Analytics.triggerFeatureUsed(Analytics.FEATURE_PUBLISH);
        }).catch(reason => {
            this.#showErrorDialog('Publishing failed');
            console.log(reason);
        });
    }

    #showErrorDialog(message) {
        let dialog = new DomBuilder.BootstrapDialog();
        dialog.setBodyContent(message);
        dialog.setHeaderContent('Error');
        dialog.addCloseButton('Close');
        dialog.show(this.#dialogAnchor);
    }
}
