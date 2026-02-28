import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
        orderId: orderId, // Это должно быть строкой вида "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33"
        amount: 150000.0,
        companyName: paymentData.companyName,
        inn: paymentData.inn,
        kpp: paymentData.kpp || null,
        bik: paymentData.bik,
        accountNumber: paymentData.accountNumber,
        correspondentAccount: paymentData.correspondentAccount || "", // Пустая строка если не ввели
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
      setMessage(`Платеж создан! Номер документа: ${data.payment_document}`);
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

      const text = await response.text();

      // Создаем файл для скачивания
      const blob = new Blob([text], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payment_${createdPayment.payment_document}.txt`;
      a.click();
    } catch (err) {
      setError("Ошибка при скачивании");
    }
  };

  return (
    <div className="main-page">
      <header className="header">
        <div className="container header-container">
          <div className="logo" onClick={() => navigate("/")}>
            <span className="logo-text">ОАО «РЖД» | Оплата</span>
          </div>
        </div>
      </header>

      <main
        className="container"
        style={{ maxWidth: "800px", padding: "40px 0" }}
      >
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
            ❌ {error}
          </div>
        )}

        {!createdPayment ? (
          <form onSubmit={handleSubmit}>
            <h2>Платежные реквизиты</h2>

            <div style={{ marginBottom: "15px" }}>
              <label>Название компании *</label>
              <input
                type="text"
                name="companyName"
                value={paymentData.companyName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
              <div style={{ flex: 1 }}>
                <label>ИНН *</label>
                <input
                  type="text"
                  name="inn"
                  value={paymentData.inn}
                  onChange={handleChange}
                  pattern="\d{10}|\d{12}"
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>КПП</label>
                <input
                  type="text"
                  name="kpp"
                  value={paymentData.kpp}
                  onChange={handleChange}
                  pattern="\d{9}"
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
              <div style={{ flex: 1 }}>
                <label>БИК *</label>
                <input
                  type="text"
                  name="bik"
                  value={paymentData.bik}
                  onChange={handleChange}
                  pattern="\d{9}"
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Расчетный счет *</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={paymentData.accountNumber}
                  onChange={handleChange}
                  pattern="\d{20}"
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label>Название банка *</label>
              <input
                type="text"
                name="bankName"
                value={paymentData.bankName}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label>Назначение платежа *</label>
              <textarea
                name="paymentPurpose"
                value={paymentData.paymentPurpose}
                onChange={handleChange}
                rows="2"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Создание..." : "Создать платеж"}
            </button>
          </form>
        ) : (
          <div>
            <h3>Платеж создан успешно!</h3>
            <p>
              Номер документа:{" "}
              <strong>{createdPayment.payment_document}</strong>
            </p>
            <p>Статус: {createdPayment.status}</p>

            <div style={{ display: "flex", gap: "20px", marginTop: "30px" }}>
              <button onClick={downloadInvoice} className="btn btn-primary">
                📄 Скачать платежное поручение
              </button>
              <button onClick={() => navigate("/")} className="btn btn-outline">
                На главную
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PaymentPage;
