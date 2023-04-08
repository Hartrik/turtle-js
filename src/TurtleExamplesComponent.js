import { DomBuilder } from "./DomBuilder.js";

/**
 * @requires jQuery
 *
 * @author Patrik Harag
 * @version 2022-10-11
 */
export class TurtleExamplesComponent {

    #rootNode;
    #firstExample = null;
    #selectedNode = null;

    /** @type function(string) */
    #loadFunction;

    constructor(rootNode, loadFunction) {
        this.#rootNode = rootNode;
        this.#loadFunction = loadFunction;
    }

    createNode() {
        let panel = DomBuilder.div({ class: 'turtle-graphics-examples-component' });

        let baseUrl = '/resources/app/turtle/examples/'

        let exampleList1 = [
                [TurtleExamplesComponent.EXAMPLE_5, 'example-05.png'],
                [TurtleExamplesComponent.EXAMPLE_8, 'example-08.png'],
                [TurtleExamplesComponent.EXAMPLE_1, 'example-01.png'],
                [TurtleExamplesComponent.EXAMPLE_7, 'example-07.png'],
        ];

        let exampleList2 = [
                [TurtleExamplesComponent.EXAMPLE_6, 'example-06.png'],
                [TurtleExamplesComponent.EXAMPLE_2, 'example-02.png'],
                [TurtleExamplesComponent.EXAMPLE_3, 'example-03.png'],
                [TurtleExamplesComponent.EXAMPLE_4, 'example-04.png'],
        ];

        for (let list of [exampleList1, exampleList2]) {
            let listNode = DomBuilder.div({class: 'example-list'});
            panel.append(listNode);

            for (let [example, previewFilename] of list) {

                let container = DomBuilder.div({ class: 'example-image' });

                let url = baseUrl + previewFilename;
                let img = DomBuilder.element('img', { src: url });
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
        this.#rootNode.append(panel);
    }

    selectFirst() {
        this.#firstExample.click();
    }


    static EXAMPLE_1 =
        'M(0, 170)\n' +
        'R(72) {\n' +
        '  R(365) {\n' +
        '    D(1)\n' +
        '    -(1)\n' +
        '  }\n' +
        '  M(10)\n' +
        '}\n';

    static EXAMPLE_2 =
        '# spider\n' +
        '\n' +
        'W(10)\n' +
        'S(40)\n' +
        '\n' +
        '[+D--D--D--D F]  # head\n' +
        '[+(180)-D+D+D++D+D+D F]  # body\n' +
        '\n' +
        '# legs\n' +
        'M($$s/2)\n' +
        '[\n' +
        '  [+++DD+D]\n' +
        '  [+(110)DD+D]\n' +
        '  M($$s/4)\n' +
        '  [++DD+D]\n' +
        '  [+(60)DD+D]\n' +
        ']\n' +
        '[\n' +
        '  [---DD-D]\n' +
        '  [-(110)DD-D]\n' +
        '  M($$s/4)\n' +
        '  [--DD-D]\n' +
        '  [-(60)DD-D]\n' +
        ']\n' +
        '\n' +
        '# mandibles\n' +
        '[+(20)D($$s * 1.5)]\n' +
        '[-(20)D($$s * 1.5)]\n';


    static EXAMPLE_3 =
        '# test random\n' +
        '\n' +
        '@spider {\n' +
        '  [+D--D--D--D F]  # head\n' +
        '  [+(180)-D+D+D++D+D+D F]  # body\n' +
        '\n' +
        '  # legs\n' +
        '  M($$s/2)\n' +
        '  [\n' +
        '    [+++DD+D]\n' +
        '    [+(110)DD+D]\n' +
        '    M($$s/4)\n' +
        '    [++DD+D]\n' +
        '    [+(60)DD+D]\n' +
        '  ]\n' +
        '  [\n' +
        '    [---DD-D]\n' +
        '    [-(110)DD-D]\n' +
        '    M($$s/4)\n' +
        '    [--DD-D]\n' +
        '    [-(60)DD-D]\n' +
        '  ]\n' +
        '\n' +
        '  # mandibles\n' +
        '  [+(20)D($$s * 1.5)]\n' +
        '  [-(20)D($$s * 1.5)]\n' +
        '}\n' +
        '\n' +
        'R(30) {\n' +
        '  M($$rnd*$$width/2 - $$rnd*$$width/2, $$rnd*$$height/2 - $$rnd*$$height/2)\n' +
        '  A($$rnd * 90)\n' +
        '  W(1.5)\n' +
        '  S(5 + 4 * $$rnd)\n' +
        '  $c($$rnd * 255/2) C($c, 0, $c)\n' +
        '  @spider\n' +
        '}\n';

    static EXAMPLE_4 =
        '# Koch snowflake\n' +
        '# https://en.wikipedia.org/wiki/Koch_snowflake\n' +
        '\n' +
        '$segment_part_ratio(3)\n' +
        '\n' +
        '@segment($length, $n) {\n' +
        '  ?($n = 0) {\n' +
        '    D($length)\n' +
        '  }\n' +
        '  ?($n > 0) {\n' +
        '    @segment($length / $segment_part_ratio, $n - 1)\n' +
        '    +(60)\n' +
        '    @segment($length / $segment_part_ratio, $n - 1)\n' +
        '    -(120)\n' +
        '    @segment($length / $segment_part_ratio, $n - 1)\n' +
        '    +(60)\n' +
        '    @segment($length / $segment_part_ratio, $n - 1)\n' +
        '  }\n' +
        '}\n' +
        '\n' +
        '@snowflake($segment_size, $iterations) {\n' +
        '  R(3) {\n' +
        '    @segment($segment_size, $iterations)\n' +
        '    -(120)\n' +
        '  }\n' +
        '}\n' +
        '\n' +
        '!(10)\n' +
        '\n' +
        '# full snowflake with border\n' +
        'M(-250, 80)\n' +
        'C(220)\n' +
        '@snowflake(240, 3)\n' +
        'F\n' +
        'C(0)\n' +
        '@snowflake(240, 3)\n' +
        '\n' +
        '# segments\n' +
        'C(0)\n' +
        'M(50, 140) @segment(200, 0)\n' +
        'M(50, 70) @segment(200, 1)\n' +
        'M(50, 0) @segment(200, 2)\n' +
        'M(50, -70) @segment(200, 3)\n' +
        'M(50, -140) @segment(200, 4)\n';

    static EXAMPLE_5 =
        '# try to edit code below\n' +
        '# these two lines are just comments\n' +
        '\n' +
        'D(100)   # draw forward by 100\n' +
        '+(90)    # turn left by 90 degrees\n' +
        'D(50)\n' +
        '+(90)\n' +
        'D(100)\n' +
        '+(90)\n' +
        'D(25)\n' +
        '\n' +
        '# you can also select different example...';

    static EXAMPLE_6 =
        'C(0, 180, 180)\n' +
        'M(50, 0)\n' +
        'R (10) {\n' +
        '  E D(20)+D(20)+D(70)FD(40)+D(20)+D(60)+\n' +
        '}\n' +
        '\n' +
        'M(-80, -100)\n' +
        'C(0, 70, 180)\n' +
        'A(0)\n' +
        'R (10) {\n' +
        '  E D(20)+(60)D(20)+(60)D(70) F D(40)+(60)D(20)+(60)D(60)+(60)\n' +
        '}\n';

    static EXAMPLE_7 =
        'R(6) {\n' +
        '  H\n' +
        '  R(5) {\n' +
        '    D(50)+(60)\n' +
        '    D(50)-(120)   # try append F, Z or D here\n' +
        '  }\n' +
        '}\n';

    static EXAMPLE_8 =
        'W(3)   # set stroke width \n' +
        'S(70)  # set step\n' +
        '\n' +
        '# triangle\n' +
        'M(-125, 0)\n' +
        'R(3) {\n' +
        ' D\n' +
        ' +(360/3)\n' +
        '}\n' +
        '\n' +
        '# square\n' +
        'M(-35, 0)\n' +
        'R(4) {\n' +
        ' D\n' +
        ' +(360/4)\n' +
        '}\n' +
        '\n' +
        '# pentagon\n' +
        'M(75, 0)\n' +
        'R(5) {\n' +
        ' D\n' +
        ' +(360/5)\n' +
        '}\n';
}
