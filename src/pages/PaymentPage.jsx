import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./MainPage.css";
import { fetchWithAuth } from "../api";

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);
  const orderId = searchParams.get("orderId");
  const wagonId = searchParams.get("wagonId");
  const [orderAmount, setOrderAmount] = useState(0);

  const [paymentData, setPaymentData] = useState({
    companyName: "",
    inn: "",
    kpp: "",
    bik: "",
    accountNumber: "",
    correspondentAccount: "",
    bankName: "",
    paymentPurpose: "",
  });

  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [createdPayment, setCreatedPayment] = useState(null);

  // Функция отмены брони - вызывается ТОЛЬКО по кнопке или при ошибке
  const cancelReservation = async () => {
    console.log("Отмена брони по запросу пользователя", {
      wagonId,
      orderId,
    });

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
        console.log("Вагон освобожден");
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

        setPaymentData((prev) => ({
          ...prev,
          companyName: userData.companyName,
          inn: userData.inn,
        }));

        if (orderId) {
          const orderResponse = await fetchWithAuth(
            `http://localhost:8080/api/orders/${orderId}`
          );

          if (orderResponse.ok) {
            const orderData = await orderResponse.json();
            console.log("Данные заказа:", orderData);

            const price = orderData.totalPrice || 0;
            setOrderAmount(Number(price));
          } else {
            console.warn("Не удалось загрузить заказ, берем сумму из URL");
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
        setError(
          "Не удалось загрузить данные компании. Возможно, сессия истекла."
        );
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(createdPayment.payment_document);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Ошибка:", err);
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

      console.log("Тип amount:", typeof orderAmount, "Значение:", orderAmount);

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
        kpp: paymentData.kpp || null,
        bik: paymentData.bik,
        accountNumber: paymentData.accountNumber,
        correspondentAccount: paymentData.correspondentAccount || "",
        bankName: paymentData.bankName,
        paymentPurpose:
          paymentData.paymentPurpose ||
          `Оплата перевозки по заказу №${orderId.slice(0, 8)}`,
      };

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
        // ТОЛЬКО ПРИ ОШИБКЕ - отменяем бронь
        await cancelReservation();

        const errorText = await response.text();
        throw new Error(`Ошибка ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setCreatedPayment(data);
      setMessage(`✓ Платеж успешно создан!`);

      // НИЧЕГО НЕ ОТМЕНЯЕМ ПРИ УСПЕХЕ!
    } catch (err) {
      console.error("Ошибка:", err);
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

  if (profileLoading) {
    return (
      <div className="main-page">
        <div
          className="container"
          style={{ textAlign: "center", padding: "50px" }}
        >
          <div className="loading-spinner">Загрузка данных компании...</div>
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
            {/* Кнопка отмены брони - видна всегда, пока платеж не создан */}
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
            Платежные реквизиты
          </h2>

          {message && (
            <div
              style={{
                padding: "15px",
                background: "#d4edda",
                color: "#155724",
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

          {!createdPayment ? (
            <>
              {/* Информация о бронировании */}
              <div
                style={{
                  background: "#fff3cd",
                  color: "#856404",
                  padding: "10px 15px",
                  borderRadius: "5px",
                  marginBottom: "20px",
                  fontSize: "14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>⏳ Вагон забронирован на 30 минут</span>
                <button
                  onClick={cancelReservation}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#856404",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Отменить бронь
                </button>
              </div>

              <form onSubmit={handleSubmit} className="form-container">
                {/* Название компании */}
                <div className="form-group">
                  <label className="form-label">
                    Название компании <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={paymentData.companyName}
                    className="form-input"
                    readOnly
                    style={{ background: "#f0f0f0", fontWeight: "bold" }}
                  />
                  <small style={{ color: "#666" }}>Данные из профиля</small>
                </div>

                {/* ИНН и КПП */}
                <div style={{ display: "flex", gap: "20px" }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">
                      ИНН <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      value={paymentData.inn}
                      className="form-input"
                      readOnly
                      style={{ background: "#f0f0f0", fontWeight: "bold" }}
                    />
                    <small style={{ color: "#666" }}>Данные из профиля</small>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">КПП</label>
                    <input
                      type="text"
                      name="kpp"
                      value={paymentData.kpp}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="9 цифр (для юрлиц)"
                    />
                  </div>
                </div>

                {/* БИК и Расчетный счет */}
                <div style={{ display: "flex", gap: "20px" }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">
                      БИК <span className="required">*</span>
                    </label>
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
                    <label className="form-label">
                      Расчетный счет <span className="required">*</span>
                    </label>
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

                {/* Корр. счет и Банк */}
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

                <div className="form-group">
                  <label className="form-label">
                    Название банка <span className="required">*</span>
                  </label>
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

                {/* Сумма платежа */}
                <div className="form-group">
                  <label className="form-label">
                    Сумма к оплате <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={`${orderAmount.toLocaleString()} ₽`}
                    className="form-input"
                    readOnly
                    style={{
                      background: "#f0f0f0",
                      fontWeight: "bold",
                      color: "#0066cc",
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Назначение платежа <span className="required">*</span>
                  </label>
                  <textarea
                    name="paymentPurpose"
                    value={paymentData.paymentPurpose}
                    onChange={handleChange}
                    className="form-input"
                    rows="3"
                    placeholder="Опишите назначение платежа"
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
                    {loading ? "Создание..." : "Оплатить"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  background: "#f8f9fa",
                  padding: "25px",
                  borderRadius: "10px",
                  margin: "30px 0",
                }}
              >
                <p style={{ fontSize: "1.1rem", marginBottom: "15px" }}>
                  <strong>Номер платежного документа:</strong>
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    color: "#0066cc",
                    fontFamily: "monospace",
                    padding: "10px",
                    background: "white",
                    borderRadius: "5px",
                    border: "2px dashed #0066cc",
                  }}
                >
                  <span>{createdPayment.payment_document}</span>
                  <button
                    onClick={handleCopy}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: copied ? "#28a745" : "#0066cc",
                    }}
                  ></button>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  justifyContent: "center",
                }}
              >
                <button onClick={downloadInvoice} className="btn btn-primary">
                  Скачать счет
                </button>
                <button onClick={downloadContract} className="btn btn-primary">
                  Скачать договор
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="btn btn-outline"
                >
                  На главную
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
