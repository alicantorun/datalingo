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

import {
    generateTableInfoFromTables,
    getTableAndColumnsName,
    queryDbAfterGettingTableInfo,
    concatGlobalString,
} from "../../lib/db";

export const runtime = "edge";

export async function POST(req: Request) {
    const body = await req.json();
    const messages = body.messages ?? [];

    const { sqlTables } = await getTableAndColumnsName();

    const { globalString }: any = await generateTableInfoFromTables(sqlTables);

    console.log(globalString);

    return Response.json({ globalString });
}
