import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./MainPage.css";

const MainPage = () => {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    if (refreshToken) {
      try {
        await fetch("http://localhost:8080/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (e) {
        console.error("Ошибка при логауте на сервере", e);
      }
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    setIsLoggedIn(false);
    alert("Вы успешно вышли из аккаунта");
  };

  const handleOrderClick = (e) => {
    e.preventDefault();

    const token = localStorage.getItem("accessToken");

    if (token) {
      navigate("/create-order");
    } else {
      alert("Для оформления заявки необходимо войти в аккаунт.");
      navigate("/login");
    }
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");
    if (token) {
      navigate("/profile");
    } else {
      alert("Для входа в личный кабинет необходимо авторизоваться.");
      navigate("/login");
    }
  };

  return (
    <div className="main-page">
      {/* Шапка сайта */}
      <header className="header">
        <div className="container header-container">
          <div className="logo">
            <img src="/logo.png" alt="РЖД Логотип" />
            <span className="logo-text">ОАО «РЖД»</span>
          </div>
          <nav className="main-nav">
            <ul className="nav-list">
              <li>
                <a href="#" className="active">
                  Грузовые перевозки
                </a>
              </li>
              <li>
                <Link to="/create-order" className="feature-link">
                  Оформление заявки
                </Link>
                {/* <a href="#">Оформление заявки</a> */}
              </li>
              <li>
                <Link to="/calculator" className="feature-link">
                  Калькулятор
                </Link>
              </li>
              <li>
                <Link to="/profile" className="feature-link">
                  Личный кабинет
                </Link>
              </li>
            </ul>
          </nav>
          <div className="header-actions">
            {isLoggedIn ? (
              <button className="btn btn-outline" onClick={handleLogout}>
                Выйти
              </button>
            ) : (
              <>
                <button
                  className="btn btn-outline"
                  onClick={() => navigate("/login")}
                >
                  Войти
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/register")}
                >
                  Регистрация
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="anniversary-section">
          <div className="container">
            <div className="anniversary-content">
              <h1 className="anniversary-title">
                90 лет центральному управлению движением
              </h1>
              <p className="anniversary-text">
                С 1936 года наш приоритет — бесперебойные и безопасные
                перевозки. Обеспечиваем высокую скорость и надёжность, чтобы
                доставить ваши грузы точно в срок
              </p>
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="container">
            <h2 className="section-title">
              Попробуйте функции Личного кабинета
            </h2>

            <div className="features-grid">
              <div className="feature-card">
                <h3 className="feature-title">Калькулятор</h3>
                <p className="feature-description">
                  Рассчитайте предварительную стоимость перевозки вашего груза.
                </p>
                <Link to="/calculator" className="feature-link">
                  Рассчитать →
                </Link>
              </div>

              <div className="feature-card">
                <h3 className="feature-title">Оформление заявки</h3>
                <p className="feature-description">
                  Воспользуйтесь удобным инструментом для оформления заявки.
                </p>

                <a
                  onClick={handleOrderClick}
                  className="feature-link"
                  style={{ cursor: "pointer" }}
                >
                  Перейти →
                </a>
              </div>

              <div className="feature-card">
                <h3 className="feature-title">Личный кабинет</h3>
                <p className="feature-description">
                  Ознакомьтесь с текущими заявками и профилем в личном кабинете.
                </p>
                <a
                  onClick={handleProfileClick}
                  className="feature-link"
                  style={{ cursor: "pointer" }}
                >
                  Перейти в кабинет →
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Грузовые перевозки</h4>
              <ul>
                <li>
                  <a href="#">Калькулятор</a>
                </li>
                <li>
                  <a href="#">Тарифы</a>
                </li>
                <li>
                  <a href="#">Документы</a>
                </li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Сервисы</h4>
              <ul>
                <li>
                  <a href="#">Личный кабинет</a>
                </li>
                <li>
                  <a href="#">Справочники</a>
                </li>
                <li>
                  <a href="#">Карта</a>
                </li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Контакты</h4>
              <p>8-800-XXX-XX-XX</p>
              <p>info@rzd.ru</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 ОАО «Российские железные дороги»</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainPage;
