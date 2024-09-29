import React from "react";

interface StyledStartButtonProps {
    state: boolean;
    toggleState: (state: boolean) => void;
    start: () => Promise<void>;
    stop: () => void;
}

const StyledStartButton: React.FC<StyledStartButtonProps> = ({
    state,
    toggleState,
    start,
    stop,
}) => {
    const onClick = () => {
        if (!state && start) {
            start();
        } else {
            if (stop) stop();
        }
        toggleState(!state);
    };

    return (
        <div
            className="px-4 py-2 rounded-lg text-center bg-[#182631] w-[250px]"
            onClick={onClick}
        >
            <button className="text-[#8CB4FF]">
                {state ? `Stop` : `Start`}
            </button>
        </div>
    );
};

export default StyledStartButton;
