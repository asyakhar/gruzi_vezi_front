import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../api";
import "./MainPage.css";

const ProfilePage = () => {
    const navigate = useNavigate();

    // Состояния для хранения данных
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Загружаем данные при открытии страницы
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                // 1. Запрашиваем инфу о пользователе
                const userResponse = await fetchWithAuth("http://localhost:8080/api/user/me");
                if (!userResponse.ok) throw new Error("Не удалось загрузить профиль");
                const userData = await userResponse.json();
                setUser(userData);

                // 2. Запрашиваем список заявок
                const ordersResponse = await fetchWithAuth("http://localhost:8080/api/orders");
                if (!ordersResponse.ok) throw new Error("Не удалось загрузить список заявок");
                const ordersData = await ordersResponse.json();
                setOrders(ordersData);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    // Функция для красивого вывода статуса
    const getStatusBadge = (status) => {
        switch (status) {
            case 'черновик': return <span style={{ color: '#856404', background: '#fff3cd', padding: '4px 8px', borderRadius: '4px' }}>Черновик</span>;
            case 'поиск_вагона': return <span style={{ color: '#004085', background: '#cce5ff', padding: '4px 8px', borderRadius: '4px' }}>Поиск вагона</span>;
            case 'ожидает_оплаты': return <span style={{ color: '#856404', background: '#ffeeba', padding: '4px 8px', borderRadius: '4px' }}>Ожидает оплаты</span>;
            default: return <span style={{ background: '#e2e3e5', padding: '4px 8px', borderRadius: '4px' }}>{status}</span>;
        }
    };

    return (
        <div className="main-page">
            <header className="header">
                <div className="container header-container">
                    <div className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                        <img src="/logo.png" alt="Логотип" />
                        <span className="logo-text">ОАО «РЖД» | Личный кабинет</span>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-outline" onClick={() => navigate("/")}>На главную</button>
                    </div>
                </div>
            </header>

            <main className="container" style={{ padding: "40px 0", maxWidth: "1000px", minHeight: "60vh" }}>
                <h2 className="section-title" style={{ textAlign: "left", marginBottom: "30px" }}>Мой профиль</h2>

                {loading ? (
                    <p>Загрузка данных...</p>
                ) : error ? (
                    <div style={{ color: "red", padding: "15px", background: "#f8d7da", borderRadius: "5px" }}>{error}</div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>

                        {/* Блок с информацией о компании */}
                        <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px", border: "1px solid #dee2e6" }}>
                            <h3 style={{ marginBottom: "15px", color: "#e21a1a" }}>Данные компании</h3>
                            <p><strong>Название:</strong> {user?.companyName}</p>
                            <p><strong>ИНН:</strong> {user?.inn}</p>
                            <p><strong>Email:</strong> {user?.email}</p>
                        </div>

                        {/* Блок с заявками */}
                        <div>
                            <h3 style={{ marginBottom: "15px", color: "#e21a1a" }}>Мои заявки</h3>

                            {orders.length === 0 ? (
                                <p>У вас пока нет созданных заявок.</p>
                            ) : (
                                <table style={{ width: "100%", borderCollapse: "collapse", background: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                                    <thead style={{ background: "#f1f3f5", textAlign: "left" }}>
                                        <tr>
                                            <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>№</th>
                                            <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Маршрут</th>
                                            <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Груз</th>
                                            <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Статус</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => (
                                            <tr key={order.id} style={{ borderBottom: "1px solid #dee2e6" }}>
                                                <td style={{ padding: "12px" }}>{order.orderId}</td>
                                                <td style={{ padding: "12px" }}>{order.departureStation} → {order.destinationStation}</td>
                                                <td style={{ padding: "12px" }}>{order.cargo?.cargoType} ({order.cargo?.weightKg} кг)</td>
                                                <td style={{ padding: "12px" }}>{getStatusBadge(order.status)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                    </div>
                )}
            </main>
        </div>
    );
};

export default ProfilePage;