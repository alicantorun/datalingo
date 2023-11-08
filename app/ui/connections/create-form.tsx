"use client";

import { CustomerField } from "@/app/lib/definitions";
import Link from "next/link";
import {
  CheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/app/ui/button";
import { createConnection } from "@/app/lib/actions";
import { useFormState } from "react-dom";

export default function Form({ customers }: { customers: CustomerField[] }) {
  const initialState = { message: null, errors: {} };
  const [state, dispatch] = useFormState(createConnection, initialState);

  return (
    <form action={dispatch}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Customer Name */}
        <div className="mb-4">
          <label
            htmlFor="customer_id"
            className="mb-2 block text-sm font-medium"
          >
            Choose customer
          </label>
          <div className="relative">
            <select
              id="customer_id"
              name="customer_id"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              defaultValue=""
              aria-describedby="customer-error"
            >
              <option value="" disabled>
                Select a customer
              </option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>
          {state.errors?.customerId ? (
            <div
              id="customer-error"
              aria-live="polite"
              className="mt-2 text-sm text-red-500"
            >
              {state.errors.customerId.map((error: string) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mb-4">
          <label
            htmlFor="postgres_database"
            className="mb-2 block text-sm font-medium"
          >
            Enter postgres database
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="postgres_database"
                name="postgres_database"
                type="text"
                placeholder=""
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>
        <div className="mb-4">
          <label
            htmlFor="postgres_host"
            className="mb-2 block text-sm font-medium"
          >
            Enter postgres host
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="postgres_host"
                name="postgres_host"
                type="text"
                placeholder=""
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>
        <div className="mb-4">
          <label
            htmlFor="postgres_password"
            className="mb-2 block text-sm font-medium"
          >
            Enter postgres password
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="postgres_password"
                name="postgres_password"
                type="text"
                placeholder=""
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>
        <div className="mb-4">
          <label
            htmlFor="postgres_prisma_url"
            className="mb-2 block text-sm font-medium"
          >
            Enter postgres prisma url
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="postgres_prisma_url"
                name="postgres_prisma_url"
                type="text"
                placeholder=""
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>
        <div className="mb-4">
          <label
            htmlFor="postgres_url"
            className="mb-2 block text-sm font-medium"
          >
            Enter postgres url
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="postgres_url"
                name="postgres_url"
                type="text"
                placeholder=""
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>
        <div className="mb-4">
          <label
            htmlFor="postgres_url_non_pooling"
            className="mb-2 block text-sm font-medium"
          >
            Enter postgres url non pooling
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="postgres_url_non_pooling"
                name="postgres_url_non_pooling"
                type="text"
                placeholder=""
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>
        <div className="mb-4">
          <label
            htmlFor="postgres_user"
            className="mb-2 block text-sm font-medium"
          >
            Enter postgres user
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="postgres_user"
                name="postgres_user"
                type="text"
                placeholder=""
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>
        {state.errors ? (
          <div
            id="status-error"
            aria-live="polite"
            className="mt-2 text-sm text-red-500"
          >
            <p key={state.message}>{state.message}</p>
          </div>
        ) : null}
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/invoices"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">Create Connection</Button>
      </div>
    </form>
  );
}
