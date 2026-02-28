import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MainPage.css";
import "./WagonSearchResult.css";
import { fetchWithAuth } from "../api";

const CreateOrderPage = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        departureStation: "",
        destinationStation: "",
        requestedWagonType: "крытый",
        cargoType: "Электроника", // Изменил на русские названия
        weightKg: "",
        volumeM3: "",
        packagingType: "Паллеты", // Изменил на русские
    });

    const [orderId, setOrderId] = useState(null);
    const [wagons, setWagons] = useState([]);
    const [selectedWagon, setSelectedWagon] = useState(null);
    const [fullPrice, setFullPrice] = useState(null);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // ШАГ 1: Создание заявки
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        setWagons([]);
        setSelectedWagon(null);
        setFullPrice(null);
        setLoading(true);

        const payload = {
            departureStation: formData.departureStation,
            destinationStation: formData.destinationStation,
            requestedWagonType: formData.requestedWagonType,
            cargo: {
                cargoType: formData.cargoType,
                weightKg: Number(formData.weightKg),
                volumeM3: Number(formData.volumeM3),
                packagingType: formData.packagingType,
            },
        };

        try {
            const response = await fetchWithAuth("http://localhost:8080/api/orders", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            //   const token = localStorage.getItem("accessToken");

            //   const response = await fetch("http://localhost:8080/api/orders", {
            //     method: "POST",
            //     headers: {
            //       "Content-Type": "application/json",
            //       Authorization: `Bearer ${token}`,
            //     },
            //     body: JSON.stringify(payload),
            //   });

            if (!response.ok) throw new Error("Ошибка при создании заявки");

            const data = await response.json();

            // ЛОГИРУЕМ ЧТО ПРИШЛО С СЕРВЕРА
            console.log("Ответ от сервера:", data);

            // ИСПРАВЛЕНО: проверяем разные возможные имена поля
            let newOrderId = null;

            if (data.id) {
                newOrderId = data.id;
            } else if (data.orderId) {
                newOrderId = data.orderId;
            } else if (data.order_id) {
                newOrderId = data.order_id;
            } else {
                console.error("Неизвестный формат ответа:", data);
                throw new Error("Сервер вернул данные в неожиданном формате");
            }

            setOrderId(newOrderId);
            setMessage(
                ` Заявка №${newOrderId.slice(0, 8)} создана! Ищем подходящие вагоны...`
            );

            // ШАГ 2: Автоматически ищем вагоны после создания заявки
            await searchWagons(newOrderId);
        } catch (err) {
            setError(err.message);
            console.error("Ошибка:", err);
        } finally {
            setLoading(false);
        }
    };

    // ШАГ 2: Поиск вагонов
    const searchWagons = async (orderId) => {
        setCalculating(true);
        try {
            const token = localStorage.getItem("accessToken");

            const searchPayload = {
                orderId: orderId,
                departureStation: formData.departureStation,
                arrivalStation: formData.destinationStation,
                weightKg: Number(formData.weightKg),
                volumeM3: Number(formData.volumeM3),
                cargoType: formData.cargoType,
                preferredWagonType: formData.requestedWagonType,
                allowAlternativeStations: true,
            };

            const response = await fetch(
                "http://localhost:8080/api/dispatcher/wagons/search",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(searchPayload),
                }
            );

            if (!response.ok) throw new Error("Ошибка при поиске вагонов");

            const data = await response.json();
            setWagons(data);

            if (data.length > 0) {
                setMessage(`Найдено ${data.length} подходящих вагонов`);
            } else {
                setMessage("Вагонов не найдено. Попробуйте изменить параметры");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setCalculating(false);
        }
    };

    // ШАГ 3: Расчет полной стоимости для выбранного вагона
    const calculateFullPrice = async (wagonId) => {
        setCalculating(true);
        try {
            const token = localStorage.getItem("accessToken");

            const response = await fetch(
                `http://localhost:8080/api/dispatcher/pricing/full?orderId=${orderId}&wagonId=${wagonId}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) throw new Error("Ошибка при расчете стоимости");

            const data = await response.json();
            setFullPrice(data);

            // Находим выбранный вагон
            const wagon = wagons.find((w) => w.wagonId === wagonId);
            setSelectedWagon({ ...wagon, price: data });
        } catch (err) {
            setError(err.message);
        } finally {
            setCalculating(false);
        }
    };

    // ШАГ 4: Резервирование вагона
    const reserveWagon = async (wagonId) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");

            const response = await fetch(
                `http://localhost:8080/api/dispatcher/wagons/${wagonId}/reserve?orderId=${orderId}&minutes=30`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) throw new Error("Ошибка при резервировании");

            const result = await response.text();
            setMessage(` ${result}. Переходите к оплате.`);

            // Переход к оплате через 2 секунды
            setTimeout(() => {
                navigate(`/payment/create?orderId=${orderId}&wagonId=${wagonId}`);
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getMatchClass = (percentage) => {
        if (percentage >= 90) return "match-ideal";
        if (percentage >= 75) return "match-good";
        if (percentage >= 60) return "match-ok";
        return "match-poor";
    };

    return (
        <div className="main-page">
            {/* ПОЛНАЯ ШАПКА КАК НА ГЛАВНОЙ СТРАНИЦЕ */}
            <header className="header">
                <div className="container header-container">
                    <div
                        className="logo"
                        onClick={() => navigate("/")}
                        style={{ cursor: "pointer" }}
                    >
                        <img src="/logo.png" alt="РЖД Логотип" />
                        <span className="logo-text">ОАО «РЖД» | Личный кабинет</span>
                    </div>
                    <nav className="main-nav">
                        <ul className="nav-list">
                            <li>
                                <a href="#" className="active">
                                    Грузовые перевозки
                                </a>
                            </li>
                        </ul>
                    </nav>
                    <div className="header-actions">
                        <button className="btn btn-outline" onClick={() => navigate("/")}>
                            На главную
                        </button>
                    </div>
                </div>
            </header>

            <main
                className="container"
                style={{
                    padding: "40px 0",
                    maxWidth: "1000px",
                    margin: "0 auto",
                    minHeight:
                        "calc(100vh - 80px - 300px)" /* 80px - высота шапки, 300px - примерная высота подвала */,
                }}
            >
                <h2
                    className="section-title"
                    style={{ textAlign: "left", marginBottom: "30px" }}
                >
                    Оформление заявки на перевозку
                </h2>

                {message && (
                    <div
                        style={{
                            padding: "15px",
                            background: message.includes("") ? "#d4edda" : "#fff3cd",
                            color: message.includes("") ? "#155724" : "#856404",
                            marginBottom: "20px",
                            borderRadius: "5px",
                        }}
                    >
                        {message}
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            padding: "15px",
                            background: "#f8d7da",
                            color: "#721c24",
                            marginBottom: "20px",
                            borderRadius: "5px",
                        }}
                    >
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    style={{ display: "flex", flexDirection: "column", gap: "20px" }}
                >
                    <div style={{ display: "flex", gap: "20px" }}>
                        <div style={{ flex: 1 }}>
                            <label>Станция отправления *</label>
                            <input
                                type="text"
                                name="departureStation"
                                value={formData.departureStation}
                                onChange={handleChange}
                                className="form-input"
                                required
                                placeholder="Москва-Товарная"
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label>Станция назначения *</label>
                            <input
                                type="text"
                                name="destinationStation"
                                value={formData.destinationStation}
                                onChange={handleChange}
                                className="form-input"
                                required
                                placeholder="Екатеринбург-Товарный"
                            />
                        </div>
                    </div>

                    <div>
                        <label>Тип груза *</label>
                        <select
                            name="cargoType"
                            value={formData.cargoType}
                            onChange={handleChange}
                            className="form-input"
                            required
                        >
                            <option value="Электроника">Электроника</option>
                            <option value="Уголь">Уголь</option>
                            <option value="Нефть">Нефть</option>
                            <option value="Металл">Металл</option>
                            <option value="Лес">Лес</option>
                            <option value="Оборудование">Оборудование</option>
                            <option value="Зерно">Зерно</option>
                            <option value="Химия">Химия</option>
                            <option value="Контейнеры">Контейнеры</option>
                            <option value="Трубы_стальные">Трубы стальные</option>
                        </select>
                    </div>

                    <div style={{ display: "flex", gap: "20px" }}>
                        <div style={{ flex: 1 }}>
                            <label>Объём груза (м³) *</label>
                            <input
                                type="number"
                                min="1"
                                name="volumeM3"
                                value={formData.volumeM3}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label>Вес груза (кг) *</label>
                            <input
                                type="number"
                                min="1"
                                name="weightKg"
                                value={formData.weightKg}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "20px" }}>
                        <div style={{ flex: 1 }}>
                            <label>Тип упаковки *</label>
                            <select
                                name="packagingType"
                                value={formData.packagingType}
                                onChange={handleChange}
                                className="form-input"
                                required
                            >
                                <option value="Паллеты">Паллеты</option>
                                <option value="Ящики">Ящики</option>
                                <option value="Мешки">Мешки</option>
                                <option value="Бочки">Бочки</option>
                                <option value="Контейнеры">Контейнеры</option>
                                <option value="Без_упаковки">Без упаковки</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label>Род вагонов *</label>
                            <select
                                name="requestedWagonType"
                                value={formData.requestedWagonType}
                                onChange={handleChange}
                                className="form-input"
                                required
                            >
                                <option value="крытый">Крытый вагон</option>
                                <option value="полувагон">Полувагон</option>
                                <option value="цистерна">Цистерна</option>
                                <option value="платформа">Платформа</option>
                                <option value="рефрижератор">Рефрижератор</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-large"
                        style={{ alignSelf: "flex-start", marginTop: "10px" }}
                        disabled={loading}
                    >
                        {loading ? "Создание..." : "Создать заявку"}
                    </button>
                </form>

                {/* Результаты поиска вагонов */}
                {wagons.length > 0 && (
                    <div className="wagon-search-result">
                        <h3>Доступные вагоны</h3>

                        {calculating && (
                            <div className="loading-spinner">Расчет стоимости...</div>
                        )}

                        {wagons.map((wagon) => (
                            <div
                                key={wagon.wagonId}
                                className={`wagon-card ${selectedWagon?.wagonId === wagon.wagonId ? "recommended" : ""
                                    }`}
                            >
                                <div className="wagon-header">
                                    <span className="wagon-type">
                                        Вагон {wagon.wagonNumber} ({wagon.wagonType})
                                    </span>
                                    <span
                                        className={`match-badge ${getMatchClass(
                                            wagon.matchPercentage
                                        )}`}
                                    >
                                        {wagon.recommendation} ({wagon.matchPercentage}%)
                                    </span>
                                </div>

                                <div className="wagon-details">
                                    <div className="detail-item">
                                        <div className="detail-label">Грузоподъемность</div>
                                        <div className="detail-value">{wagon.maxWeightKg} кг</div>
                                    </div>
                                    <div className="detail-item">
                                        <div className="detail-label">Объем</div>
                                        <div className="detail-value">{wagon.maxVolumeM3} м³</div>
                                    </div>
                                    <div className="detail-item">
                                        <div className="detail-label">Станция</div>
                                        <div className="detail-value">{wagon.currentStation}</div>
                                    </div>
                                    <div className="detail-item">
                                        <div className="detail-label">Статус</div>
                                        <div className="detail-value">
                                            {wagon.availabilityStatus}
                                        </div>
                                    </div>
                                </div>

                                {wagon.distanceToStation > 0 && (
                                    <div className="distance-warning">
                                        ⚠️ Вагон на станции {wagon.currentStation} (подача через{" "}
                                        {wagon.estimatedArrivalHours} ч)
                                    </div>
                                )}

                                {selectedWagon?.wagonId === wagon.wagonId && fullPrice && (
                                    <div className="services-list">
                                        <h4>Дополнительные услуги:</h4>
                                        {fullPrice.recommendedServices.map((service, idx) => (
                                            <div key={idx} className="service-item">
                                                <span className="service-name">{service.name}</span>
                                                <span className="service-price">
                                                    {service.price.toLocaleString()} ₽
                                                </span>
                                            </div>
                                        ))}
                                        <div
                                            className="service-item"
                                            style={{
                                                fontWeight: "bold",
                                                borderTop: "2px solid #0066cc",
                                                marginTop: "5px",
                                                paddingTop: "5px",
                                            }}
                                        >
                                            <span>ИТОГО:</span>
                                            <span>{fullPrice.totalPrice.toLocaleString()} ₽</span>
                                        </div>
                                    </div>
                                )}

                                <div className="price-block">
                                    <div>
                                        <span className="price-amount">
                                            {selectedWagon?.wagonId === wagon.wagonId && fullPrice
                                                ? fullPrice.totalPrice.toLocaleString()
                                                : wagon.estimatedPrice?.toLocaleString()}
                                        </span>
                                        <span className="price-currency"> ₽</span>
                                    </div>
                                    <div>
                                        {selectedWagon?.wagonId === wagon.wagonId ? (
                                            <button
                                                className="btn-reserve"
                                                onClick={() => reserveWagon(wagon.wagonId)}
                                                disabled={loading}
                                            >
                                                {loading ? "Резервирование..." : "Забронировать"}
                                            </button>
                                        ) : (
                                            <button
                                                className="btn-reserve"
                                                onClick={() => calculateFullPrice(wagon.wagonId)}
                                                disabled={calculating}
                                            >
                                                Рассчитать стоимость
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default CreateOrderPage;
