import React from "react";
// Обязательно добавляем импорты для роутера
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Импорты твоих страниц (проверь, чтобы пути совпадали с твоей структурой папок)
import MainPage from "./pages/MainPage";
import CreateOrderPage from "./pages/CreateOrderPage"; // или откуда ты его сохранила

function App() {
  return (
    // Оборачиваем всё в один корневой div
    <div className="App">
      <Router>
        <Routes>
          {/* Роутер сам решит, какую из этих страниц показать */}
          <Route path="/" element={<MainPage />} />
          <Route path="/create-order" element={<CreateOrderPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;