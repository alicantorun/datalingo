import { sql } from "@vercel/postgres";
import {
    generateTableInfoFromTables,
    getTableAndColumnsNameFromConnection,
} from "@/app/lib/db";
import { connectToDatabase } from "@/app/lib/database";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email } = body;
        const db = connectToDatabase();

        // Retrieve table and column names
        const { sqlTables } = await getTableAndColumnsNameFromConnection(db);

        // Generate global string from table information
        const { globalString } = await generateTableInfoFromTables(sqlTables);

        // Insert into 'schemas' table
        await sql`INSERT INTO schemas (schema, email) VALUES (${globalString}, ${email})`;

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
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
