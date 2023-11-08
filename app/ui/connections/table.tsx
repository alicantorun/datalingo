import Image from "next/image";
// import { UpdateInvoice, DeleteInvoice } from '@/app/ui/connections/buttons';
// import InvoiceStatus from "@/app/ui/connections/status";
// import { formatDateToLocal, formatCurrency } from "@/app/lib/utils";
import { fetchFilteredConnections } from "@/app/lib/data";

export default async function InvoicesTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const connections = await fetchFilteredConnections(query, currentPage);

  return (
    <div className="mt-6 flow-root overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <div className="md:hidden">
            {connections?.map((connection) => (
              <div
                key={connection.id}
                className="mb-2 w-full rounded-md bg-white p-4"
              >
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="mb-2 flex items-center">
                      <p>{connection.postgres_database}</p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {connection.postgres_host}
                    </p>
                  </div>
                  {/* <InvoiceStatus status={connection.status} /> */}
                </div>
                <div className="flex w-full items-center justify-between pt-4">
                  <div>
                    <p className="text-xl font-medium">
                      {/* {formatCurrency(connection.amount)} */}
                    </p>
                    {/* <p>{formatDateToLocal(connection.date)}</p> */}
                  </div>
                  <div className="flex justify-end gap-2">
                    {/* <UpdateInvoice id={connection.id} />
                    <DeleteInvoice id={connection.id} /> */}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Customer
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  postgres_database
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  postgres_host
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  postgres_password
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  postgres_prisma_url
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  postgres_url
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  postgres_url_non_pooling
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  postgres_user
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {connections?.map((connection) => (
                <tr
                  key={connection.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  {/* Use `truncate` to cut off text and add ellipsis if it overflows */}
                  {/* Use `max-w-[size]` to set a maximum width for each cell */}
                  <td className="truncate max-w-xs py-3 pl-6 pr-3">
                    <p>{connection.customer_name}</p>
                  </td>
                  <td className="truncate max-w-xs py-3 pl-6 pr-3">
                    <p>{connection.postgres_database}</p>
                  </td>
                  <td className="truncate max-w-xs px-3 py-3">
                    {connection.postgres_host}
                  </td>
                  <td className="truncate max-w-xs px-3 py-3">
                    {connection.postgres_password}
                  </td>
                  <td className="truncate max-w-xs px-3 py-3">
                    {connection.postgres_prisma_url}
                  </td>
                  <td className="truncate max-w-xs px-3 py-3">
                    {connection.postgres_url}
                  </td>
                  <td className="truncate max-w-xs px-3 py-3">
                    {connection.postgres_url_non_pooling}
                  </td>
                  <td className="truncate max-w-xs px-3 py-3">
                    {connection.postgres_user}
                  </td>
                  {/* Remove whitespace-nowrap if you want to allow wrapping for amount and date */}
                  <td className="px-3 py-3">
                    {/* {formatCurrency(connection.amount)} */}
                  </td>
                  <td className="px-3 py-3">
                    {/* {formatDateToLocal(connection.date)} */}
                  </td>
                  <td className="px-3 py-3">
                    {/* <InvoiceStatus status={connection.status} /> */}
                  </td>
                  <td className="py-3 pl-6 pr-3">
                    <div className="flex justify-end gap-3">
                      {/* <UpdateInvoice id={connection.id} />
          <DeleteInvoice id={connection.id} /> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
