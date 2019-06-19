'use strict';


module.exports = exports.default = {
    // Initial RegExps must start with a '^' and match at most one character.
    Initial: {
        BinaryOrHex: /^[xXbB]/,

        BinaryOrHexQuote: /^['"]/,

        Identifier: /^[0-9A-Za-z_$\u{80}-\u{d7ff}\u{e000}-\u{ffff}]/u,

        PossibleComment: /^[-#/]/,

        Punctuation: /^[-:!#%&()*+,.\/;<=>?[\]^{|}~]/,

        SurrogateHigh: /^[\u{d800}-\u{dbff}]/u,

        SurrogateLow: /^[\u{dc00}-\u{dfff}]/u,

        Quote: /^['"`]/,

        Whitespace: /^[ \t\r\n]/
    },

    // Token RegExps must have the 'g' and 'y' flags set.
    Token: {
        HexNumber: /0x[0-9A-Fa-f]+/gy,

        Identifier: /[0-9A-Za-z_$\u{80}-\u{d7ff}\u{e000}-\u{ffff}]+/guy,

        // Allows the characters of IdentifierChar and also '.'
        IdentifierAfterAt: /[.0-9A-Za-z_$\u{80}-\u{d7ff}\u{e000}-\u{ffff}]*/guy,

        Number: /(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)(?:[eE]-?[0-9]*)?/gy,

        StartComment: /(?:#|--(?=\s)|--$|\/\*)/gy,

        Whitespace: /[ \t\r\n]+/gy
    }
};
