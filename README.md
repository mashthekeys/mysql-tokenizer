# Mysql Tokenizer

Splits strings into tokens using the syntax of Mysql 8.

```javascript
const tokenize = require('mysql-tokenizer')();

const tokens = tokenize("SELECT 0, 0x1, '2', X'33';")

console.log(JSON.stringify(tokens));
/* Output:
["SELECT"," ","0",",","0x1",","," ","'2'",","," ","X'33'",";"]
*/
```

## Basic Usage
```javascript
const tokenize = require('mysql-tokenizer')();

const tokens = tokenize("SELECT tbl.x->'$', 1--2=<=>-1 FROM tbl;");

console.log(`Mysql: ${JSON.stringify(tokens)}`);

/* Output:
mysql: ["SELECT"," ","tbl",".","x","->","'$'",","," ","1","-","-","2","=","<=>","-","1"," ","FROM"," ","tbl",";"]
*/
````


## Comment Syntax
Comments are supported using ``--``, ``#`` and ``/*...*/`` syntaxes.

By default, comments using ```--``` must start with a space, or come at the end of a line, as in Mysql.

```javascript
const tokenize = require('mysql-tokenizer')();

const tokens = tokenize("SELECT 1--2=3 -- One less minus two equals three")

console.log(JSON.stringify(tokens));
/* Output:
["SELECT"," ","1","-","-","2","=","3"," ","-- One less minus two equals three"]
*/
```

To implement the SQL standard, which does not require following whitespace,
include ``{ regExp: require('mysql-tokenizer/lib/regexp-sql92') }`` in the options.


## Options
The following options are supported:

###``options.operators``: Array

Specify the list of valid operator tokens.  If not specified,
all operators from Mysql 8 are supported.

If this is the only option required, options can be specified as an Array.

Alternatively, specify ``options.regExp.Token.Operator``.

###``options.regExp.Initial``: Object

Override the parser's built-in regular expressions for character parsing.  
Initial RegExps must start with ```^``` and match at most one character.

```typescript
declare namespace options.regExp.Initial {
    let BinaryOrHex: RegExp;
    let Identifier: RegExp;
    let PossibleComment: RegExp;
    let Punctuation: RegExp;
    let Quote: RegExp;
    let Whitespace: RegExp;
}
```

###``options.regExp.Token``: Object

Token RegExps must have the 'g' and 'y' flags set.

``Token.Operator`` is optional.  Without it, the parser treats punctuation as invalid characters.
```typescript
declare namespace options.regExp.Token {
    let StartComment: RegExp;
    let HexNumber: RegExp;
    let Identifier: RegExp;
    let IdentifierAfterAt: RegExp;
    let Number: RegExp;
    let Operator: RegExp|null;
    let Whitespace: RegExp;
}
```

###``options.commentHandlers``: Object

Override the parser's built-in parsing of comments.  

After a successful match on ``Token.StartComment``, the 
matching string is used to look up a parsing function.

The default comment object is
```javascript
comment = {
    '/*': Parser.prototype.starComment,
    '--': Parser.prototype.singleLineComment,
    '#': Parser.prototype.singleLineComment
}
```

## Example: Comparing Mysql and SQL-92 Operator and Comment Parsing
```javascript
const tokenizerFactory = require('mysql-tokenizer');

const tokenizeMysql = tokenizerFactory();

const tokensMysql = tokenizeMysql("SELECT tbl.x->'$', -1<=>1--2 FROM tbl;");

console.log(`Mysql: ${JSON.stringify(tokensMysql)}`);

/* Output:
Mysql: ["SELECT"," ","tbl",".","x","->","'$'",","," ","-","1","<=>","1","-","-","2"," ","FROM"," ","tbl",";"]
 */



const sql92Operators = require('sql92-operators')
const sql92RegExp = require('mysql-tokenizer/lib/regexp-sql92');
const tokenizeSQL92 = tokenizerFactory({
    operators: sql92Operators,
    regExp: sql92RegExp
});
const tokensSQL92 = tokenizeSQL92("SELECT tbl.x->'$', -1<=>1--2 FROM tbl;");
console.log(`SQL92: ${JSON.stringify(tokensSQL92)}`);
/* Output:
SQL92: ["SELECT"," ","tbl",".","x","-",">","'$'",","," ","-","1","<=",">","1","--2 FROM tbl;"]
 */
```


