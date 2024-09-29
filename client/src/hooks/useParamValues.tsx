import { useContext } from "react"
import { ParamContext } from "../providers/ParamContext"

const useParamValues = () => {
    const context = useContext(ParamContext);
    if (!context) {
        throw new Error("Cannot find context!");
    }

    return context;
}

export default useParamValues;