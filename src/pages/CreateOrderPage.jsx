import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MainPage.css"; // Можешь создать отдельный CSS, но пока возьмем стили отсюда

const CreateOrderPage = () => {
    const navigate = useNavigate();

    // Состояние для хранения данных формы
    const [formData, setFormData] = useState({
        departureStation: "",
        destinationStation: "",
        requestedWagonType: "крытый", // Значение по умолчанию
        cargoType: "STANDARD",
        weightKg: "",
        volumeM3: "",
        packagingType: "CONTAINER",
    });

    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    // Обработчик изменения полей
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Отправка формы на бэкенд
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);

        // Собираем JSON в том виде, в котором его ждет наш бэкенд (DTO)
        const payload = {
            departureStation: formData.departureStation,
            destinationStation: formData.destinationStation,
            requestedWagonType: formData.requestedWagonType,
            cargo: {
                cargoType: formData.cargoType,
                weightKg: Number(formData.weightKg),
                volumeM3: Number(formData.volumeM3),
                packagingType: formData.packagingType,
            }
        };

        try {
            // Достаем токен из памяти браузера (предполагается, что при логине мы его туда сохранили)
            const token = localStorage.getItem("accessToken");

            const response = await fetch("http://localhost:8080/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` // Передаем токен охраннику Spring Security
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                if (response.status === 403 || response.status === 401) {
                    throw new Error("Сессия истекла. Пожалуйста, авторизуйтесь заново.");
                }

                // Пытаемся прочитать подробности ошибки от бэкенда
                const errorData = await response.json().catch(() => null);

                if (errorData) {
                    // Если это наша ErrorResponse (с полем message)
                    if (errorData.message) {
                        throw new Error(errorData.message);
                    }
                    // Если это ошибки валидации полей (Map<String, String>)
                    else {
                        // Собираем все ошибки полей в одну красивую строку
                        const fieldErrors = Object.entries(errorData)
                            .map(([field, msg]) => `• ${msg}`)
                            .join("\n");
                        throw new Error(`Пожалуйста, исправьте ошибки:\n${fieldErrors}`);
                    }
                }
                throw new Error("Произошла неизвестная ошибка при создании заявки.");
            }

            const data = await response.json();
            setMessage(`Успешно! Номер вашей заявки: ${data.orderId}`);

            // Очищаем форму после успеха
            setFormData({
                departureStation: "", destinationStation: "", requestedWagonType: "COVERED",
                cargoType: "STANDARD", weightKg: "", volumeM3: "", packagingType: "CONTAINER"
            });

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="main-page">
            <header className="header">
                <div className="container header-container">
                    <div className="logo" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
                        <span className="logo-text">ОАО «РЖД» | Личный кабинет</span>
                    </div>
                    <button className="btn btn-outline" onClick={() => navigate("/")}>На главную</button>
                </div>
            </header>

            <main className="container" style={{ padding: "40px 0", maxWidth: "800px" }}>
                <h2 className="section-title" style={{ textAlign: "left", marginBottom: "30px" }}>
                    Оформление заявки на перевозку
                </h2>

                {message && <div style={{ padding: "15px", background: "#d4edda", color: "#155724", marginBottom: "20px", borderRadius: "5px" }}>{message}</div>}
                {error && <div style={{ padding: "15px", background: "#f8d7da", color: "#721c24", marginBottom: "20px", borderRadius: "5px" }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                    <div style={{ display: "flex", gap: "20px" }}>
                        <div style={{ flex: 1 }}>
                            <label>Станция отправления *</label>
                            <input type="text" name="departureStation" value={formData.departureStation} onChange={handleChange} className="form-input" required />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label>Станция назначения *</label>
                            <input type="text" name="destinationStation" value={formData.destinationStation} onChange={handleChange} className="form-input" required />
                        </div>
                    </div>

                    <div>
                        <label>Груз по ЕТСНГ (Тип груза) *</label>
                        <select name="cargoType" value={formData.cargoType} onChange={handleChange} className="form-input" required>
                            <option value="STANDARD">Стандартный (штучный)</option>
                            <option value="BULK">Сыпучий</option>
                            <option value="LIQUID">Наливной</option>
                            <option value="DANGEROUS">Опасный груз</option>
                            <option value="FRAGILE">Хрупкий</option>
                            <option value="OVERSIZED">Негабаритный</option>
                        </select>
                    </div>

                    <div style={{ display: "flex", gap: "20px" }}>
                        <div style={{ flex: 1 }}>
                            <label>Объём груза (м3) *</label>
                            <input type="number" min="1" name="volumeM3" value={formData.volumeM3} onChange={handleChange} className="form-input" required />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label>Вес груза (кг) *</label>
                            <input type="number" min="1" name="weightKg" value={formData.weightKg} onChange={handleChange} className="form-input" required />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "20px" }}>
                        <div style={{ flex: 1 }}>
                            <label>Тип упаковки *</label>
                            <select name="packagingType" value={formData.packagingType} onChange={handleChange} className="form-input" required>
                                <option value="CONTAINER">Контейнер</option>
                                <option value="TANK">Цистерна</option>
                                <option value="PALLET">Паллеты</option>
                                <option value="BOX">Коробки</option>
                                <option value="NONE">Без упаковки</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label>Род вагонов *</label>
                            {/* Значения value должны совпадать с твоим WagonType.java */}
                            <select name="requestedWagonType" value={formData.requestedWagonType} onChange={handleChange} className="form-input" required>
                                <option value="крытый">Крытый вагон</option>
                                <option value="полувагон">Полувагон</option>
                                <option value="цистерна">Цистерна</option>
                                <option value="платформа">Платформа</option>
                                <option value="рефрижератор">Рефрижератор</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-large" style={{ alignSelf: "flex-start", marginTop: "10px" }}>
                        Создать заявку
                    </button>
                </form>
            </main>
        </div>
    );
};

export default CreateOrderPage;