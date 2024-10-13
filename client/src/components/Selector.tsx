import React from "react";
import useParamValues from "@hooks/useParamValues";

interface SelectorProps {
    values: string[];
    id: string;
    defaultValue?: string;
}

const Selector: React.FC<SelectorProps> = ({ defaultValue, values, id }) => {
    const { params, setParam } = useParamValues();

    const handleOnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setParam(id, e.target.value);
    };

    return (
        <select value={params[id] || defaultValue} onChange={handleOnChange}>
            {values.map((v, ind) => (
                <option key={ind}>{v}</option>
            ))}
        </select>
    );
};

export default Selector;
