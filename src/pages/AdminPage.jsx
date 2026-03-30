import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../api";
import "./MainPage.css";

const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("orders");

  const [allOrders, setAllOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [wagons, setWagons] = useState([]);

  const [loading, setLoading] = useState(true);

  const [newWagon, setNewWagon] = useState({
    wagonNumber: "",
    wagonType: "крытый",
    maxWeightKg: "",
    maxVolumeM3: "120",
    currentStation: "Москва-Товарная",
  });

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetchWithAuth("http://localhost:8080/api/user/me");
        if (!response.ok) throw new Error("Не авторизован");

        const data = await response.json();
        if (data.role !== "ADMIN") {
          alert("У вас нет прав для просмотра этой страницы");
          navigate("/profile");
        }
      } catch (e) {
        navigate("/login");
      }
    };
    checkAdmin();
  }, [navigate]);

  const fetchAllOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth("http://localhost:8080/api/admin/orders");
      if (response.ok) setAllOrders(await response.json());
    } catch (error) {
      console.error("Ошибка загрузки заявок:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth("http://localhost:8080/api/admin/users");
      if (response.ok) setUsers(await response.json());
    } catch (error) {
      console.error("Ошибка загрузки пользователей:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllWagons = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth("http://localhost:8080/api/admin/wagons");
      if (response.ok) setWagons(await response.json());
    } catch (error) {
      console.error("Ошибка загрузки вагонов:", error);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    if (activeTab === "orders") fetchAllOrders();
    if (activeTab === "users") fetchAllUsers();
    if (activeTab === "wagons") fetchAllWagons();
  }, [activeTab, fetchAllOrders, fetchAllUsers, fetchAllWagons]);

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8080/api/admin/orders/${orderId}/status?status=${newStatus}`,
        { method: "PUT" }
      );
      if (response.ok) {
        alert("Статус успешно обновлен!");
        fetchAllOrders();
      } else {
        alert("Ошибка при обновлении статуса");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Вы уверены, что хотите удалить этого пользователя?")) return;
    try {
      const response = await fetchWithAuth(`http://localhost:8080/api/admin/users/${userId}`, { method: "DELETE" });
      if (response.ok) fetchAllUsers();
      else alert("Ошибка при удалении");
    } catch (error) {
      console.error(error);
    }
  };


  const handleAddWagon = async (e) => {
    e.preventDefault();
    try {
      const response = await fetchWithAuth("http://localhost:8080/api/admin/wagons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWagon)
      });
      if (response.ok) {
        alert("Вагон успешно добавлен");
        setNewWagon({ wagonNumber: "", wagonType: "крытый", maxWeightKg: "", maxVolumeM3: "120", currentStation: "Москва-Товарная", status: "свободен" });
        fetchAllWagons();
      } else {
        alert("Ошибка при добавлении вагона");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleWagonStatusChange = async (wagonId, newStatus) => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8080/api/admin/wagons/${wagonId}/status?status=${newStatus}`,
        { method: "PUT" }
      );
      if (response.ok) fetchAllWagons();
      else alert("Ошибка обновления статуса вагона");
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteWagon = async (wagonId) => {
    if (!window.confirm("Удалить вагон?")) return;
    try {
      const response = await fetchWithAuth(`http://localhost:8080/api/admin/wagons/${wagonId}`, { method: "DELETE" });
      if (response.ok) fetchAllWagons();
      else alert("Ошибка при удалении");
    } catch (error) {
      console.error(error);
    }
  };


  const renderContent = () => {
    switch (activeTab) {
      case "orders":
        return (
          <div>
            <h3 style={{ marginBottom: "20px", color: "#e21a1a" }}>Управление всеми заявками</h3>
            {loading ? <p>Загрузка данных...</p> : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "#f1f3f5", textAlign: "left" }}>
                    <tr>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>ID / Клиент</th>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Маршрут</th>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Текущий статус</th>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allOrders.map((order) => (
                      <tr key={order.id} style={{ borderBottom: "1px solid #dee2e6" }}>
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#6c757d" }}>{order.id.substring(0, 8)}...</div>
                          <div style={{ fontWeight: "500" }}>{order.userEmail || "Клиент"}</div>
                        </td>
                        <td style={{ padding: "12px" }}>{order.departureStation} → {order.destinationStation}</td>
                        <td style={{ padding: "12px", fontWeight: "bold" }}>{order.status}</td>
                        <td style={{ padding: "12px" }}>
                          <select
                            value={order.status}
                            onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                            style={{ padding: "6px", borderRadius: "4px" }}
                          >
                            <option value="черновик">Черновик</option>
                            <option value="поиск_вагона">Поиск вагона</option>
                            <option value="ожидает_оплаты">Ожидает оплаты</option>
                            <option value="в_пути">В пути</option>
                            <option value="доставлен">Доставлен</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case "users":
        return (
          <div>
            <h3 style={{ marginBottom: "20px", color: "#e21a1a" }}>Пользователи системы</h3>
            {loading ? <p>Загрузка...</p> : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "#f1f3f5", textAlign: "left" }}>
                    <tr>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Компания / ИНН</th>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Email</th>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Роль</th>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} style={{ borderBottom: "1px solid #dee2e6" }}>
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontWeight: "bold" }}>{user.companyName}</div>
                          <div style={{ fontSize: "12px", color: "#6c757d" }}>ИНН: {user.inn}</div>
                        </td>
                        <td style={{ padding: "12px" }}>{user.email}</td>
                        <td style={{ padding: "12px", fontWeight: "bold", color: user.role === 'ADMIN' ? '#e21a1a' : '#333' }}>
                          {user.role}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            style={{ background: "#dc3545", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case "wagons":
        return (
          <div>
            <h3 style={{ marginBottom: "20px", color: "#e21a1a" }}>Управление вагонами</h3>

            {/* Форма добавления вагона */}
            <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #dee2e6" }}>
              <h4 style={{ marginTop: 0 }}>Добавить новый вагон</h4>
              <form onSubmit={handleAddWagon} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <input
                  type="text" placeholder="Номер вагона" required
                  value={newWagon.wagonNumber} onChange={e => setNewWagon({ ...newWagon, wagonNumber: e.target.value })}
                  style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                />

                {/* Обновленный список типов вагонов */}
                <select
                  value={newWagon.wagonType} onChange={e => setNewWagon({ ...newWagon, wagonType: e.target.value })}
                  style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                >
                  <option value="крытый">крытый</option>
                  <option value="полувагон">полувагон</option>
                  <option value="платформа">платформа</option>
                  <option value="цистерна">цистерна</option>
                  <option value="рефрижератор">рефрижератор</option>
                </select>

                <input
                  type="number" placeholder="Вес (кг)" required
                  value={newWagon.maxWeightKg} onChange={e => setNewWagon({ ...newWagon, maxWeightKg: e.target.value })}
                  style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", width: "100px" }}
                />
                <input
                  type="number" placeholder="Объем (м3)" required
                  value={newWagon.maxVolumeM3} onChange={e => setNewWagon({ ...newWagon, maxVolumeM3: e.target.value })}
                  style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", width: "100px" }}
                />
                <input
                  type="text" placeholder="Станция" required
                  value={newWagon.currentStation} onChange={e => setNewWagon({ ...newWagon, currentStation: e.target.value })}
                  style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                />
                <button type="submit" style={{ background: "#e21a1a", color: "white", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer" }}>
                  Добавить вагон
                </button>
              </form>
            </div>

            {/* Таблица вагонов */}
            {loading ? <p>Загрузка...</p> : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "#f1f3f5", textAlign: "left" }}>
                    <tr>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Номер</th>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Тип</th>
                      {/* Заменили грузоподъемность на станцию */}
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Текущая станция</th>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Статус</th>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wagons.map((wagon) => (
                      <tr key={wagon.id} style={{ borderBottom: "1px solid #dee2e6" }}>
                        <td style={{ padding: "12px", fontWeight: "bold" }}>{wagon.wagonNumber}</td>
                        <td style={{ padding: "12px" }}>{wagon.wagonType}</td>
                        {/* Выводим станцию вместо веса */}
                        <td style={{ padding: "12px" }}>{wagon.currentStation}</td>
                        <td style={{ padding: "12px" }}>
                          <select
                            value={wagon.status}
                            onChange={(e) => handleWagonStatusChange(wagon.id, e.target.value)}
                            style={{ padding: "6px", borderRadius: "4px" }}
                          >
                            <option value="свободен">Свободен</option>
                            <option value="в_пути">В пути</option>
                            <option value="на_ремонте">На ремонте</option>
                            <option value="забронирован">Забронирован</option>
                          </select>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <button
                            onClick={() => handleDeleteWagon(wagon.id)}
                            style={{ background: "#dc3545", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      default: return <div>Выберите раздел</div>;
    }
  };

  return (
    <div className="main-page">
      <header className="header">
        <div className="container header-container">
          <div className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <img src="/logo.png" alt="Логотип" />
            <span className="logo-text">ОАО «РЖД» | Админ-панель</span>
          </div>
          <button className="btn btn-outline" onClick={() => navigate("/profile")}>Вернуться в профиль</button>
        </div>
      </header>

      <main className="container" style={{ display: "flex", flex: 1, padding: "20px 0", gap: "20px" }}>
        <aside style={{ width: "250px", background: "#f8f9fa", borderRadius: "8px", padding: "20px", border: "1px solid #dee2e6", height: "fit-content" }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
            {["orders", "users", "wagons"].map(tab => (
              <li key={tab}>
                <button
                  onClick={() => setActiveTab(tab)}
                  style={{ width: "100%", padding: "10px", textAlign: "left", background: activeTab === tab ? "#e21a1a" : "transparent", color: activeTab === tab ? "white" : "#333", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "500" }}
                >
                  {tab === "orders" ? "Все заявки" : tab === "users" ? "Пользователи" : "Вагоны"}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section style={{ flex: 1, background: "white", borderRadius: "8px", padding: "30px", border: "1px solid #dee2e6", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
          {renderContent()}
        </section>
      </main>
    </div>
  );
};

export default AdminPage;