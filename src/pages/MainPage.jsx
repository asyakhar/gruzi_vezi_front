import React from "react";
import "./MainPage.css";
import { Link } from "react-router-dom";

const MainPage = () => {
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
                <a href="#">Компания</a>
              </li>
              <li>
                <a href="#">Пресс-центр</a>
              </li>
              <li>
                <a href="#">Контакты</a>
              </li>
            </ul>
          </nav>
          <div className="header-actions">
            <button className="btn btn-outline">Войти</button>
            <button className="btn btn-primary">Регистрация</button>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main>
        {/* Блок с юбилеем */}
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

        {/* Блок с функциями личного кабинета */}
        <section className="features-section">
          <div className="container">
            <h2 className="section-title">
              Попробуйте функции Личного кабинета
            </h2>

            <div className="features-grid">
              {/* Карточка 1 - Калькулятор */}
              <div className="feature-card">
                <h3 className="feature-title">Калькулятор</h3>
                <p className="feature-description">
                  Рассчитайте предварительную стоимость перевозки вашего груза.
                </p>
                <a href="#" className="feature-link">
                  Рассчитать →
                </a>
              </div>

              {/* Карточка 2 - Интерактивная карта */}
              <div className="feature-card">
                <h3 className="feature-title">Интерактивная карта</h3>
                <p className="feature-description">
                  Получите информацию об объектах инфраструктуры ОАО «РЖД»,
                  загруженности участков дорог и портов.
                </p>
                <a href="#" className="feature-link">
                  Открыть карту →
                </a>
              </div>

              {/* Карточка 3 - Справочники */}
              <div className="feature-card">
                <h3 className="feature-title">Оформление заявки</h3>
                <p className="feature-description">
                  Воспользуйтесь удобным инструментом для оформления заявки.
                </p>
                <Link to="/create-order" className="feature-link">Перейти →</Link>
              </div>

              {/* Карточка 4 - О кабинете */}
              <div className="feature-card">
                <h3 className="feature-title">О кабинете</h3>
                <p className="feature-description">
                  Ознакомьтесь с инструкциями и презентациями и узнайте больше о
                  работе с Личным кабинетом.
                </p>
                <a href="#" className="feature-link">
                  Узнать больше →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Форма поиска грузоперевозки (ключевая для бизнес-процесса) */}
        <section className="cargo-search-section">
          <div className="container">
            <div className="search-form">
              <h3 className="search-form-title">Грузовые перевозки</h3>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Станция отправления"
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Станция назначения"
                  className="form-input"
                />
                <input type="date" placeholder="Дата" className="form-input" />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Груз (код или наименование)"
                  className="form-input"
                />
                <input
                  type="number"
                  placeholder="Вес (т)"
                  className="form-input"
                />
                <button className="btn btn-primary btn-large">Найти</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Подвал */}
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
