import React, { useState } from "react";
import { v4 as uuid } from "uuid";

interface MediaSelectorOptions {
    label: string;
    value: string;
}

interface MediaSelectorProps {
    placeholder: string;
    options: MediaSelectorOptions[];
    onSelect: (value: string) => void;
}

const MediaSelector: React.FC<MediaSelectorProps> = ({
    placeholder,
    options,
    onSelect,
}) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [selectedOption, setSelectedOption] = useState<string>("");

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleOptionClick = (option: MediaSelectorOptions) => {
        setSelectedOption(option.label);
        onSelect(option.value);
        setIsOpen(false);
    };

    return (
        <div className="dropdown-container" tabIndex={0}>
            <div className="dropdown-header" onClick={toggleDropdown}>
                <div className="dropdown-option-selected">
                    <span className="flex flex-row flex-wrap gap-2 text-[20px] font-medium">
                        {selectedOption || placeholder}
                    </span>
                </div>
            </div>
            {isOpen && (
                <ul className="dropdown-list max-h-[20vh] overflow-x-hidden break-words">
                    {options.map((option) => (
                        <li
                            key={uuid()}
                            className="dropdown-option"
                            onClick={() => handleOptionClick(option)}
                        >
                            <span>{option.label}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default MediaSelector;
