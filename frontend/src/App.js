import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Campanas from "@/pages/Campanas";
import TipoCampana from "@/pages/TipoCampana";
import Inmobiliaria from "@/pages/Inmobiliaria";
import Asistente from "@/pages/Asistente";
import Campana from "@/pages/Campana";
import Conocimiento from "@/pages/Conocimiento";
import Prompts from "@/pages/Prompts";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/campanas" element={<Campanas />} />
        <Route path="/nueva/tipo" element={<TipoCampana />} />
        <Route path="/nueva/inmobiliaria/:campanaId" element={<Inmobiliaria />} />
        <Route path="/asistente/:campanaId" element={<Asistente />} />
        <Route path="/campana/:campanaId" element={<Campana />} />
        <Route path="/conocimiento" element={<Conocimiento />} />
        <Route path="/prompts" element={<Prompts />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
