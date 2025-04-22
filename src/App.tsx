import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Scenarios from "./pages/Scenarios";
import BaselineScenarios from "./pages/BaselineScenarios";
import Test from "./pages/Test";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scenarios" element={<Scenarios />} />
        {/*<Route path="/baseline" element={<BaselineScenarios />} />*/}
        {/*<Route path="/test" element={<Test />} /> */}
      </Routes>
    </Router >
  );
}

export default App;
