'use strict';

const {BinaryOrHex, Quote} = require('./regexp');

module.exports = exports.default = function isQuoted(block) {
    const type = block[0];
    const start = BinaryOrHex.test(type) ? block[1] : type;
    const end = block[block.length - 1];
    return Quote.test(start) && Quote.test(end);
};
