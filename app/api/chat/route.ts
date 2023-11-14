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
    functions,
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
BEFORE ANSWER IMPORTANT CONTEXT: {context}
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
NATURAL LANGUAGE RESPONSE:
BEFORE ANSWER IMPORTANT CONTEXT: {context}
`;

export async function POST(req: Request) {
    const body = await req.json();
    const currentChart = body.chart ?? "";

    const messages = body.messages ?? [];
    const currentContext = body.context ?? "";

    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    const currentMessageContent = messages[messages.length - 1].content;
    const prompt = PromptTemplate.fromTemplate(TEMPLATE);

    const { sqlTables } = await getTableAndColumnsName();

    const { globalString }: any = await generateTableInfoFromTables(sqlTables);

    const llm = new ChatOpenAI({
        temperature: 0,
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-3.5-turbo",
        // modelName: "gpt-4-0613",
        // verbose: true,
    });

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
                return input.context;
            },
        },
        prompt,
        llm.bind({ stop: ["\nSQLResult:"] }),
        new StringOutputParser(),
    ]);

    const sql = await sqlQueryChain.invoke({
        question: currentMessageContent,
        context: currentContext,
    });

    const finalResponsePrompt = PromptTemplate.fromTemplate(
        FINAL_RESPONSE_TEMPLATE
    );

    const finalChain = RunnableSequence.from([
        {
            question: (input) => {
                return input.question;
            },
            context: (input) => {
                return input.context;
            },
            query: sqlQueryChain,
        },
        {
            schema: async () => globalString,
            context: (input) => {
                return input.context;
            },
            question: (input) => input.question,
            query: (input) => input.query,
            response: async (input) => {
                // console.log("input: ", input);

                const response = await vercelSQL.query(input.query);

                const answer = JSON.stringify(response.rows[0]);

                return answer;
            },
            constructAndLogPrompt: async (input) => {
                console.log(input);

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

                return { ...input, fullPrompt };
            },
        },
        finalResponsePrompt,
        llm.bind({
            functions,
            // function_call: { name: "get_pie_chart" },
        }),
        // llm,
        new StringOutputParser(),
    ]);

    const finalResponse = await finalChain.invoke({
        question: currentMessageContent,
        context: currentContext,
    });

    const { additional_kwargs } = await runFunctionCallingWithOpenAI(
        finalResponse + " get pie chart"
    );

    console.log({
        response: finalResponse,
        sql,
        function_call: additional_kwargs,
    });

    return Response.json({
        response: finalResponse,
        sql,
        function_call: additional_kwargs,
    });
}
