import Form from "@/app/ui/connections/create-form";
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import { fetchCustomers } from "@/app/lib/data";

export default async function Page() {
  const customers = await fetchCustomers();

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Connections", href: "/dashboard/connections" },
          {
            label: "Create Connection",
            href: "/dashboard/connections/create",
            active: true,
          },
        ]}
      />
      <Form customers={customers} />
    </main>
  );
}
