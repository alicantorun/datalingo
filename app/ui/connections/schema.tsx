"use client";

import React, { useState, useEffect } from "react";

// Define a type for the component props
interface DataParserProps {
    dataString: string;
}

const DataParser: React.FC<DataParserProps> = ({ dataString }) => {
    const [parsedData, setParsedData] = useState<string[]>([]);

    useEffect(() => {
        parseData();
    }, [dataString]);

    const parseData = () => {
        // Split the string by new lines and filter out empty lines
        const lines = dataString
            .split("\n")
            .filter((line) => line.trim() !== "");
        setParsedData(lines);
    };

    return (
        <div className="p-4 bg-gray-50 rounded-md">
            {parsedData.map((line, index) => (
                <p className="mb-1 border-b-2" key={index}>
                    {line}
                </p>
            ))}
        </div>
    );
};

export default DataParser;
