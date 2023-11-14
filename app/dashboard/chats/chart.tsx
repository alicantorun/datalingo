import { BarChart, Card, DonutChart, LineChart, Title } from "@tremor/react";

const cities = [
  {
    name: "New York",
    sales: 9800,
  },
  {
    name: "London",
    sales: 4567,
  },
  {
    name: "Hong Kong",
    sales: 3908,
  },
  {
    name: "San Francisco",
    sales: 2400,
  },
  {
    name: "Singapore",
    sales: 1908,
  },
  {
    name: "Zurich",
    sales: 1398,
  },
];

type Data = {
  name: string;
  data: any;
};

const valueFormatter = (number: number) =>
  `$ ${new Intl.NumberFormat("us").format(number).toString()}`;

export const ChartComponent = ({ data }: { data: Data }) => {
  const renderChart = () => {
    switch (data.name) {
      case "get_pie_chart":
        return (
          <DonutChart
            className="mt-6"
            data={data?.data?.data}
            category="value"
            index="name"
            valueFormatter={valueFormatter}
            colors={["slate", "violet", "indigo", "rose", "cyan", "amber"]}
          />
        );
      case "get_line_chart":
        return (
          <LineChart
            className="mt-6"
            data={data?.data?.data}
            categories={["value"]}
            index="name"
            valueFormatter={valueFormatter}
            colors={["slate", "violet", "indigo", "rose", "cyan", "amber"]}
          />
        );
      case "get_bar_chart":
        return (
          <BarChart
            className="mt-6"
            data={data?.data?.data}
            categories={["value"]}
            index="name"
            valueFormatter={valueFormatter}
            colors={["slate", "violet", "indigo", "rose", "cyan", "amber"]}
          />
        );
      default:
        return <div>No chart type specified</div>;
    }
  };

  if (!data) {
    // Handle undefined data, maybe render a fallback UI
    return <div>No data available</div>;
  }

  return (
    <Card className="max-w-lg">
      <Title>Sales</Title>
      {renderChart()}
    </Card>
  );
};
