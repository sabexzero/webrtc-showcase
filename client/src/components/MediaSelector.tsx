import React from "react";

interface MediaSelectorOptions {
    label: string;
    value: string;
}

interface MediaSelectorProps {
    options: MediaSelectorOptions[];
    onSelect: (value: string) => void;
}

const MediaSelector: React.FC<MediaSelectorProps> = ({ options, onSelect }) => {
    const handleOptionClick = (option: MediaSelectorOptions) => {
        onSelect(option.value);
    };

    return (
        <>
            <select>
                {options.map((v, ind) => (
                    <option onClick={() => handleOptionClick(v)} key={ind}>
                        {v.label}
                    </option>
                ))}
            </select>
        </>
    );
};

export default MediaSelector;
