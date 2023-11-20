import { ChatCompletionCreateParams } from "openai/resources/chat/index";
import { ChatOpenAI } from "langchain/chat_models/openai";

import OpenAIFromOpenAI from "openai";

import { OpenAI, OpenAICallOptions } from "langchain/llms/openai";
import { SqlDatabase } from "langchain/sql_db";
import { createSqlAgent, SqlToolkit } from "langchain/agents/toolkits/sql";
import { PromptTemplate } from "langchain/prompts";
import {
    RunnablePassthrough,
    RunnableSequence,
} from "langchain/schema/runnable";
import { StringOutputParser } from "langchain/schema/output_parser";
import { getPostgresDatasource } from "@/app/lib/postgres-datasource";

export const runQuerySql = async (input: string) => {
    const TEMPLATE = `Based on the table schema below, write a SQL query that would answer the user's question:
{schema}

Question: {question}
SQL Query:`;

    const FINAL_RESPONSE_TEMPLATE = `Based on the table schema below, question, sql query, and sql response, write a natural language response:
Important that if money coming is is greater than 5 it is good for business.
{schema}

Question: {question}
SQL Query: {query}
SQL Response: {response}`;

    const datasource = getPostgresDatasource({
        database: "verceldb",
        host: "ep-square-star-98504178-pooler.us-east-1.postgres.vercel-storage.com",
        password: "BDO5onx1pZWG",
        port: 5432,
        username: "default",
    });

    // You can include or exclude tables when creating the SqlDatabase object to help the chain focus on the tables you want.
    // It can also reduce the number of tokens used in the chain.
    const db = await SqlDatabase.fromDataSourceParams({
        appDataSource: datasource,
        // includesTables: ["Track"],
    });

    const prompt = PromptTemplate.fromTemplate(TEMPLATE);

    const model = new OpenAI({
        temperature: 0,
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-3.5-turbo",
    });

    // The `RunnablePassthrough.assign()` is used here to passthrough the input from the `.invoke()`
    // call (in this example it's the question), along with any inputs passed to the `.assign()` method.
    // In this case, we're passing the schema.
    const sqlQueryGeneratorChain = RunnableSequence.from([
        RunnablePassthrough.assign({
            schema: async () => db.getTableInfo(),
        }),
        prompt,
        model.bind({ stop: ["\nSQLResult:"] }),
        new StringOutputParser(),
    ]);

    const sql = await sqlQueryGeneratorChain.invoke({
        question: input,
    });

    const finalResponsePrompt = PromptTemplate.fromTemplate(
        FINAL_RESPONSE_TEMPLATE
    );

    const fullChain = RunnableSequence.from([
        RunnablePassthrough.assign({
            query: sqlQueryGeneratorChain,
        }),
        {
            schema: async () => db.getTableInfo(),
            question: (input) => input.question,
            query: (input) => input.query,
            response: (input) => db.run(input.query),
        },
        finalResponsePrompt,
        model,
    ]);

    const response = await fullChain.invoke({
        question: input,
    });

    await datasource.destroy();

    return { response, sql };
};

