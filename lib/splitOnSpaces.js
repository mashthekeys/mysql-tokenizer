'use strict';

const isWhiteSpace = require('./isWhiteSpace');

module.exports = exports.default = function splitOnSpaces(sql) {
    return sql.split('').reduce((blocks, character) => {
        const isSpace = isWhiteSpace(character);
        const numBlocks = blocks.length;

        // TODO Surely this can be done with fewer array instances
        if (numBlocks === 0) {
            // blocks.push(character);
            return [character];
        } else {
            const lastBlock = blocks[numBlocks - 1];

            const lastBlockIsSpace = isWhiteSpace(lastBlock);

            if (isSpace === lastBlockIsSpace) {
                // Character and last block are of the same type, that is both
                // are spaces or both are not spaces. In this case, character is
                // appended to last block.
                return blocks.slice(0, numBlocks - 1).concat(lastBlock + character);
                // blocks[numBlocks - 1] = lastBlock + character;
            } else {
                // Character and last block are of not of the same type, hence
                // character will start a new block.
                return blocks.slice(0, numBlocks - 1).concat([lastBlock, character]);
            }
        }
        // return blocks;
    }, []);
};
