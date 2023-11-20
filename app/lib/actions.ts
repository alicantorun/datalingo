"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

// This is temporary until @types/react-dom is updated
export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
        customer_id?: string[];
        postgres_database?: string[];
        postgres_host?: string[];
        postgres_password?: string[];
        postgres_prisma_url?: string[];
        postgres_url?: string[];
        postgres_url_non_pooling?: string[];
        postgres_user?: string[];
    };
    message?: string | null;
};

const InvoiceSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: "Please select a customer.",
    }),
    amount: z.coerce
        .number()
        .gt(0, { message: "Please enter an amount greater than $0." }),
    status: z.enum(["pending", "paid"], {
        invalid_type_error: "Please select an invoice status.",
    }),
    date: z.string(),
});

const CreateInvoice = InvoiceSchema.omit({ id: true, date: true });
const UpdateInvoice = InvoiceSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get("customerId"),
        amount: formData.get("amount"),
        status: formData.get("status"),
    });

    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields. Failed to Create Invoice.",
        };
    }

    // Prepare data for insertion into the database
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split("T")[0];

    try {
        await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
    } catch (error) {
        return {
            message: "Database Error: Failed to Create Invoice.",
        };
    }

    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");
}

export async function updateInvoice(
    id: string,
    prevState: State,
    formData: FormData
) {
    const validatedFields = UpdateInvoice.safeParse({
        customerId: formData.get("customerId"),
        amount: formData.get("amount"),
        status: formData.get("status"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields. Failed to Update Invoice.",
        };
    }

    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;

    try {
        await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
    } catch (error) {
        return { message: "Database Error: Failed to Update Invoice." };
    }

    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
        revalidatePath("/dashboard/invoices");
        return { message: "Deleted Invoice." };
    } catch (error) {
        return { message: "Database Error: Failed to Delete Invoice." };
    }
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData
) {
    try {
        await signIn("credentials", Object.fromEntries(formData));
    } catch (error) {
        if ((error as Error).message.includes("CredentialsSignin")) {
            return "CredentialSignin";
        }
        throw error;
    }
}

// CONNECTIONS

const ConnectionSchema = z.object({
    id: z.string().uuid(),
    customer_id: z.string().uuid({
        message: "Please select a customer.",
    }),
    postgres_url: z.string({
        required_error: "Please enter a valid PostgreSQL URL.",
    }),
    postgres_prisma_url: z.string({
        required_error: "Please enter a valid Prisma PostgreSQL URL.",
    }),
    postgres_url_non_pooling: z.string({
        required_error: "Please enter a valid non-pooling PostgreSQL URL.",
    }),
    postgres_user: z.string({
        required_error: "Please enter a PostgreSQL user.",
    }),
    postgres_host: z.string({
        required_error: "Please enter a PostgreSQL host.",
    }),
    postgres_password: z.string({
        required_error: "Please enter a PostgreSQL password.",
    }),
    postgres_database: z.string({
        required_error: "Please enter a PostgreSQL database name.",
    }),
});

const CreateConnection = ConnectionSchema.omit({ id: true });

export async function createConnection(prevState: State, formData: FormData) {
    const validatedFields = CreateConnection.safeParse({
        customer_id: formData.get("customer_id"),
        postgres_database: formData.get("postgres_database"),
        postgres_host: formData.get("postgres_host"),
        postgres_password: formData.get("postgres_password"),
        postgres_prisma_url: formData.get("postgres_prisma_url"),
        postgres_url: formData.get("postgres_url"),
        postgres_url_non_pooling: formData.get("postgres_url_non_pooling"),
        postgres_user: formData.get("postgres_user"),
    });

    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields. Failed to Create Connection.",
        };
    }

    // Prepare data for insertion into the database
    const {
        customer_id,
        postgres_database,
        postgres_host,
        postgres_password,
        postgres_prisma_url,
        postgres_url,
        postgres_url_non_pooling,
        postgres_user,
    } = validatedFields.data;

    try {
        await sql`
    INSERT INTO connections (
      customer_id,
      postgres_database,
      postgres_host,
      postgres_password,
      postgres_prisma_url,
      postgres_url,
      postgres_url_non_pooling,
      postgres_user
    ) VALUES (
      ${customer_id},
      ${postgres_database},
      ${postgres_host},
      ${postgres_password},
      ${postgres_prisma_url},
      ${postgres_url},
      ${postgres_url_non_pooling},
      ${postgres_user}
    )
  `;
    } catch (error) {
        return {
            message: "Database Error: Failed to Create Connection.",
        };
    }

    revalidatePath("/dashboard/connections");
    redirect("/dashboard/connections");
}

export async function deleteConnection(id: string) {
    try {
        await sql`DELETE FROM connections WHERE id = ${id}`;
        revalidatePath("/dashboard/connections");
        return { message: "Deleted Connection." };
    } catch (error) {
        return { message: "Database Error: Failed to Delete Invoice." };
    }
}

export async function createSchema(email: string) {
    console.log("createSchema");

    try {
        // await fetch(
        //     `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/create-schema`,
        //     {
        //         method: "POST",
        //         body: JSON.stringify(email),
        //         headers: {
        //             "Content-Type": "application/json",
        //         },
        //     }
        // );

        revalidatePath("/dashboard/connections");
        return { message: "Deleted Connection." };
    } catch (error) {
        console.log(error);
        return { message: "Database Error: Failed to Delete Invoice." };
    }
}
