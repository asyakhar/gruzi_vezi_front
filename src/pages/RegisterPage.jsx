import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API_CONFIG from "../config";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState("LEGAL_ENTITY");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    userType: "LEGAL_ENTITY",
    // Для юридических лиц
    companyName: "",
    inn: "",
    // Для физических лиц
    lastName: "",
    firstName: "",
    patronymic: "",
    phone: "",
    passportSeries: "",
    passportNumber: "",
    passportIssuedBy: "",
    passportIssuedDate: "",
    registrationAddress: "",
    snils: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Введите корректный email адрес";
    }

    if (formData.password.length < 6) {
      newErrors.password = "Пароль должен содержать минимум 6 символов";
    }

    if (formData.userType === "LEGAL_ENTITY") {
      const innRegex = /^\d{10}$|^\d{12}$/;
      if (!innRegex.test(formData.inn)) {
        newErrors.inn = "ИНН должен содержать 10 или 12 цифр";
      }
      if (formData.companyName.trim().length < 2) {
        newErrors.companyName = "Введите корректное название компании";
      }
    } else {
      // Валидация для физических лиц
      if (formData.lastName.trim().length < 2) {
        newErrors.lastName = "Введите фамилию";
      }
      if (formData.firstName.trim().length < 2) {
        newErrors.firstName = "Введите имя";
      }

      const phoneRegex = /^\+?[0-9\s\-()]{10,20}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = "Введите корректный номер телефона";
      }

      const passportSeriesRegex = /^\d{4}$/;
      if (!passportSeriesRegex.test(formData.passportSeries)) {
        newErrors.passportSeries = "Серия паспорта: 4 цифры";
      }

      const passportNumberRegex = /^\d{6}$/;
      if (!passportNumberRegex.test(formData.passportNumber)) {
        newErrors.passportNumber = "Номер паспорта: 6 цифр";
      }

      if (formData.passportIssuedBy.trim().length < 3) {
        newErrors.passportIssuedBy = "Введите кем выдан паспорт";
      }

      if (!formData.passportIssuedDate) {
        newErrors.passportIssuedDate = "Укажите дату выдачи паспорта";
      }

      if (formData.registrationAddress.trim().length < 10) {
        newErrors.registrationAddress = "Введите полный адрес регистрации";
      }

      const snilsRegex = /^\d{11}$/;
      if (!snilsRegex.test(formData.snils)) {
        newErrors.snils = "СНИЛС: 11 цифр";
      }

      const innRegex = /^\d{12}$/;
      if (!innRegex.test(formData.inn)) {
        newErrors.inn = "ИНН физического лица: 12 цифр";
      }
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }

    if (serverError) {
      setServerError(null);
    }
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
    setFormData({ ...formData, userType: type });
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(
            data.message || "Проверьте правильность заполнения формы"
          );
        } else if (response.status === 409) {
          throw new Error("Пользователь с таким email уже существует");
        } else {
          throw new Error(data.message || "Ошибка регистрации");
        }
      }

      sessionStorage.setItem("accessToken", data.accessToken);
      sessionStorage.setItem("refreshToken", data.refreshToken);

      alert("Регистрация успешна!");
      navigate("/");
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "600px", marginTop: "50px" }}>
      <h2 className="section-title">Регистрация</h2>

      {serverError && (
        <div
          className="error-message"
          style={{
            color: "red",
            marginBottom: "15px",
            padding: "10px",
            backgroundColor: "#ffeeee",
            borderRadius: "4px",
          }}
        >
          {serverError}
        </div>
      )}

      {/* Переключатель типа пользователя */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "25px",
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          onClick={() => handleUserTypeChange("LEGAL_ENTITY")}
          style={{
            padding: "10px 20px",
            backgroundColor:
              userType === "LEGAL_ENTITY" ? "#e31e24" : "#f0f0f0",
            color: userType === "LEGAL_ENTITY" ? "white" : "#333",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Юридическое лицо
        </button>
        <button
          type="button"
          onClick={() => handleUserTypeChange("INDIVIDUAL")}
          style={{
            padding: "10px 20px",
            backgroundColor: userType === "INDIVIDUAL" ? "#e31e24" : "#f0f0f0",
            color: userType === "INDIVIDUAL" ? "white" : "#333",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Физическое лицо
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        {/* Общие поля */}
        <div>
          <input
            type="email"
            name="email"
            placeholder="Email *"
            value={formData.email}
            onChange={handleChange}
            className={`form-input ${errors.email ? "input-error" : ""}`}
            required
          />
          {errors.email && (
            <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
              {errors.email}
            </div>
          )}
        </div>

        <div>
          <input
            type="password"
            name="password"
            placeholder="Пароль (минимум 6 символов) *"
            value={formData.password}
            onChange={handleChange}
            className={`form-input ${errors.password ? "input-error" : ""}`}
            minLength="6"
            required
          />
          {errors.password && (
            <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
              {errors.password}
            </div>
          )}
        </div>

        {userType === "LEGAL_ENTITY" ? (
          // Форма для юридических лиц
          <>
            <div>
              <input
                type="text"
                name="companyName"
                placeholder="Название компании *"
                value={formData.companyName}
                onChange={handleChange}
                className={`form-input ${errors.companyName ? "input-error" : ""
                  }`}
                required
              />
              {errors.companyName && (
                <div
                  style={{ color: "red", fontSize: "12px", marginTop: "4px" }}
                >
                  {errors.companyName}
                </div>
              )}
            </div>
            <div>
              <input
                type="text"
                name="inn"
                placeholder="ИНН (10 или 12 цифр) *"
                value={formData.inn}
                onChange={handleChange}
                className={`form-input ${errors.inn ? "input-error" : ""}`}
                maxLength="12"
                required
              />
              {errors.inn && (
                <div
                  style={{ color: "red", fontSize: "12px", marginTop: "4px" }}
                >
                  {errors.inn}
                </div>
              )}
            </div>
          </>
        ) : (
          // Форма для физических лиц
          <>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Фамилия *"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`form-input ${errors.lastName ? "input-error" : ""
                    }`}
                  required
                />
                {errors.lastName && (
                  <div
                    style={{ color: "red", fontSize: "12px", marginTop: "4px" }}
                  >
                    {errors.lastName}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Имя *"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`form-input ${errors.firstName ? "input-error" : ""
                    }`}
                  required
                />
                {errors.firstName && (
                  <div
                    style={{ color: "red", fontSize: "12px", marginTop: "4px" }}
                  >
                    {errors.firstName}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  name="patronymic"
                  placeholder="Отчество"
                  value={formData.patronymic}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <input
                type="tel"
                name="phone"
                placeholder="Телефон (+7XXXXXXXXXX) *"
                value={formData.phone}
                onChange={handleChange}
                className={`form-input ${errors.phone ? "input-error" : ""}`}
                required
              />
              {errors.phone && (
                <div
                  style={{ color: "red", fontSize: "12px", marginTop: "4px" }}
                >
                  {errors.phone}
                </div>
              )}
            </div>

            <div>
              <input
                type="text"
                name="inn"
                placeholder="ИНН (12 цифр) *"
                value={formData.inn}
                onChange={handleChange}
                className={`form-input ${errors.inn ? "input-error" : ""}`}
                maxLength="12"
                required
              />
              {errors.inn && (
                <div
                  style={{ color: "red", fontSize: "12px", marginTop: "4px" }}
                >
                  {errors.inn}
                </div>
              )}
            </div>

            <div>
              <input
                type="text"
                name="snils"
                placeholder="СНИЛС (11 цифр) *"
                value={formData.snils}
                onChange={handleChange}
                className={`form-input ${errors.snils ? "input-error" : ""}`}
                maxLength="11"
                required
              />
              {errors.snils && (
                <div
                  style={{ color: "red", fontSize: "12px", marginTop: "4px" }}
                >
                  {errors.snils}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  name="passportSeries"
                  placeholder="Серия паспорта (4 цифры) *"
                  value={formData.passportSeries}
                  onChange={handleChange}
                  className={`form-input ${errors.passportSeries ? "input-error" : ""
                    }`}
                  maxLength="4"
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  name="passportNumber"
                  placeholder="Номер паспорта (6 цифр) *"
                  value={formData.passportNumber}
                  onChange={handleChange}
                  className={`form-input ${errors.passportNumber ? "input-error" : ""
                    }`}
                  maxLength="6"
                  required
                />
              </div>
            </div>
            {errors.passportSeries && (
              <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                {errors.passportSeries}
              </div>
            )}
            {errors.passportNumber && (
              <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                {errors.passportNumber}
              </div>
            )}

            <div>
              <input
                type="text"
                name="passportIssuedBy"
                placeholder="Кем выдан паспорт *"
                value={formData.passportIssuedBy}
                onChange={handleChange}
                className={`form-input ${errors.passportIssuedBy ? "input-error" : ""
                  }`}
                required
              />
              {errors.passportIssuedBy && (
                <div
                  style={{ color: "red", fontSize: "12px", marginTop: "4px" }}
                >
                  {errors.passportIssuedBy}
                </div>
              )}
            </div>

            <div>
              <input
                type="date"
                name="passportIssuedDate"
                placeholder="Дата выдачи *"
                value={formData.passportIssuedDate}
                onChange={handleChange}
                className={`form-input ${errors.passportIssuedDate ? "input-error" : ""
                  }`}
                required
              />
              {errors.passportIssuedDate && (
                <div
                  style={{ color: "red", fontSize: "12px", marginTop: "4px" }}
                >
                  {errors.passportIssuedDate}
                </div>
              )}
            </div>

            <div>
              <textarea
                name="registrationAddress"
                placeholder="Адрес регистрации *"
                value={formData.registrationAddress}
                onChange={handleChange}
                className={`form-input ${errors.registrationAddress ? "input-error" : ""
                  }`}
                rows="3"
                required
              />
              {errors.registrationAddress && (
                <div
                  style={{ color: "red", fontSize: "12px", marginTop: "4px" }}
                >
                  {errors.registrationAddress}
                </div>
              )}
            </div>
          </>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-large"
          style={{ marginTop: "10px" }}
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
