'use strict';

const {BinaryOrHex, Quote, InitialCommentChar, Comment} = require('./regexp');

const verbose_debug = false;


// Single and double-quoted strings usually accept \\ as escape character.
// Backtick quotes do not use \\.
const defaultEscapeChar = {
    '"': '\\',
    "'": '\\',
    "`": null
};

/**
 * @param sql
 * @param parsePos
 * @returns {string}
 */
function identifyComment(sql, parsePos) {
    const match = Comment.exec(sql.substr(parsePos, 3));
    return match ? match[0] : false;
}


const nextNewLine = /\n|\r/g;

function endOfLine(string, from) {
    nextNewLine.lastIndex = from;
    const match = nextNewLine.exec(string);
    return match ? match.index : string.length;
}


module.exports = exports.default = function extractCommentsAndQuotes(sql) {
    const sqlLength = sql.length;
    if (!sqlLength) return [''];

    // console.warn('/* Assessing SQL (%d characters)\n%s\n*/', sql.length, sql);

    const blocks = [];
    let parsePos = 0;

    // Hard-limits the number of bytes to 1MB in development
    let noInfiniteLoops = verbose_debug ? 1000000 : Infinity;

    while (parsePos < sqlLength) {
        // Acquire non-quote block
        if (verbose_debug) console.warn('// Acquire non-quote block at %d', parsePos);
        const startPos = parsePos;
        let quoteFollows = false;
        let commentType = null;
        while (parsePos < sqlLength && !quoteFollows && !commentType) {
            const current = sql[parsePos];
            if (BinaryOrHex.test(current)) {
                // Handle hex and binary literals
                quoteFollows = Quote.test(sql[parsePos + 1]);
            } else {
                quoteFollows = Quote.test(current);
            }

            if (!quoteFollows) {
                if (InitialCommentChar.test(current)) {
                    commentType = identifyComment(sql, parsePos);
                }
                if (!commentType) {
                    ++parsePos;
                }
            }

            if (verbose_debug) console.warn({current, quoteFollows, commentType, parsePos, noInfiniteLoops});
            if (--noInfiniteLoops <= 0) { throw new Error(`Halted infinite loop at ${parsePos}\n${sql}\n--------`) }
        }

        if (startPos !== parsePos) {
            const nonQuoteBlock = sql.substring(startPos, parsePos);
            if (verbose_debug) console.warn('// Non-quote', {blocks, nonQuoteBlock});
            blocks.push(nonQuoteBlock);
        }

        if (quoteFollows) {
            // Acquire quote block
            // console.warn('// Acquire quote block at %d', parsePos);
            const startQuote = parsePos;
            let quoteChar = sql[startQuote];
            if (BinaryOrHex.test(quoteChar)) {
                // Handle hex and binary literals
                ++parsePos;
                quoteChar = sql[parsePos];
            }
            const escapeChar = defaultEscapeChar[quoteChar];
            let withinQuote = true;

            do {
                ++parsePos;

                const current = sql[parsePos];
                // console.warn({current, parsePos, startQuote});

                if (current === quoteChar) {
                    // Check for preceding escape
                    // console.warn('// Check for preceding escape at %d', parsePos);
                    const isEscaped = (parsePos > startQuote && sql[parsePos - 1] === escapeChar);

                    if (!isEscaped) {
                        // console.warn('// !isEscaped', {current, quoteChar});
                        // Check for following repeated quote character
                        // console.warn('// Check for following repeated quote character at %d', parsePos);
                        const isDoubled = (parsePos < sqlLength && sql[parsePos + 1] === quoteChar);
                        if (isDoubled) {
                            // console.warn('// isDoubled', {current, quoteChar});
                            ++parsePos;
                        } else {
                            withinQuote = false;
                        }
                    }
                }
            } while (withinQuote && parsePos < sqlLength);

            const quoteBlock = sql.substring(startQuote, ++parsePos);

            if (withinQuote) {
                // invalid sql found
                if (verbose_debug) console.error('// !!! invalid sql found', {sql, blocks, quoteBlock});
                throw new Error("invalid sql: quote does not end");
            } else {
                if (verbose_debug) console.warn('// Quote', {blocks, quoteBlock});
            }

            blocks.push(quoteBlock);

        } else if (commentType === '/*') {
            // Match starred comment
            const startPos = parsePos;
            parsePos += 2;
            const endPos = sql.indexOf('*/', parsePos);

            if (endPos >= 0) {
                parsePos = endPos + 2;
                const commentBlock = sql.substring(startPos, parsePos);
                if (verbose_debug) console.error('// Starred comment', {blocks, commentBlock});
                blocks.push(commentBlock);

            } else {
                throw new Error("invalid sql: starred comment does not end");
            }


        } else if (commentType !== null) {
            // Single line comment
            const startPos = parsePos;
            const endPos = endOfLine(sql, parsePos);
            parsePos = endPos;
            const commentBlock = sql.substring(startPos, endPos);
            if (verbose_debug) console.error('// Single line comment', {blocks, commentBlock, startPos, endPos});
            blocks.push(commentBlock);
        }

        if (--noInfiniteLoops <= 0) { throw new Error(`Halted infinite loop at ${parsePos}\n${sql}\n--------`) }
    }

    // console.warn('/* %d blocks */', blocks.length);
    return blocks;
};