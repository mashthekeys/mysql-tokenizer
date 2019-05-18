'use strict';

const mysqlTokenizer = require('./mysql-tokenizer');
const regexp = require('./regexp');
const isWhiteSpace = _ => regexp.Whitespace.test(_);
const isComment = _ => regexp.Comment.test(_);

const verboseLogging = false;

const mysqlBrackets = [
    {
        begin: "(",
        end: ")"
    },
    {
        begin: "WHEN",
        end: "THEN"
    }
];

const reservedKeywords = ['IF', 'REPEAT', 'CASE', 'WHILE', 'LOOP'];
const maxKeywordLength = reservedKeywords.reduce((max, keyword) => Math.max(max, keyword.length), 0);

const Syntax = {
    identifier: function(token) {
        return /^`.*`$|^[_$0-9A-Za-z]+$/.test(token) && !Syntax.reservedKeyword(token);
    },

    reservedKeyword: function(token) {
        return (typeof token === 'string' && token.length <= maxKeywordLength && reservedKeywords.includes(token.toUpperCase()));
    },

    bracketed: function(token) { return typeof token === 'object' && token.isBracketed },

    optional(testFunction) {
        return function(token) {
            const isAllowed = token !== undefined && testFunction(token);
            return {
                accept: isAllowed ? 1 : 0
            };
        }
    },

    forbidden(testFunction) {
        return function(token) {
            const isAllowed = token === undefined || !testFunction(token);
            if (isAllowed) {
                return { accept: 0 };
            } else {
                return false;
            }
        }
    }
};

Syntax.skipToEndOfLine = { skipToEndOfLine: true };

const mysqlCompoundStatements = [
    {
        begin: "BEGIN",
        end: ["END", Syntax.optional(Syntax.identifier), ";"]
    },
    {
        begin: "IF",
        end: ["END", "IF", ";"]
    },
    {
        begin: "LOOP",
        end: ["END", "LOOP", Syntax.optional(Syntax.identifier), ";"]
    },
    {
        begin: "WHILE",
        end: ["END", "WHILE", Syntax.optional(Syntax.identifier), ";"]
    },
    {
        begin: "REPEAT",
        end: ["UNTIL", Syntax.skipToEndOfLine, "END", "REPEAT", Syntax.optional(Syntax.identifier), ";"]
    },
    {
        begin: "CASE",
        end: ["END", "CASE", ";"],
        endInline: ["END"]
    }
];

