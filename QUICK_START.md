# 🚀 Быстрый старт: Frontend + Backend

## Запуск за 3 шага

### 1️⃣ Запустите Backend

```bash
cd backend

# Создайте .env файл (если его нет)
cp .env.example .env

# Запустите Docker контейнеры
docker-compose up -d

# Проверьте статус
docker-compose ps
```

Backend будет доступен на http://localhost:8000

### 2️⃣ Запустите Frontend

```bash
cd frontend

# Установите зависимости (если еще не установлены)
npm install

# Запустите dev сервер
npm run dev
```

Frontend будет доступен на http://localhost:3000

### 3️⃣ Протестируйте

### Вариант A: Через веб-страницу (для тестирования)

1. Откройте http://localhost:8000/static/auth.html
2. Зарегистрируйте нового пользователя
3. Войдите с теми же данными

### Вариант B: Через расширение

1. Установите расширение в Chrome
2. Откройте Options Page (правый клик → Параметры)
3. В секции "Cloud Sync" укажите API URL: `http://localhost:8000`
4. Нажмите "Sign In / Register"
5. Зарегистрируйтесь или войдите
6. После успеха страница закроется, токен сохранится

## 📊 Проверка API

```bash
# Health check
curl http://localhost:8000/health

# API документация
open http://localhost:8000/docs
```

## 🛑 Остановка

```bash
# Остановить контейнеры
cd backend
docker-compose down

# Остановить с удалением данных (включая SQLite базу)
docker-compose down -v
```

## 📝 Логи

```bash
# Логи бэкенда
docker-compose logs -f api
```
