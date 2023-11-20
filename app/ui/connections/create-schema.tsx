"use client";

import axios from "axios";
import { PlusIcon } from "lucide-react";
import { revalidatePath } from "next/cache";

export function CreateSchema({ email }: { email: string }) {
    const onCreateSchema = async () => {
        try {
            // Define the payload if you need to send data with your POST request
            const payload = {
                // ... your data here
                email,
            };

            // Making the POST request
            const response = await axios.post("/api/create-schema", payload);

            // Handle the response
            console.log("Response:", response.data);

            revalidatePath("/dashboard/connections");

            // Optional: Do something with the response data
        } catch (error) {
            // Handle any errors
            console.error("Error creating schema:", error);
        }
    };

    return (
        <button
            onClick={onCreateSchema}
            className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
            <span className="hidden md:block">Create Schema</span>{" "}
            <PlusIcon className="h-5 md:ml-4" />
        </button>
    );
}
