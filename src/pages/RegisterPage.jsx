import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "", password: "", companyName: "", inn: ""
    });
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const response = await fetch("http://localhost:8080/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Ошибка регистрации. Возможно, email уже занят.");
            }

            const data = await response.json();

            // Сразу авторизуем пользователя после регистрации
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);

            alert("Регистрация успешна!");
            navigate("/"); // Перебрасываем на главную

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container" style={{ maxWidth: "400px", marginTop: "100px" }}>
            <h2 className="section-title">Регистрация</h2>
            {error && <div style={{ color: "red", marginBottom: "15px" }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <input
                    type="text" name="companyName" placeholder="Название компании (ООО 'Ромашка')"
                    value={formData.companyName} onChange={handleChange}
                    className="form-input" required
                />
                <input
                    type="text" name="inn" placeholder="ИНН"
                    value={formData.inn} onChange={handleChange}
                    className="form-input" required
                />
                <input
                    type="email" name="email" placeholder="Email"
                    value={formData.email} onChange={handleChange}
                    className="form-input" required
                />
                <input
                    type="password" name="password" placeholder="Пароль"
                    value={formData.password} onChange={handleChange}
                    className="form-input" required
                />
                <button type="submit" className="btn btn-primary btn-large">Зарегистрироваться</button>
            </form>

            <p style={{ marginTop: "20px", textAlign: "center" }}>
                Уже есть аккаунт? <Link to="/login">Войти</Link>
            </p>
        </div>
    );
};

export default RegisterPage;