'use strict';

const mysqlStructured = require('../lib/mysql-structured')();
const runTestsAndExit = require('./runTests').runTestsAndExit;

runTestsAndExit([
    {
        name: "SELECT",
        function: mysqlStructured,
        arguments: ["SELECT 1 FROM dual"],
        output: [["SELECT", " ", "1", " ", "FROM", " ", "dual"]]
    },
    {
        name: "SELECT, Semicolon",
        function: mysqlStructured,
        arguments: ["SELECT 1 FROM dual;"],
        output: [["SELECT", " ", "1", " ", "FROM", " ", "dual", ";"], []]
    },
    {
        name: "SELECT, White Space at End",
        function: mysqlStructured,
        arguments: ["SELECT 1 FROM dual; "],
        output: [
            ["SELECT", " ", "1", " ", "FROM", " ", "dual", ";"],
            [" "]
        ]
    },
    {
        name: "Temporary Table",
        function: mysqlStructured,
        arguments: ["CREATE TEMPORARY TABLE TEST ( id INT(11) PRIMARY KEY );"],
        output: [[
            "CREATE", " ", "TEMPORARY", " ", "TABLE", " ", "TEST", " ",
            ["(", " ", "id", " ", "INT",
                ["(", "11", ")"],
                " ", "PRIMARY", " ", "KEY", " ", ")"
            ], ";"],
            []
        ]
    },
    {
        name: "Multiple SELECTs",
        function: mysqlStructured,
        arguments: ["SELECT 1 FROM dual; SELECT 2 FROM dual; SELECT 3 FROM dual"],
        output: [
            ["SELECT", " ", "1", " ", "FROM", " ", "dual", ";"],
            [" ", "SELECT", " ", "2", " ", "FROM", " ", "dual", ";"],
            [" ", "SELECT", " ", "3", " ", "FROM", " ", "dual"]
        ]
    },

    {
        name: "CREATE PROCEDURE, Simple",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST(\r\n)\r\n\tDO 0/*does nothing*/;"],
        output: [["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", "\r\n", ")"], "\r\n\t", "DO", " ", "0", "/*does nothing*/", ";"], []]
    },

    {
        name: "CREATE FUNCTION, Simple",
        function: mysqlStructured,
        arguments: ["CREATE FUNCTION TEST(\r\n)\r\nRETURNS BIGINT\r\n\tRETURN 0/*does nothing*/;"],
        output: [["CREATE", " ", "FUNCTION", " ", "TEST", ["(", "\r\n", ")"], "\r\n", "RETURNS", " ", "BIGINT", "\r\n\t", "RETURN", " ", "0", "/*does nothing*/", ";"], []]
    },

    {
        name: "CREATE PROCEDURE, BEGIN Block",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST(\n) BEGIN\n\tDO 1;\n\tDO 2;\nEND/*does nothing*/;\r\n\r\n\r\n"],
        output: [
            ["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", "\n", ")"], " ",
                ["BEGIN",
                    ["\n\t", "DO", " ", "1", ";"],
                    ["\n\t", "DO", " ", "2", ";"],
                    ["\n", "END", "/*does nothing*/", ";"]
                ]
            ],
            ["\r\n\r\n\r\n"]
        ]
    },
    {
        name: "CREATE PROCEDURE, BEGIN Block Nested",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST() BEGIN DO 1; BEGIN DO 2; /*four*/BEGIN DO 3; END/*three*/;\rEND/*two*/;\nEND/*one*/;\t"],
        output: [
            ["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", ")"], " ", 
                ["BEGIN",
                    [" ", "DO", " ", "1", ";"],
                    [" ", ["BEGIN",
                        [" ", "DO", " ", "2", ";"],
                        [" ", "/*four*/", ["BEGIN",
                            [" ", "DO", " ", "3", ";"],
                            [" ", "END", "/*three*/", ";"]
                        ]],
                        ["\r", "END", "/*two*/", ";"]
                    ]],
                    ["\n", "END", "/*one*/", ";"]
                ]
            ],
            ["\t"]
        ]
    },
    {
        name: "CREATE PROCEDURE, BEGIN Block Nested 2",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST() BEGIN DO 1;BEGIN DO 2;BEGIN DO 3; END/*three*/;\rEND/*two*/;\nEND/*one*/;\t"],
        output: [
            ["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", ")"], " ",
                ["BEGIN",
                    [" ", "DO", " ", "1", ";"],
                    [["BEGIN",
                        [" ", "DO", " ", "2", ";"],
                        [["BEGIN",
                            [" ", "DO", " ", "3", ";"],
                            [" ", "END", "/*three*/", ";"]
                        ]],
                        ["\r", "END", "/*two*/", ";"]
                    ]],
                    ["\n", "END", "/*one*/", ";"]
                ]
            ],
            ["\t"]
        ]
    },

    {
        name: "CREATE PROCEDURE, IF Block 1",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST()\r\nIF 1=1 THEN\r\n\tDO 0;\r\nEND IF;/*done*/"],
        output: [
            ["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", ")"], "\r\n",
                ["IF",
                    [" ", "1", "=", "1", " ", "THEN", "\r\n\t", "DO", " ", "0", ";"],
                    ["\r\n", "END", " ", "IF", ";"]
                ]
            ],
            ["/*done*/"]
        ]
    },

    {
        name: "CREATE PROCEDURE, IF Block 2",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST()\r\nIF (1=(2/2)) THEN\r\n\tDO 'END IF';\r\nEND/*end of end if*/IF;/*done*/"],
        output: [
            ["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", ")"], "\r\n",
                ["IF",
                    [" ", ["(", "1", "=", ["(", "2", "/", "2", ")"], ")"], " ", "THEN", "\r\n\t", "DO", " ", "'END IF'", ";"],
                    ["\r\n", "END", "/*end of end if*/", "IF", ";"]
                ]
            ],
            ["/*done*/"]
        ]
    },

    {
        name: "CREATE PROCEDURE, IF ELSE Block",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST()\r\nIF 1=2 THEN\r\n\tDO 3;\r\nELSE\r\n\tDO 4;\r\nEND IF;/*done*/"],
        output: [
            ["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", ")"], "\r\n",
                ["IF",
                    [" ", "1", "=", "2", " ", "THEN", "\r\n\t", "DO", " ", "3", ";"],
                    ["\r\n", "ELSE", "\r\n\t", "DO", " ", "4", ";"],
                    ["\r\n", "END", " ", "IF", ";"]
                ]
            ],
            ["/*done*/"]
        ]
    },

    {
        name: "CREATE PROCEDURE, IF Block, Nested 1",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST()\r\nBEGIN\r\n  IF 1=2 THEN\r\n\tDO 3;\r\n  ELSE\r\n\tDO 4;\r\n  END IF;\r\nEND;/*done*/"],
        output: [
            ["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", ")"], "\r\n",
                ["BEGIN",
                    ["\r\n  ", ["IF",
                        [" ", "1", "=", "2", " ", "THEN", "\r\n\t", "DO", " ", "3", ";"],
                        ["\r\n  ", "ELSE", "\r\n\t", "DO", " ", "4", ";"],
                        ["\r\n  ", "END", " ", "IF", ";"]
                    ]],
                    ["\r\n", "END", ";"]
                ]
            ],
            ["/*done*/"]
        ]
    },

    {
        name: "CREATE PROCEDURE, IF Block, Nested 2",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST()\r\nBEGIN\r\n  IF 1=2 THEN\r\n\tDO 3;\r\n  ELIF TRUE THEN\r\n\tDO 4;\r\n  ELSE\r\n\tDO 5;\r\n  END IF;\r\nEND;/*done*/"],
        output: [
            ["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", ")"], "\r\n",
                ["BEGIN",
                    ["\r\n  ", ["IF",
                        [" ", "1", "=", "2", " ", "THEN", "\r\n\t", "DO", " ", "3", ";"],
                        ["\r\n  ", "ELIF", " ", "TRUE", " ", "THEN", "\r\n\t", "DO", " ", "4", ";"],
                        ["\r\n  ", "ELSE", "\r\n\t", "DO", " ", "5", ";"],
                        ["\r\n  ", "END", " ", "IF", ";"]
                    ]],
                    ["\r\n", "END", ";"]
                ]
            ],
            ["/*done*/"]
        ]
    },

    {
        name: "While Loop, Simple",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST() WHILE(1) DO\nDO 0;\nEND WHILE;"],
        output: [
            ["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", ")"], " ", ["WHILE", [["(", "1", ")"], " ", "DO", "\n", "DO", " ", "0", ";"], ["\n", "END", " ", "WHILE", ";"]]],
            []
        ]
    },
    {
        name: "Labelled While",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST() label: WHILE TRUE DO LEAVE label; END WHILE label;"],
        output: [
            ["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", ")"], " ", "label", ":", " ", ["WHILE", [" ", "TRUE", " ", "DO", " ", "LEAVE", " ", "label", ";"], [" ", "END", " ", "WHILE", " ", "label", ";"]]],
            []
        ]
    },

    {
        name: "Labelled Loop, Simple",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST() label: LOOP LEAVE; END LOOP;"],
        output: [
            ["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", ")"], " ", "label", ":", " ", ["LOOP", [" ", "LEAVE", ";"], [" ", "END", " ", "LOOP", ";"]]],
            []
        ]
    },
    {
        name: "Labelled Loop 1",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST() label: LOOP LEAVE label; END LOOP label;"],
        output: [
            ["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", ")"], " ", "label", ":", " ", ["LOOP", [" ", "LEAVE", " ", "label", ";"], [" ", "END", " ", "LOOP", " ", "label", ";"]]],
            []
        ]
    },
    {
        name: "Labelled Loop 2",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST() label\t:LOOP LEAVE/*1*/label; END/*2*/LOOP label/*3*/;"],
        output: [
            ["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", ")"], " ", "label", "\t", ":", ["LOOP", [" ", "LEAVE", "/*1*/", "label", ";"], [" ", "END", "/*2*/", "LOOP", " ", "label", "/*3*/", ";"]]],
            []
        ]
    },
    {
        name: "Labelled Loop, Quoted Identifier",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST() `[Quoted Label]`: LOOP LEAVE `[Quoted Label]`; END LOOP `[Quoted Label]`;"],
        output: [
            ["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", ")"], " ", "`[Quoted Label]`", ":", " ", ["LOOP", [" ", "LEAVE", " ", "`[Quoted Label]`", ";"], [" ", "END", " ", "LOOP", " ", "`[Quoted Label]`", ";"]]],
            []
        ]
    },

    {
        name: "Labelled Begin...End 1",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST() label: BEGIN DO 0; END label;"],
        output: [
            ["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", ")"], " ", "label", ":", " ", ["BEGIN", [" ", "DO", " ", "0", ";"], [" ", "END", " ", "label", ";"]]],
            []
        ]
    },
    {
        name: "Labelled Begin...End 2",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST() label\t:BEGIN DO/*1*/0; END/*2*/label/*3*/;"],
        output: [
            ["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", ")"], " ", "label", "\t", ":", ["BEGIN", [" ", "DO", "/*1*/", "0", ";"], [" ", "END", "/*2*/", "label", "/*3*/", ";"]]],
            []
        ]
    },
    {
        name: "Labelled Loop, Quoted Identifier",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST() `[Quoted Label]`: LOOP LEAVE `[Quoted Label]`; END LOOP `[Quoted Label]`;"],
        output: [
            ["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", ")"], " ", "`[Quoted Label]`", ":", " ", ["LOOP", [" ", "LEAVE", " ", "`[Quoted Label]`", ";"], [" ", "END", " ", "LOOP", " ", "`[Quoted Label]`", ";"]]],
            []
        ]
    },

    {
        name: "Labelled Repeat 1",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST() REPEAT LEAVE; UNTIL 'never' END REPEAT;"],
        output: [
            ["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", ")"], " ", ["REPEAT", [" ", "LEAVE", ";"], [" ", "UNTIL", " ", "'never'", " ", "END", " ", "REPEAT", ";"]]],
            []
        ]
    },
    {
        name: "Labelled Repeat 2",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST() label: REPEAT LEAVE; UNTIL 'never' END REPEAT label;"],
        output: [
            ["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", ")"], " ", "label", ":", " ", ["REPEAT", [" ", "LEAVE", ";"], [" ", "UNTIL", " ", "'never'", " ", "END", " ", "REPEAT", " ", "label", ";"]]],
            []
        ]
    },

    {
        name: "Simple IF() Function 1",
        function: mysqlStructured,
        arguments: ["CREATE FUNCTION TEST() RETURNS FLOAT RETURN\nIF (@userVar=0, 0.0, 0.1);/*done*/"],
        output: [
            ["CREATE", " ", "FUNCTION", " ", "TEST", ["(", ")"], " ", "RETURNS", " ", "FLOAT", " ", "RETURN", "\n",
                ["IF", [" ", ["(", "@userVar", "=", "0", ",", " ", "0.0", ",", " ", "0.1", ")"]]],
                ";"
            ],
            ["/*done*/"]
        ]
    },
    {
        name: "Simple IF() Function 2",
        function: mysqlStructured,
        arguments: ["CREATE FUNCTION TEST() RETURNS FLOAT RETURN\nIF(@userVar=0, 0.0, 0.1);/*done*/"],
        output: [
            ["CREATE", " ", "FUNCTION", " ", "TEST", ["(", ")"], " ", "RETURNS", " ", "FLOAT", " ", "RETURN", "\n",
                ["IF", [["(", "@userVar", "=", "0", ",", " ", "0.0", ",", " ", "0.1", ")"]]],
                ";"
            ],
            ["/*done*/"]
        ]
    },
    {
        name: "Nested IF() Function 1",
        function: mysqlStructured,
        arguments: ["CREATE FUNCTION TEST() RETURNS FLOAT RETURN\nIF(@userVar=0, 0.0,\n  IF(@userVar=1, 1.1,\n\t2.2\n));/*done*/"],
        output: [
            ["CREATE", " ", "FUNCTION", " ", "TEST", ["(", ")"], " ", "RETURNS", " ", "FLOAT", " ", "RETURN", "\n",
                ["IF", [["(", "@userVar", "=", "0", ",", " ", "0.0", ",", "\n  ", ["IF", [["(", "@userVar", "=", "1", ",", " ", "1.1", ",", "\n\t", "2.2", "\n", ")"]]], ")"]]],
                ";"
            ],
            ["/*done*/"]
        ]
    },


    {
        name: "Case Statement 1",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST() CASE 1 WHEN 2 THEN DO 3; ELSE DO 4; END CASE;"],
        output: [
            ["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", ")"], " ",
                ["CASE",
                    [" ", "1", " ", ["WHEN", " ", "2", " ", "THEN"], " ", "DO", " ", "3", ";"],
                    [" ", "ELSE", " ", "DO", " ", "4", ";"],
                    [" ", "END", " ", "CASE", ";"]
                ]
            ],
            []
        ]
    },

    {
        name: "Case Statement 2",
        function: mysqlStructured,
        arguments: ["CREATE PROCEDURE TEST() CASE\nWHEN 0 THEN DO 0;\n  WHEN 1 THEN DO 1;\n\tELSE DO 2;\nEND CASE;"],
        output: [
            ["CREATE", " ", "PROCEDURE", " ", "TEST", ["(", ")"], " ",
                ["CASE",
                    ["\n", ["WHEN", " ", "0", " ", "THEN"], " ", "DO", " ", "0", ";"],
                    ["\n  ", ["WHEN", " ", "1", " ", "THEN"], " ", "DO", " ", "1", ";"],
                    ["\n\t", "ELSE", " ", "DO", " ", "2", ";"],
                    ["\n", "END", " ", "CASE", ";"]
                ]
            ],
            []
        ]
    },

    {
        name: "Case Expression 1",
        function: mysqlStructured,
        arguments: ["CREATE FUNCTION TEST() RETURNS FLOAT RETURN CASE @userVar\nWHEN 0 THEN 0.0\n  WHEN 1 THEN 1.1\n\tELSE 2.2\nEND;/*done*/"],
        output: [
            ["CREATE", " ", "FUNCTION", " ", "TEST", ["(", ")"], " ", "RETURNS", " ", "FLOAT", " ", "RETURN", " ",
                ["CASE",
                    [
                        " ", "@userVar", "\n", ["WHEN", " ", "0", " ", "THEN"], " ", "0.0",
                        "\n  ", ["WHEN", " ", "1", " ", "THEN"], " ", "1.1",
                        "\n\t", "ELSE", " ", "2.2",
                        "\n", "END"
                    ]
                ],
                ";"
            ],
            ["/*done*/"]
        ]
    },

    {
        name: "Case Expression, Nested IF Function",
        function: mysqlStructured,
        arguments: ["CREATE FUNCTION TEST() RETURNS FLOAT RETURN CASE @userVar\nWHEN 0 THEN 0.0\n  WHEN IF(1,1,1) THEN 1.1\n\tELSE 2.2\nEND;/*done*/"],
        output: [
            ["CREATE", " ", "FUNCTION", " ", "TEST", ["(", ")"], " ", "RETURNS", " ", "FLOAT", " ", "RETURN", " ",
                ["CASE",
                    [
                        " ", "@userVar", "\n", ["WHEN", " ", "0", " ", "THEN"], " ", "0.0",
                        "\n  ", ["WHEN", " ", ["IF", [["(", "1", ",", "1", ",", "1", ")"]]], " ", "THEN"], " ", "1.1",
                        "\n\t", "ELSE", " ", "2.2",
                        "\n", "END"
                    ]
                ],
                ";"
            ],
            ["/*done*/"]
        ]
    },

    {
        name: "Case Statement, Nested IF Function and Block 1",
        function: mysqlStructured,
        arguments: ["CREATE FUNCTION TEST() RETURNS FLOAT CASE @userVar\nWHEN 0 THEN RETURN IF(0.0,0.0,0.0);\n  WHEN IF(1,1,1) THEN IF(TRUE) THEN RETURN 1.1; ELSE SIGNAL SQLSTATE '99999'; END IF;\n\tELSE RETURN 2.2;\nEND CASE;/*done*/"],
        output: [
            ["CREATE", " ", "FUNCTION", " ", "TEST", ["(", ")"], " ", "RETURNS", " ", "FLOAT", " ",
                ["CASE",
                    [" ", "@userVar", "\n", ["WHEN", " ", "0", " ", "THEN"], " ", "RETURN", " ", ["IF", [["(", "0.0", ",", "0.0", ",", "0.0", ")"]]], ";"],
                    ["\n  ", ["WHEN", " ", ["IF", [["(", "1", ",", "1", ",", "1", ")"]]], " ", "THEN"], " ",
                        ["IF",
                            [["(", "TRUE", ")"], " ", "THEN", " ", "RETURN", " ", "1.1", ";"],
                            [" ", "ELSE", " ", "SIGNAL", " ", "SQLSTATE", " ", "'99999'", ";"],
                            [" ", "END", " ", "IF", ";"]
                        ]
                    ],
                    ["\n\t", "ELSE", " ", "RETURN", " ", "2.2", ";"],
                    ["\n", "END", " ", "CASE", ";"],
                ]
            ],
            ["/*done*/"]
        ]
    },
    {
        name: "Case Statement, Nested IF Function and Block 2",
        function: mysqlStructured,
        arguments: ["CREATE FUNCTION TEST() RETURNS FLOAT CASE @userVar\nWHEN 0<>IF(0,0,0) THEN RETURN IF(0.0,0.0,0.0);\n  WHEN IF(1,1,1) THEN IF(TRUE) THEN RETURN 1.1; ELSE SIGNAL SQLSTATE '99999'; END IF;\n\tELSE RETURN 2.2;\nEND CASE;/*done*/"],
        output: [
            ["CREATE", " ", "FUNCTION", " ", "TEST", ["(", ")"], " ", "RETURNS", " ", "FLOAT", " ",
                ["CASE",
                    [" ", "@userVar", "\n",
                        ["WHEN", " ", "0", "<>", ["IF", [["(", "0", ",", "0", ",", "0", ")"]]], " ", "THEN"],
                        " ", "RETURN", " ",
                        ["IF", [["(", "0.0", ",", "0.0", ",", "0.0", ")"]]],
                        ";"
                    ],
                    ["\n  ", ["WHEN", " ", ["IF", [["(", "1", ",", "1", ",", "1", ")"]]], " ", "THEN"], " ",
                        ["IF",
                            [["(", "TRUE", ")"], " ", "THEN", " ", "RETURN", " ", "1.1", ";"],
                            [" ", "ELSE", " ", "SIGNAL", " ", "SQLSTATE", " ", "'99999'", ";"],
                            [" ", "END", " ", "IF", ";"]
                        ]
                    ],
                    ["\n\t", "ELSE", " ", "RETURN", " ", "2.2", ";"],
                    ["\n", "END", " ", "CASE", ";"],
                ]
            ],
            ["/*done*/"]
        ]
    },

]);