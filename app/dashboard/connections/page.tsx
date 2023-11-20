import Pagination from "@/app/ui/invoices/pagination";
import Search from "@/app/ui/search";
import Table from "@/app/ui/connections/table";
import { CreateConnection } from "@/app/ui/connections/buttons";
import { CreateSchema } from "@/app/ui/connections/create-schema";
import { lusitana } from "@/app/ui/fonts";
import { InvoicesTableSkeleton } from "@/app/ui/skeletons";
import { Suspense } from "react";
import { fetchConnectionsPages, getSchema } from "@/app/lib/data";
import { Metadata } from "next";
import { auth } from "@/auth";
import DataParser from "@/app/ui/connections/schema";

export const metadata: Metadata = {
    title: "Connections",
};
export default async function Page({
    searchParams,
}: {
    searchParams?: {
        query?: string;
        page?: string;
    };
}) {
    const query = searchParams?.query || "";
    const currentPage = Number(searchParams?.page) || 1;
    const totalPages = await fetchConnectionsPages(query);
    const session = await auth();
    const schema = await getSchema(session?.user?.email ?? "");

    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between">
                <h1 className={`${lusitana.className} text-2xl`}>
                    Connections
                </h1>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
                <Search placeholder="Search connections..." />
                <CreateConnection />
            </div>
            <Suspense
                key={query + currentPage}
                fallback={<InvoicesTableSkeleton />}
            >
                <Table query={query} currentPage={currentPage} />
            </Suspense>
            <div className="">
                <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
                    <h1 className={`${lusitana.className} text-2xl mt-4`}>
                        Schema
                    </h1>
                    <CreateSchema email={session?.user?.email ?? ""} />
                </div>
                <DataParser dataString={schema} />
            </div>
            <div className="mt-5 flex w-full justify-center">
                <Pagination totalPages={totalPages} />
            </div>
        </div>
    );
}
