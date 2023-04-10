import FileSaver from "file-saver";
import { Canvg, presets } from "canvg";

/**
 *
 * @author Patrik Harag
 * @version 2023-04-10
 */
export class ExportUtils {

    static prepareSVG(svgNode) {
        let w = svgNode.width();
        let h = svgNode.height();
        let content = svgNode.html();
        return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
    }

    static downloadSVG(svgNode, defaultFilename) {
        const svg = this.prepareSVG(svgNode);
        const blob = new Blob([svg], {type: 'image/svg+xml;charset=utf-8;'});
        FileSaver.saveAs(blob, defaultFilename);
    }

    static downloadPNG(svgNode, defaultFilename) {
        const svg = this.prepareSVG(svgNode);
        const w = svgNode.width();
        const h = svgNode.height();

        async function convert() {
            const canvas = new OffscreenCanvas(w, h)
            const ctx = canvas.getContext('2d')
            const v = await Canvg.from(ctx, svg, presets.offscreen())

            // Render only first frame, ignoring animations and mouse.
            await v.render()

            const blob = await canvas.convertToBlob({type: "image/png"});
            FileSaver.saveAs(blob, defaultFilename);
        }

        convert();
    }
}