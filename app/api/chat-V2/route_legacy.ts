import { kv } from "@vercel/kv";
import { Ratelimit } from "@upstash/ratelimit";
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

// export const runtime = "edge";

const formatMessage = (message: VercelChatMessage) => {
    return `${message.role}: ${message.content}`;
};

const TEMPLATE = `You are a pirate named Patchy. All responses must be extremely verbose and in pirate dialect.

Current conversation:
{chat_history}

User: {input}
AI:`;

export async function POST(req: Request) {
    if (
        process.env.NODE_ENV !== "development" &&
        process.env.KV_REST_API_URL &&
        process.env.KV_REST_API_TOKEN
    ) {
        const ip = req.headers.get("x-forwarded-for");
        const ratelimit = new Ratelimit({
            redis: kv,
            limiter: Ratelimit.slidingWindow(50, "1 d"),
        });

        const { success, limit, reset, remaining } = await ratelimit.limit(
            `chat_ratelimit_${ip}`
        );

        if (!success) {
            return new Response(
                "You have reached your request limit for the day.",
                {
                    status: 429,
                    headers: {
                        "X-RateLimit-Limit": limit.toString(),
                        "X-RateLimit-Remaining": remaining.toString(),
                        "X-RateLimit-Reset": reset.toString(),
                    },
                }
            );
        }
    }

    const body = await req.json();
    const messages = body.messages ?? [];
    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    const currentMessageContent = messages[messages.length - 1].content;
    const prompt = PromptTemplate.fromTemplate(TEMPLATE);

    // const { response, sql } = await runSqlDatabaseChain(currentMessageContent);
    const { additional_kwargs } = await runFunctionCallingWithOpenAI(
        currentMessageContent
    );

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
        function_call: additional_kwargs,
    });
}
