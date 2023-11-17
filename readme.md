# Turtle JS

Turtle graphics is a popular way for introducing programming to non-programmers.

This is a simple **turtle graphics implementation** in JavaScript that works in browser.
Imagine a robotic turtle starting at (0, 0) in the x-y plane.
Give it the command `D(50)`, and it moves (on-screen) 50 pixels in the direction it is facing, drawing a line as it moves.
Give it the command `+(45)`, and it rotates in-place 45 degrees counter-clockwise.
There are many other commands as well as variables, conditions, loops and procedures.

**Online: https://harag.cz/app/turtle**

![Turtle graphics example](https://files.harag.cz/www/app/turtle-js/social-preview.png)

## Milestones

- 2021-03-02: The first commit
- 2021-04-07: Turtle language finalized (hasn't been touched since)
- 2022-10-12: Examples – from simple to advanced, right next to the editor
- 2022-10-17: Publishing
- 2023-04-08: The codebase moved into *this* separate Git repository and migrated to Rollup.js
- 2023-04-10: PNG export introduced
- 2023-10-30: Migration to Bootstrap 5

## Development

`npm install` to install dependencies.

`npm run build` builds the library to `dist`.

`npm run dev` builds the library, then keeps rebuilding it whenever the source files change using rollup-watch.

`npm test` builds the library, then tests it.

## TODOs

- TODO: on exception - ability to determine position in source

Turtle language ideas:
- TODO: (?) allow argument list without parenthesis
- TODO: text - T("hello")
- TODO: stroke pattern - P("dotted"), P("dashed"), P(10, 5)...
- TODO: colors using string - B("red")...
- TODO: bezier curve (B)
- TODO: introduce optimizing painter - merge sequences like DDD, M(10)M(50, 20)...
