import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../api";
import "./MainPage.css";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [fullProfile, setFullProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const profileResponse = await fetchWithAuth(
          "http://localhost:8080/api/user/profile"
        );
        if (!profileResponse.ok)
          throw new Error("Не удалось загрузить профиль");
        const profileData = await profileResponse.json();
        setFullProfile(profileData);
        setUserType(profileData.userType);

        const userResponse = await fetchWithAuth(
          "http://localhost:8080/api/user/me"
        );

        if (!userResponse.ok)
          throw new Error("Не удалось загрузить данные пользователя");
        const userData = await userResponse.json();
        setUser(userData);
        setUserRole(userData.role);

        const ordersResponse = await fetchWithAuth(
          "http://localhost:8080/api/orders"
        );
        if (!ordersResponse.ok)
          throw new Error("Не удалось загрузить список заявок");
        const ordersData = await ordersResponse.json();
        setOrders(ordersData);
        setFilteredOrders(ordersData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter((order) => order.status === statusFilter);
      setFilteredOrders(filtered);
    }
  }, [statusFilter, orders]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "черновик":
        return (
          <span
            style={{
              color: "#856404",
              background: "#fff3cd",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            Черновик
          </span>
        );
      case "поиск_вагона":
        return (
          <span
            style={{
              color: "#004085",
              background: "#cce5ff",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            Поиск вагона
          </span>
        );
      case "ожидает_оплаты":
        return (
          <span
            style={{
              color: "#856404",
              background: "#ffeeba",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            Ожидает оплаты
          </span>
        );
      case "в_пути":
        return (
          <span
            style={{
              color: "#155724",
              background: "#d4edda",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            В пути
          </span>
        );
      case "доставлен":
        return (
          <span
            style={{
              color: "#0c5460",
              background: "#d1ecf1",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            Доставлен
          </span>
        );
      case "оплачен":
        return (
          <span
            style={{
              background: "#28a745",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            Оплачен
          </span>
        );
      default:
        return (
          <span
            style={{
              background: "#6c757d",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            {status}
          </span>
        );
    }
  };

  const cancelOrder = async (orderId) => {
    if (
      !window.confirm(
        "Вы уверены, что хотите отменить заявку? Все изменения будут откачены."
      )
    )
      return;

    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `http://localhost:8080/api/orders/${orderId}/complete-cancel?withRefund=true`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ошибка при отмене");
      }

      alert("Заявка успешно отменена (JTA транзакция)");

      const ordersResponse = await fetchWithAuth(
        "http://localhost:8080/api/orders"
      );
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData);
        setFilteredOrders(ordersData);
      } else {
        window.location.reload();
      }
    } catch (err) {
      alert(`Ошибка: ${err.message}. Транзакция откатилась.`);
    }
  };
  const getStatusStats = () => {
    const stats = {
      all: orders.length,
      черновик: orders.filter((o) => o.status === "черновик").length,
      поиск_вагона: orders.filter((o) => o.status === "поиск_вагона").length,
      ожидает_оплаты: orders.filter((o) => o.status === "ожидает_оплаты")
        .length,
      оплачен: orders.filter((o) => o.status === "оплачен").length,
      в_пути: orders.filter((o) => o.status === "в_пути").length,
      доставлен: orders.filter((o) => o.status === "доставлен").length,
    };
    return stats;
  };

  const orderStats = getStatusStats();

  const renderUserInfo = () => {
    if (userType === "LEGAL_ENTITY") {
      return (
        <div
          style={{
            background: "#f8f9fa",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #dee2e6",
          }}
        >
          <h3 style={{ marginBottom: "15px", color: "#e21a1a" }}>
            Информация о компании
          </h3>
          <p>
            <strong>Название компании:</strong>{" "}
            {fullProfile?.companyName || user?.companyName}
          </p>
          <p>
            <strong>ИНН:</strong> {fullProfile?.inn || user?.inn}
          </p>
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
          <p>
            <strong>Тип аккаунта:</strong> Юридическое лицо
          </p>
        </div>
      );
    } else {
      return (
        <div
          style={{
            background: "#f8f9fa",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #dee2e6",
          }}
        >
          <h3 style={{ marginBottom: "15px", color: "#e21a1a" }}>
            Личная информация
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "15px",
            }}
          >
            <div>
              <strong>Фамилия:</strong> {fullProfile?.lastName || "—"}
            </div>
            <div>
              <strong>Имя:</strong> {fullProfile?.firstName || "—"}
            </div>
            <div>
              <strong>Отчество:</strong> {fullProfile?.patronymic || "—"}
            </div>
            <div>
              <strong>Телефон:</strong> {fullProfile?.phone || "—"}
            </div>
            <div>
              <strong>Email:</strong> {user?.email}
            </div>
            <div>
              <strong>ИНН:</strong> {fullProfile?.inn || "—"}
            </div>
            <div>
              <strong>СНИЛС:</strong> {fullProfile?.snils || "—"}
            </div>
            <div>
              <strong>Тип аккаунта:</strong> Физическое лицо
            </div>
          </div>

          <hr style={{ margin: "15px 0", borderColor: "#dee2e6" }} />

          <h4 style={{ marginBottom: "10px", color: "#e21a1a" }}>
            Паспортные данные
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <div>
              <strong>Серия:</strong> {fullProfile?.passportSeries || "—"}
            </div>
            <div>
              <strong>Номер:</strong> {fullProfile?.passportNumber || "—"}
            </div>
            <div>
              <strong>Кем выдан:</strong> {fullProfile?.passportIssuedBy || "—"}
            </div>
            <div>
              <strong>Дата выдачи:</strong>{" "}
              {fullProfile?.passportIssuedDate || "—"}
            </div>
          </div>

          <hr style={{ margin: "15px 0", borderColor: "#dee2e6" }} />

          <h4 style={{ marginBottom: "10px", color: "#e21a1a" }}>
            Адрес регистрации
          </h4>
          <p>{fullProfile?.registrationAddress || "—"}</p>
        </div>
      );
    }
  };

  const renderActionButtons = () => {
    console.log(userRole);
    if (userRole === "ADMIN") {
      return (
        <div
          style={{
            display: "flex",
            gap: "15px",
            marginBottom: "30px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => navigate("/admin")}
            className="btn btn-primary"
            style={{ background: "#e21a1a", borderColor: "#e21a1a" }}
          >
            Перейти в Панель Администратора
          </button>
          <button
            onClick={() => navigate("/create-order")}
            className="btn btn-outline"
          >
            Тестовая заявка
          </button>
        </div>
      );
    }

    if (userType === "LEGAL_ENTITY") {
      return (
        <div style={{ display: "flex", gap: "15px", marginBottom: "30px" }}>
          <button
            onClick={() => navigate("/create-order")}
            className="btn btn-primary"
          >
            Создать новую заявку
          </button>
          <button
            onClick={() => navigate("/calculator")}
            className="btn btn-outline"
          >
            Калькулятор стоимости
          </button>
        </div>
      );
    } else {
      return (
        <div
          style={{
            display: "flex",
            gap: "15px",
            marginBottom: "30px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => navigate("/create-order")}
            className="btn btn-primary"
          >
            Создать новую заявку
          </button>
          <button
            onClick={() => navigate("/calculator")}
            className="btn btn-outline"
          >
            Калькулятор стоимости
          </button>
          <button
            onClick={() => window.open("https://www.nalog.gov.ru", "_blank")}
            className="btn btn-outline"
            style={{ borderColor: "#28a745", color: "#28a745" }}
          >
            Проверить ИНН на сайте ФНС
          </button>
        </div>
      );
    }
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
            <img src="/logo.png" alt="Логотип" />
            <span className="logo-text">
              ОАО «РЖД» |{" "}
              {userType === "INDIVIDUAL"
                ? "Личный кабинет (ФЛ)"
                : "Личный кабинет (ЮЛ)"}
            </span>
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
        style={{ padding: "40px 0", maxWidth: "1200px", minHeight: "60vh" }}
      >
        <h2
          className="section-title"
          style={{ textAlign: "left", marginBottom: "20px" }}
        >
          Мой профиль
        </h2>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <div className="loading-spinner">Загрузка данных...</div>
          </div>
        ) : error ? (
          <div
            style={{
              color: "red",
              padding: "15px",
              background: "#f8d7da",
              borderRadius: "5px",
            }}
          >
            {error}
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "30px" }}
          >
            {renderUserInfo()}

            {renderActionButtons()}

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                  flexWrap: "wrap",
                  gap: "15px",
                }}
              >
                <h3 style={{ color: "#e21a1a" }}>Мои заявки</h3>

                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <span style={{ fontWeight: "500" }}>Фильтр:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                    style={{
                      padding: "8px 12px",
                      borderRadius: "4px",
                      border: "1px solid #dee2e6",
                      background: "white",
                      fontWeight: "500",
                      color: "#333333",
                      cursor: "pointer",
                    }}
                  >
                    <option value="all">Все заявки ({orderStats.all})</option>
                    <option value="черновик">
                      Черновики ({orderStats.черновик})
                    </option>
                    <option value="поиск_вагона">
                      Поиск вагона ({orderStats.поиск_вагона})
                    </option>
                    <option value="ожидает_оплаты">
                      Ожидает оплаты ({orderStats.ожидает_оплаты})
                    </option>
                    <option value="оплачен">
                      Оплачен ({orderStats.оплачен})
                    </option>
                    <option value="в_пути">В пути ({orderStats.в_пути})</option>
                    <option value="доставлен">
                      Доставлен ({orderStats.доставлен})
                    </option>
                  </select>
                </div>
              </div>

              {orders.length === 0 ? (
                <div
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    background: "#f8f9fa",
                    borderRadius: "8px",
                    border: "1px dashed #dee2e6",
                  }}
                >
                  <p
                    style={{
                      fontSize: "16px",
                      color: "#6c757d",
                      marginBottom: "15px",
                    }}
                  >
                    У вас пока нет созданных заявок
                  </p>
                  <button
                    onClick={() => navigate("/create-order")}
                    className="btn btn-primary"
                  >
                    Создать первую заявку
                  </button>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div
                  style={{
                    padding: "30px",
                    textAlign: "center",
                    background: "#f8f9fa",
                    borderRadius: "8px",
                    border: "1px dashed #dee2e6",
                  }}
                >
                  <p style={{ fontSize: "16px", color: "#6c757d" }}>
                    Нет заявок с выбранным статусом
                  </p>
                  <button
                    onClick={() => setStatusFilter("all")}
                    style={{
                      marginTop: "10px",
                      padding: "8px 16px",
                      background: "#e21a1a",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Показать все заявки
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        background: "white",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        minWidth: "600px",
                      }}
                    >
                      <thead
                        style={{ background: "#f1f3f5", textAlign: "left" }}
                      >
                        <tr>
                          <th
                            style={{
                              padding: "12px",
                              borderBottom: "2px solid #dee2e6",
                              width: "50px",
                            }}
                          >
                            #
                          </th>
                          <th
                            style={{
                              padding: "12px",
                              borderBottom: "2px solid #dee2e6",
                            }}
                          >
                            ID заявки
                          </th>
                          <th
                            style={{
                              padding: "12px",
                              borderBottom: "2px solid #dee2e6",
                            }}
                          >
                            Маршрут
                          </th>
                          <th
                            style={{
                              padding: "12px",
                              borderBottom: "2px solid #dee2e6",
                            }}
                          >
                            Груз
                          </th>
                          <th
                            style={{
                              padding: "12px",
                              borderBottom: "2px solid #dee2e6",
                            }}
                          >
                            Стоимость
                          </th>
                          <th
                            style={{
                              padding: "12px",
                              borderBottom: "2px solid #dee2e6",
                            }}
                          >
                            Статус
                          </th>
                          <th
                            style={{
                              padding: "12px",
                              borderBottom: "2px solid #dee2e6",
                            }}
                          >
                            Действия
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order, index) => (
                          <tr
                            key={order.id}
                            style={{ borderBottom: "1px solid #dee2e6" }}
                          >
                            <td
                              style={{
                                padding: "12px",
                                fontWeight: "bold",
                                color: "#6c757d",
                              }}
                            >
                              {index + 1}
                            </td>
                            <td
                              style={{
                                padding: "12px",
                                fontFamily: "monospace",
                                fontSize: "14px",
                              }}
                            >
                              {order.id?.substring(0, 8) || "—"}...
                            </td>
                            <td style={{ padding: "12px" }}>
                              {order.departureStation || "—"} →{" "}
                              {order.destinationStation || "—"}
                            </td>
                            <td style={{ padding: "12px" }}>
                              {order.cargo?.cargoType || "—"}
                              {order.cargo?.weightKg &&
                                ` (${order.cargo.weightKg} кг)`}
                            </td>
                            <td style={{ padding: "12px" }}>
                              {order.totalPrice
                                ? `${order.totalPrice.toLocaleString()} ₽`
                                : "—"}
                            </td>
                            <td style={{ padding: "12px" }}>
                              {getStatusBadge(order.status)}
                            </td>
                            <td style={{ padding: "12px" }}>
                              <button
                                onClick={() => cancelOrder(order.id)}
                                style={{
                                  background: "#dc3545",
                                  color: "white",
                                  border: "none",
                                  padding: "6px 12px",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                }}
                              >
                                Отменить
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div
                    style={{
                      marginTop: "15px",
                      padding: "10px",
                      background: "#f8f9fa",
                      borderRadius: "4px",
                      fontSize: "14px",
                      color: "#6c757d",
                      textAlign: "right",
                    }}
                  >
                    Показано {filteredOrders.length} из {orders.length} заявок
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfilePage;
