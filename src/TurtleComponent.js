import { TurtleGraphics } from "./TurtleGraphics.js";
import { Context } from "./Context.js";
import { DomBuilder } from "./DomBuilder.js";
import { Analytics } from "./Analytics.js";
import { EditorView, basicSetup } from "codemirror"

/**
 * @requires jQuery
 *
 * @author Patrik Harag
 * @version 2023-04-08
 */
export class TurtleComponent {

    context;

    init = {
        code: '',
        drawCursor: true,
        collapsed: false,
        canvasWidthPx: null,  // resizable
        canvasHeightPx: 400,
        editorWidthPx: null,  // resizable
        editorHeightPx: 300,
        actions: new Map()
    };

    nodePanel;
    nodeCanvas;
    nodeCanvasHeader;
    nodeCanvasOverlay;
    nodeEditorPanel;
    nodeDialogAnchor;

    editor;
    turtleGraphics;

    settingText = false;

    /**
     *
     * @param context {Context}
     * @param code {string}
     */
    constructor(context, code) {
        this.context = context;
        this.init.code = code;
    }

    setDrawCursor(drawCursor) {
        this.init.drawCursor = drawCursor;
    }

    setCollapsed(collapsed) {
        this.init.collapsed = collapsed;
    }

    setCanvasSize(widthPx, heightPx) {
        this.init.canvasWidthPx = widthPx;
        this.init.canvasHeightPx = heightPx;
    }

    setEditorSize(widthPx, heightPx) {
        this.init.editorWidthPx = widthPx;
        this.init.editorHeightPx = heightPx;
    }

    addAction(name, actionFunction) {
        this.init.actions.set(name, actionFunction);
    }

    createNode() {
        let panel = $('<div class="turtle-graphics-component"></div>');
        panel.append(this.nodeCanvasHeader = $('<div class="turtle-graphics-canvas-header"></div>'));
        panel.append(this.nodeCanvas = $('<svg class="turtle-graphics-canvas"></svg>'));
        panel.append(this.nodeCanvasOverlay = $('<div class="turtle-graphics-overlay"></div>'));
        panel.append($('<br>'));
        panel.append(this.nodeEditorPanel = $('<div class="turtle-graphics-editor"></div>'));
        panel.append(this.nodeDialogAnchor = $('<div></div>'));
        this.nodePanel = panel;
        return panel;
    }

    initialize() {
        // canvas width & height
        const canvasWidth = Math.min((this.init.canvasWidthPx !== null) ? this.init.canvasWidthPx : Number.MAX_VALUE,
            this.nodeCanvas.parent().width());
        this.nodeCanvas.width(canvasWidth);
        this.nodeCanvas.height(this.init.canvasHeightPx);

        // init canvas overlay
        this._initializeOverlay();

        // init editor
        this.editor = this._createEditor(this.init.code);
        this.nodeEditorPanel.append(this.editor.dom);
        const editorWidth = Math.min((this.init.editorWidthPx !== null) ? this.init.editorWidthPx : Number.MAX_VALUE,
                this.nodeCanvas.parent().width());

        // set panel max width - this allows to place something next
        this.nodePanel.css('max-width', Math.max(canvasWidth, editorWidth) + 'px');

        // set canvas overlay width
        this.nodeCanvasOverlay.width(canvasWidth);

        // init turtle graphics
        this.turtleGraphics = new TurtleGraphics(this.nodeCanvas);
        this.turtleGraphics.setDrawCursor(this.init.drawCursor);

        if (this.init.collapsed) {
            let hidden = true;
            this.nodeEditorPanel.hide();
            this.nodeCanvas.on("click", () => {
                if (hidden) {
                    this.nodeEditorPanel.show();
                } else {
                    this.nodeEditorPanel.hide();
                }
                hidden = !hidden;
            });
        }

        this._redraw();
    }

    _redraw() {
        this.nodePanel.removeClass('has-error');
        this.nodeCanvasHeader.empty();

        let logs = [];
        this.turtleGraphics.setLogHandler((msg, severity) => logs.push(severity + ': ' + msg));
        this.turtleGraphics.draw(this.getText());

        if (logs.length > 0) {
            this.nodePanel.addClass('has-error');
            this.nodeCanvasHeader.append(this.#createButtonShowLog(this.nodeDialogAnchor, logs))
        }
    }

    _initializeOverlay() {
        let toolbar = DomBuilder.div({ class: 'turtle-graphics-toolbar' });

        toolbar.append(DomBuilder.link('Export as SVG', { class: 'btn btn-sm btn-secondary' }, e => {
            Utils.downloadSVG(this.nodeCanvas, 'image.svg');
            Analytics.triggerFeatureUsed(Analytics.FEATURE_EXPORT_SVG);
        }));

        this.init.actions.forEach((value, key) => {
            toolbar.append(DomBuilder.link(key, { class: 'btn btn-sm btn-secondary' }, e => {
                value();
            }));
        });

        this.nodeCanvasOverlay.append(toolbar);

        this.nodeCanvas.on('contextmenu', (e) => {
            return false;  // blocks default right click menu
        });
    }

    _createEditor(code) {
        return new EditorView({
            doc: code,
            extensions: [
                basicSetup,
                EditorView.updateListener.of((v) => {
                    if (v.docChanged) {
                        this.turtleGraphics.setDrawCursor(true);
                        this._redraw();

                        if (!this.settingText) {
                            Analytics.triggerFeatureUsed(Analytics.FEATURE_EDITOR);
                        }
                    }
                })
            ]
        });
    }

    #createButtonShowLog(dialogAnchor, logs) {
        return DomBuilder.link('!', { tabindex: '0', class: 'badge badge-pill badge-danger turtle-show-log-button', role: 'button' }, e => {
            let uniqueLines = logs.filter((item, i, ar) => ar.indexOf(item) === i);
            let uniqueLinesAsString = uniqueLines.join('\n');

            let dialog = new DomBuilder.BootstrapDialog();
            dialog.setBodyContent(DomBuilder.element('code', { style: 'white-space: pre-line;' }, uniqueLinesAsString));
            dialog.setHeaderContent('Interpreter output');
            dialog.addCloseButton('Close');
            dialog.show(dialogAnchor);

            Analytics.triggerFeatureUsed(Analytics.FEATURE_SHOW_LOG);
        });
    }

    setText(code) {
        this.settingText = true;
        this.editor.dispatch({
            changes: {
                from: 0,
                to: this.editor.state.doc.length,
                insert: code
            }
        });
        this.settingText = false;
    }

    getText() {
        return this.editor.state.doc.toString();
    }
}

/**
 *
 * @author Patrik Harag
 * @version 2022-10-11
 */
class Utils {

    static download(content, defaultFilename, contentType) {
        // create a blob
        let blob = new Blob([content], { type: contentType });
        let url = URL.createObjectURL(blob);

        // create a link to download it
        let pom = document.createElement('a');
        pom.href = url;
        pom.setAttribute('download', defaultFilename);
        pom.click();
    }

    static downloadSVG(svgNode, defaultFilename) {
        let w = svgNode.width();
        let h = svgNode.height();
        let content = svgNode.html();
        let svg = `<svg width="${ w }" height="${ h }" xmlns="http://www.w3.org/2000/svg">${ content }</svg>`;

        Utils.download(svg, defaultFilename, 'image/svg+xml;charset=utf-8;');
    }
}