((console) => {
    const recursiveCopy = _ => Array.isArray(_) ? _.map(recursiveCopy) : _;

    function isJunk(_) {
        if (_ === undefined) {
            return false;
        }
        return typeof _ === 'string' && (isWhiteSpace(_) || isComment(_));
    }

    function isNonJunk(_) {
        if (_ === undefined) {
            return false;
        }
        return !(typeof _ === 'string' && (isWhiteSpace(_) || isComment(_)));
    }

    function matchPattern(token, pattern, caseInsensitiveLength) {
        if (pattern === Syntax.skipToEndOfLine) {
            throw new Error("matchPattern cannot match Syntax.skipToEndOfLine");
        }

        if (typeof pattern === 'function') {
            // pattern() should return true to accept 1 token, false to reject.
            // Special answer { accept: 0 } allows the function to match 0 tokens.
            return pattern(token);
        }

        const isMatch = (
            caseInsensitiveLength && typeof token === 'string' && token.length < caseInsensitiveLength && pattern.label < caseInsensitiveLength
                ? token.toUpperCase() === pattern.toUpperCase()
                : token === pattern
        );

        // console && console.log('matchPattern', token, pattern, isMatch);

        return isMatch;
    }

    function joinNoSpaces() {
        return this.join('');
    }

    function AnnotatedArray(type, tokens, parent, endTokens) {
        tokens.toString = joinNoSpaces;
        tokens.syntaxType = type;
        tokens[`is${type}`] = true;
        tokens.closed = false;

        tokens.containsSQL = tokens.some(token => isNonJunk(token));
        tokens.parent = parent;
        tokens.endTokens = (
            Array.isArray(endTokens) ? endTokens :
                [endTokens ? endTokens : ';']
        );
        return tokens;
    }

    function Root() {
        return AnnotatedArray('Root', [], null, []);
    }

    function Compound(tokens, parent, endTokens, endInline) {
        const _ = AnnotatedArray("Compound", tokens, parent, endTokens);
        const content = Statement([], _);
        _.push(content);

        if (endInline) {
            content.inlineEndTokens = endInline;
        }


        return _;

    }

    function Statement(tokens, parent, endTokens) {
        return AnnotatedArray("Statement", tokens, parent, endTokens);
    }

    function Bracketed(tokens, parent, endTokens) {
        return AnnotatedArray("Bracketed", tokens, parent, endTokens);
    }

    function matchTokens(rawTokens, patterns, caseInsensitiveLength) {
        const tokens = rawTokens.filter(isNonJunk);
        let tokenIndex = 0;

        const tested = [];
        let isMatch = true;

        let pattern = undefined;

        // Match tokens to patterns from left to right
        let patternIndex = 0;
        for (;patternIndex < patterns.length; ++patternIndex) {
            pattern = patterns[patternIndex];

            if (pattern !== Syntax.skipToEndOfLine) {
                const token = tokens[tokenIndex];
                const _isMatch = matchPattern(token, pattern, caseInsensitiveLength);

                tested[patternIndex] = _isMatch;

                if (_isMatch) {
                    if (_isMatch.hasOwnProperty('accept')) {
                        tokenIndex += _isMatch.accept;
                    } else {
                        ++tokenIndex;
                    }
                } else {
                    isMatch = false;
                    break;
                }
            } else {
                break;
            }
        }

        if (pattern === Syntax.skipToEndOfLine) {
            // Match remaining tokens and patterns from right to left
            const skipPatternPosition = patternIndex;
            const skipTokenPosition = tokenIndex;

            tokenIndex = tokens.length - 1;
            // console && console.log("SKIP TO END OF LINE:", skipPatternPosition, skipTokenPosition);

            for (patternIndex = patterns.length - 1; patternIndex > skipPatternPosition && tokenIndex > skipTokenPosition; --patternIndex) {
                pattern = patterns[patternIndex];

                if (pattern !== Syntax.skipToEndOfLine) {
                    const token = tokens[tokenIndex];
                    const _isMatch = matchPattern(token, pattern, caseInsensitiveLength);

                    tested[patternIndex] = _isMatch;

                    if (_isMatch) {
                        if (_isMatch.hasOwnProperty('accept')) {
                            tokenIndex -= _isMatch.accept;
                        } else {
                            --tokenIndex;
                        }
                    } else {
                        isMatch = false;
                        break;
                    }
                } else {
                    break;
                }
            }
        }

        // const isMatch = patterns.every(test);

        console && console.log('matchTokens(): ', String(isMatch).toUpperCase());
        console && console.log('             : tokens  ', String(rawTokens).replace(/\n|\r\n?/g, "⏎"));
        console && console.log('             : patterns', Array.from(patterns));
        console && console.log('             : test    ', tested);
        return isMatch;
    }

    function structuredTokens(options) {
        options = options || {};

        const tokenize = options.tokenize || mysqlTokenizer();
        const compoundStatements = options.compoundStatements || mysqlCompoundStatements;
        const brackets = options.brackets || mysqlBrackets;

        const compoundStatementStarts = {};
        const openBrackets = {};
        const closeBrackets = {};

        const NO_MATCH = {};

        const maxStartTokenLength = compoundStatements.reduce((maxStartTokenLength, compoundStatement) => {
            const begin = compoundStatement.begin;

            compoundStatementStarts[begin] = compoundStatement;

            return (begin.length > maxStartTokenLength) ? begin.length : maxStartTokenLength;
        }, 0);

        brackets.forEach(_ => {
            openBrackets[_.begin] = _;
            closeBrackets[_.end] = _;
        });

        return function (input) {
            if (input === undefined || input === null) throw new ReferenceError(`input is ${input}`);

            const tokens = tokenize(input);

            const output = Root();

            let currentOutput = TopLevelStatement();

            let compoundStack = [];
            let currentCompound = undefined;

            let previousNonJunk = undefined;
            let i;


            for (i = 0; i < tokens.length; ++i) {
                const token = tokens[i];

                if (isJunk(token)) {
                    currentOutput.push(token);
                } else if (openBrackets.hasOwnProperty(token)) {
                    const handle_IF = previousNonJunk === 'IF';
                    const ifBlock = handle_IF ? currentOutput.parent : null;

                    beginBracketed([token], openBrackets[token].end);

                    if (handle_IF) {
                        currentOutput.onClose = function() {
                            // console && console.log("currentOutput.onClose", String(this));

                            // const previousSibling = block => {
                            //     const parent = block.parent;
                            //     const index = parent.indexOf(block);
                            //
                            //     for (let i = index - 1; i >= 0; --i) {
                            //         if (isNonJunk(parent[i])) return parent[i];
                            //     }
                            //
                            //     return undefined;
                            // };

                            const firstSibling = block => block.parent.find(isNonJunk);

                            // WHEN ... IF(...) THEN is always a function call
                            const insideWhenClause = /^WHEN$/i.test(firstSibling(ifBlock) || '');

                            // IF(...) without following THEN is a function call
                            const isFunctionCall = insideWhenClause || !/^THEN$/i.test(LookAhead());

                            console && console.log("currentOutput.onClose", String(this).replace(/\n|\r\n?/g, "⏎"), insideWhenClause, isFunctionCall, LookAhead(), firstSibling(ifBlock));

                            if (isFunctionCall) {
                                // Mark ifBlock as a functional IF() call, rather than an IF ... END IF statement
                                delete ifBlock.isCompound;
                                ifBlock.isExpression = true;
                                ifBlock.type = 'Expression';

                                // Resume parsing at outer level
                                upOneLevel();
                                upOneLevel();
                            }

                            //console && console.log("ifBlock", ifBlock.map(recursiveCopy));
                            //console && console.log("currentOutput", currentOutput.map(recursiveCopy));
                        };
                    }

                    previousNonJunk = token;

                } else {
                    currentOutput.containsSQL = true;

                    // Test for compound statement
                    const matchToken = token.length > maxStartTokenLength ? NO_MATCH : token.toUpperCase();

                    if (compoundStatementStarts.hasOwnProperty(matchToken) && previousNonJunk !== 'END') {
                        const statementInfo = compoundStatementStarts[matchToken];

                        console && console.log('Starting at:', [token], statementInfo.end, previousNonJunk);
                        beginCompound([token], statementInfo.end, statementInfo.endInline);

                    } else if (matchToken === ';' || matchToken === currentOutput.endTokens[0]) {
                        console && console.log('endTokens at:', [token], currentOutput.endTokens);
                        endTokenMatch(currentOutput.endTokens);

                    } else if (currentOutput.inlineEndTokens && matchToken === currentOutput.inlineEndTokens[0]) {
                        console && console.log('inlineEndTokens at:', [token], currentOutput.inlineEndTokens);
                        endTokenMatch(currentOutput.inlineEndTokens);
                        upOneLevel();

                    } else {
                        console && console.log('(passthru):', [token], currentOutput.isStatement, currentOutput.inlineEndTokens);
                        currentOutput.push(token);
                    }
                    previousNonJunk = token;
                }
            }

            parseComplete();

            return output;


            function TopLevelStatement() {
                const _ = Statement([], output);
                output.push(_);
                return _;
            }

            function parseComplete() {
                if (typeof currentOutput.onClose === 'function') {
                    currentOutput.onClose();
                    delete currentOutput.onClose;
                }
            }

            function upOneLevel() {
                const target = currentOutput;
                if (target === currentCompound) {
                    currentCompound = compoundStack.pop();
                }

                if (currentOutput.parent === output || !currentOutput.parent) {
                    currentOutput = output;
                } else {
                    currentOutput = currentOutput.parent;
                }

                if (target.onClose) {
                    target.onClose();
                    delete target.onClose;
                }
            }

            function continueSameLevel() {
                do {
                    upOneLevel();
                } while (!(currentOutput.isCompound || currentOutput.isRoot));

                beginStatement();
            }

            function beginStatement(tokens, endTokens) {
                let _tokens = tokens || [];

                const _ = Statement(_tokens, currentOutput, endTokens);
                currentOutput.push(_);
                currentOutput = _;
            }

            function beginBracketed(tokens, endTokens) {
                let _tokens = tokens || [];

                const _ = Bracketed(_tokens, currentOutput, endTokens);
                currentOutput.push(_);
                currentOutput = _;
            }

            function beginCompound(tokens, endTokens, endInline) {
                let _tokens = tokens || [];

                const _ = Compound(_tokens, currentOutput, endTokens, endInline);
                currentOutput.push(_);
                currentOutput = _[_.length - 1];

                if (currentCompound !== undefined) compoundStack.push(currentCompound);
                currentCompound = _;

                if (!Array.isArray(currentOutput)) throw new Error(`Invalid Compound array ${JSON.stringify(_, null, 4)}`);
            }

            function lookAheadMatch(patternTokens, patternIndex) {
                console && console.log("lookAheadMatch", tokens.slice(i, i + 3), "patternTokens", patternTokens, "patternIndex", patternIndex);
                patternIndex = patternIndex | 0;
                let actualMatch = undefined;
                let possibleMatch = true;
                let lookAhead = new LookAhead(i + patternIndex - 1);

                do {
                    const nextPattern = patternTokens[patternIndex];

                    let nextToken;
                    if (nextPattern === Syntax.skipToEndOfLine) {
                        throw new Error("skipToEndOfLine cannot occur within lookAheadMatch");

                        // let remainingTokens = [];
                        //
                        // do {
                        //     nextToken = tokens[lookAheadIndex++];
                        //
                        //     if (nextToken === ';') {
                        //         break;
                        //     } else if (isNonJunk(nextToken)) {
                        //         remainingTokens.push(nextToken);
                        //     }
                        //
                        // } while (lookAheadIndex <= tokens.length);
                        //
                        // remainingTokens.push(';');
                        //
                        // const remainingPatterns = patternTokens.slice(patternIndex + 1);
                        //
                        // return matchTokens(remainingTokens, remainingPatterns, maxStartTokenLength);

                    } else {
                        nextToken = lookAhead.next();
                    }

                    if (matchPattern(nextToken, nextPattern, maxStartTokenLength)) {
                        ++patternIndex;
                        if (patternIndex >= patternTokens.length) {
                            // Match found
                            actualMatch = tokens.slice(i, lookAhead.to());
                            // return actualMatch;
                        }
                    } else {
                        // Not a match
                        // return undefined;
                        possibleMatch = false;
                    }
                } while (actualMatch === undefined && possibleMatch && lookAhead.hasNext());

                console && console.log("actualMatch", actualMatch, "patternTokens", patternTokens);

                // if (actualMatch !== undefined && !matchTokens(actualMatch, patternTokens, maxStartTokenLength)) {
                //     throw new Error("matchTokens fails");
                // }

                return actualMatch;
                // return undefined;
            }

            function endTokenMatch(endTokens) {
                const token = tokens[i];

                const statementEnded = token === ';';

                if (statementEnded || endTokens.length === 1) {
                    currentOutput.push(token);

                    if (statementEnded) {
                        if (currentCompound !== undefined && matchTokens(currentOutput, currentCompound.endTokens, maxStartTokenLength)) {
                            console && console.warn("END COMPOUND: ", Array.from(currentOutput));
                            currentOutput = currentCompound.parent;
                            currentCompound = compoundStack.pop();
                            continueSameLevel();
                            console && console.warn("CONTINUING COMPOUND: ", currentCompound === undefined ? currentCompound : String(currentCompound).length);

                        } else {
                            console && console.warn("END TOKEN: ", token, statementEnded, currentCompound !== undefined);
                            continueSameLevel();
                        }
                    } else {
                        console && console.warn("END TOKEN: ", token, statementEnded, currentCompound !== undefined);
                        upOneLevel();
                    }

                } else {
                    let actualMatch = lookAheadMatch(endTokens, 1);

                    if (actualMatch !== undefined) {
                        currentOutput.push.apply(currentOutput, actualMatch);

                        i += actualMatch.length;

                        if (actualMatch.pop() === ';') {
                            upOneLevel();
                        } else {
                            continueSameLevel();
                        }
                    }
                }
                // return i;
            }

            function LookAhead(from) {
                const start = arguments.length ? from : i;
                let lookAheadIndex = start;

                const next = function() {
                    let token = undefined;

                    do {
                        token = tokens[++lookAheadIndex];
                    } while (isJunk(token));

                    return token;
                };

                if (!new.target) return next();

                this.next = next;
                this.hasNext = () => lookAheadIndex < tokens.length;
                this.from = () => start;
                this.to = () => lookAheadIndex;
            }
        }
    }

    module.exports = exports.default = structuredTokens;
})(verboseLogging ? console : undefined);