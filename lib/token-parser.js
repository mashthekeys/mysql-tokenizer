'use strict';

const {BinaryOrHex, Quote, InitialCommentChar, Identifier, Comment, Whitespace} = require('./regexp');

const verbose_debug = false;


// Single and double-quoted strings usually accept \\ as escape character.
// Backtick quotes do not use \\.
const defaultEscapeChar = {
    '"': '\\',
    "'": '\\',
    "`": null
};



const endOfLine = (() => {
    const nextNewLine = /\n|\r/g;

    return function endOfLine(string, from) {
        nextNewLine.lastIndex = from;
        const match = nextNewLine.exec(string);
        return match ? match.index : string.length;
    }
})();



function invalidBlock(token) {
    const output = [token];
    output.invalid = true;
    return output;
}

const WhitespaceToken = /[ \t\r\n]+/gy;
const IdentifierToken = /[0-9A-Za-z_$\u{80}-\u{10ffff}]+/guy;
const HexToken = /0x[0-9A-Fa-f]+/gy;
const NumberToken = /(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)(?:[eE]-?[0-9]*)?/gy;

// Allows the characters of IdentifierChar and also '.'
const IdentifierAfterAt = /[.0-9A-Za-z_$\u{80}-\u{10ffff}]+/guy;

const PunctuationChar = /[-:!#$%&()*+,.\/;<=>?[\]^{|}~]/;

class Parser {
    constructor(operatorMethod, input, start) {
        this.operator = operatorMethod;

        if (input !== undefined && input !== null) {
            input = String(input);
        }

        // Throw a TypeError for undefined and null input
        this.length = input.length;

        this.input = input;


        this.valid = true;

        start = start | 0;

        this.start = start;

        this.position = start;

        this.lookAheadPosition = start;

        this.markPosition = undefined;
    }

    static operatorMethod(operatorList) {
        // These characters are always considered to be operators
        // Dash must be first due to character class syntax.
        const specialChars = ['-', '.', ',', ';', '(', ')', '='];

        const operatorsByLength = operatorList.reduce((operatorsByLength, operator) => {
            if (operator.length && !specialChars.includes(operator)) {
                const isValidPunctuation = operator.split('').every(_ => PunctuationChar.test(_));
                if (isValidPunctuation) {
                    operatorsByLength[operator.length] = operatorsByLength[operator.length] || [];
                    operatorsByLength[operator.length].push(operator);
                } else {
                    throw new Error(`All operators must match ${PunctuationChar}`);
                }
            }
            return operatorsByLength;
        }, []);

        // const maxOperatorLength = operatorsByLength.length - 1;

        const RegExpEscapeInBody = /[$()*+.\/?[\]\\^{|}]/g;
        const RegExpEscapeInCharacterClass = /[\/\]\\]/g;

        const regExpSource = operatorsByLength.reduceRight((regExpSource, operators, operatorLength) => {
            if (operatorLength > 1) {
                operators.forEach(operator => {
                    regExpSource.push(operator.replace(RegExpEscapeInBody, '\\$&'))
                });
            } else {
                const operatorChars = operators.join('').replace(RegExpEscapeInCharacterClass, '\\$&');
                regExpSource.push(`[${specialChars.join('')}${operatorChars}]`);
            }
            return regExpSource;
        }, []);

        // Flags 'guy' ensure that this is a sticky regexp supporting unicode
        const OperatorRegExp = new RegExp(`(?:${regExpSource.join('|')})`, 'guy');

        return function operator(tokens) {
            let found = false;
            let length;

            do {
                // const position = this.position;
                const lookAhead1 = this.resetLookAhead(1);

                let match;
                if (PunctuationChar.test(lookAhead1)) {
                    found = true;
                    match = this.execRead(OperatorRegExp);
                    if (match !== null) {
                        tokens.push(match[0]);
                    } else {
                        // Loose punctuation that does not match an operator is returned as an invalid token
                        match = [this.readLookAhead()];
                        tokens.push(invalidBlock(match[0]))
                        this.valid = false;
                    }
                } else {
                    match = null;
                }

                // if (verbose_debug) console.log({ lookAhead1, match, from: position, to: this.position });
            } while (length);

            if (!found) {
                if (verbose_debug) console.error(regExpSource);
                throw new Error("operator() called but no operator found");
            }
        };
    }

    /** Executes a sticky RegExp ('g' and 'y' flags set),
     *  against the characters at the current read position
     *  of the parser.
     *
     *  If successful, the read position advances to the end
     *  of the match.
     *
     *  @param {RegExp} regExpG
     *  @return {Array|null}
     *  */
    execRead(regExpG) {
        regExpG.lastIndex = this.position;

        const lastIndex = regExpG.lastIndex;

        let match = regExpG.exec(this.input);

        if (match !== null && match.index !== this.position) {
            if (verbose_debug) console.warn('Non-sticky RegExp passed to execRead', { lastIndex, match, now: regExpG.lastIndex });
            match = null;
        }

        // if (verbose_debug) console.log({ lastIndex, match, now: regExpG.lastIndex });


        if (match !== null) {
            this.position += match[0].length;
        }
        return match;
    }


    read(n) {
        if (!arguments.length) n = 1;

        const start = this.position;
        const end = this.lookAheadPosition = this.position += n;
        return this.input.substring(start, end);
    }

    back(n) {
        if (!arguments.length) n = 1;

        this.position -= n;
    }

    next() {
        const here = this.position;
        this.lookAheadPosition = ++this.position;
        return this.input[here];
    }

    hasNext() {
        return this.position < this.length;
    }

    lookAhead(n) {
        if (n === undefined || n === 1) {
            return this.input[this.lookAheadPosition++];
        } else {
            const substr = this.input.substr(this.lookAheadPosition, n);
            this.lookAheadPosition += n;
            return substr;
        }
    }

    hasLookAhead() {
        return this.lookAheadPosition < this.length;
    }

    readLookAhead() {
        return this.read(this.lookAheadPosition - this.position);
    }

    lookToOffset(n) {
        return isNaN(n) ? undefined : this.input[this.position + n - 1];
    }

    resetLookAhead(n) {
        this.lookAheadPosition = this.position;

        if (n !== undefined && n > 0) {
            return this.lookAhead(n);
        }
    }

    identifyComment() {
        const match = Comment.exec(this.input.substr(this.position, 3));
        return match && (match[0] in this.comment) ? this.comment[match[0]] : undefined;
    }


    mark() {
        return (this.markPosition = this.position);
    }

    lookBehindToMark() {
        const lookBehind = this.input.substring(this.markPosition, this.position);
        this.markPosition = undefined;
        return lookBehind;
    }

    resetMark() {
        this.markPosition = undefined;
    }

    starComment(tokens) {
        // Match starred comment
        this.mark();
        this.read(2);
        const endPos = this.input.indexOf('*/', this.position);

        if (endPos >= 0) {
            this.position = endPos + 2;
            const commentBlock = this.lookBehindToMark();
            if (verbose_debug) console.error('// Starred comment', {tokens, commentBlock});
            tokens.push(commentBlock);

        } else {
            this.position = this.length;
            const commentBlock = this.lookBehindToMark();
            this.valid = false;
            tokens.push(invalidBlock(commentBlock));
            // throw new Error("invalid sql: starred comment does not end");
        }
    }

    singleLineComment(tokens) {
        // Single line comment
        this.mark();
        const endPos = endOfLine(this.input, this.position);
        this.position = endPos;
        const commentBlock = this.lookBehindToMark();
        if (verbose_debug) console.error('// Single line comment', {tokens, commentBlock, endPos});
        tokens.push(commentBlock);
    }
    
    quoted(tokens) {
        this.mark();
        let quoteChar = this.read();
        if (BinaryOrHex.test(quoteChar)) {
            // Handle hex and binary literals
            quoteChar = this.read();
        }
        const escapeChar = defaultEscapeChar[quoteChar];
        let withinQuote = true;
        let last = undefined;

        do {
            const current = this.read();
            // console.warn({current, parsePos, startQuote});

            if (current === quoteChar) {
                // Check for preceding escape
                // console.warn('// Check for preceding escape at %d', parsePos);
                const isEscaped = (last === escapeChar);

                if (!isEscaped) {
                    // console.warn('// !isEscaped', {current, quoteChar});
                    // Check for following repeated quote character
                    // console.warn('// Check for following repeated quote character at %d', parsePos);
                    const isDoubled = this.lookAhead() === quoteChar;
                    if (isDoubled) {
                        // console.warn('// isDoubled', {current, quoteChar});
                        this.read();
                    } else {
                        withinQuote = false;
                    }
                }
            }

            last = current;
        } while (withinQuote && this.hasNext());

        const quoteBlock = this.lookBehindToMark();

        if (withinQuote) {
            // invalid sql found
            this.valid = false;
            tokens.push(invalidBlock(quoteBlock));
            // if (verbose_debug) console.error('// !!! invalid sql found', {sql, tokens, quoteBlock});
        } else {
            tokens.push(quoteBlock);
            // if (verbose_debug) console.warn('// Quote', {tokens, quoteBlock});
        }
    } // end of quoted

    whitespace(tokens) {
        const match = this.execRead(WhitespaceToken);

        const length = match && match[0].length;
        if (length) {
            tokens.push(match[0]);
        } else {
            throw new Error("whitespace() called but no whitespace found");
        }
    }

    identifier(tokens, tokenType) {
        const match = this.execRead(IdentifierToken);

        const length = match && match[0].length;
        if (length) {
            tokens.push(match[0]);

        } else {
            throw new Error("identifier() called but no identifier found");
        }

        if (this.resetLookAhead(1) === '.') {
            tokens.push(this.next());
            if (tokenType) tokenType.push('operator');

            // Check to ensure that Identifier Dot Number is recognised as Identifier Dot Identifier
            if (Identifier.test(this.lookAhead())) {
                this.identifier(tokens, tokenType);
            }
        }
    }

    hexNumber(tokens) {
        const match = this.execRead(HexToken);

        const length = match && match[0].length;
        if (length) {
            tokens.push(match[0]);
        } else {
            throw new Error("hexNumber() called but no hexNumber found");
        }
    }

    number(tokens) {
        const match = this.execRead(NumberToken);

        const length = match && match[0].length;
        if (length) {
            tokens.push(match[0]);
        } else {
            throw new Error("number() called but no number found");
        }
    }

    atIdentifier(tokens) {
        this.resetLookAhead();

        let numberOfAts = 0;
        while (this.lookAhead() === '@') ++numberOfAts;

        const atChars = this.read(numberOfAts);

        if (numberOfAts > 2) {
            this.valid = false;
            tokens.push(invalidBlock(atChars));

        } else if (numberOfAts) {
            const nextChar = this.lookAhead();

            if (Quote.test(nextChar)) {
                const temp = [];
                this.quoted(temp);

                let [ quote ] =  temp;

                if (quote.invalid) {
                    quote[0] = `${atChars}${quote[0]}`;
                } else {
                    quote = `${atChars}${quote}`;
                }
                tokens.push(quote);

            } else if (nextChar === '.' || Identifier.test(nextChar)) {
                const match = this.execRead(IdentifierAfterAt);
                // const match = this.execRead(/\S+/ug);
                tokens.push(`${atChars}${match[0]}`);

            } else {
                this.valid = false;
                tokens.push(invalidBlock(atChars));
            }
        } else {
            throw new Error("atIdentifier() called but no atIdentifier found");
        }
    }

    unrecognised(tokens) {
        this.valid = false;
        tokens.push(invalidBlock(this.read()));
    }

    readNextToken(tokens, tokenType) {
        // Acquire non-quote block
        if (verbose_debug) console.warn('// Acquire new token at %d', this.position);

        let next = undefined;

        const current = this.lookToOffset(1);

        if (current === '0' && this.lookToOffset(2) === 'x') {
            next = this.hexNumber;

        } else if (current === '.' && '0123456789'.indexOf(this.lookToOffset(2)) !== -1) {
            next = this.number;

        } else if ('0123456789'.indexOf(current) !== -1) {
            next = this.number;

        } else if (current === '@') {
            next = this.atIdentifier;

        } else if (Quote.test(current)) {
            next = this.quoted;

        } else if (BinaryOrHex.test(current) && /^['"]/.test(this.lookToOffset(2))) {
            // Handle hex and binary literals
            next = this.quoted;

        } else if (InitialCommentChar.test(current)
            && (next = this.identifyComment())
        ) {
            // Nothing to do

        } else if (Whitespace.test(current)) {
            next = this.whitespace;

        } else if (PunctuationChar.test(current)) {
            next = this.operator;

        } else if (Identifier.test(current)) {
            next = this.identifier;

        } else {
            next = this.unrecognised;
        }

        if (verbose_debug) console.warn("// Token identified:", {
            token: next.name,
            identifiedBy: current,
            position: this.position,
            lookAheadPosition: this.lookAheadPosition,
            tokens
        });
        
        if (tokenType) tokenType.push(next.name);

        next.call(this, tokens, tokenType);
    }

    run(tokenType) {
        const tokens = [];
        while (this.hasNext()) {
            this.readNextToken(tokens, tokenType);
        }

        return tokens;
    }
}

Parser.prototype.comment = {
    '/*': Parser.prototype.starComment,
    '--': Parser.prototype.singleLineComment,
    '#': Parser.prototype.singleLineComment
};


Parser.create = function(operatorList) {
    const operator = Parser.operatorMethod(operatorList);

    return (class extends Parser {
        constructor(sql) {
            super(operator, sql);
        }
    });
}

module.exports = Parser;

