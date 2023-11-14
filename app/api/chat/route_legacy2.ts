import { kv } from "@vercel/kv";
import { sql as vercelSQL } from "@vercel/postgres";
import { Ratelimit } from "@upstash/ratelimit";
import { ChatOpenAI } from "langchain/chat_models/openai";
import {
    Message as VercelChatMessage,
    StreamingTextResponse,
    experimental_StreamData,
} from "ai";

import {
    runSqlDatabaseChain,
    runQuerySql,
    runSqlAgent,
    runFunctionCalling,
    runFunctionCallingWithOpenAI,
} from "../db/functions";
import { PromptTemplate } from "langchain/prompts";
import {
    generateTableInfoFromTables,
    getTableAndColumnsName,
} from "@/app/lib/db";
import { RunnableSequence } from "langchain/schema/runnable";
import { StringOutputParser } from "langchain/schema/output_parser";

// export const runtime = "edge";

const formatMessage = (message: VercelChatMessage) => {
    return `${message.role}: ${message.content}`;
};

const TEMPLATE = `Based on the provided SQL table schema below, write a SQL query that would answer the user's question.
------------
SCHEMA: {schema}
------------
QUESTION: {question}
------------
SQL CONTEXT: {context}
------------
SQL QUERY:`;

const FINAL_RESPONSE_TEMPLATE = `SQL CONTEXT: {context}
------------
Based on the table schema below, question, SQL query, and SQL response, write a natural language response:
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

export async function POST(req: Request) {
    const body = await req.json();
    const messages = body.messages ?? [];
    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    const currentMessageContent = messages[messages.length - 1].content;
    const prompt = PromptTemplate.fromTemplate(TEMPLATE);

    const { sqlTables } = await getTableAndColumnsName();

    const { globalString }: any = await generateTableInfoFromTables(sqlTables);

    const llm = new ChatOpenAI({
        temperature: 0,
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-3.5-turbo",
    });

    /**
     * Create a new RunnableSequence where we pipe the output from `db.getTableInfo()`
     * and the users question, into the prompt template, and then into the llm.
     * We're also applying a stop condition to the llm, so that it stops when it
     * sees the `\nSQLResult:` token.
     */
    const sqlQueryChain = RunnableSequence.from([
        {
            schema: async () => {
                const tableInfo = globalString;

                return tableInfo;
            },
            question: (input: { question: string; context: string }) => {
                return input.question;
            },
            context: (input: { question: string; context: string }) => {
                console.log(input);
                return input.context;
            },
        },
        prompt,
        llm.bind({ stop: ["\nSQLResult:"] }),
        new StringOutputParser(),
    ]);

    // const sql = await sqlQueryChain.invoke({
    //     question: currentMessageContent,
    //     context:
    //         "If the question is as follows: What is the total amount of all pending invoices recorded in our database? ANSWER 'SORRY I CANT ANSWER THIS",
    // });

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
            context: (input) => input.context,
            query: sqlQueryChain,
        },
        {
            schema: async () => globalString,
            context: (input) => input.context,
            question: (input) => input.question,
            query: (input) => input.query,
            response: async (input) => {
                // console.log("input: ", input);

                const response = await vercelSQL.query(input.query);

                const answer = JSON.stringify(response.rows[0]);

                return answer;
            },
            // log: (input) => {
            //     console.log("Full prompt for LLM:", input);
            //     return input; // Pass the input through
            // },
        }, // Either this
        {
            constructAndLogPrompt: async (input) => {
                const finalResponsePrompt = PromptTemplate.fromTemplate(
                    FINAL_RESPONSE_TEMPLATE
                );
                const fullPrompt = await finalResponsePrompt.format({
                    schema: await globalString,
                    context: input.context,
                    question: input.question,
                    query: input.query,
                    response: await input.response,
                });

                // console.log(fullPrompt);

                // Return the constructed prompt so it can be used by llm
                return { ...input, fullPrompt };
            },
        },
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
        question: currentMessageContent,
        context: "no context",
    });

    // console.log("finalResponse: ", finalResponse);

    /**
     * Agent executors don't support streaming responses (yet!), so stream back the
     * complete response one character at a time with a delay to simluate it.
     */
    // const textEncoder = new TextEncoder();
    // const fakeStream = new ReadableStream({
    //   async start(controller) {
    //     for (const character of response) {
    //       controller.enqueue(textEncoder.encode(character));
    //       await new Promise((resolve) => setTimeout(resolve, 20));
    //     }
    //     controller.close();
    //   },
    // });

    // Instantiate the StreamData. It works with all API providers.
    // const data = new experimental_StreamData();

    // data.append({
    //   sql,
    //   response,
    // });

    // data.close();

    // return new StreamingTextResponse(fakeStream, {}, data);
    // return Response.json({ response, sql });
    return Response.json({
        response: "function_call",
        sql: null,
        // function_call: additional_kwargs,
    });
}
