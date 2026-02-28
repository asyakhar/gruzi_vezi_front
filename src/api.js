//что-то для токенов 

export const fetchWithAuth = async (url, options = {}) => {
  // Достаем текущий короткий токен
  let accessToken = localStorage.getItem("accessToken");

  // Автоматически приклеиваем его к заголовкам запроса
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    "Authorization": `Bearer ${accessToken}`,
  };

  // 1. Делаем первую попытку запроса
  let response = await fetch(url, { ...options, headers });

  // 2. Если токен протух (бэкенд вернул 401)
  if (response.status === 401) {
    console.log("Access токен истек! Начинаем секретную операцию по обновлению...");
    
    const refreshToken = localStorage.getItem("refreshToken");
    
    if (refreshToken) {
      try {
        // 3. Идем к главному охраннику за новым токеном
        const refreshResponse = await fetch("http://localhost:8080/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken })
        });

        if (refreshResponse.ok) {
          // Ура! Нам дали новые токены
          const data = await refreshResponse.json();
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          console.log("Токены успешно обновлены!");

          // 4. Повторяем наш ИЗНАЧАЛЬНЫЙ запрос, но уже с НОВЫМ токеном
          headers["Authorization"] = `Bearer ${data.accessToken}`;
          response = await fetch(url, { ...options, headers });
        } else {
          // Рефреш-токен тоже протух - выкидываем на логин
          throw new Error("Refresh token expired");
        }
      } catch (err) {
        console.error("Не удалось обновить токен. Требуется авторизация.");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login"; // Принудительно кидаем на страницу входа
      }
    } else {
      // Рефреш-токена вообще нет
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
    }
  }

  // Возвращаем результат (успешный с первого раза, либо успешный со второго)
  return response;
};