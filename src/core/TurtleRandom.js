/**
 *
 * @author Patrik Harag
 * @version 2021-04-07
 */
export class TurtleRandom {
    seed = 1;

    nextDouble() {
        // 1993 Park-Miller LCG
        this.seed = Math.imul(48271, this.seed) | 0 % 2147483647;
        return (this.seed & 2147483647) / 2147483648;
    }
}