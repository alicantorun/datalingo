import { sql } from "@vercel/postgres";
import { PromptTemplate } from "langchain/prompts";
import { unstable_noStore as noStore } from "next/cache";

const formatToSqlTable = (rawResultsTableAndColumn: any) => {
    const sqlTables: any[] = [];
    for (const oneResult of rawResultsTableAndColumn) {
        const sqlColumn = {
            columnName: oneResult.column_name,
            dataType: oneResult.data_type,
            isNullable: oneResult.is_nullable === "YES",
        };
        const currentTable = sqlTables.find(
            (oneTable) => oneTable.tableName === oneResult.table_name
        );
        if (currentTable) {
            currentTable.columns.push(sqlColumn);
        } else {
            const newTable = {
                tableName: oneResult.table_name,
                columns: [sqlColumn],
            };
            sqlTables.push(newTable);
        }
    }

    return { sqlTables };
};

export const getTableAndColumnsName = async () => {
    try {
        const data = await sql`SELECT 
            t.table_name, 
            c.* 
          FROM 
            information_schema.tables t 
              JOIN information_schema.columns c 
                ON t.table_name = c.table_name 
          WHERE 
            t.table_schema = 'public' 
              AND c.table_schema = 'public' 
          ORDER BY 
            t.table_name,
            c.ordinal_position;`;

        const { sqlTables } = formatToSqlTable(data.rows);

        return { sqlTables };
    } catch (error: any) {
        throw new Error("Database type not implemented yet", error);
    }
};

export const generateTableInfoFromTables = async (
    tables: any,
    customDescription = "",
    sampleRowsInTableInfo = 3
) => {
    if (!tables) {
        return "";
    }

    let globalString = "";

    for (const currentTable of tables) {
        let sqlSelectInfoQuery = "";
        let sqlCreateTableQuery = "";
        let tableCustomDescription = customDescription;

        // Determine the schema
        const schema = "public";

        // Add the custom info of the table
        // for context
        tableCustomDescription =
            customDescription &&
            Object.keys(customDescription).includes(currentTable.tableName)
                ? `${customDescription[currentTable.tableName]}\n`
                : "";

        // Add the creation of the table in SQL
        sqlCreateTableQuery = `CREATE TABLE "${schema}"."${currentTable.tableName}" (\n`;

        for (const [key, currentColumn] of currentTable.columns.entries()) {
            if (key > 0) {
                sqlCreateTableQuery += ", ";
            }
            sqlCreateTableQuery += `${currentColumn.columnName} ${
                currentColumn.dataType
            } ${currentColumn.isNullable ? "" : "NOT NULL"}`;
        }

        sqlCreateTableQuery += ") \n";

        sqlSelectInfoQuery = `SELECT * FROM "${schema}"."${currentTable.tableName}" LIMIT ${sampleRowsInTableInfo};\n`;

        // Concatenate column names
        const columnNamesConcatString = `${currentTable.columns.reduce(
            (completeString: any, column: any) =>
                `${completeString} ${column.columnName}`,
            ""
        )}\n`;
        let sample = "";
        try {
            const infoObjectResult = sampleRowsInTableInfo
                ? await sql.query(sqlSelectInfoQuery)
                : null;
            sample = formatSqlResponseToSimpleTableString(infoObjectResult);
        } catch (error) {
            // If the request fails we catch it and only display a log message
            console.log(error);
        }

        globalString = globalString.concat(
            tableCustomDescription +
                sqlCreateTableQuery +
                sqlSelectInfoQuery +
                columnNamesConcatString +
                sample
        );
    }

    return { globalString };
};

export const concatGlobalString = (
    sqlSelectInfoQuery: any,
    sqlCreateTableQuery: any,
    columnNamesConcatString: any,
    tableCustomDescription: any,
    sample: any
) => {
    let globalString = "";

    globalString = globalString.concat(
        tableCustomDescription +
            sqlCreateTableQuery +
            sqlSelectInfoQuery +
            columnNamesConcatString +
            sample
    );

    return { globalString };
};

const formatSqlResponseToSimpleTableString = (rawResult: any) => {
    const rows = rawResult.rows;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
        return "";
    }

    let globalString = "";

    for (const oneRow of rows) {
        globalString += `${Object.values(oneRow).reduce(
            (completeString, columnValue) => `${completeString} ${columnValue}`,
            ""
        )}\n`;
    }

    return globalString;
};

export const queryDbAfterGettingTableInfo = async (
    sqlSelectInfoQuery: any,
    sampleRowsInTableInfo = 3
) => {
    let sample = "";

    try {
        const infoObjectResult = sampleRowsInTableInfo
            ? await await sql.query(sqlSelectInfoQuery)
            : null;

        sample = formatSqlResponseToSimpleTableString(infoObjectResult);
    } catch (error) {
        // If the request fails we catch it and only display a log message
        console.log(error);
    }

    return { sample };
};

export const SQL_POSTGRES_PROMPT = /*#__PURE__*/ new PromptTemplate({
    template: `You are a PostgreSQL expert. Given an input question, first create a syntactically correct PostgreSQL query to run, then look at the results of the query and return the answer to the input question.
Unless the user specifies in the question a specific number of examples to obtain, query for at most {top_k} results using the LIMIT clause as per PostgreSQL. You can order the results to return the most informative data in the database.
Never query for all columns from a table. You must query only the columns that are needed to answer the question. Wrap each column name in double quotes (") to denote them as delimited identifiers.
Pay attention to use only the column names you can see in the tables below. Be careful to not query for columns that do not exist. Also, pay attention to which column is in which table.

Use the following format:

Question: "Question here"
SQLQuery: "SQL Query to run"
SQLResult: "Result of the SQLQuery"
Answer: "Final answer here"

Only use the following tables:
{table_info}

Question: {input}`,
    inputVariables: ["dialect", "table_info", "input", "top_k"],
});
