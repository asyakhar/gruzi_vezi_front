import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const LoginPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const response = await fetch("http://localhost:8080/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Неверный email или пароль");
            }

            const data = await response.json();

            // МАГИЯ ЗДЕСЬ: Сохраняем токены в память браузера!
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);

            alert("Вы успешно вошли!");
            navigate("/"); // Перебрасываем на главную страницу

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container" style={{ maxWidth: "400px", marginTop: "100px" }}>
            <h2 className="section-title">Вход в систему</h2>
            {error && <div style={{ color: "red", marginBottom: "15px" }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <input
                    type="email" name="email" placeholder="Email"
                    value={formData.email} onChange={handleChange}
                    className="form-input login-input" required
                />
                <input
                    type="password" name="password" placeholder="Пароль"
                    value={formData.password} onChange={handleChange}
                    className="form-input login-input" required
                />
                <button type="submit" className="btn btn-primary btn-large">Войти</button>
            </form>

            <p style={{ marginTop: "20px", textAlign: "center" }}>
                Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
            </p>
        </div>
    );
};

export default LoginPage;