import { Pool } from "pg";

// Assuming you have loaded environment variables from a .env file
// e.g., using the dotenv package or similar
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false, // This should be true in production for better security
    },
    // Optionally, add other configuration parameters here
    // ssl: { rejectUnauthorized: false } // Uncomment if SSL connection is required
});

export const connectToDatabase = () => {
    return pool;
};
