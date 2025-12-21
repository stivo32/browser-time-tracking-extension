# 🧪 Тестирование связки Frontend и Backend

## 📋 Предварительные требования

- Docker и Docker Compose
- Node.js 18+ (для фронтенда)
- npm или yarn

## 🚀 Быстрый старт

### 1. Запуск Backend в Docker

```bash
cd backend

# Создайте .env файл (если его нет)
cp .env.example .env

# Запустите бэкенд и базу данных
docker-compose up -d

# Проверьте, что все запустилось
docker-compose ps

# Посмотрите логи
docker-compose logs -f api
```

### 2. Проверка Backend

После запуска бэкенд будет доступен по адресу:
- **API**: http://localhost:8000
- **Health Check**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs

Проверьте, что API работает:
```bash
curl http://localhost:8000/health
# Должен вернуть: {"status":"healthy"}
```

### 3. Запуск Frontend

```bash
cd frontend

# Установите зависимости
npm install

# Запустите dev сервер
npm run dev
```

Frontend будет доступен по адресу:
- **Frontend**: http://localhost:3000

### 4. Тестирование регистрации и логина

#### Вариант A: Через веб-страницу на сервере

1. Откройте http://localhost:8000/static/auth.html
2. Перейдите на вкладку "Register"
3. Заполните форму:
   - Email: `test@example.com`
   - Password: `password123` (минимум 8 символов)
   - Full Name: `Test User` (опционально)
4. Нажмите "Create Account"
5. Должно появиться сообщение об успешной регистрации

#### Вариант B: Через расширение

**📖 Подробная инструкция: см. файл `HOW_TO_OPEN_OPTIONS_PAGE.md`**

**Краткая версия:**

1. **Установите расширение:**
   - Откройте `chrome://extensions/`
   - Включите "Режим разработчика"
   - Нажмите "Загрузить распакованное расширение"
   - Выберите папку `dist/`

2. **Откройте Options Page:**
   - Найдите иконку расширения в панели инструментов (справа вверху)
   - **Правый клик** на иконке → выберите **"Параметры"** (Options)
   - ИЛИ откройте `chrome://extensions/` → найдите расширение → "Подробности" → "Параметры расширения"

3. **Настройте и авторизуйтесь:**
   - В секции **"Cloud Sync"** введите API URL: `http://localhost:8000`
   - Нажмите **"Sign In / Register"**
   - Откроется веб-страница авторизации
   - После успеха страница закроется, токен сохранится

#### Вариант C: Через тестовый фронтенд (React)

1. Откройте http://localhost:3000
2. Используйте формы для тестирования API

## 🔍 Проверка работы

### Проверка базы данных

```bash
# Подключитесь к SQLite базе данных
docker-compose exec api sqlite3 /app/data/app.db

# Проверьте таблицы
.tables

# Проверьте пользователей
SELECT id, email, full_name, is_active, created_at FROM users;

# Проверьте сессии аутентификации
SELECT id, user_id, session_token, expires_at, created_at FROM auth_sessions;

# Выход
.quit
```

Или используйте Python для проверки:
```bash
docker-compose exec api python -c "
from src.db.database import async_session_maker
from src.db.models import User, AuthSession
import asyncio

async def check_db():
    async with async_session_maker() as session:
        from sqlalchemy import select
        result = await session.execute(select(User))
        users = result.scalars().all()
        print(f'Users: {len(users)}')
        for user in users:
            print(f'  - {user.email}')

asyncio.run(check_db())
"
```

### Проверка API через curl

```bash
# Регистрация
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "password123",
    "full_name": "Test User 2"
  }'

# Логин
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "password123"
  }'

# Получить текущего пользователя (замените SESSION_TOKEN на токен из ответа логина)
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "X-Session-Token: SESSION_TOKEN"
```

## 🛠️ Устранение проблем

### Backend не запускается

1. Проверьте логи:
   ```bash
   docker-compose logs api
   ```

2. Проверьте, что контейнер запущен:
   ```bash
   docker-compose ps
   ```

3. Проверьте миграции:
   ```bash
   docker-compose exec api alembic current
   docker-compose exec api alembic upgrade head
   ```

### Frontend не подключается к Backend

1. Проверьте, что бэкенд запущен:
   ```bash
   curl http://localhost:8000/health
   ```

2. Проверьте CORS настройки в `backend/src/main.py`

3. Проверьте переменную окружения `VITE_API_URL` в фронтенде

### Ошибки базы данных

1. Пересоздайте базу данных:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

2. Запустите миграции вручную:
   ```bash
   docker-compose exec api alembic upgrade head
   ```

3. Проверьте файл базы данных:
   ```bash
   docker-compose exec api ls -la /app/data/
   ```

## 📝 Структура проекта

```
backend/
├── docker-compose.yml      # Docker Compose конфигурация
├── Dockerfile              # Docker образ для бэкенда
├── docker-entrypoint.sh   # Скрипт запуска миграций
├── .env.example           # Пример переменных окружения
└── src/
    └── main.py            # FastAPI приложение

frontend/
├── vite.config.js         # Vite конфигурация с proxy
├── src/
│   ├── config/
│   │   └── api.js         # Конфигурация API
│   ├── api/
│   │   ├── client.js      # HTTP клиент
│   │   └── auth.js        # API для аутентификации
│   ├── components/
│   │   ├── RegisterForm.jsx
│   │   └── LoginForm.jsx
│   └── App.jsx            # Главный компонент
```

## 🎯 Следующие шаги

После успешного тестирования регистрации и логина:

1. ✅ Протестируйте другие endpoints (sessions, domains)
2. ✅ Добавьте обработку ошибок
3. ✅ Добавьте валидацию форм
4. ✅ Добавьте роутинг (React Router)
5. ✅ Добавьте защиту роутов

## 🔐 Безопасность

⚠️ **Важно**: В production обязательно:
- Измените `SECRET_KEY` на случайный секретный ключ
- Настройте правильные CORS origins
- Используйте HTTPS
- Настройте переменные окружения через `.env` файл
