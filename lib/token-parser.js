'use strict';

const MysqlRegExp = require('./regexp');

const verbose_debug = false;


// Single and double-quoted strings usually accept \\ as escape character.
// Backtick quotes do not use \\.
const defaultEscapeChar = {
    '"': '\\',
    "'": '\\',
    "`": null
};

// Backtick quotes do not allow Unicode characters beyond U+FFFF.
const restrictToUnicodeBMP = {
    "`": true
};



const endOfLine = (() => {
    const nextNewLine = /\n|\r/g;

    return function endOfLine(string, from) {
        nextNewLine.lastIndex = from;
        const match = nextNewLine.exec(string);
        return match ? match.index : string.length;
    }
})();


function store(tokens, tokenInfo, token, tokenType, quoteType) {
    tokens.push(token);

    if (tokenInfo) {
        if (tokenType === undefined) {
            tokenType = 'invalid';
        }

        tokenInfo.push({
            tokenType,
            quoteType
        })
    }
}



function invalidBlock(content) {
    const token = [content];
    token.invalid = true;
    return token;
}




class Parser {
    constructor(input, start) {
        if (input === undefined || input === null) {
            throw new TypeError(`input cannot be ${input}`);
        }
        input = String(input);

        this.input = input;

        this.length = input.length;

        this.valid = true;

        start = start | 0;

        this.start = start;

        this.position = start;

        this.lookAheadPosition = start;

        this.markPosition = undefined;
    }

