import { OpenAI } from "langchain/llms/openai";
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

  const llm = new OpenAI({
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
      schema: async () => db.getTableInfo(),
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
