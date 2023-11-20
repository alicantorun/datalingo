import { BarChart, Card, DonutChart, LineChart, Title } from "@tremor/react";
import { ChartData } from "./chartAtom";

const valueFormatter = (number: number) =>
    `${new Intl.NumberFormat("us").format(number).toString()}`;

export const ChartComponent = ({ data }: { data: ChartData }) => {
    const renderChart = () => {
        switch (data.name) {
            case "get_bar_chart":
                return (
                    <BarChart
                        className="mt-6"
                        data={data.chartdata}
                        categories={data.categories || []}
                        index="value"
                        valueFormatter={valueFormatter}
                        colors={[
                            "slate",
                            "violet",
                            "indigo",
                            "rose",
                            "cyan",
                            "amber",
                        ]}
                    />
                );
            case "get_pie_chart":
                return (
                    <DonutChart
                        variant="donut"
                        className="mt-6"
                        data={data.chartdata}
                        category={data.category}
                        index="name"
                        valueFormatter={valueFormatter}
                        colors={[
                            "slate",
                            "violet",
                            "indigo",
                            "rose",
                            "cyan",
                            "amber",
                        ]}
                    />
                );
            case "get_line_chart":
                return (
                    <LineChart
                        className="mt-6"
                        data={data.chartdata}
                        categories={data.categories || []}
                        index="name"
                        valueFormatter={valueFormatter}
                        colors={[
                            "slate",
                            "violet",
                            "indigo",
                            "rose",
                            "cyan",
                            "amber",
                        ]}
                    />
                );

            default:
                return <div>No chart type specified</div>;
        }
    };

    if (!data) {
        return <div>No data available</div>;
    }

    return (
        <Card className="max-w-lg">
            <Title>Sales</Title>
            {renderChart()}
        </Card>
    );
};
