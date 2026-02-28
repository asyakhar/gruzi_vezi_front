import React from "react";
// Обязательно добавляем импорты для роутера
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Импорты твоих страниц (проверь, чтобы пути совпадали с твоей структурой папок)
import MainPage from "./pages/MainPage";
import CreateOrderPage from "./pages/CreateOrderPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PaymentPage from "./pages/PaymentPage";

function App() {
  return (
    // Оборачиваем всё в один корневой div
    <div className="App">
      <Router>
        <Routes>
          {/* Роутер сам решит, какую из этих страниц показать */}
          <Route path="/" element={<MainPage />} />
          <Route path="/create-order" element={<CreateOrderPage />} />
          <Route path="/payment/create" element={<PaymentPage />} />
          <Route path="/login" element={<LoginPage />} />{" "}
          {/* <-- Роут логина */}
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
