import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { deleteConnection, createSchema } from "@/app/lib/actions";
import axios from "axios";

export function CreateSchema({ onClick }: { onClick: any }) {
    const onCreateSchema = async () => {
        try {
            // Define the payload if you need to send data with your POST request
            const payload = {
                // ... your data here
            };

            // Making the POST request
            const response = await axios.post("/api/create-schema", payload);

            // Handle the response
            console.log("Response:", response.data);

            // Optional: Do something with the response data
        } catch (error) {
            // Handle any errors
            console.error("Error creating schema:", error);
        }
    };

    return (
        <button
            onClick={onCreateSchema}
            className="rounded-md border p-2 hover:bg-gray-100"
        >
            <span className="hidden md:block">Create Schema</span>{" "}
            <PlusIcon className="h-5 md:ml-4" />
        </button>
    );
}

export function CreateConnection() {
    return (
        <Link
            href="/dashboard/connections/create"
            className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
            <span className="hidden md:block">Create Connection</span>{" "}
            <PlusIcon className="h-5 md:ml-4" />
        </Link>
    );
}

export function UpdateConnection({ id }: { id: string }) {
    return (
        <Link
            href={`/dashboard/connections/${id}/edit`}
            className="rounded-md border p-2 hover:bg-gray-100"
        >
            <PencilIcon className="w-5" />
        </Link>
    );
}

export function DeleteConnection({ id }: { id: string }) {
    const deleteConnectionWithId = deleteConnection.bind(null, id);

    return (
        <form action={deleteConnectionWithId}>
            <button className="rounded-md border p-2 hover:bg-gray-100">
                <span className="sr-only">Delete</span>
                <TrashIcon className="w-5" />
            </button>
        </form>
    );
}
