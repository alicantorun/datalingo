const { db } = require("@vercel/postgres");
const ExcelJS = require("exceljs");

async function seedSalesData(client) {
  try {
    // Create the "sales_data" table if it doesn't exist
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sales_data (
          order_id VARCHAR(255) PRIMARY KEY,
          order_date DATE,
          ship_date DATE,
          aging INT,
          ship_mode VARCHAR(255),
          product_category VARCHAR(255),
          product VARCHAR(255),
          sales NUMERIC,
          quantity INT,
          discount NUMERIC,
          profit NUMERIC,
          shipping_cost NUMERIC,
          order_priority VARCHAR(255),
          customer_id VARCHAR(255),
          customer_name VARCHAR(255),
          segment VARCHAR(255),
          city VARCHAR(255),
          state VARCHAR(255),
          country VARCHAR(255),
          region VARCHAR(255),
          months VARCHAR(255)
        );
      `;
    await client.query(createTableQuery);
    console.log('Created "sales_data" table');

    // Read data from Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(
      "/Users/alicantorun/Documents/Repos/nextjs-dashboard/sales.xlsx"
    );
    const worksheet = workbook.getWorksheet("Sales Data");
    const salesData = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber !== 1) {
        salesData.push({
          order_id: row.getCell(1).text,
          order_date: row.getCell(2).value,
          ship_date: row.getCell(3).value,
          aging: row.getCell(4).value,
          ship_mode: row.getCell(5).value,
          product_category: row.getCell(6).value,
          product: row.getCell(7).value,
          sales: row.getCell(8).value,
          quantity: row.getCell(9).value,
          discount: row.getCell(10).value,
          profit: row.getCell(11).value,
          shipping_cost: row.getCell(12).value,
          order_priority: row.getCell(13).value,
          customer_id: row.getCell(14).value,
          customer_name: row.getCell(15).value,
          segment: row.getCell(16).value,
          city: row.getCell(17).value,
          state: row.getCell(18).value,
          country: row.getCell(19).value,
          region: row.getCell(20).value,
          months: row.getCell(21).value,
        });
      }
    });

    // Insert data into the "sales_data" table
    for (const data of salesData) {
      const insertQuery = `
          INSERT INTO sales_data (
            order_id, order_date, ship_date, aging, ship_mode, 
            product_category, product, sales, quantity, discount, 
            profit, shipping_cost, order_priority, customer_id, 
            customer_name, segment, city, state, country, region, months
          )
          VALUES (
            $1, $2, $3, $4, $5, 
            $6, $7, $8, $9, $10, 
            $11, $12, $13, $14, $15, 
            $16, $17, $18, $19, $20, $21
          )
          ON CONFLICT (order_id) DO NOTHING;
        `;
      await client.query(insertQuery, [
        data.order_id,
        data.order_date,
        data.ship_date,
        data.aging,
        data.ship_mode,
        data.product_category,
        data.product,
        data.sales,
        data.quantity,
        data.discount,
        data.profit,
        data.shipping_cost,
        data.order_priority,
        data.customer_id,
        data.customer_name,
        data.segment,
        data.city,
        data.state,
        data.country,
        data.region,
        data.months,
      ]);
    }

    console.log(`Seeded sales data`);
  } catch (error) {
    console.error("Error seeding sales data:", error);
    throw error;
  }
}

async function main() {
  const client = await db.connect();

  await seedSalesData(client);
  await client.end();
}

main().catch((err) => {
  console.error(
    "An error occurred while attempting to seed the database:",
    err
  );
});