export const runSqlDatabaseChain = async (input: string) => {
    const TEMPLATE = `Based on the provided SQL table schema below, write a SQL query that would answer the user's question.
  ------------
  SCHEMA: {schema}
  ------------
  QUESTION: {question}
  ------------
  SQL QUERY:`;

    const FINAL_RESPONSE_TEMPLATE = `Based on the table schema below, question, SQL query, and SQL response, write a natural language response:
  ------------
  SCHEMA: {schema}
  ------------
  QUESTION: {question}
  ------------
  SQL QUERY: {query}
  ------------
  SQL RESPONSE: {response}
  ------------
  NATURAL LANGUAGE RESPONSE:`;

    const datasource = getPostgresDatasource({
        database: "verceldb",
        host: "ep-square-star-98504178-pooler.us-east-1.postgres.vercel-storage.com",
        password: "BDO5onx1pZWG",
        port: 5432,
        username: "default",
    });

    // You can include or exclude tables when creating the SqlDatabase object to help the chain focus on the tables you want.
    // It can also reduce the number of tokens used in the chain.
    const db = await SqlDatabase.fromDataSourceParams({
        appDataSource: datasource,
        // includesTables: ["Track"],
    });

    const llm = new ChatOpenAI({
        temperature: 0,
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-3.5-turbo",
    });

    const prompt = PromptTemplate.fromTemplate(TEMPLATE);
    /**
     * You can also load a default prompt by importing from "langchain/sql_db"
     *
     * import {
     *   DEFAULT_SQL_DATABASE_PROMPT
     *   SQL_POSTGRES_PROMPT
     *   SQL_SQLITE_PROMPT
     *   SQL_MSSQL_PROMPT
     *   SQL_MYSQL_PROMPT
     *   SQL_SAP_HANA_PROMPT
     * } from "langchain/sql_db";
     *
     */

    /**
     * Create a new RunnableSequence where we pipe the output from `db.getTableInfo()`
     * and the users question, into the prompt template, and then into the llm.
     * We're also applying a stop condition to the llm, so that it stops when it
     * sees the `\nSQLResult:` token.
     */
    const sqlQueryChain = RunnableSequence.from([
        {
            schema: async () => {
                const tableInfo = await db.getTableInfo();

                return tableInfo;
            },
            question: (input: { question: string }) => input.question,
        },
        prompt,
        llm.bind({ stop: ["\nSQLResult:"] }),
        new StringOutputParser(),
    ]);

    const sql = await sqlQueryChain.invoke({
        question: input,
    });

    const finalResponsePrompt = PromptTemplate.fromTemplate(
        FINAL_RESPONSE_TEMPLATE
    );

    /**
     * https://js.langchain.com/docs/modules/chains/popular/sqlite
     *
     * Create a new RunnableSequence where we pipe the output from the previous chain, the users question,
     * and the SQL query, into the prompt template, and then into the llm.
     * Using the result from the `sqlQueryChain` we can run the SQL query via `db.run(input.query)`.
     */
    /**
     * Create a new RunnableSequence where we pipe the output from the previous chain, the users question,
     * and the SQL query, into the prompt template, and then into the llm.
     * Using the result from the `sqlQueryChain` we can run the SQL query via `db.run(input.query)`.
     *
     * Lastly we're piping the result of the first chain (the outputted SQL query) so it is
     * logged along with the natural language response.
     */

    const finalChain = RunnableSequence.from([
        {
            question: (input) => input.question,
            query: sqlQueryChain,
        },
        {
            schema: async () => db.getTableInfo(),
            question: (input) => input.question,
            query: (input) => input.query,
            response: (input) => db.run(input.query),
        },
        // Either this
        finalResponsePrompt,
        llm,
        new StringOutputParser(),
        // Or this
        // {
        //   result: finalResponsePrompt.pipe(llm).pipe(new StringOutputParser()),
        //   // Pipe the query through here unchanged so it gets logged alongside the result.
        //   sql: (previousStepResult) => previousStepResult.query,
        // },
    ]);

    const finalResponse = await finalChain.invoke({
        question: input,
    });

    await datasource.destroy();

    return { response: finalResponse, sql };
};

/**
 * https://js.langchain.com/docs/integrations/toolkits/sql
 * Agents are more complex, and involve multiple queries to the LLM to understand what to do.
 * The downside of agents are that you have less control.
 * The upside is that they are more powerful, which allows you to use them on larger databases and more complex schemas.
 */
export const runSqlAgent = async (input: string) => {
    const datasource = getPostgresDatasource({
        database: "verceldb",
        host: "ep-square-star-98504178-pooler.us-east-1.postgres.vercel-storage.com",
        password: "BDO5onx1pZWG",
        port: 5432,
        username: "default",
    });

    // You can include or exclude tables when creating the SqlDatabase object to help the chain focus on the tables you want.
    // It can also reduce the number of tokens used in the chain.
    const db = await SqlDatabase.fromDataSourceParams({
        appDataSource: datasource,
        // includesTables: ["Track"],
    });

    const llm = new OpenAI({
        temperature: 0,
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-3.5-turbo",
    });

    const toolkit = new SqlToolkit(db, llm);
    const executor = createSqlAgent(llm, toolkit);

    // console.log(`Executing with input "${input}"...`);

    const result = await executor.call({ input });

    // console.log(`Got output ${result.output}`);

    const finalResponse = `Got intermediate steps ${JSON.stringify(
        result.intermediateSteps,
        null,
        2
    )}`;

    await datasource.destroy();

    return { response: finalResponse };
};

