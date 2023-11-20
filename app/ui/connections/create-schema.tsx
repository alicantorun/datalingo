"use client";

import axios from "axios";
import { PlusIcon, SendIcon } from "lucide-react";
import { revalidatePath } from "next/cache";
import { LoadingCircle } from "../icons";
import clsx from "clsx";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateSchema({ email }: { email: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const onCreateSchema = async () => {
        setIsLoading(true);
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

            router.refresh();
            // revalidatePath("/dashboard");

            // Optional: Do something with the response data
        } catch (error) {
            // Handle any errors
            console.error("Error creating schema:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={onCreateSchema}
            className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
            <span className="hidden md:block">Create Schema</span>{" "}
            <span className="h-5 ml-4 md:ml-4">
                {isLoading ? <LoadingCircle /> : <PlusIcon />}
            </span>
        </button>
    );
}
