import axios from "axios";
import {
    Message as VercelChatMessage,
    StreamingTextResponse,
    experimental_StreamData,
} from "ai"; // Ensure that these imports are correct and necessary

const formatMessage = (message: VercelChatMessage) => {
    return `${message.role}: ${message.content}`;
};

export async function POST(req: Request) {
    try {
        // Make sure the request body is parsed correctly
        const body = await req.json();
        const currentChart = body.chart ?? "";

        const messages = body.messages ?? [];
        const currentContext = body.context ?? "";

        const formattedPreviousMessages = messages
            .slice(0, -1)
            .map(formatMessage);
        const currentMessageContent = messages[messages.length - 1]?.content; // Added a safety check

        // Ensure the environment variable for DATALINGO_API is set
        const url = process.env.DATALINGO_API;
        if (!url) {
            throw new Error("DATALINGO_API environment variable is not set");
        }

        // The data you want to send in the POST request
        const postData = {
            user_query: currentMessageContent,
        };

        // Making the POST request using axios
        const { data } = await axios.post(url + "/query", postData);

        // Returning the response from the API
        return Response.json({
            response: data,
            // response: {
            //     result: {
            //         sql_query: "SELECT month, sales FROM sales_table",
            //         raw_data: [
            //             ["April", 2500],
            //             ["August", 3700],
            //             ["December", 4800],
            //             ["February", 1800],
            //             ["January", 2000],
            //         ],
            //         bar_chart: {
            //             categories: ["Sales"],
            //             chartdata: [
            //                 {
            //                     name: "April",
            //                     Sales: 2500.0,
            //                 },
            //                 {
            //                     name: "August",
            //                     Sales: 3700.0,
            //                 },
            //                 {
            //                     name: "December",
            //                     Sales: 4800.0,
            //                 },
            //                 {
            //                     name: "February",
            //                     Sales: 1800.0,
            //                 },
            //                 {
            //                     name: "January",
            //                     Sales: 2000.0,
            //                 },
            //             ],
            //         },
            //     },
            // },
        });
    } catch (error: any) {
        // Handle errors
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    }
}
