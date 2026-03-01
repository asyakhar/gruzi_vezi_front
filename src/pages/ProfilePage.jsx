import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../api";
import "./MainPage.css";

const ProfilePage = () => {
  const navigate = useNavigate();

  // Состояния для хранения данных
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all"); // Фильтр по статусу

  // Загружаем данные при открытии страницы
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // 1. Запрашиваем инфу о пользователе
        const userResponse = await fetchWithAuth(
          "http://localhost:8080/api/user/me"
        );
        if (!userResponse.ok) throw new Error("Не удалось загрузить профиль");
        const userData = await userResponse.json();
        setUser(userData);

        // 2. Запрашиваем список заявок
        const ordersResponse = await fetchWithAuth(
          "http://localhost:8080/api/orders"
        );
        if (!ordersResponse.ok)
          throw new Error("Не удалось загрузить список заявок");
        const ordersData = await ordersResponse.json();
        setOrders(ordersData);
        setFilteredOrders(ordersData); // Изначально показываем все
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Фильтрация заявок при изменении фильтра или списка заказов
  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter((order) => order.status === statusFilter);
      setFilteredOrders(filtered);
    }
  }, [statusFilter, orders]);

  // Функция для красивого вывода статуса
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
      default:
        return (
          <span
            style={{
              background: "#e2e3e5",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            {status}
          </span>
        );
    }
  };

  // Получение статистики по статусам
  const getStatusStats = () => {
    const stats = {
      all: orders.length,
      черновик: orders.filter((o) => o.status === "черновик").length,
      поиск_вагона: orders.filter((o) => o.status === "поиск_вагона").length,
      ожидает_оплаты: orders.filter((o) => o.status === "ожидает_оплаты")
        .length,
      в_пути: orders.filter((o) => o.status === "в_пути").length,
      доставлен: orders.filter((o) => o.status === "доставлен").length,
    };
    return stats;
  };

  const stats = getStatusStats();

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
            <span className="logo-text">ОАО «РЖД» | Личный кабинет</span>
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
          style={{ textAlign: "left", marginBottom: "30px" }}
        >
          Мой профиль
        </h2>

        {loading ? (
          <p>Загрузка данных...</p>
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
            {/* Блок с информацией о компании */}
            <div
              style={{
                background: "#f8f9fa",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid #dee2e6",
              }}
            >
              <h3 style={{ marginBottom: "15px", color: "#e21a1a" }}>
                Данные компании
              </h3>
              <p>
                <strong>Название:</strong> {user?.companyName}
              </p>
              <p>
                <strong>ИНН:</strong> {user?.inn}
              </p>
              <p>
                <strong>Email:</strong> {user?.email}
              </p>
            </div>

            {/* Блок с заявками */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <h3 style={{ color: "#e21a1a" }}>Мои заявки</h3>

                {/* Фильтр по статусу */}
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
                    <option value="all">Все заявки ({stats.all})</option>
                    <option value="черновик">
                      Черновики ({stats.черновик})
                    </option>
                    <option value="поиск_вагона">
                      Поиск вагона ({stats.поиск_вагона})
                    </option>
                    <option value="ожидает_оплаты">
                      Ожидают оплаты ({stats.ожидает_оплаты})
                    </option>
                    <option value="в_пути">В пути ({stats.в_пути})</option>
                    <option value="доставлен">
                      Доставлены ({stats.доставлен})
                    </option>
                  </select>
                </div>
              </div>

              {orders.length === 0 ? (
                <p>У вас пока нет созданных заявок.</p>
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
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    background: "white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  <thead style={{ background: "#f1f3f5", textAlign: "left" }}>
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
                        Статус
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
                          {order.id || order.orderId || "—"}
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
                          {getStatusBadge(order.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Информация о количестве отображаемых заявок */}
              {filteredOrders.length > 0 && (
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
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfilePage;
