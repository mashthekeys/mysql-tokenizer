'use strict';

module.exports = exports.default = function isComment(block) {
    if (block[0] === '#') return true;

    const first2Chars = block.substring(0, 2);
    if (first2Chars === '--') return true;

    return (
        (first2Chars === '/*') &&
        (block.substring(block.length - 2, block.length) === '*/')
    );
};
