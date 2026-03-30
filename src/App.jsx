import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage";
import CreateOrderPage from "./pages/CreateOrderPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PaymentPage from "./pages/PaymentPage";
import CargoCalculatorPage from "./pages/CargoCalculatorPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from './pages/AdminPage';
function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/create-order" element={<CreateOrderPage />} />
          <Route path="/payment/create" element={<PaymentPage />} />
          <Route path="/login" element={<LoginPage />} />{" "}
          <Route path="/calculator" element={<CargoCalculatorPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
