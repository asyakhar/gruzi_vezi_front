import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MainPage.css";
import "./WagonSearchResult.css";
import { fetchWithAuth } from "../api";
import AutocompleteInput from "./AutocompleteInput";
import API_CONFIG from "../config";

const CreateOrderPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    departureStation: "",
    destinationStation: "",
    requestedWagonType: "крытый",
    cargoType: "Электроника",
    weightKg: "",
    volumeM3: "",
    packagingType: "Паллеты",
  });

  const [wagons, setWagons] = useState([]);
  const [selectedWagon, setSelectedWagon] = useState(null);
  const [fullPrice, setFullPrice] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [selectedServicesByWagon, setSelectedServicesByWagon] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleServiceToggle = (wagonId, serviceCode) => {
    setSelectedServicesByWagon((prev) => {
      const wagonServices = prev[wagonId] || new Set();
      const newSet = new Set(wagonServices);
      if (newSet.has(serviceCode)) {
        newSet.delete(serviceCode);
      } else {
        newSet.add(serviceCode);
      }
      return { ...prev, [wagonId]: newSet };
    });
  };

  const searchWagonsTemporary = async () => {
    setLoading(true);
    setError(null);
    setWagons([]);
    setSelectedWagon(null);
    setFullPrice(null);
    setSelectedServicesByWagon({});

    const searchPayload = {
      departureStation: formData.departureStation,
      arrivalStation: formData.destinationStation,
      weightKg: Number(formData.weightKg),
      volumeM3: Number(formData.volumeM3),
      cargoType: formData.cargoType,
      preferredWagonType: formData.requestedWagonType,
      allowAlternativeStations: true,
    };

    try {
      const token = sessionStorage.getItem("accessToken");
      const response = await fetch(
        `${API_CONFIG.baseURL}/api/dispatcher/wagons/search-temporary`,
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
      setMessage(
        data.length > 0
          ? `✓ Найдено ${data.length} подходящих вагонов`
          : "Вагонов не найдено. Попробуйте изменить параметры"
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.departureStation || !formData.destinationStation) {
      setError("Заполните станции отправления и назначения");
      return;
    }
    if (!formData.weightKg || !formData.volumeM3) {
      setError("Заполните вес и объем груза");
      return;
    }

    searchWagonsTemporary();
  };

  const calculateFullPrice = async (wagonId) => {
    setCalculating(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("accessToken");
      const selectedServices = selectedServicesByWagon[wagonId] || new Set();

      const priceRequest = {
        cargoType: formData.cargoType,
        wagonType: formData.requestedWagonType,
        weightKg: Number(formData.weightKg),
        departureStation: formData.departureStation,
        destinationStation: formData.destinationStation,
        selectedServices: Array.from(selectedServices),
      };

      const response = await fetch(
        `${API_CONFIG.baseURL}/api/dispatcher/pricing/calculate-for-wagon?wagonId=${wagonId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(priceRequest),
        }
      );

      if (!response.ok) throw new Error("Ошибка при расчете стоимости");

      const data = await response.json();
      setFullPrice(data);

      const wagon = wagons.find((w) => w.wagonId === wagonId);
      setSelectedWagon({ ...wagon, price: data });
    } catch (err) {
      setError(err.message);
    } finally {
      setCalculating(false);
    }
  };

  const recalculatePrice = async (wagonId) => {
    if (!wagonId) return;
    await calculateFullPrice(wagonId);
  };

  const reserveWagonAndCreateOrder = async (wagonId) => {
    setLoading(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("accessToken");
      const selectedServices = selectedServicesByWagon[wagonId] || new Set();

      const requestBody = {
        orderRequest: {
          departureStation: formData.departureStation,
          destinationStation: formData.destinationStation,
          requestedWagonType: formData.requestedWagonType,
          cargo: {
            cargoType: formData.cargoType,
            weightKg: Number(formData.weightKg),
            volumeM3: Number(formData.volumeM3),
            packagingType: formData.packagingType,
          },
        },
        wagonId: wagonId,
        selectedServices: Array.from(selectedServices),
      };

      const response = await fetch(
        `${API_CONFIG.baseURL}/api/orders/complete-with-reservation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Ошибка при создании заявки");
      }

      const data = await response.json();
      setMessage(
        `✓ Заявка №${data.orderId.slice(0, 8)} создана, вагон забронирован.`
      );

      navigate(
        `/payment/create?orderId=${data.orderId}&wagonId=${wagonId}&amount=${fullPrice.totalPrice}`
      );
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

  const getCategoryLabel = (category) => {
    const labels = {
      SAFETY: "Безопасность",
      LOGISTICS: "Логистика",
      DOCUMENTS: "Документы",
      MONITORING: "Мониторинг",
    };
    return labels[category] || "Услуга";
  };

  const getCategoryClass = (category) => {
    const classes = {
      SAFETY: "safety",
      LOGISTICS: "logistics",
      DOCUMENTS: "documents",
      MONITORING: "monitoring",
    };
    return classes[category] || "";
  };

  const getSelectedServicesForWagon = (wagonId) => {
    return selectedServicesByWagon[wagonId] || new Set();
  };

  return (
    <div className="main-page">
      <header className="header">
        <div className="container header-container">
          <div
            className="logo"
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            <img src="/logo.png" alt="РЖД Логотип" />
            <span className="logo-text">ОАО «РЖД» | Подбор вагонов</span>
          </div>
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
          minHeight: "calc(100vh - 80px - 300px)",
        }}
      >
        <h2
          className="section-title"
          style={{ textAlign: "left", marginBottom: "30px" }}
        >
          Подбор вагонов для перевозки
        </h2>

        {message && (
          <div
            style={{
              padding: "15px",
              background: message.includes("✓") ? "#d4edda" : "#fff3cd",
              color: message.includes("✓") ? "#155724" : "#856404",
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
              <AutocompleteInput
                label="Станция отправления"
                name="departureStation"
                value={formData.departureStation}
                onChange={handleChange}
                placeholder="Москва-Товарная"
                required={true}
              />
            </div>
            <div style={{ flex: 1 }}>
              <AutocompleteInput
                label="Станция назначения"
                name="destinationStation"
                value={formData.destinationStation}
                onChange={handleChange}
                placeholder="Екатеринбург-Товарный"
                required={true}
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
            {loading ? "Поиск..." : "Найти вагоны"}
          </button>
        </form>

        {/* Результаты поиска вагонов */}
        {wagons.length > 0 && (
          <div className="wagon-search-result">
            <h3>Доступные вагоны</h3>

            {calculating && (
              <div className="loading-spinner">Расчет стоимости...</div>
            )}

            {wagons.map((wagon) => {
              const wagonSelectedServices = getSelectedServicesForWagon(
                wagon.wagonId
              );

              return (
                <div
                  key={wagon.wagonId}
                  className={`wagon-card ${
                    selectedWagon?.wagonId === wagon.wagonId
                      ? "recommended"
                      : ""
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

                  {/* Блок с дополнительными услугами */}
                  {selectedWagon?.wagonId === wagon.wagonId &&
                    fullPrice &&
                    fullPrice.availableServices && (
                      <div className="services-list">
                        <h4>Дополнительные услуги:</h4>

                        {fullPrice.availableServices.map((service, idx) => (
                          <div key={idx} className="service-item">
                            <input
                              type="checkbox"
                              id={`service-${wagon.wagonId}-${service.code}`}
                              checked={wagonSelectedServices.has(service.code)}
                              onChange={() =>
                                handleServiceToggle(wagon.wagonId, service.code)
                              }
                              disabled={service.code === "CONSOLIDATION"}
                            />
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  flexWrap: "wrap",
                                }}
                              >
                                <label
                                  htmlFor={`service-${wagon.wagonId}-${service.code}`}
                                  style={{ fontWeight: "bold" }}
                                >
                                  {service.name}
                                </label>
                                <span
                                  className={`service-category ${getCategoryClass(
                                    service.category
                                  )}`}
                                >
                                  {getCategoryLabel(service.category)}
                                </span>
                              </div>
                              <div className="service-description">
                                {service.description}
                              </div>
                              {service.recommendationReason && (
                                <div className="service-reason">
                                  {service.recommendationReason}
                                </div>
                              )}
                            </div>
                            <div className="service-price">
                              {service.price > 0
                                ? `${service.price.toLocaleString()} ₽`
                                : "Бесплатно"}
                              {service.details && (
                                <small>{service.details}</small>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Кнопка пересчета */}
                        <div
                          style={{ padding: "15px 20px", textAlign: "right" }}
                        >
                          <button
                            onClick={() => recalculatePrice(wagon.wagonId)}
                            disabled={calculating}
                            className="btn-primary"
                            style={{ padding: "10px 20px" }}
                          >
                            {calculating
                              ? "Пересчет..."
                              : "Пересчитать с выбранными услугами"}
                          </button>
                        </div>

                        {/* Итоговая стоимость */}
                        <div className="total-price-row">
                          <span className="total-price-label">ИТОГО:</span>
                          <span className="total-price-amount">
                            {fullPrice.totalPrice.toLocaleString()} ₽
                          </span>
                        </div>

                        {/* Информация о грузе */}
                        {fullPrice.cargoEstimate && (
                          <div className="cargo-info">
                            <div className="cargo-info-item">
                              <span className="cargo-info-label">
                                Оценка груза:
                              </span>
                              <span className="cargo-info-value">
                                {fullPrice.cargoEstimate.estimatedValue.toLocaleString()}{" "}
                                ₽
                              </span>
                            </div>
                            <div className="cargo-info-item">
                              <span className="cargo-info-label">Вес:</span>
                              <span className="cargo-info-value">
                                {fullPrice.cargoEstimate.weightTons} тонн
                              </span>
                            </div>
                            <div className="cargo-info-item">
                              <span className="cargo-info-label">
                                Уровень риска:
                              </span>
                              <span className="cargo-info-value">
                                {fullPrice.cargoEstimate.riskLevel}
                              </span>
                            </div>
                          </div>
                        )}
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
                          onClick={() =>
                            reserveWagonAndCreateOrder(wagon.wagonId)
                          }
                          disabled={loading}
                          style={{ background: "#28a745" }}
                        >
                          {loading ? "..." : "Оплатить"}
                        </button>
                      ) : (
                        <button
                          className="btn-reserve"
                          onClick={() => calculateFullPrice(wagon.wagonId)}
                          disabled={calculating}
                        >
                          {calculating ? "Расчет..." : "Рассчитать стоимость"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default CreateOrderPage;
