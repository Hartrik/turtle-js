import { DomBuilder } from "./DomBuilder.js";
import { ServerApi } from "./ServerApi.js";
import { Analytics } from "./Analytics.js";

/**
 *
 * @author Patrik Harag
 * @version 2023-11-17
 */
export class TurtlePublishComponent {

    #context;
    #turtleComponent;

    constructor(context, turtleComponent) {
        this.#context = context;
        this.#turtleComponent = turtleComponent;
    }

    createNode() {
        let panel = DomBuilder.div({ class: 'turtle-graphics-publish-component' });
        panel.append(DomBuilder.par(null, 'Once you draw something nice you can publish it. ' +
            'After that, you will get a permanent link to your creation, and it may eventually appear in the gallery.'));

        let buttonPanel = DomBuilder.div();
        let button = DomBuilder.button('Publish', { class: 'btn btn-secondary' }, (e) => {
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
        dialog.show(this.#context.dialogAnchor);
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
            let message = 'Publishing failed: ';
            if (reason.responseJSON !== undefined && reason.responseJSON.message !== undefined) {
                message += reason.responseJSON.message;
            } else {
                message += reason.statusText;
            }
            this.#showErrorDialog(message);

            console.log(reason);
        });
    }

    #showErrorDialog(message) {
        let dialog = new DomBuilder.BootstrapDialog();
        dialog.setBodyContent(message);
        dialog.setHeaderContent('Error');
        dialog.addCloseButton('Close');
        dialog.show(this.#context.dialogAnchor);
    }
}