    static operatorRegExp(operatorList, Initial) {
        // These characters are always considered to be operators
        // Dash must be first due to character class syntax.
        const specialChars = ['-', '.', ',', ';', '(', ')', '='];

        const operatorsByLength = operatorList.reduce((operatorsByLength, operator) => {
            if (operator.length && !specialChars.includes(operator)) {
                const isValidPunctuation = operator.split('').every(_ => Initial.Punctuation.test(_));
                if (isValidPunctuation) {
                    (
                        operatorsByLength[operator.length] = operatorsByLength[operator.length] || []
                    ).push(operator);
                } else {
                    throw new Error(`All operators must match ${Initial.Punctuation}`);
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

        if (verbose_debug) console.error('// Created operator RegExp to match ', regExpSource);

        return OperatorRegExp;
    }

    /** Executes a sticky RegExp ('g' and 'y' flags set),
     *  against the characters at the current read position
     *  of the parser.
     *
     *  If successful, the read position advances to the end
     *  of the match.
     *
     *  @param {RegExp} regExp
     *  @return {Array|null}
     *  */
    execRead(regExp) {
        regExp.lastIndex = this.position;

        const lastIndex = regExp.lastIndex;

        let match = regExp.exec(this.input);

        if (match !== null && match.index !== this.position) {
            if (verbose_debug) console.warn('Non-sticky RegExp passed to execRead', { lastIndex, match, now: regExp.lastIndex });
            match = null;
        }

        // if (verbose_debug) console.log({ lastIndex, match, now: regExp.lastIndex });


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

    parserForComment(lookAhead1) {
        if (this.Initial.PossibleComment.test(lookAhead1)) {
            const lookAhead4 = this.input.substr(this.position, 4);
            const commentStarts = this.identifyComment(lookAhead4);
            if (commentStarts) {
                return this.comment[commentStarts];
            }
        }
        return undefined;
    }

    identifyComment(subject) {
        this.Token.StartComment.lastIndex = 0;
        const match = this.Token.StartComment.exec(subject);
        return match && (match[0] in this.comment) ? match[0] : undefined;
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
        const mark = this.markPosition;
        this.markPosition = undefined;
        return mark;
    }

    starComment(tokens, tokenInfo) {
        // Match starred comment
        this.mark();
        this.read(2);
        const endPos = this.input.indexOf('*/', this.position);

        if (endPos >= 0) {
            this.position = endPos + 2;
            const commentBlock = this.lookBehindToMark();
            if (verbose_debug) console.error('// Starred comment', {tokens, commentBlock});
            store(tokens, tokenInfo, commentBlock, 'starComment', this.identifyComment(commentBlock));

        } else {
            this.position = this.length;
            const commentBlock = this.lookBehindToMark();
            this.valid = false;
            store(tokens, tokenInfo, invalidBlock(commentBlock), undefined, this.identifyComment(commentBlock));
            // throw new Error("invalid sql: starred comment does not end");
        }
        return 1;
    }

    singleLineComment(tokens, tokenInfo) {
        // Single line comment
        this.mark();
        const endPos = endOfLine(this.input, this.position);
        this.position = endPos;
        const commentBlock = this.lookBehindToMark();
        if (commentBlock.length) {
            if (verbose_debug) console.error('// Single line comment', {tokens, commentBlock, endPos});
            store(tokens, tokenInfo, commentBlock, 'singleLineComment', this.identifyComment(commentBlock));
            return 1;
        }
        return 0;
    }

    quoted(tokens, tokenInfo) {
        this.mark();
        let quotePrefix = '';
        let quoteChar = this.read();
        if (this.Initial.BinaryOrHex.test(quoteChar)) {
            // Handle hex and binary literals
            quotePrefix = quoteChar;
            quoteChar = this.read();
        }
        const requireValidUnicode = this.requireValidUnicode;
        const escapeChar = this.quoteEscapeChar[quoteChar];
        const unicodeBMPOnly = this.quoteBMPOnly[quoteChar];
        let quoteIsOpen = true;
        let unicodeError = false;
        let last = undefined;

        do {
            const current = this.read();
            // console.warn({current, parsePos, startQuote});

            if (current === escapeChar) {
                // Read escaped character
                // console.warn('// Escaped', {current, escaped: this.lookAhead()});
                this.read();

            } else if (current === quoteChar) {
                if (this.lookAhead() === quoteChar) {
                    // Read doubled quote
                    // console.warn('// Doubled', {current, quoteChar});
                    this.read();
                } else {
                    quoteIsOpen = false;
                }
            } else if (!unicodeError) {
                if (unicodeBMPOnly &&
                    (this.Initial.SurrogateHigh.test(current) || this.Initial.SurrogateLow.test(current))
                ) {
                    // Continue to parse but reject at end of quote
                    unicodeError = true;

                } else if (requireValidUnicode && this.Initial.SurrogateHigh.test(current)) {
                    if (this.Initial.SurrogateLow.test(this.lookAhead())) {
                        this.readLookAhead();
                    } else {
                        // Continue to parse but reject at end of quote
                        unicodeError = true;
                    }
                }
            }

            last = current;
        } while (quoteIsOpen && this.hasNext());

        const quoteBlock = this.lookBehindToMark();

        if (quoteIsOpen || unicodeError) {
            // Unclosed quote, or Non-BMP characters found where forbidden
            this.valid = false;
            store(tokens, tokenInfo, invalidBlock(quoteBlock), undefined, `${quotePrefix}${quoteChar}`);
            // if (verbose_debug) console.error('// !!! invalid sql found', {sql, tokens, quoteBlock});
        } else {
            store(tokens, tokenInfo, quoteBlock, 'quoted', `${quotePrefix}${quoteChar}`);
            // if (verbose_debug) console.warn('// Quote', {tokens, quoteBlock});
        }
        return 1;
    } // end of quoted

    whitespace(tokens, tokenInfo) {
        const match = this.execRead(this.Token.Whitespace);

        const length = match && match[0].length;
        if (length) {
            store(tokens, tokenInfo, match[0], 'whitespace');
        // } else {
        //     throw new Error("whitespace() called but no whitespace found");
        }
        return length ? 1 : 0;
    }

    identifier(tokens, tokenInfo) {
        // Check for preceding dot
        const lookBehind1 = this.input[this.position - 1];
        const quoteType = lookBehind1 === '.' ? lookBehind1 : undefined;

        const match = this.execRead(this.Token.Identifier);

        let count = 0;
        const length = match && match[0].length;
        if (length) {
            store(tokens, tokenInfo, match[0], 'identifier', quoteType);

            ++count;

            if (this.resetLookAhead(1) === '.') {
                store(tokens, tokenInfo, this.next(), 'operator');
                ++count;

                // Check to ensure that Identifier Dot Number is recognised as Identifier Dot Identifier
                if (this.Initial.Identifier.test(this.lookAhead())) {
                    count += this.identifier(tokens, tokenInfo);
                }
            }
        }
        return count;
    }

    hexNumber(tokens, tokenInfo) {
        const match = this.execRead(this.Token.HexNumber);

        const length = match && match[0].length;
        if (length) {
            store(tokens, tokenInfo, match[0], 'hexNumber');
        }
        return length ? 1 : 0;
    }

    operator(tokens, tokenInfo) {
        let found = 0;
        let match;

        do {
            const lookAhead1 = this.resetLookAhead(1);

            if (this.parserForComment(lookAhead1)) {
                // Next is a comment
                return found;

            } else if (this.Initial.Punctuation.test(lookAhead1)) {
                ++found;

                // Parser implementations need to supply Token.Operator.
                // Parser.create() takes care of those automatically.
                match = this.Token.Operator ? this.execRead(this.Token.Operator) : null;
                if (match !== null) {
                    store(tokens, tokenInfo, match[0], 'operator');
                } else {
                    match = [this.readLookAhead()];
                    store(tokens, tokenInfo, invalidBlock(match[0]));
                }
            } else {
                match = null;
            }

            // if (verbose_debug) console.log({ lookAhead1, match, from: position, to: this.position });
        } while (match !== null);

        return found;
    }

    number(tokens, tokenInfo) {
        const match = this.execRead(this.Token.Number);

        const length = match && match[0].length;
        if (length) {
            store(tokens, tokenInfo, match[0], 'number');
        }
        return length ? 1 : 0;
    }

    atIdentifier(tokens, tokenInfo) {
        this.resetLookAhead();

        let numberOfAts = 0;
        while (this.lookAhead() === '@') ++numberOfAts;

        const atChars = this.read(numberOfAts);

        if (numberOfAts > 2) {
            this.valid = false;
            store(tokens, tokenInfo, invalidBlock(atChars));

        } else if (numberOfAts) {
            const nextChar = this.lookAhead();

            if (this.Initial.Quote.test(nextChar)) {
                const temp = [];
                this.quoted(temp);

                let [ quote ] =  temp;

                if (quote.invalid) {
                    quote[0] = `${atChars}${quote[0]}`;
                } else {
                    quote = `${atChars}${quote}`;
                }
                store(tokens, tokenInfo, quote, 'atIdentifier', `${atChars}${nextChar}`);

            } else if (nextChar === '.' || this.Initial.Identifier.test(nextChar)) {
                const match = this.execRead(this.Token.IdentifierAfterAt);
                store(tokens, tokenInfo, `${atChars}${match[0]}`, 'atIdentifier', atChars);

            } else {
                this.valid = false;
                store(tokens, tokenInfo, invalidBlock(atChars));
            }
        }

        return numberOfAts ? 1 : 0;
    }

    unrecognised(tokens, tokenInfo) {
        let token = this.read();
        const found = token !== undefined;
        if (found) {
            if (this.Initial.SurrogateHigh.test(token) && this.Initial.SurrogateLow.test(this.lookAhead())) {
                token += this.readLookAhead();
            }

            this.valid = false;
            store(tokens, tokenInfo, invalidBlock(token));
        }
        return found ? 1 : 0;
    }

    readNextToken(tokens, tokenInfo) {
        // Acquire non-quote block
        if (verbose_debug) console.warn('// Acquire new token at %d', this.position);

        const current = this.lookToOffset(1);

        let next = this.parserForComment(current);

        if (typeof next === 'function') {
            // next will be called below

        } else if (current === '0' && this.lookToOffset(2) === 'x') {
            next = this.hexNumber;

        } else if (current === '.' && '0123456789'.indexOf(this.lookToOffset(2)) !== -1) {
            next = this.number;

        } else if ('0123456789'.indexOf(current) !== -1) {
            next = this.number;

        } else if (current === '@') {
            next = this.atIdentifier;

        } else if (this.Initial.Quote.test(current)) {
            next = this.quoted;

        } else if (this.Initial.BinaryOrHex.test(current) && /^['"]/.test(this.lookToOffset(2))) {
            next = this.quoted;

        } else if (this.Initial.Whitespace.test(current)) {
            next = this.whitespace;

        } else if (this.Initial.Punctuation.test(current)) {
            next = this.operator;

        } else if (/[\u{10000}-\u{10FFFF}]/guy.test(current)) {
            next = this.unrecognised;

        } else if (this.Initial.Identifier.test(current)) {
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

        this.acquireTokens(next, tokens, tokenInfo);
    }

    acquireTokens(next, tokens, tokenInfo) {
        const found = next.call(this, tokens, tokenInfo);

        if (!found) {
            throw new Error(`next(${next.name}) called but no ${next.name} found`);
        }
    }

    run(tokenInfo) {
        const tokens = [];
        while (this.hasNext()) {
            this.readNextToken(tokens, tokenInfo);
        }

        return tokens;
    }
}


Parser.prototype.comment = {
    '/*': Parser.prototype.starComment,
    '--': Parser.prototype.singleLineComment,
    '#': Parser.prototype.singleLineComment
};


Parser.prototype.Initial = MysqlRegExp.Initial;
Parser.prototype.Token = MysqlRegExp.Token;


Parser.create = function(operatorList, regExp, commentHandlers, otherOptions) {
    const Initial = Object.assign({}, Parser.prototype.Initial, regExp && regExp.Initial || {});
    const Token = Object.assign({}, Parser.prototype.Token, regExp && regExp.Token || {});

    Token.Operator = Parser.operatorRegExp(operatorList, Initial);

    const ParserClass = class extends Parser {
        constructor(sql, start) {
            super(sql, start);
        }
    };

    otherOptions = otherOptions || {};

    ParserClass.prototype.requireValidUnicode = otherOptions.requireValidUnicode || otherOptions.requireValidUnicode === undefined;

    ParserClass.prototype.quoteEscapeChar = otherOptions.quoteEscapeChar || defaultEscapeChar;

    ParserClass.prototype.quoteBMPOnly = otherOptions.quoteBMPOnly || restrictToUnicodeBMP;

    ParserClass.prototype.Initial = Initial;

    ParserClass.prototype.Token = Token;

    if (commentHandlers !== undefined && commentHandlers !== null) {
        ParserClass.prototype.comment = commentHandlers;
    }

    return ParserClass;
};

module.exports = Parser;

