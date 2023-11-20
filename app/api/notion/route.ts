// https://github.com/htrivedi99/notion_streamlit_app/blob/main/notion_streamlit.py
// https://github.com/mayooear/notion-chat-langchain/blob/main/pages/api/chat.ts

import axios from "axios";
import { Tiktoken } from "tiktoken/lite";
import cl100k_base from "tiktoken/encoders/cl100k_base.json";
import { QdrantVectorStore } from "langchain/vectorstores/qdrant";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { QdrantClient } from "@qdrant/js-client-rest";

// export const runtime = "edge";

const BASE_URL = "https://api.notion.com";

const notionGetBlocks = async (pageId: string, headers: any) => {
    try {
        const res = await axios.get(
            `${BASE_URL}/v1/blocks/${pageId}/children?page_size=100`,
            { headers }
        );

        console.log("notionGetBlocks: ", res.data);

        return res.data;
    } catch (error) {
        console.error("Error fetching Notion blocks:", error);
        throw error;
    }
};

const notionSearch = async (query: any, headers: any) => {
    try {
        const res = await axios.post(`${BASE_URL}/v1/search`, query, {
            headers,
        });

        console.log("notionSearch: ", res.data);
        return res.data;
    } catch (error) {
        console.error("Error searching in Notion:", error);
        throw error;
    }
};

const getPageText = async (pageId: string, headers: any): Promise<string[]> => {
    try {
        const pageText: string[] = [];
        const blocks = await notionGetBlocks(pageId, headers);
        for (const item of blocks.results) {
            const itemType = item.type;
            const content = item[itemType];
            if (content.rich_text) {
                for (const text of content.rich_text) {
                    const plainText = text.plain_text;
                    pageText.push(plainText);
                }
            }
        }
        return pageText;
    } catch (error) {
        console.error("Error getting page text:", error);
        throw error;
    }
};

const loadNotion = async (headers: any): Promise<string[]> => {
    try {
        const documents: string[] = [];
        const allNotionDocuments = await notionSearch({}, headers);
        const items = allNotionDocuments.results;
        for (const item of items) {
            const objectType = item.object;
            const objectId = item.id;
            const titleContent =
                item.properties?.title || item.properties?.Name;
            let title = "";

            if (
                titleContent &&
                titleContent.title &&
                titleContent.title.length > 0
            ) {
                title = titleContent.title[0].text.content;
            }

            const pageText = [title];
            const pageContent = await getPageText(objectId, headers);
            pageText.push(...pageContent);

            const textPerPage = pageText.join(". ");
            if (textPerPage.length > 0) {
                documents.push(textPerPage);
            }
        }
        return documents;
    } catch (error) {
        console.error("Error loading Notion documents:", error);
        throw error;
    }
};

const chunkTokens = (text: string, tokenLimit: number): string[] => {
    const encoding = new Tiktoken(
        cl100k_base.bpe_ranks,
        cl100k_base.special_tokens,
        cl100k_base.pat_str
    );

    const chunks: string[] = [];
    let tokens = encoding.encode(text);

    while (tokens.length > 0) {
        const chunkTokens = tokens.slice(0, tokenLimit);
        let chunkText = encoding.decode(chunkTokens);
        const lastPunctuation = Math.max(
            chunkText.lastIndexOf("."),
            chunkText.lastIndexOf("?"),
            chunkText.lastIndexOf("!"),
            chunkText.lastIndexOf("\n")
        );

        if (lastPunctuation !== -1) {
            chunkText = chunkText.substring(0, lastPunctuation + 1);
        }

        const cleanedText = chunkText.replace("\n", " ").trim();
        if (cleanedText) {
            chunks.push(cleanedText);
        }

        tokens = tokens.slice(chunkTokens.length);
    }

    encoding.free();
    return chunks;
};

const loadDataIntoVectorstore = async (
    client: any,
    docs: string[],
    openaiApiKey: string
): Promise<number[]> => {
    const embeddings = new OpenAIEmbeddings({
        openAIApiKey: openaiApiKey,
    });
    const qdrantClient = new QdrantVectorStore(
        client,
        "notion_wyzard_ai",
        embeddings.embedQuery
    );

    const ids = await qdrantClient.addTexts(docs);
    return ids;
};

// This function sets up and returns the Qdrant client
const connectToVectorstore = async (): Promise<QdrantClient> => {
    const qdrantApiKey = process.env.QDRANT_API_KEY; // Replace with actual API key retrieval logic
    const apiEndpoint = process.env.QDRANT_API_ENDPOINT; // Replace with actual API key retrieval logic

    const client = new QdrantClient({
        url: apiEndpoint,
        apiKey: qdrantApiKey,
    });

    try {
        await client.getCollection("notion_wyzard_ai");
    } catch (error) {
        await client.recreateCollection("notion_wyzard_ai", {
            vectors: {
                size: 1536,
                distance: "Cosine", // Adjust based on actual API
            },
        });
    }

    return client;
};

// Function to generate headers for Notion API requests
const cacheHeaders = (notionApiKey: string): Record<string, string> => {
    return {
        Authorization: `Bearer ${notionApiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
    };
};

const loadChain = async (
    client: any,
    apiKey: string
): Promise<ConversationalRetrievalQAChain> => {
    if (!apiKey || apiKey.length === 0) {
        apiKey = "temp value"; // Replace with actual fallback logic
    }

    const embeddings = new OpenAIEmbeddings(apiKey);
    const vectorStore = new Qdrant(
        client,
        "notion_wyzard_ai",
        embeddings.embedQuery
    );

    const chain = new ConversationalRetrievalQAChain({
        llm: new ChatOpenAI({
            temperature: 0.0,
            modelName: "gpt-3.5-turbo",
            openaiApiKey: apiKey,
        }),
        retriever: vectorStore.asRetriever(),
    });

    return chain;
};

const mainLogic = async () => {
    // Initialize the vector store (Qdrant client)

    const vectorStore = await connectToVectorstore();

    // Placeholders for API keys - In a real application, these would come from a secure source
    const openaiApiKey = process.env.OPENAI_API_KEY; // Replace with actual API key retrieval logic
    const notionApiKey = process.env.NOTION_API_KEY; // Replace with actual API key retrieval logic

    if (openaiApiKey && notionApiKey) {
        // Generate headers for Notion API
        const notionHeaders = cacheHeaders(notionApiKey);
        console.log("before document");
        // Load data from Notion
        const documents = await loadNotion(notionHeaders);

        console.log("after document", documents);

        // Process and chunk the documents
        const chunks = [];
        for (const doc of documents) {
            const docChunks = chunkTokens(doc, 100); // Adjust the token limit as needed
            chunks.push(...docChunks);
        }

        console.log(chunks);

        // Load data into the vector store
        await loadDataIntoVectorstore(vectorStore, chunks, openaiApiKey);

        console.log("Documents loaded.");

        // Initialize the conversational chain
        const chain = await loadChain(vectorStore, openaiApiKey);

        // Placeholder for user input - In a real application, this would come from user interaction
        const userInput = "Your user input here";

        if (userInput) {
            const result = await chain({
                question: userInput,
                chatHistory: [],
            }); // Adjust chatHistory as needed
            const response = result.answer;

            console.log("User Input:", userInput);
            console.log("Response:", response);
        }
    }

    return Response.json("Missing keys");
};

export async function POST(req: Request) {
    const body = await req.json();

    // Extract data from request
    const { notionApiKey, openaiApiKey /* other required data */ } = body;

    // Set up headers for Notion API
    const headers = {
        Authorization: `Bearer ${notionApiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
    };

    mainLogic();

    return Response.json({});
}
