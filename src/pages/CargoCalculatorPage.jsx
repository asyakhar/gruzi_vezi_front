import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MainPage.css";
import "./CalculatorPage.css"; // Создадим отдельный CSS для калькулятора

const CargoCalculatorPage = () => {
  const navigate = useNavigate();

  // Состояние для шагов
  const [currentStep, setCurrentStep] = useState(1);

  // Состояние для данных формы
  const [formData, setFormData] = useState({
    // Шаг 1: Маршрут
    departureStation: "",
    destinationStation: "",

    // Шаг 2: Параметры перевозки
    cargoType: "Электроника",
    weightKg: "",
    volumeM3: "",
    packagingType: "Паллеты",
    wagonType: "крытый",
    ownership: "Парк РЖД", // Принадлежность
  });

  // Состояние для результатов расчета
  const [calculationResult, setCalculationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Переход к следующему шагу
  const nextStep = () => {
    if (currentStep === 1) {
      // Валидация шага 1
      if (!formData.departureStation || !formData.destinationStation) {
        setError("Заполните станции отправления и назначения");
        return;
      }
    } else if (currentStep === 2) {
      // Валидация шага 2
      if (!formData.weightKg || !formData.volumeM3) {
        setError("Заполните вес и объем груза");
        return;
      }
    }
    setError(null);
    setCurrentStep(currentStep + 1);
  };

  // Возврат к предыдущему шагу
  const prevStep = () => {
    setError(null);
    setCurrentStep(currentStep - 1);
  };

  // Расчет стоимости и углеродного следа
  const calculatePrice = async () => {
    setLoading(true);
    setError(null);

    try {
      // Используем твой существующий эндпоинт для расчета
      const payload = {
        cargoType: formData.cargoType,
        wagonType: formData.wagonType,
        weightKg: Number(formData.weightKg),
        departureStation: formData.departureStation,
        destinationStation: formData.destinationStation,
      };

      const response = await fetch(
        "http://localhost:8080/api/dispatcher/pricing/calculate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Ошибка при расчете стоимости");

      const data = await response.json();

      // Добавляем углеродный след к результату (он уже должен быть в ответе)
      setCalculationResult({
        ...data,
        // Если углеродного следа нет в ответе, рассчитываем приблизительно
        carbonFootprint:
          data.carbonFootprintKg ||
          (
            (formData.weightKg * (data.distanceKm || 1000) * 0.02) /
            1000
          ).toFixed(2),
        // Добавляем сравнение с автотранспортом
        truckCarbonFootprint: (
          (formData.weightKg * (data.distanceKm || 1000) * 0.12) /
          1000
        ).toFixed(2),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Обработка отправки формы
  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentStep === 3) {
      calculatePrice();
    } else {
      nextStep();
    }
  };

  // Сброс и начало нового расчета
  const resetCalculator = () => {
    setCurrentStep(1);
    setCalculationResult(null);
    setFormData({
      departureStation: "",
      destinationStation: "",
      cargoType: "Электроника",
      weightKg: "",
      volumeM3: "",
      packagingType: "Паллеты",
      wagonType: "крытый",
      ownership: "Парк РЖД",
    });
  };

  // Прогресс-бар шагов
  const renderProgressBar = () => {
    return (
      <div className="calculator-progress">
        <div
          className={`progress-step ${currentStep >= 1 ? "active" : ""} ${
            currentStep > 1 ? "completed" : ""
          }`}
        >
          <span className="step-number">1</span>
          <span className="step-label">Маршрут</span>
        </div>
        <div
          className={`progress-line ${currentStep > 1 ? "active" : ""}`}
        ></div>
        <div
          className={`progress-step ${currentStep >= 2 ? "active" : ""} ${
            currentStep > 2 ? "completed" : ""
          }`}
        >
          <span className="step-number">2</span>
          <span className="step-label">Параметры груза</span>
        </div>
        <div
          className={`progress-line ${currentStep > 2 ? "active" : ""}`}
        ></div>
        <div className={`progress-step ${currentStep >= 3 ? "active" : ""}`}>
          <span className="step-number">3</span>
          <span className="step-label">Расчет</span>
        </div>
      </div>
    );
  };

  // Шаг 1: Маршрут
  const renderStep1 = () => (
    <div className="calculator-step">
      <h3 className="step-title">Шаг 1: Маршрут перевозки</h3>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">
            Станция отправления <span className="required">*</span>
          </label>
          <input
            type="text"
            name="departureStation"
            value={formData.departureStation}
            onChange={handleChange}
            className="form-input"
            placeholder="Москва-Товарная"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">
            Станция назначения <span className="required">*</span>
          </label>
          <input
            type="text"
            name="destinationStation"
            value={formData.destinationStation}
            onChange={handleChange}
            className="form-input"
            placeholder="Екатеринбург-Товарный"
            required
          />
        </div>
      </div>
    </div>
  );

  // Шаг 2: Параметры перевозки
  const renderStep2 = () => (
    <div className="calculator-step">
      <h3 className="step-title">Шаг 2: Параметры перевозки</h3>

      <div className="form-group">
        <label className="form-label">Груз по ЕТСНГ *</label>
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
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Объём груза (м³) *</label>
          <input
            type="number"
            min="1"
            name="volumeM3"
            value={formData.volumeM3}
            onChange={handleChange}
            className="form-input"
            placeholder="100"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Вес груза (кг) *</label>
          <input
            type="number"
            min="1"
            name="weightKg"
            value={formData.weightKg}
            onChange={handleChange}
            className="form-input"
            placeholder="60000"
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Тип упаковки *</label>
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
        <div className="form-group">
          <label className="form-label">Род вагонов *</label>
          <select
            name="wagonType"
            value={formData.wagonType}
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

      <div className="form-group">
        <label className="form-label">Принадлежность вагона</label>
        <select
          name="ownership"
          value={formData.ownership}
          onChange={handleChange}
          className="form-input"
        >
          <option value="Парк РЖД">Парк РЖД</option>
          <option value="Собственный">Собственный</option>
          <option value="АрENDованный">Арендованный</option>
        </select>
      </div>
    </div>
  );

  // Шаг 3: Результаты расчета
  const renderStep3 = () => (
    <div className="calculator-step">
      <h3 className="step-title">Шаг 3: Результаты расчета</h3>

      {!calculationResult ? (
        <div className="calculation-preview">
          <p>Проверьте введенные данные и нажмите "Рассчитать стоимость"</p>
          <div className="preview-details">
            <div className="preview-row">
              <span className="preview-label">Маршрут:</span>
              <span className="preview-value">
                {formData.departureStation} → {formData.destinationStation}
              </span>
            </div>
            <div className="preview-row">
              <span className="preview-label">Груз:</span>
              <span className="preview-value">
                {formData.cargoType}, {formData.weightKg} кг,{" "}
                {formData.volumeM3} м³
              </span>
            </div>
            <div className="preview-row">
              <span className="preview-label">Вагон:</span>
              <span className="preview-value">
                {formData.wagonType}, {formData.ownership}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="calculation-result">
          <div className="result-card">
            <h4 className="result-title">💰 Стоимость перевозки</h4>
            <div className="result-amount">
              {calculationResult.totalPrice.toLocaleString()} ₽
            </div>
            <div className="result-details">
              <div className="detail-row">
                <span>Базовая стоимость:</span>
                <span>{calculationResult.basePrice.toLocaleString()} ₽</span>
              </div>
              {calculationResult.additionalServicesPrice > 0 && (
                <div className="detail-row">
                  <span>Дополнительные услуги:</span>
                  <span>
                    {calculationResult.additionalServicesPrice.toLocaleString()}{" "}
                    ₽
                  </span>
                </div>
              )}
              <div className="detail-row">
                <span>Расстояние:</span>
                <span>{calculationResult.distanceKm} км</span>
              </div>
            </div>
          </div>

          <div className="result-card carbon-card">
            <h4 className="result-title">🌍 Углеродный след</h4>

            <div className="carbon-comparison">
              <div className="carbon-item">
                <div className="carbon-label">
                  <span className="carbon-icon">🚂</span>
                  <span>Ж/Д транспорт</span>
                </div>
                <div className="carbon-value">
                  {calculationResult.carbonFootprintKg} кг CO₂
                </div>
                <div className="carbon-bar">
                  <div
                    className="carbon-bar-fill rail"
                    style={{
                      width: `${(
                        (calculationResult.carbonFootprintKg /
                          calculationResult.truckCarbonFootprint) *
                        100
                      ).toFixed(0)}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="carbon-item">
                <div className="carbon-label">
                  <span className="carbon-icon">🚛</span>
                  <span>Автотранспорт</span>
                </div>
                <div className="carbon-value">
                  {calculationResult.truckCarbonFootprint} кг CO₂
                </div>
                <div className="carbon-bar">
                  <div
                    className="carbon-bar-fill truck"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="carbon-savings">
              <div className="savings-badge">🌱 Экономия выбросов</div>
              <div className="savings-amount">
                {(
                  calculationResult.truckCarbonFootprint -
                  calculationResult.carbonFootprintKg
                ).toFixed(2)}{" "}
                кг CO₂
              </div>
              <div className="savings-equivalent">
                Это эквивалентно посадке{" "}
                {Math.round(
                  (calculationResult.truckCarbonFootprint -
                    calculationResult.carbonFootprintKg) /
                    20
                )}{" "}
                деревьев
              </div>
            </div>

            <div className="carbon-note">
              <p>
                Расчет выполнен по методологии Минприроды РФ (коэффициенты
                выбросов: ЖД - 0.02 кг/т·км, авто - 0.12 кг/т·км)
              </p>
            </div>
          </div>

          {calculationResult.recommendedServices?.length > 0 && (
            <div className="result-card">
              <h4 className="result-title">✨ Рекомендуемые услуги</h4>
              <div className="services-list">
                {calculationResult.recommendedServices.map((service, idx) => (
                  <div key={idx} className="service-item">
                    <span className="service-name">{service.name}</span>
                    <span className="service-price">
                      {service.price.toLocaleString()} ₽
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="main-page calculator-page">
      <header className="header">
        <div className="container header-container">
          <div
            className="logo"
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            <img src="/logo.png" alt="РЖД Логотип" />
            <span className="logo-text">ОАО «РЖД» | Калькулятор перевозок</span>
          </div>
          <div className="header-actions">
            <button className="btn btn-outline" onClick={() => navigate("/")}>
              На главную
            </button>
          </div>
        </div>
      </header>

      <main className="container calculator-container">
        <h1 className="calculator-main-title">
          Расчёт стоимости грузоперевозки
        </h1>

        {renderProgressBar()}

        {error && <div className="message error">❌ {error}</div>}

        <form onSubmit={handleSubmit} className="calculator-form">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          <div className="calculator-actions">
            {currentStep > 1 && !calculationResult && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={prevStep}
              >
                ← Назад
              </button>
            )}

            {currentStep < 3 ? (
              <button type="submit" className="btn btn-primary">
                Далее →
              </button>
            ) : !calculationResult ? (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Расчет..." : "Рассчитать стоимость"}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={resetCalculator}
              >
                Новый расчет
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
};

export default CargoCalculatorPage;
