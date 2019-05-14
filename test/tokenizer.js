'use strict';

const mysqlTokenize = require('../lib/mysql-tokenizer')();
const runTestsAndExit = require('./runTests').runTestsAndExit;

runTestsAndExit([
    {
        name: "Simple",
        function: mysqlTokenize,
        arguments: ["DO 0"],
        output: ["DO", " ", "0"]
    },
    {
        name: "Simple+WS 1",
        function: mysqlTokenize,
        arguments: ["DO \t \t 0\n"],
        output: ["DO", " \t \t ", "0", "\n"]
    },
    {
        name: "Simple+WS 2",
        function: mysqlTokenize,
        arguments: ["\n\n\tDO\t0\n\n "],
        output: ["\n\n\t", "DO", "\t", "0", "\n\n "]
    },
    {
        name: "Select No Quotes",
        function: mysqlTokenize,
        arguments: ["SELECT 1 FROM dual"],
        output: ["SELECT", " ", "1", " ", "FROM", " ", "dual"]
    },
    {
        name: "Select Single Quotes",
        function: mysqlTokenize,
        arguments: ["SELECT '1' FROM dual"],
        output: ["SELECT", " ", "'1'", " ", "FROM", " ", "dual"]
    },
    {
        name: "Select Double Quotes",
        function: mysqlTokenize,
        arguments: ["SELECT \"1\" FROM dual"],
        output: ["SELECT", " ", "\"1\"", " ", "FROM", " ", "dual"]
    },
    {
        name: "Select Backticks",
        function: mysqlTokenize,
        arguments: ["SELECT `1` FROM dual"],
        output: ["SELECT", " ", "`1`", " ", "FROM", " ", "dual"]
    },
    {
        name: "Select Single Quotes, Embedded Other Quotes",
        function: mysqlTokenize,
        arguments: ["SELECT '\"`' FROM dual"],
        output: ["SELECT", " ", "'\"\`'", " ", "FROM", " ", "dual"]
    },
    {
        name: "Select Double Quotes, Embedded Other Quotes",
        function: mysqlTokenize,
        arguments: ["SELECT \"'`\" FROM dual"],
        output: ["SELECT", " ", "\"'`\"", " ", "FROM", " ", "dual"]
    },
    {
        name: "Select Backticks, Embedded Other Quotes",
        function: mysqlTokenize,
        arguments: ["SELECT `'\"` FROM dual"],
        output: ["SELECT", " ", "`'\"`", " ", "FROM", " ", "dual"]
    },
    {
        name: "Repeated Single Quotes",
        function: mysqlTokenize,
        arguments: ["SELECT 'single''quoteX2' FROM dual"],
        output: ["SELECT", " ", "'single''quoteX2'", " ", "FROM", " ", "dual"]
    },
    {
        name: "Repeated Double Quotes",
        function: mysqlTokenize,
        arguments: ["SELECT \"double\"\"quoteX2\" FROM dual"],
        output: ["SELECT", " ", "\"double\"\"quoteX2\"", " ", "FROM", " ", "dual"]
    },
    {
        name: "Repeated Backticks",
        function: mysqlTokenize,
        arguments: ["SELECT `back``tickX2` FROM dual"],
        output: ["SELECT", " ", "`back``tickX2`", " ", "FROM", " ", "dual"]
    },
    {
        name: "Escaped Single Quotes",
        function: mysqlTokenize,
        arguments: ["SELECT 'single\\'quoteEscaped' FROM dual"],
        output: ["SELECT", " ", "'single\\'quoteEscaped'", " ", "FROM", " ", "dual"]
    },
    {
        name: "Escaped Double Quotes",
        function: mysqlTokenize,
        arguments: ["SELECT \"double\\\"quoteEscaped\" FROM dual"],
        output: ["SELECT", " ", "\"double\\\"quoteEscaped\"", " ", "FROM", " ", "dual"]
    },
    {
        name: "Newline Escaped in Single Quotes",
        function: mysqlTokenize,
        arguments: ["SELECT 'new\\nlineEscaped' FROM dual"],
        output: ["SELECT", " ", "'new\\nlineEscaped'", " ", "FROM", " ", "dual"]
    },
    {
        name: "Newline Escaped in Double Quotes",
        function: mysqlTokenize,
        arguments: ["SELECT \"new\\nlineEscaped\" FROM dual"],
        output: ["SELECT", " ", "\"new\\nlineEscaped\"", " ", "FROM", " ", "dual"]
    },
    {
        name: "Newline Unescaped in Single Quotes",
        function: mysqlTokenize,
        arguments: ["SELECT 'new\nlineUnescaped' FROM dual"],
        output: ["SELECT", " ", "'new\nlineUnescaped'", " ", "FROM", " ", "dual"]
    },
    {
        name: "Newline Unescaped in Double Quotes",
        function: mysqlTokenize,
        arguments: ["SELECT \"new\nlineUnescaped\" FROM dual"],
        output: ["SELECT", " ", "\"new\nlineUnescaped\"", " ", "FROM", " ", "dual"]
    },
    {
        name: "Hexadecimal String (Upper Case X)",
        function: mysqlTokenize,
        arguments: ["SELECT X'1010CAFEBABE' FROM dual"],
        output: ["SELECT", " ", "X'1010CAFEBABE'", " ", "FROM", " ", "dual"]
    },
    {
        name: "Hexadecimal String (Lower Case x)",
        function: mysqlTokenize,
        arguments: ["SELECT x'1010CAFEBABE' FROM dual"],
        output: ["SELECT", " ", "x'1010CAFEBABE'", " ", "FROM", " ", "dual"]
    },
    {
        name: "Hexadecimal String (Multiple)",
        function: mysqlTokenize,
        arguments: ["SELECT x'1010', x'CAFE', x'BABE' FROM dual"],
        output: ["SELECT", " ", "x'1010'", ",", " ", "x'CAFE'", ",", " ", "x'BABE'", " ", "FROM", " ", "dual"]
    },
    {
        name: "Hexadecimal String with Introducer",
        function: mysqlTokenize,
        arguments: ["SELECT _ascii X'313233' FROM dual"],
        output: ["SELECT", " ", "_ascii", " ", "X'313233'", " ", "FROM", " ", "dual"]
    },
    {
        name: "Binary String (Upper Case B)",
        function: mysqlTokenize,
        arguments: ["SELECT B'00110011' = '3' FROM dual"],
        output: ["SELECT", " ", "B'00110011'", " ", "=", " ", "'3'", " ", "FROM", " ", "dual"]
    },
    {
        name: "Binary String (Lower Case b)",
        function: mysqlTokenize,
        arguments: ["SELECT b'00110011' = '3' FROM dual"],
        output: ["SELECT", " ", "b'00110011'", " ", "=", " ", "'3'", " ", "FROM", " ", "dual"]
    },
    {
        name: "Binary String with Introducer",
        function: mysqlTokenize,
        arguments: ["SELECT _ascii B'00110011' = '3' FROM dual"],
        output: ["SELECT", " ", "_ascii", " ", "B'00110011'", " ", "=", " ", "'3'", " ", "FROM", " ", "dual"]
    },
    {
        name: "Hexadecimal C-Style",
        function: mysqlTokenize,
        arguments: ["SELECT 0x1010CAFEBABE FROM dual"],
        output: ["SELECT", " ", "0x1010CAFEBABE", " ", "FROM", " ", "dual"]
    },
    {
        name: "Single Quotes with Introducer",
        function: mysqlTokenize,
        arguments: ["SELECT _ascii'1' FROM dual"],
        output: ["SELECT", " ", "_ascii", "'1'", " ", "FROM", " ", "dual"]
    },
    {
        name: "Double Quotes with Introducer",
        function: mysqlTokenize,
        arguments: ["SELECT _ascii\"1\" FROM dual"],
        output: ["SELECT", " ", "_ascii", "\"1\"", " ", "FROM", " ", "dual"]
    },
    {
        name: "Single Quotes with Introducer + Space",
        function: mysqlTokenize,
        arguments: ["SELECT _ascii '1' FROM dual"],
        output: ["SELECT", " ", "_ascii", " ", "'1'", " ", "FROM", " ", "dual"]
    },
    {
        name: "Double Quotes with Introducer + Space",
        function: mysqlTokenize,
        arguments: ["SELECT _ascii \"1\" FROM dual"],
        output: ["SELECT", " ", "_ascii", " ", "\"1\"", " ", "FROM", " ", "dual"]
    },
    {
        name: "Function Call",
        function: mysqlTokenize,
        arguments: ["SELECT ASCII('9') FROM dual"],
        output: [
            "SELECT", " ",
            "ASCII", "(", "'9'", ")",
            " ", "FROM", " ", "dual"
        ]
    },
    {
        name: "Operators",
        function: mysqlTokenize,
        arguments: ["SELECT 1+2*3/4>5<<6&7 FROM dual"],
        output: [
            "SELECT", " ",
            "1", "+", "2", "*", "3", "/", "4", ">", "5", "<<", "6", "&", "7",
            " ", "FROM", " ", "dual"
        ]
    },
    {
        name: "Parentheses",
        function: mysqlTokenize,
        arguments: ["SELECT (((((1+2)*3)/4)>5)<<6)&7 FROM dual"],
        output: [
            "SELECT", " ",
            "(", "(", "(", "(", "(", "1", "+", "2", ")", "*", "3", ")", "/", "4", ")", ">", "5", ")", "<<", "6", ")", "&", "7",
            " ", "FROM", " ", "dual"
        ]
    },
    {
        name: "Operators + Hexadecimal + Strings 1",
        function: mysqlTokenize,
        arguments: ["SELECT X'01'+x'02' FROM dual"],
        output: [
            "SELECT", " ",
            "X'01'", "+", "x'02'",
            " ", "FROM", " ", "dual"
        ]
    },
    {
        name: "Operators + Hexadecimal + Strings 2",
        function: mysqlTokenize,
        arguments: ["SELECT 0x3/'4' FROM dual"],
        output: [
            "SELECT", " ",
            "0x3", "/", "'4'",
            " ", "FROM", " ", "dual"
        ]
    },
    {
        name: "Operators + Hexadecimal + Strings 3",
        function: mysqlTokenize,
        arguments: ["SELECT \"5\"<<_ascii'6' FROM dual"],
        output: [
            "SELECT", " ",
            "\"5\"", "<<", "_ascii", "'6'",
            " ", "FROM", " ", "dual"
        ]
    },
    {
        name: "Operators + Hexadecimal + Strings 4",
        function: mysqlTokenize,
        arguments: ["SELECT X'01'+x'02'*0x3/'4'>\"5\"<<_ascii'6' FROM dual"],
        output: [
            "SELECT", " ",
            "X'01'", "+", "x'02'", "*", "0x3", "/", "'4'", ">", "\"5\"", "<<", "_ascii", "'6'",
            " ", "FROM", " ", "dual"
        ]
    },
    {
        name: "Starred Comment 1",
        function: mysqlTokenize,
        arguments: ["/* IGNORE ME */DO 0"],
        output: ["/* IGNORE ME */", "DO", " ", "0"]
    },
    {
        name: "Starred Comment 2",
        function: mysqlTokenize,
        arguments: ["DO /* IGNORE ME */0"],
        output: ["DO", " ", "/* IGNORE ME */", "0"]
    },
    {
        name: "Starred Comment 3",
        function: mysqlTokenize,
        arguments: ["DO 0/* IGNORE ME */"],
        output: ["DO", " ", "0", "/* IGNORE ME */"]
    },
    {
        name: "Starred Comment 4",
        function: mysqlTokenize,
        arguments: ["DO 0/* IGNORE * / / * ME */"],
        output: ["DO", " ", "0", "/* IGNORE * / / * ME */"]
    },
    {
        name: "Starred Comment, Embedded Quote 1",
        function: mysqlTokenize,
        arguments: ["DO 0/* IGNORE '...' ME */"],
        output: ["DO", " ", "0", "/* IGNORE '...' ME */"]
    },
    {
        name: "Starred Comment, Embedded Quote 2",
        function: mysqlTokenize,
        arguments: ["DO 0/* IGNORE `...` ME */"],
        output: ["DO", " ", "0", "/* IGNORE `...` ME */"]
    },
    {
        name: "Hash Comment, No Text",
        function: mysqlTokenize,
        arguments: ["DO #\n0"],
        output: ["DO", " ", "#", "\n", "0"]
    },
    {
        name: "Hash Comment 1",
        function: mysqlTokenize,
        arguments: ["DO 0# IGNORE LINE"],
        output: ["DO", " ", "0", "# IGNORE LINE"]
    },
    {
        name: "Hash Comment 2",
        function: mysqlTokenize,
        arguments: ["DO 0# IGNORE LINE\n"],
        output: ["DO", " ", "0", "# IGNORE LINE", "\n"]
    },
    {
        name: "Hash Comment 3",
        function: mysqlTokenize,
        arguments: ["DO # IGNORE LINE\n0"],
        output: ["DO", " ", "# IGNORE LINE", "\n", "0"]
    },
    {
        name: "Hash Comment 4",
        function: mysqlTokenize,
        arguments: ["# IGNORE LINE\nDO 0"],
        output: ["# IGNORE LINE", "\n", "DO", " ", "0"]
    },
    {
        name: "Hash Comment 5",
        function: mysqlTokenize,
        arguments: ["# 'IGNORE LINE'\nDO 0"],
        output: ["# 'IGNORE LINE'", "\n", "DO", " ", "0"]
    },
    {
        name: "Dash Comment, No Text",
        function: mysqlTokenize,
        arguments: ["DO --\n0"],
        output: ["DO", " ", "--", "\n", "0"]
    },
    {
        name: "Dash Comment 1",
        function: mysqlTokenize,
        arguments: ["DO 0-- IGNORE LINE"],
        output: ["DO", " ", "0", "-- IGNORE LINE"]
    },
    {
        name: "Dash Comment 2",
        function: mysqlTokenize,
        arguments: ["DO 0-- IGNORE LINE\n"],
        output: ["DO", " ", "0", "-- IGNORE LINE", "\n"]
    },
    {
        name: "Dash Comment 3",
        function: mysqlTokenize,
        arguments: ["DO -- IGNORE LINE\n0"],
        output: ["DO", " ", "-- IGNORE LINE", "\n", "0"]
    },
    {
        name: "Dash Comment 4",
        function: mysqlTokenize,
        arguments: ["-- IGNORE LINE\nDO 0"],
        output: ["-- IGNORE LINE", "\n", "DO", " ", "0"]
    },
    {
        name: "Dash Comment 5",
        function: mysqlTokenize,
        arguments: ["-- 'IGNORE LINE'\nDO 0"],
        output: ["-- 'IGNORE LINE'", "\n", "DO", " ", "0"]
    },
    {
        name: "Dash Comment, Embedded Hash Comment",
        function: mysqlTokenize,
        arguments: ["DO -- IGNORE # LINE\n0"],
        output: ["DO", " ", "-- IGNORE # LINE", "\n", "0"]
    },
    {
        name: "Hash Comment, Embedded Dash Comment",
        function: mysqlTokenize,
        arguments: ["DO # IGNORE -- LINE\n0"],
        output: ["DO", " ", "# IGNORE -- LINE", "\n", "0"]
    },
    {
        name: "Dash Comment, Embedded Starred Comment",
        function: mysqlTokenize,
        arguments: ["DO -- IGNORE /*LINE*/\n0"],
        output: ["DO", " ", "-- IGNORE /*LINE*/", "\n", "0"]
    },
    {
        name: "Hash Comment, Embedded Starred Comment",
        function: mysqlTokenize,
        arguments: ["DO # IGNORE /*LINE*/\n0"],
        output: ["DO", " ", "# IGNORE /*LINE*/", "\n", "0"]
    },
    {
        name: "Starred Comment, Embedded Dash Comment",
        function: mysqlTokenize,
        arguments: ["DO /* IGNORE -- ME */0"],
        output: ["DO", " ", "/* IGNORE -- ME */", "0"]
    },
    {
        name: "Starred Comment, Embedded Hash Comment",
        function: mysqlTokenize,
        arguments: ["DO /* IGNORE # ME */0"],
        output: ["DO", " ", "/* IGNORE # ME */", "0"]
    },
    {
        name: "Starred Comment, Embedded Newlines",
        function: mysqlTokenize,
        arguments: ["DO /* IGNORE\r\n\r\n\r\nME */0"],
        output: ["DO", " ", "/* IGNORE\r\n\r\n\r\nME */", "0"]
    },
    {
        name: "Starred Comment, Embedded Comments and Newlines",
        function: mysqlTokenize,
        arguments: ["DO /* IGNORE#\r\n-- \r\n--\r\nME */0"],
        output: ["DO", " ", "/* IGNORE#\r\n-- \r\n--\r\nME */", "0"]
    },
    {
        name: "Mysql Double Dash without Space",
        function: mysqlTokenize,
        arguments: ["SELECT 2--1"],
        output: ["SELECT", " ", "2", "-", "-", "1"]
    },
    {
        name: "SQL-92 Equivalent for Double Dash without Space",
        function: mysqlTokenize,
        arguments: ["SELECT 2 - -1"],
        output: ["SELECT", " ", "2", " ", "-", " ", "-", "1"]
    },
    {
        name: "Single Quotes, Embedded Comment",
        function: mysqlTokenize,
        arguments: ["SELECT 'String With /*Comment -- like*/ #Content' FROM dual"],
        output: ["SELECT", " ", "'String With /*Comment -- like*/ #Content'", " ", "FROM", " ", "dual"]
    },
    {
        name: "Double Quotes, Embedded Comment",
        function: mysqlTokenize,
        arguments: ["SELECT \"String With /*Comment -- like*/ #Content\" FROM dual"],
        output: ["SELECT", " ", "\"String With /*Comment -- like*/ #Content\"", " ", "FROM", " ", "dual"]
    },
    {
        name: "Backticks, Embedded Comment",
        function: mysqlTokenize,
        arguments: ["SELECT `Technically/*Valid*/Column#Name-- No, Really!` FROM dual"],
        output: ["SELECT", " ", "`Technically/*Valid*/Column#Name-- No, Really!`", " ", "FROM", " ", "dual"]
    },
    {
        name: "JSON Table",
        function: mysqlTokenize,
        arguments: [`SELECT * FROM JSON_TABLE('["1","2","3"]', '$[*]' COLUMNS(value VARCHAR(100) PATH '$')) AS JT1`],
        output: ["SELECT", " ", "*", " ", "FROM", " ", "JSON_TABLE", "(", `'["1","2","3"]'`, ",", " ", "'$[*]'", " ", "COLUMNS", "(", "value", " ", "VARCHAR", "(", "100", ")", " ", "PATH", " ", "'$'", ")", ")", " ", "AS", " ", "JT1"],
    },
    {
        name: "JSON Operator 1",
        function: mysqlTokenize,
        arguments: [`SELECT value->'$' FROM JSON_TABLE('["1","2","3"]', '$[*]' COLUMNS(value VARCHAR(100) PATH '$')) AS JT1`],
        output: ["SELECT", " ", "value", "->", "'$'", " ", "FROM", " ", "JSON_TABLE", "(", `'["1","2","3"]'`, ",", " ", "'$[*]'", " ", "COLUMNS", "(", "value", " ", "VARCHAR", "(", "100", ")", " ", "PATH", " ", "'$'", ")", ")", " ", "AS", " ", "JT1"],
    },
    {
        name: "JSON Operator 2",
        function: mysqlTokenize,
        arguments: [`SELECT value->>'$' FROM JSON_TABLE('["1","2","3"]', '$[*]' COLUMNS(value VARCHAR(100) PATH '$')) AS JT1`],
        output: ["SELECT", " ", "value", "->>", "'$'", " ", "FROM", " ", "JSON_TABLE", "(", `'["1","2","3"]'`, ",", " ", "'$[*]'", " ", "COLUMNS", "(", "value", " ", "VARCHAR", "(", "100", ")", " ", "PATH", " ", "'$'", ")", ")", " ", "AS", " ", "JT1"],
    },
    {
        name: "SET Using Equals",
        function: mysqlTokenize,
        arguments: ["SET @user_var = -1"],
        output: ["SET", " ", "@user_var", " ", "=", " ", "-", "1"]
    },
    {
        name: "SET Using Assignment",
        function: mysqlTokenize,
        arguments: ["SET @user_var := -1"],
        output: ["SET", " ", "@user_var", " ", ":=", " ", "-", "1"]
    },
    {
        name: "Labelled Loop 1",
        function: mysqlTokenize,
        arguments: ["CREATE PROCEDURE Test() label: LOOP LEAVE label; END LOOP label;"],
        output: ["CREATE", " ", "PROCEDURE", " ", "Test", "(", ")", " ", "label", ":", " ", "LOOP", " ", "LEAVE", " ", "label", ";", " ", "END", " ", "LOOP", " ", "label", ";"]
    },
    {
        name: "Labelled Loop 2",
        function: mysqlTokenize,
        arguments: ["CREATE PROCEDURE Test() label\t:LOOP LEAVE/*1*/label; END/*2*/LOOP label/*3*/;"],
        output: ["CREATE", " ", "PROCEDURE", " ", "Test", "(", ")", " ", "label", "\t", ":", "LOOP", " ", "LEAVE", "/*1*/", "label", ";", " ", "END", "/*2*/", "LOOP", " ", "label", "/*3*/", ";"]
    },
    {
        name: "Labelled Loop, Quoted Identifier",
        function: mysqlTokenize,
        arguments: ["CREATE PROCEDURE Test() `[Quoted Label]`: LOOP LEAVE `[Quoted Label]`; END LOOP `[Quoted Label]`;"],
        output: ["CREATE", " ", "PROCEDURE", " ", "Test", "(", ")", " ", "`[Quoted Label]`", ":", " ", "LOOP", " ", "LEAVE", " ", "`[Quoted Label]`", ";", " ", "END", " ", "LOOP", " ", "`[Quoted Label]`", ";"]
    },
]);
