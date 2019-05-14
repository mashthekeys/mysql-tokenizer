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

## Options
Currently the only configurable option is the list of operator tokens.  If not specified,
all operators from Mysql 8 are supported.


```javascript
const tokenizerFactory = require('mysql-tokenizer');
const mysql8Operators = require('mysql-tokenizer/lib/mysql-operators');
/*
mysql8Operators = [
    "&&", "=", ":=", "&", "~", "|", "^", "/", "=", "<=>", ">", ">=", "->", "->>",
    "<<", "<", "<=", "-", "%", "!", "!=", "<>", "||", "+", ">>", "*", "-", ":"
]
*/
const sql92Operators = require('sql92-operators')
/*
sql92Operators = [
    "+", "::", ">", ">=", "<", "<=", "-", "%", "*", "/", "||", "<>", "!=" 
]
*/


const tokenizeMysql = tokenizerFactory(mysql8Operators);
const tokenizeSQL92 = tokenizerFactory(sql92Operators);

const tokens = {
    mysql: tokenizeMysql("SELECT 1+2=3, 4-3<=>1, tbl.x->'$' FROM tbl;"),
    sql92: tokenizeSQL92("SELECT 1+2=3, 4-3<=>1, tbl.x->'$' FROM tbl;")
}

console.log('mysql: ' + JSON.stringify(tokens.mysql));
console.log('sql92: ' + JSON.stringify(tokens.sql92));
/* Output:
mysql: ["SELECT"," ","1","+","2","=","3",","," ","4","-","3","<=>","1",","," ","tbl.x","->","'$'"," ","FROM"," ","tbl",";"]
sql92: ["SELECT"," ","1","+","2","=","3",","," ","4","-","3","<=",">","1",","," ","tbl.x","-",">","'$'"," ","FROM"," ","tbl",";"]
*/
```

## Comment Syntax
Comments are supported using ``--``, ``#`` and ``/*...*/`` syntaxes.

Comments using ```--``` must start with a space, or come at the end of a line, as in Mysql.
This differs from the SQL standard which does not require following whitespace.

```javascript
const tokenize = require('mysql-tokenizer')();

const tokens = tokenize("SELECT 1--2=3 -- One less minus two equals three")

console.log(JSON.stringify(tokens));
/* Output:
["SELECT"," ","1","-","-","2","=","3"," ","-- One less minus two equals three"]
*/
```


