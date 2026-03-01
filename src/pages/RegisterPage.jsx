import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "", password: "", companyName: "", inn: ""
    });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);

    const validateForm = () => {
        const newErrors = {};

        // Валидация email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            newErrors.email = "Введите корректный email адрес";
        }

        // Валидация ИНН (только цифры, 10 или 12 символов)
        const innRegex = /^\d{10}$|^\d{12}$/;
        if (!innRegex.test(formData.inn)) {
            newErrors.inn = "ИНН должен содержать 10 или 12 цифр";
        }

        if (formData.password.length < 6) {
            newErrors.password = "Пароль должен содержать минимум 6 символов";
        }


        // Валидация названия компании
        if (formData.companyName.trim().length < 2) {
            newErrors.companyName = "Введите корректное название компании";
        }

        return newErrors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Правильное удаление ошибки из состояния
        if (errors[name]) {
            const newErrors = { ...errors };
            delete newErrors[name]; // Полностью стираем ключ из памяти!
            setErrors(newErrors);
        }

        if (serverError) {
            setServerError(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Валидация перед отправкой
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                // Обработка разных статусов ошибок
                if (response.status === 400) {
                    throw new Error(data.message || "Проверьте правильность заполнения формы");
                } else if (response.status === 409) {
                    throw new Error("Пользователь с таким email уже существует");
                } else {
                    throw new Error(data.message || "Ошибка регистрации");
                }
            }

            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);

            alert("Регистрация успешна!");
            navigate("/");

        } catch (err) {
            setServerError(err.message);
        }
    };

    return (
        <div className="container" style={{ maxWidth: "400px", marginTop: "100px" }}>
            <h2 className="section-title">Регистрация</h2>

            {serverError && (
                <div className="error-message" style={{ color: "red", marginBottom: "15px", padding: "10px", backgroundColor: "#ffeeee", borderRadius: "4px" }}>
                    {serverError}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div>
                    <input
                        type="text"
                        name="companyName"
                        placeholder="Название компании (ООО 'Ромашка')"
                        value={formData.companyName}
                        onChange={handleChange}
                        className={`form-input ${errors.companyName ? 'input-error' : ''}`}
                        required
                    />
                    {errors.companyName && <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>{errors.companyName}</div>}
                </div>

                <div>
                    <input
                        type="text"
                        name="inn"
                        placeholder="ИНН (10 или 12 цифр)"
                        value={formData.inn}
                        onChange={handleChange}
                        className={`form-input ${errors.inn ? 'input-error' : ''}`}
                        required
                        maxLength="12"
                        pattern="\d*"
                    />
                    {errors.inn && <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>{errors.inn}</div>}
                </div>

                <div>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`form-input ${errors.email ? 'input-error' : ''}`}
                        required
                    />
                    {errors.email && <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>{errors.email}</div>}
                </div>

                <div>
                    <input
                        type="password"
                        name="password"
                        placeholder="Пароль"
                        value={formData.password}
                        onChange={handleChange}
                        className={`form-input ${errors.password ? 'input-error' : ''}`}
                        minLength="6"
                        required
                    />
                    {errors.password && <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>{errors.password}</div>}
                </div>

                <button
                    type="submit"
                    className="btn btn-primary btn-large"
                    disabled={Object.keys(errors).length > 0}
                >
                    Зарегистрироваться
                </button>
            </form>

            <p style={{ marginTop: "20px", textAlign: "center" }}>
                Уже есть аккаунт? <Link to="/login">Войти</Link>
            </p>

            <style jsx>{`
                .input-error {
                    border-color: red !important;
                    background-color: #fff0f0;
                }
                .input-error:focus {
                    outline-color: red;
                }
                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default RegisterPage;