export const runFunctionCallingWithOpenAI = async (input: string) => {
    const model = new OpenAIFromOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const runner = model.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: input }],
        functions,
    });
    // .on("message", (message) => console.log(message));

    const finalContent = (await runner).choices[0].message.function_call;

    /* Now we can call the model without having to pass the function arguments in again */
    // const result = await model.invoke(["input"]);

    return { additional_kwargs: finalContent };
};

export const runFunctionCalling = async (input: string) => {
    const model = new ChatOpenAI({
        temperature: 0,
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-3.5-turbo",
    }).bind({
        functions,
        function_call: { name: "get_pie_chart" },
    });

    /* Now we can call the model without having to pass the function arguments in again */
    const result = await model.invoke(["input"]);

    return result;
};

export const functions = [
    {
        function: get_pie_chart,
        parse: (result: any) => JSON.parse(result),
        parameters: {
            type: "object",
            properties: {
                labels: {
                    type: "array",
                    items: {
                        type: "string",
                    },
                    description:
                        "An array of labels for each section of the pie chart.",
                },
                data: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description:
                                    "The name associated with the value.",
                            },
                            value: {
                                type: "number",
                                description:
                                    "The numeric value representing the size of a slice of the pie.",
                            },
                        },
                        required: ["name", "value"],
                    },
                    description:
                        "An array of objects, each containing a name and a numeric value. The values represent the size of each slice of the pie.",
                },
                colors: {
                    type: "array",
                    items: {
                        type: "string",
                    },
                    description:
                        "An optional array of colors for each slice of the pie chart. Each color can be specified in any CSS-compatible format (like hex, rgb, etc.). If not provided, default colors will be used.",
                },
            },
        },
        name: "get_pie_chart",
        description: "Generates a pie chart based on provided data.",
    },
    {
        function: get_line_chart,
        parse: (result: any) => JSON.parse(result),
        parameters: {
            type: "object",
            properties: {
                labels: {
                    type: "array",
                    items: {
                        type: "string",
                    },
                    description:
                        "An array of labels for each data point in the line chart.",
                },
                data: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "The label for the data point.",
                            },
                            value: {
                                type: "number",
                                description:
                                    "The numeric value of the data point.",
                            },
                        },
                        required: ["name", "value"],
                    },
                    description:
                        "An array of objects, each representing a data point in the line chart.",
                },
            },
        },
        name: "get_line_chart",
        description: "Generates a line chart based on provided data.",
    },
    {
        function: get_bar_chart,
        parse: (result: any) => JSON.parse(result),
        parameters: {
            type: "object",
            properties: {
                labels: {
                    type: "array",
                    items: {
                        type: "string",
                    },
                    description:
                        "An array of labels for each bar in the chart.",
                },
                data: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "The label for the bar.",
                            },
                            value: {
                                type: "number",
                                description:
                                    "The numeric value representing the height of the bar.",
                            },
                        },
                        required: ["name", "value"],
                    },
                    description:
                        "An array of objects, each representing a bar in the bar chart.",
                },
            },
        },
        name: "get_bar_chart",
        description: "Generates a bar chart based on provided data.",
    },
];

function get_pie_chart(labels: any, data: any, colors: any) {
    // Mock implementation for pie chart
    console.log("Pie Chart: ", { labels, data, colors });
    // Return a mock result (adjust as per your actual implementation)
    return JSON.stringify({ chartType: "Pie", labels, data, colors });
}

function get_line_chart(labels: any, data: any) {
    // Mock implementation for line chart
    console.log("Line Chart: ", { labels, data });
    // Return a mock result (adjust as per your actual implementation)
    return JSON.stringify({ chartType: "Line", labels, data });
}

function get_bar_chart(labels: any, data: any) {
    // Mock implementation for bar chart
    console.log("Bar Chart: ", { labels, data });
    // Return a mock result (adjust as per your actual implementation)
    return JSON.stringify({ chartType: "Bar", labels, data });
}
