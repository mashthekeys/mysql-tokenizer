'use strict';

// Manual implementations of regexp for performance testing

/*
2019-05-18: Manual implementations barely improve performance compared
to RegExp and often worsen it substantially.

Conclusion: Use RegExp for string matching.

Elapsed Time (lower is better):
  {
    'regexp /^[XB]/i test': 8534,
    'regexp /^[XB]/i exec': 17665,
    'regexp BinaryOrHex test': 16149,
    'functional BinaryOrHex test': 17263,
    'object BinaryOrHex test': 15126,
    'regexp BinaryOrHex exec': 18615,
    'functional BinaryOrHex exec': 20238,
    'object BinaryOrHex exec': 19432,
    'regexp Comment test': 16725,
    'functional Comment test': 19754,
    'object Comment test': 21034,
    'regexp Comment exec': 17360,
    'functional Comment exec': 27438,
    'object Comment exec': 28368,
    'regexp InitialCommentChar test': 16288,
    'functional InitialCommentChar test': 13961,
    'object InitialCommentChar test': 14103,
    'regexp InitialCommentChar exec': 17829,
    'functional InitialCommentChar exec': 19754,
    'object InitialCommentChar exec': 21322,
    'regexp Quote test': 16728,
    'functional Quote test': 14355,
    'object Quote test': 15048,
    'regexp Quote exec': 17441,
    'functional Quote exec': 18902,
    'object Quote exec': 18954,
    'regexp Whitespace test': 15968,
    'functional Whitespace test': 15386,
    'object Whitespace test': 14053,
    'regexp Whitespace exec': 16518,
    'functional Whitespace exec': 20351,
    'object Whitespace exec': 19182
  }
 */

class MockRegExp {
    constructor(length, test) {
        this.length = length;
        this.test = test;
    }
    exec(string) {
        return this.test(string) ? [string.substr(0, this.length)] : null;
    }
}


const functional = {
    BinaryOrHex: new MockRegExp(1, function (string) {
        const chr = string[0];
        return chr === 'x' || chr === 'X' || chr === 'b' || chr === 'B';
    }),
    Comment: new MockRegExp(2, function (string) {
        if (string[0] === '#') {
            this.length = 1;
            return true;
        }
        const twoChars = String(string).substr(0, 2);
        if (twoChars === '/*') {
            this.length = 2;
            return true;
        }
        if (twoChars === '--' && (
            !this.requireWhitespace
            || (string.length === 2)
            || functional.Whitespace.test(string[2])
        )) {
            this.length = 2;
            return true;
        }
    }),
    InitialCommentChar: new MockRegExp(1, function (string) {
        const chr = string[0];
        return chr === '-' || chr === '#' || chr === '/';
    }),
    Quote: new MockRegExp(1, function (string) {
        const chr = string[0];
        return chr === "'" || chr === '"' || chr === '`';
    }),
    Whitespace: new MockRegExp(1, function (string) {
        const chr = string[0];
        return chr === ' ' || chr === '\t' || chr === '\r' || chr === '\n';
    }),
};

functional.Comment.requireWhitespace = true;


const BinHexObject = { b: true, B: true, x: true, X: true };
const InitialCommentCharObject = { '-': true, '#': true, '/': true };
const QuoteObject = { '"': true, "'": true, '`': true };
const WhitespaceObject = { ' ': true, '\t': true, '\n': true, '\r': true };

const object = {
    BinaryOrHex: new MockRegExp(1, function (string) {
        return BinHexObject[string[0]];
    }),
    Comment: new MockRegExp(2, function (string) {
        if (string[0] === '#') {
            this.length = 1;
            return true;
        }
        const twoChars = String(string).substr(0, 2);
        if (twoChars === '/*') {
            this.length = 2;
            return true;
        }
        if (twoChars === '--' && (
            !this.requireWhitespace
            || (string.length === 2)
            || object.Whitespace.test(string[2])
        )) {
            this.length = 2;
            return true;
        }
    }),
    InitialCommentChar: new MockRegExp(1, function (string) {
        return InitialCommentCharObject[string[0]];
    }),
    Quote: new MockRegExp(1, function (string) {
        return QuoteObject[string[0]];
    }),
    Whitespace: new MockRegExp(1, function (string) {
        return WhitespaceObject[string[0]];
    }),
};


object.Comment.requireWhitespace = true;


module.exports = exports.default = {};
exports.default.functional = functional;
exports.default.object = object;