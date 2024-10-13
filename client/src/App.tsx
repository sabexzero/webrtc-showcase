import "./App.css";

import MainPage from "@pages/MainPage";
import { ParamProvider } from "@providers/ParamContext";

function App() {
    return (
        <ParamProvider>
            <MainPage />
        </ParamProvider>
    );
}

export default App;
