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
  const [profileLoading, setProfileLoading] = useState(true); // НОВОЕ
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [createdPayment, setCreatedPayment] = useState(null);

  // useEffect(() => {
  //   const loadUserProfile = async () => {
  //     try {
  //       const token = localStorage.getItem("accessToken");
  //       if (!token) {
  //         setError("Требуется авторизация");
  //         setTimeout(() => navigate("/login"), 2000);
  //         return;
  //       }

  //       // Загружаем профиль пользователя
  //       const response = await fetch("http://localhost:8080/api/user/profile", {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });

  //       if (!response.ok) {
  //         throw new Error("Ошибка загрузки профиля");
  //       }

  //       const userData = await response.json();

  //       // Заполняем данные из БД
  //       setPaymentData((prev) => ({
  //         ...prev,
  //         companyName: userData.companyName,
  //         inn: userData.inn,
  //       }));
  //       if (orderId) {
  //         const orderResponse = await fetch(
  //           `http://localhost:8080/api/orders/${orderId}`,
  //           {
  //             headers: { Authorization: `Bearer ${token}` },
  //           }
  //         );

  //         if (orderResponse.ok) {
  //           const orderData = await orderResponse.json();
  //           console.log("Данные заказа:", orderData); // Для отладки

  //           // Убедимся, что totalPrice - число
  //           const price = orderData.totalPrice || 0;
  //           setOrderAmount(Number(price));
  //         } else {
  //           console.warn("Не удалось загрузить заказ");
  //         }
  //       }
  //     } catch (err) {
  //       console.error("Ошибка загрузки профиля:", err);
  //       setError("Не удалось загрузить данные компании");
  //     } finally {
  //       setProfileLoading(false);
  //     }
  //   };

  //   loadUserProfile();
  // }, [navigate]);
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await fetchWithAuth("http://localhost:8080/api/user/profile");

        if (!response.ok) {
          throw new Error("Ошибка загрузки профиля");
        }

        const userData = await response.json();

        setPaymentData((prev) => ({
          ...prev,
          companyName: userData.companyName,
          inn: userData.inn,
        }));

        // ===== ИСПРАВЛЕНО: ЗАГРУЗКА ЗАКАЗА =====
        if (orderId) {
          const orderResponse = await fetch(
            `http://localhost:8080/api/orders/${orderId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (orderResponse.ok) {
            const orderData = await orderResponse.json();
            console.log("Данные заказа:", orderData); // Для отладки

            // Убедимся, что totalPrice - число
            const price = orderData.totalPrice || 0;
            setOrderAmount(Number(price));
          } else {
            console.warn("Не удалось загрузить заказ");
          }
        }
        // ===== КОНЕЦ ИСПРАВЛЕНИЯ =====
      } catch (err) {
        console.error("Ошибка загрузки профиля:", err);
        setError("Не удалось загрузить данные компании. Возможно, сессия истекла.");
        setTimeout(() => navigate("/login"), 2000); // Если даже умный запрос не справился - отправляем на логин
      } finally {
        setProfileLoading(false);
      }
    };

    loadUserProfile();
  }, [navigate, orderId]); // Добавить orderId в зависимости
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

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   setError(null);

  //   try {
  //     const token = localStorage.getItem("accessToken");

  //     console.log("orderId из URL:", orderId);

  //     if (!orderId) {
  //       throw new Error("Не указан ID заказа в URL");
  //     }
  //     console.log("Тип amount:", typeof orderAmount, "Значение:", orderAmount);
  //     const payload = {
  //       orderId: orderId,
  //       amount: Number(orderAmount),
  //       companyName: paymentData.companyName,
  //       inn: paymentData.inn,
  //       kpp: paymentData.kpp || null,
  //       bik: paymentData.bik,
  //       accountNumber: paymentData.accountNumber,
  //       correspondentAccount: paymentData.correspondentAccount || "",
  //       bankName: paymentData.bankName,
  //       paymentPurpose: paymentData.paymentPurpose,
  //     };

  //     console.log("Отправляемый payload:", JSON.stringify(payload, null, 2));

  //     const response = await fetch(
  //       "http://localhost:8080/api/dispatcher/payments/corporate",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${token}`,
  //         },
  //         body: JSON.stringify(payload),
  //       }
  //     );

  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       console.error("Ответ сервера с ошибкой:", errorText);
  //       throw new Error(`Ошибка ${response.status}: ${errorText}`);
  //     }

  //     const data = await response.json();
  //     setCreatedPayment(data);
  //     setMessage(`Платеж успешно создан!`);
  //   } catch (err) {
  //     console.error("Полная ошибка:", err);
  //     setError(err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");

      console.log("orderId из URL:", orderId);

      if (!orderId) {
        throw new Error("Не указан ID заказа в URL");
      }

      // ===== ИСПРАВЛЕНО: ПРОВЕРКА СУММЫ =====
      console.log("Тип amount:", typeof orderAmount, "Значение:", orderAmount);

      // Преобразуем в число с двумя знаками после запятой
      let amountValue = parseFloat(orderAmount);

      if (isNaN(amountValue) || amountValue <= 0) {
        // Если сумма не загрузилась, пробуем взять из URL
        const urlAmount = searchParams.get("amount");
        if (urlAmount) {
          amountValue = parseFloat(urlAmount);
        } else {
          throw new Error("Не удалось определить сумму платежа");
        }
      }
      // ===== КОНЕЦ ИСПРАВЛЕНИЯ =====

      const payload = {
        orderId: orderId,
        amount: amountValue, // теперь точно число
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

      const response = await fetchWithAuth(
        "http://localhost:8080/api/dispatcher/payments/corporate",
        {
          method: "POST",
          // Content-Type оставляем, чтобы сервер понял, что мы шлем JSON
          headers: { "Content-Type": "application/json" },
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
      // Никаких ручных токенов!
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

  const downloadContract = async (orderId) => {
    try {
      // Удалил ошибочный POST запрос с payload. 
      // Проверь, правильный ли URL у тебя на бэкенде для скачивания договора!
      const response = await fetchWithAuth(
        `http://localhost:8080/api/orders/${orderId}/contract`
      );

      if (!response.ok) throw new Error("Ошибка сервера при скачивании договора");

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
          <div>Загрузка данных компании...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-page">
      <header className="header">
        <div className="container header-container">
          <div className="logo" onClick={() => navigate("/")}>
            <img src="/logo.png" alt="РЖД Логотип" />
            <span className="logo-text">ОАО «РЖД» | Оплата перевозки</span>
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
            <div className="message error" style={{ marginBottom: "20px" }}>
              {error}
            </div>
          )}

          {!createdPayment ? (
            <form onSubmit={handleSubmit} className="form-container">
              {/* НАЗВАНИЕ КОМПАНИИ ИЗ БД - ТОЛЬКО ЧТЕНИЕ */}
              <div className="form-group">
                <label className="form-label">
                  Название компании <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={paymentData.companyName}
                  className="form-input"
                  readOnly
                  style={{
                    background: "#f0f0f0",
                    cursor: "not-allowed",
                    fontWeight: "bold",
                  }}
                />
                <small style={{ color: "#666" }}>Данные из профиля</small>
              </div>

              {/* ИНН ИЗ БД - ТОЛЬКО ЧТЕНИЕ */}
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">
                    ИНН <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={paymentData.inn}
                    className="form-input"
                    readOnly
                    style={{
                      background: "#f0f0f0",
                      cursor: "not-allowed",
                      fontWeight: "bold",
                    }}
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
                    pattern="\d{9}"
                    title="Введите 9 цифр"
                  />
                </div>
              </div>

              {/* ОСТАЛЬНЫЕ ПОЛЯ БЕЗ ИЗМЕНЕНИЙ */}
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
                    placeholder="9 цифр"
                    pattern="\d{9}"
                    title="Введите 9 цифр"
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
                    pattern="\d{20}"
                    title="Введите 20 цифр"
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
                  placeholder="20 цифр (если есть)"
                  pattern="\d{20}"
                  title="Введите 20 цифр"
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
                    justifyContent: "center",
                    position: "relative",
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
                  <span>{createdPayment.payment_document}</span>

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
                      color: copied ? "#28a745" : "#e31e24",
                      transition: "color 0.2s",
                    }}
                  >
                    {copied ? (
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
                <button onClick={() => downloadContract(orderId)}
                  className="btn btn-primary">
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
