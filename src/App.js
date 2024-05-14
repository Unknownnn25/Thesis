import { Route, Routes, BrowserRouter } from "react-router-dom";
import "./App.css"
import Home from "./home";
import About from "./about";
import Contact from "./contacts";
import Navigate from "./navbar";
import Object from "./object";
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate />}>
          <Route path="Home" element={<Home />} />
          <Route path="About" element={<About />} />
          <Route path="Contact" element={<Contact />} />
          <Route path="Object" element={<Object />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}
export default App;