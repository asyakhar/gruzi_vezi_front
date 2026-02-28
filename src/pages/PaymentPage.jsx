import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./MainPage.css"; // Импортируем стили из MainPage

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);
  const orderId = searchParams.get("orderId");
  const wagonId = searchParams.get("wagonId");

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
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [createdPayment, setCreatedPayment] = useState(null);

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
      const token = localStorage.getItem("accessToken");

      // Логируем что отправляем
      console.log("orderId из URL:", orderId);
      console.log("Тип orderId:", typeof orderId);

      // Проверяем что orderId есть
      if (!orderId) {
        throw new Error("Не указан ID заказа в URL");
      }

      const payload = {
        orderId: orderId,
        amount: 150000.0,
        companyName: paymentData.companyName,
        inn: paymentData.inn,
        kpp: paymentData.kpp || null,
        bik: paymentData.bik,
        accountNumber: paymentData.accountNumber,
        correspondentAccount: paymentData.correspondentAccount || "",
        bankName: paymentData.bankName,
        paymentPurpose: paymentData.paymentPurpose,
      };

      console.log("Отправляемый payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(
        "http://localhost:8080/api/dispatcher/payments/corporate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Ответ сервера с ошибкой:", errorText);
        throw new Error(`Ошибка ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setCreatedPayment(data);
      setMessage(`Платеж успешно создан!`);
    } catch (err) {
      console.error("Полная ошибка:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `http://localhost:8080/api/dispatcher/payments/${createdPayment.id}/invoice`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ВАЖНО: получаем данные как blob, а не text
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Меняем расширение на .pdf
      a.download = `invoice_${createdPayment.paymentDocument || 'rzd'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      setError("Ошибка при скачивании PDF");
    }
  };

  // Добавляем проверку авторизации при загрузке
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Требуется авторизация. Перенаправление...");
      setTimeout(() => navigate("/login"), 2000);
    }
  }, [navigate]);

  return (
    <div className="main-page">
      <header className="header">
        <div className="container header-container">
          <div className="logo" onClick={() => navigate("/")}>
            <span className="logo-text">🚂 ОАО «РЖД» | Оплата перевозки</span>
          </div>
          <button className="btn btn-outline" onClick={() => navigate("/")}>
            На главную
          </button>
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

          {/* {message && (
            <div className="message success" style={{ marginBottom: "20px" }}>
              {message}
            </div>
          )} */}
          {message && ( // ДОБАВЬТЕ ЭТОТ БЛОК
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
            <div className="message error" style={{ marginBottom: "20px" }}>
              ❌ {error}
            </div>
          )}

          {!createdPayment ? (
            <form onSubmit={handleSubmit} className="form-container">
              <div className="form-group">
                <label className="form-label">
                  Название компании <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={paymentData.companyName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="ООО Ромашка"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">
                    ИНН <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="inn"
                    value={paymentData.inn}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="7701234567"
                    pattern="\d{10}|\d{12}"
                    title="ИНН должен содержать 10 или 12 цифр"
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">КПП</label>
                  <input
                    type="text"
                    name="kpp"
                    value={paymentData.kpp}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="770101001"
                    pattern="\d{9}"
                    title="КПП должен содержать 9 цифр"
                  />
                </div>
              </div>

              <div className="form-row">
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
                    placeholder="044525225"
                    pattern="\d{9}"
                    title="БИК должен содержать 9 цифр"
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
                    placeholder="40702810123450123456"
                    pattern="\d{20}"
                    title="Расчетный счет должен содержать 20 цифр"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Корреспондентский счет</label>
                <input
                  type="text"
                  name="correspondentAccount"
                  value={paymentData.correspondentAccount}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="30101810400000000225"
                  pattern="\d{20}"
                  title="Корр. счет должен содержать 20 цифр"
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
                  placeholder="ПАО СБЕРБАНК"
                  required
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
                  placeholder="Оплата грузовой перевозки по договору №РЖД-2026-123"
                  required
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ fontSize: "1.1rem", padding: "12px 30px" }}
                >
                  {loading ? "Создание..." : "Создать платеж"}
                </button>
              </div>
            </form>
          ) : (
            <div className="success-container" style={{ textAlign: "center" }}>
              {/* <div
                style={{
                  padding: "15px",
                  background: "#d4edda",
                  color: "#155724",
                  marginBottom: "20px",
                  borderRadius: "5px",
                  fontSize: "1.2rem",
                }}
              >
                ✅ Платеж создан успешно!
              </div> */}
              <div
                className="info-card"
                style={{
                  background: "#f8f9fa",
                  padding: "25px",
                  borderRadius: "10px",
                  margin: "30px 0",
                }}
              >
                <p style={{ fontSize: "1.1rem", marginBottom: "15px" }}>
                  <strong>Номер документа:</strong>
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center", // Текст по центру
                    position: "relative", // Чтобы кнопка не "убегала"
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    color: "#e31e24",
                    fontFamily: "monospace",
                    padding: "10px",
                    background: "white",
                    borderRadius: "5px",
                    border: "2px dashed #e31e24",
                  }}
                >
                  {/* Сам текст */}
                  <span>{createdPayment.payment_document}</span>

                  {/* Кнопка-иконка справа */}
                  <button
                    onClick={handleCopy}
                    title="Скопировать"
                    style={{
                      position: "absolute",
                      right: "10px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      color: copied ? "#28a745" : "#e31e24", // Зеленеет при успехе
                      transition: "color 0.2s",
                    }}
                  >
                    {copied ? (
                      // Иконка галочки
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      // Иконка копирования
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                        ></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  justifyContent: "center",
                  marginTop: "30px",
                }}
              >
                <button onClick={downloadInvoice} className="btn btn-primary">
                  Скачать платежное поручение
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
