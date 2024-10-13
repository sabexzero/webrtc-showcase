import React from "react";
import { useGlobalStore } from "@store/store.ts";

interface ParamOptionProps {
    label: string;
    id: string;
    children?: React.ReactNode;
}

const ParamOption: React.FC<ParamOptionProps> = ({ id, children, label }) => {
    const isChecked = useGlobalStore((state) => state.params[id]);
    const toggleValue = useGlobalStore((state) => state.toggleParam);

    return (
        <div className="flex flex-col w-[250px]">
            <div>
                <input
                    id={id}
                    defaultChecked={isChecked}
                    type="checkbox"
                    onClick={() => toggleValue(id)}
                />
                <label htmlFor={id} className="text-black">
                    {label}
                </label>
            </div>
            {isChecked && <div className="flex flex-col gap-2">{children}</div>}
        </div>
    );
};

export default ParamOption;
