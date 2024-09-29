import React, { useState } from "react";

interface ParamOptionProps {
    label: string;
    id: string;
    children?: React.ReactNode;
    defaultChecked?: boolean;
}

// Придумать как передавать в контекст

const ParamOption: React.FC<ParamOptionProps> = ({
    id,
    children,
    label,
    defaultChecked = false
}) => {
    const [isChecked, setIsChecked] = useState(defaultChecked);

    return (
        <div className="flex flex-col w-[250px]">
            <div>
                <input
                    id={id}
                    defaultChecked={isChecked}
                    type="checkbox"
                    onClick={() => setIsChecked(prevState => !prevState)}
                />
                <label htmlFor={id} className="text-black">{label}</label>
            </div>
            {isChecked && (
                <div className="flex flex-col gap-2">
                    {children}
                </div>
            )}
        </div>
    )
}

export default ParamOption;