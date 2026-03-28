import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./MainPage.css";
import { fetchWithAuth } from "../api";

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const orderId = searchParams.get("orderId");
  const wagonId = searchParams.get("wagonId");
  const [orderAmount, setOrderAmount] = useState(0);
  const [userType, setUserType] = useState(null);

  const [paymentData, setPaymentData] = useState({
    companyName: "",
    inn: "",
    snils: "",
    phone: "",
    passportSeries: "",
    passportNumber: "",
    passportIssuedBy: "",
    passportIssuedDate: "",
    registrationAddress: "",
    // Для юридических лиц
    kpp: "",
    bik: "",
    accountNumber: "",
    correspondentAccount: "",
    bankName: "",
    // Общие
    paymentPurpose: "",
  });

  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [createdPayment, setCreatedPayment] = useState(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await fetchWithAuth(
          "http://localhost:8080/api/user/profile"
        );

        if (!response.ok) {
          throw new Error("Ошибка загрузки профиля");
        }

        const userData = await response.json();
        console.log("Данные пользователя:", userData);

        setUserType(userData.userType);

        if (userData.userType === "LEGAL_ENTITY") {
          setPaymentData((prev) => ({
            ...prev,
            companyName: userData.companyName,
            inn: userData.inn,
          }));
        } else {
          // Для физических лиц - все данные из профиля
          const fullName = `${userData.lastName} ${userData.firstName} ${
            userData.patronymic || ""
          }`.trim();
          setPaymentData((prev) => ({
            ...prev,
            companyName: fullName,
            inn: userData.inn,
            snils: userData.snils,
            phone: userData.phone,
            passportSeries: userData.passportSeries,
            passportNumber: userData.passportNumber,
            passportIssuedBy: userData.passportIssuedBy,
            passportIssuedDate: userData.passportIssuedDate,
            registrationAddress: userData.registrationAddress,
          }));
        }

        if (orderId) {
          const orderResponse = await fetchWithAuth(
            `http://localhost:8080/api/orders/${orderId}`
          );

          if (orderResponse.ok) {
            const orderData = await orderResponse.json();
            const price = orderData.totalPrice || 0;
            setOrderAmount(Number(price));
          } else {
            const urlAmount = searchParams.get("amount");
            if (urlAmount) {
              setOrderAmount(parseFloat(urlAmount));
            }
          }
        } else {
          const urlAmount = searchParams.get("amount");
          if (urlAmount) {
            setOrderAmount(parseFloat(urlAmount));
          }
        }
      } catch (err) {
        console.error("Ошибка загрузки профиля:", err);
        setError("Не удалось загрузить данные. Возможно, сессия истекла.");
        setTimeout(() => navigate("/login"), 2000);
      } finally {
        setProfileLoading(false);
      }
    };

    loadUserProfile();
  }, [navigate, orderId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentData({ ...paymentData, [name]: value });
  };

  const cancelReservation = async () => {
    if (!wagonId) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `http://localhost:8080/api/dispatcher/wagons/${wagonId}/release`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setMessage("Бронь отменена. Вы можете вернуться к выбору вагона.");
        setTimeout(() => {
          navigate(`/create-order?orderId=${orderId}`);
        }, 2000);
      }
    } catch (err) {
      console.error("Ошибка:", err);
      setError("Не удалось отменить бронь");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!orderId) {
        throw new Error("Не указан ID заказа в URL");
      }

      let amountValue = parseFloat(orderAmount);
      if (isNaN(amountValue) || amountValue <= 0) {
        const urlAmount = searchParams.get("amount");
        if (urlAmount) {
          amountValue = parseFloat(urlAmount);
        } else {
          throw new Error("Не удалось определить сумму платежа");
        }
      }

      const payload = {
        orderId: orderId,
        amount: amountValue,
        companyName: paymentData.companyName,
        inn: paymentData.inn,
        paymentPurpose:
          paymentData.paymentPurpose ||
          `Оплата перевозки по заказу №${orderId.slice(0, 8)}`,
      };

      // Для юрлиц добавляем банковские реквизиты
      if (userType === "LEGAL_ENTITY") {
        payload.kpp = paymentData.kpp || null;
        payload.bik = paymentData.bik;
        payload.accountNumber = paymentData.accountNumber;
        payload.correspondentAccount = paymentData.correspondentAccount || "";
        payload.bankName = paymentData.bankName;
        payload.paymentMethod = "BANK_TRANSFER";
      } else {
        // Для физлиц - только базовые реквизиты (бик, счет, банк - опционально)
        if (paymentData.bik) payload.bik = paymentData.bik;
        if (paymentData.accountNumber)
          payload.accountNumber = paymentData.accountNumber;
        if (paymentData.bankName) payload.bankName = paymentData.bankName;
        payload.paymentMethod = "BANK_TRANSFER";
      }

      console.log("Отправляемый payload:", payload);

      const response = await fetchWithAuth(
        "http://localhost:8080/api/dispatcher/payments/corporate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setCreatedPayment(data);

      if (userType === "INDIVIDUAL") {
        setMessage(`✓ Платеж успешно создан и оплачен!".`);
      } else {
        setMessage(`✓ Платеж успешно создан и оплачен!`);
      }
    } catch (err) {
      console.error("Ошибка:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmIndividualPayment = async () => {
    if (!createdPayment) return;

    setLoading(true);
    try {
      const response = await fetchWithAuth(
        `http://localhost:8080/api/dispatcher/payments/individual/confirm?paymentDocument=${createdPayment.payment_document}&amount=${orderAmount}&inn=${paymentData.inn}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Ошибка при подтверждении оплаты");
      }

      const updatedPayment = await response.json();
      setCreatedPayment(updatedPayment);
      setMessage("✓ Оплата подтверждена! Спасибо за доверие!");

      // Обновляем статус заказа
      setTimeout(() => {
        navigate("/profile");
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async () => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8080/api/dispatcher/payments/${createdPayment.id}/invoice`
      );

      if (!response.ok) throw new Error("Ошибка при скачивании счета");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_${createdPayment.payment_document || "rzd"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      setError("Ошибка при скачивании PDF счета");
    }
  };

  const downloadContract = async () => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8080/api/orders/${orderId}/contract`
      );

      if (!response.ok)
        throw new Error("Ошибка сервера при скачивании договора");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contract_${orderId.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      setError("Не удалось скачать договор");
    }
  };

  const renderPaymentForm = () => {
    if (userType === "LEGAL_ENTITY") {
      return (
        <>
          <div className="form-group">
            <label className="form-label">Название компании</label>
            <input
              type="text"
              value={paymentData.companyName}
              className="form-input"
              readOnly
              style={{ background: "#f0f0f0", fontWeight: "bold" }}
            />
          </div>

          <div style={{ display: "flex", gap: "20px" }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">ИНН</label>
              <input
                type="text"
                value={paymentData.inn}
                className="form-input"
                readOnly
                style={{ background: "#f0f0f0", fontWeight: "bold" }}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">КПП (если есть)</label>
              <input
                type="text"
                name="kpp"
                value={paymentData.kpp}
                onChange={handleChange}
                className="form-input"
                placeholder="9 цифр"
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "20px" }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">БИК *</label>
              <input
                type="text"
                name="bik"
                value={paymentData.bik}
                onChange={handleChange}
                className="form-input"
                placeholder="9 цифр"
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Расчетный счет *</label>
              <input
                type="text"
                name="accountNumber"
                value={paymentData.accountNumber}
                onChange={handleChange}
                className="form-input"
                placeholder="20 цифр"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Название банка *</label>
            <input
              type="text"
              name="bankName"
              value={paymentData.bankName}
              onChange={handleChange}
              className="form-input"
              placeholder="Введите название банка"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Корреспондентский счет</label>
            <input
              type="text"
              name="correspondentAccount"
              value={paymentData.correspondentAccount}
              onChange={handleChange}
              className="form-input"
              placeholder="20 цифр (если есть)"
            />
          </div>
        </>
      );
    } else {
      // Форма для физических лиц - отображаем все данные из профиля
      return (
        <>
          <div className="form-group">
            <label className="form-label">ФИО плательщика</label>
            <input
              type="text"
              value={paymentData.companyName}
              className="form-input"
              readOnly
              style={{ background: "#f0f0f0", fontWeight: "bold" }}
            />
          </div>

          <div style={{ display: "flex", gap: "20px" }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">ИНН *</label>
              <input
                type="text"
                value={paymentData.inn}
                className="form-input"
                readOnly
                style={{ background: "#f0f0f0" }}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">СНИЛС *</label>
              <input
                type="text"
                value={paymentData.snils || ""}
                className="form-input"
                readOnly
                style={{ background: "#f0f0f0" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Телефон *</label>
            <input
              type="tel"
              value={paymentData.phone || ""}
              className="form-input"
              readOnly
              style={{ background: "#f0f0f0" }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Адрес регистрации</label>
            <textarea
              value={paymentData.registrationAddress || ""}
              className="form-input"
              readOnly
              rows="2"
              style={{ background: "#f0f0f0" }}
            />
          </div>

          <div
            style={{
              background: "#e8f4fd",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <p style={{ marginBottom: "10px", fontWeight: "bold" }}>
              📄 Паспортные данные:
            </p>
            <div style={{ display: "flex", gap: "20px", marginBottom: "10px" }}>
              <div>
                <strong>Серия:</strong> {paymentData.passportSeries}
              </div>
              <div>
                <strong>Номер:</strong> {paymentData.passportNumber}
              </div>
            </div>
            <div>
              <strong>Кем выдан:</strong> {paymentData.passportIssuedBy}
            </div>
            <div>
              <strong>Дата выдачи:</strong> {paymentData.passportIssuedDate}
            </div>
          </div>

          <div style={{ display: "flex", gap: "20px" }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">БИК (необязательно)</label>
              <input
                type="text"
                name="bik"
                value={paymentData.bik}
                onChange={handleChange}
                className="form-input"
                placeholder="9 цифр"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Номер счета (необязательно)</label>
              <input
                type="text"
                name="accountNumber"
                value={paymentData.accountNumber}
                onChange={handleChange}
                className="form-input"
                placeholder="20 цифр"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Название банка (необязательно)</label>
            <input
              type="text"
              name="bankName"
              value={paymentData.bankName}
              onChange={handleChange}
              className="form-input"
              placeholder="Введите название банка"
            />
          </div>
        </>
      );
    }
  };

  if (profileLoading) {
    return (
      <div className="main-page">
        <div
          className="container"
          style={{ textAlign: "center", padding: "50px" }}
        >
          <div className="loading-spinner">Загрузка данных...</div>
        </div>
      </div>
    );
  }

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
            <span className="logo-text">ОАО «РЖД» | Оплата перевозки</span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {!createdPayment && (
              <button
                onClick={cancelReservation}
                className="btn btn-outline"
                style={{ borderColor: "#dc3545", color: "#dc3545" }}
                disabled={loading}
              >
                Отменить бронь
              </button>
            )}
            <button className="btn btn-outline" onClick={() => navigate("/")}>
              На главную
            </button>
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: "40px 0" }}>
        <div
          className="content-card"
          style={{ maxWidth: "800px", margin: "0 auto" }}
        >
          <h2
            className="section-title"
            style={{ textAlign: "center", marginBottom: "30px" }}
          >
            Оплата перевозки
            {userType === "INDIVIDUAL" && (
              <span
                style={{
                  fontSize: "0.8rem",
                  display: "block",
                  color: "#666",
                  marginTop: "5px",
                }}
              >
                Физическое лицо
              </span>
            )}
          </h2>

          {message && (
            <div
              style={{
                padding: "15px",
                background: message.includes("✓") ? "#d4edda" : "#d1ecf1",
                color: message.includes("✓") ? "#155724" : "#0c5460",
                marginBottom: "20px",
                borderRadius: "5px",
                whiteSpace: "pre-line",
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

          {!createdPayment ? (
            <form onSubmit={handleSubmit}>
              {renderPaymentForm()}

              <div className="form-group">
                <label className="form-label">Сумма к оплате</label>
                <input
                  type="text"
                  value={`${orderAmount.toLocaleString()} ₽`}
                  className="form-input"
                  readOnly
                  style={{
                    background: "#f0f0f0",
                    fontWeight: "bold",
                    color: "#e31e24",
                    fontSize: "1.2rem",
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Назначение платежа *</label>
                <textarea
                  name="paymentPurpose"
                  value={paymentData.paymentPurpose}
                  onChange={handleChange}
                  className="form-input"
                  rows="3"
                  placeholder="Например: Оплата перевозки груза по заказу №..."
                  required
                />
              </div>

              <div style={{ textAlign: "center", marginTop: "30px" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ fontSize: "1.1rem", padding: "12px 40px" }}
                >
                  {loading
                    ? "Создание платежа..."
                    : userType === "LEGAL_ENTITY"
                    ? "Оплатить"
                    : "Создать платеж"}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: "center" }}>
              {/* Реквизиты для оплаты */}
              <div
                style={{
                  background: "#f8f9fa",
                  padding: "25px",
                  borderRadius: "10px",
                  margin: "30px 0",
                }}
              >
                <p
                  style={{
                    fontSize: "1.1rem",
                    marginBottom: "15px",
                    fontWeight: "bold",
                  }}
                >
                  Номер платежного документа:
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    fontSize: "1.3rem",
                    fontWeight: "bold",
                    color: "#0066cc",
                    fontFamily: "monospace",
                    padding: "10px",
                    background: "white",
                    borderRadius: "5px",
                    border: "2px dashed #0066cc",
                    marginBottom: "20px",
                  }}
                >
                  <span>{createdPayment.payment_document}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        createdPayment.payment_document
                      );
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.2rem",
                    }}
                  >
                    {copied ? "✓" : "⎘"}
                  </button>
                </div>
              </div>

              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  gap: "20px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button onClick={downloadInvoice} className="btn btn-primary">
                  Скачать счет
                </button>
                <button onClick={downloadContract} className="btn btn-primary">
                  Скачать договор
                </button>

                {userType === "INDIVIDUAL" &&
                  createdPayment.status === "PENDING" && (
                    <button
                      onClick={confirmIndividualPayment}
                      className="btn btn-primary"
                      disabled={loading}
                      style={{ background: "#28a745" }}
                    >
                      {loading ? "Подтверждение..." : "Подтвердить оплату"}
                    </button>
                  )}

                <button
                  onClick={() => navigate("/")}
                  className="btn btn-outline"
                >
                  🏠 На главную
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentPage;
