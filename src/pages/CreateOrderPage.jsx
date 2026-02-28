import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MainPage.css"; // Можешь создать отдельный CSS, но пока возьмем стили отсюда

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
      // Достаем токен из памяти браузера (предполагается, что при логине мы его туда сохранили)
      const token = localStorage.getItem("accessToken");

      const response = await fetch("http://localhost:8080/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Передаем токен охраннику Spring Security
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
        departureStation: "",
        destinationStation: "",
        requestedWagonType: "COVERED",
        cargoType: "STANDARD",
        weightKg: "",
        volumeM3: "",
        packagingType: "CONTAINER",
      });
    } catch (err) {
      setError(err.message);
    }
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
                className={`wagon-card ${
                  selectedWagon?.wagonId === wagon.wagonId ? "recommended" : ""
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
