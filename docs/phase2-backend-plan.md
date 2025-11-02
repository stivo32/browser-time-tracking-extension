# План разработки Backend API (Фаза 2)

## Обзор

Данный план описывает разработку backend API для Browser Time Tracking Extension в рамках Фазы 2 (Cloud & Premium). 

**Цель**: Создать полнофункциональный backend API для облачной синхронизации данных с аутентификацией пользователей.

**Длительность**: Sprint 5-6 (4 недели)
**Задачи из backlog**: BTE-011, BTE-012, BTE-013

## Архитектура Backend

### Технологический стек
- **Python**: 3.12
- **Framework**: FastAPI
- **Validation**: Pydantic v2
- **Database**: SQLite (для MVP, возможность миграции на PostgreSQL)
- **Migrations**: Alembic
- **Testing**: pytest + httpx AsyncClient
- **Formatting**: Black
- **Linting**: Ruff

### Структура проекта

```
backend/
├── src/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Конфигурация (настройки из env)
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py         # Database connection & session
│   │   ├── base.py             # Base model для SQLAlchemy
│   │   └── models.py           # SQLAlchemy models (User, Session, Domain, etc.)
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py             # Pydantic schemas для User
│   │   ├── session.py          # Pydantic schemas для Session
│   │   ├── domain.py           # Pydantic schemas для Domain
│   │   └── auth.py             # Pydantic schemas для аутентификации
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py             # Dependencies (get_current_user, etc.)
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py       # Основной router v1
│   │   │   ├── auth.py         # Эндпоинты аутентификации
│   │   │   ├── users.py         # Эндпоинты пользователей
│   │   │   ├── sessions.py     # Эндпоинты сессий
│   │   │   └── domains.py      # Эндпоинты доменов
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth.py             # Сервис аутентификации (session-based, password hashing)
│   │   ├── user.py             # Бизнес-логика пользователей
│   │   ├── session.py          # Бизнес-логика сессий
│   │   └── domain.py           # Бизнес-логика доменов
│   └── utils/
│       ├── __init__.py
│       └── security.py         # Утилиты безопасности (password hashing, session tokens)
├── tests/
│   ├── __init__.py
│   ├── conftest.py             # pytest fixtures (db, client, test_user)
│   ├── test_auth.py            # Тесты аутентификации
│   ├── test_users.py           # Тесты пользователей
│   ├── test_sessions.py        # Тесты сессий
│   ├── test_domains.py         # Тесты доменов
│   └── test_api_integration.py # Интеграционные тесты
├── migrations/
│   └── versions/               # Alembic migrations
├── alembic.ini                  # Alembic конфигурация
├── .env.example                 # Пример переменных окружения
├── pyproject.toml               # Уже существует
└── requirements.txt             # Уже существует
```

## Модели данных

### User Model
```python
- id: UUID (primary key)
- email: str (unique, indexed)
- hashed_password: str
- full_name: str | None
- is_active: bool (default=True)
- is_premium: bool (default=False)
- created_at: datetime
- updated_at: datetime
```

### AuthSession Model (для аутентификации)
```python
- id: UUID (primary key)
- user_id: UUID (foreign key -> User)
- session_token: str (unique, indexed)
- expires_at: datetime (indexed)
- created_at: datetime
- last_used_at: datetime
```

### Session Model (для данных трекинга)
```python
- id: UUID (primary key)
- user_id: UUID (foreign key -> User)
- date: date (indexed)
- created_at: datetime
- updated_at: datetime
```

### Domain Model
```python
- id: UUID (primary key)
- user_id: UUID (foreign key -> User)
- session_id: UUID (foreign key -> Session)
- domain: str (indexed)
- total_time: int (секунды)
- category: str | None
- custom_name: str | None
- created_at: datetime
- updated_at: datetime
```

### Page Model
```python
- id: UUID (primary key)
- domain_id: UUID (foreign key -> Domain)
- url: str
- time: int (секунды)
- title: str | None
- created_at: datetime
- updated_at: datetime
```

## API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - Регистрация нового пользователя
- `POST /login` - Вход (возвращает session_token)
- `POST /logout` - Выход (удаление сессии)
- `GET /me` - Получить текущего пользователя

### Users (`/api/v1/users`)
- `GET /me` - Профиль текущего пользователя
- `PATCH /me` - Обновление профиля
- `DELETE /me` - Удаление аккаунта

### Sessions (`/api/v1/sessions`)
- `GET /` - Список сессий трекинга с пагинацией
- `GET /{session_id}` - Детали сессии трекинга
- `POST /` - Создание новой сессии трекинга
- `PUT /{session_id}` - Обновление сессии трекинга
- `DELETE /{session_id}` - Удаление сессии трекинга
- `GET /sync` - Синхронизация (получение последних изменений)

### Domains (`/api/v1/domains`)
- `GET /` - Список доменов с фильтрацией
- `GET /{domain_id}` - Детали домена
- `PUT /{domain_id}` - Обновление домена (категория, custom_name)
- `GET /stats` - Агрегированная статистика по доменам

## План реализации по шагам

### Шаг 1: Базовая структура и конфигурация (4-6h)

**Файлы для создания**:
1. `backend/src/main.py` - FastAPI app с базовой структурой
2. `backend/src/config.py` - Конфигурация (настройки из переменных окружения)
3. `backend/src/db/__init__.py`
4. `backend/src/db/database.py` - Database connection, session factory
5. `backend/src/db/base.py` - Base model
6. `backend/.env.example` - Пример переменных окружения
7. `backend/alembic.ini` - Конфигурация Alembic

**Что делаем**:
- Настройка FastAPI приложения
- Настройка SQLAlchemy с async поддержкой
- Настройка Alembic
- Конфигурация из переменных окружения (DATABASE_URL, SECRET_KEY, etc.)

### Шаг 2: Модели базы данных (6-8h)

**Файлы для создания**:
1. `backend/src/db/models.py` - Все SQLAlchemy модели (User, AuthSession, Session, Domain, Page)
2. Миграция: `backend/migrations/versions/001_initial_tables.py`

**Что делаем**:
- Определение всех моделей
- AuthSession модель для session-based аутентификации
- Связи между моделями (foreign keys, relationships)
- Индексы для оптимизации запросов (особенно для session_token и expires_at)
- Создание первой миграции

**Тесты**:
- `backend/tests/test_models.py` - Тесты моделей и их связей

### Шаг 3: Pydantic схемы (4h)

**Файлы для создания**:
1. `backend/src/schemas/__init__.py`
2. `backend/src/schemas/auth.py` - Token, TokenData, Login, Register
3. `backend/src/schemas/user.py` - User, UserCreate, UserUpdate
4. `backend/src/schemas/session.py` - Session, SessionCreate, SessionUpdate
5. `backend/src/schemas/domain.py` - Domain, DomainCreate, DomainUpdate, DomainStats

**Что делаем**:
- Определение всех Pydantic схем для валидации
- Схемы для создания, обновления, ответов
- Валидация данных

**Тесты**:
- `backend/tests/test_schemas.py` - Тесты валидации схем

### Шаг 4: Утилиты безопасности (3h)

**Файлы для создания**:
1. `backend/src/utils/__init__.py`
2. `backend/src/utils/security.py` - password hashing, session token generation

**Что делаем**:
- Функции для хеширования паролей (passlib)
- Генерация случайных session токенов (secrets.token_urlsafe)
- Валидация сессий (проверка истечения)

**Тесты**:
- `backend/tests/test_security.py` - Тесты безопасности

### Шаг 5: Сервис аутентификации (6h)

**Файлы для создания**:
1. `backend/src/services/__init__.py`
2. `backend/src/services/auth.py` - Аутентификация пользователей
3. `backend/src/services/user.py` - CRUD операции для пользователей
4. `backend/src/services/session_auth.py` - Управление сессиями аутентификации

**Что делаем**:
- Регистрация пользователей
- Вход в систему (верификация пароля, создание AuthSession в БД)
- Получение текущего пользователя по session_token
- Удаление сессии при logout
- Очистка истекших сессий

**Тесты**:
- `backend/tests/test_auth.py` - Тесты аутентификации
- `backend/tests/test_users.py` - Тесты пользователей
- `backend/tests/test_session_auth.py` - Тесты управления сессиями

### Шаг 6: API Dependencies (3h)

**Файлы для создания**:
1. `backend/src/api/deps.py` - Dependencies для FastAPI

**Что делаем**:
- `get_db` - получение DB сессии
- `get_current_user` - получение текущего пользователя из session_token (из заголовка или cookie)
- Обработка ошибок аутентификации (401 Unauthorized)
- Проверка истечения сессии

### Шаг 7: Эндпоинты аутентификации (4h)

**Файлы для создания**:
1. `backend/src/api/v1/__init__.py`
2. `backend/src/api/v1/auth.py` - Эндпоинты /register, /login, /logout, /me

**Что делаем**:
- POST /api/v1/auth/register - регистрация, автоматический вход
- POST /api/v1/auth/login - вход, создание сессии, возврат session_token
- POST /api/v1/auth/logout - удаление текущей сессии
- GET /api/v1/auth/me - получение текущего пользователя

**Тесты**:
- Обновление `backend/tests/test_auth.py` - E2E тесты эндпоинтов

### Шаг 8: Эндпоинты пользователей (2h)

**Файлы для создания**:
1. `backend/src/api/v1/users.py` - Эндпоинты для профиля пользователя

**Что делаем**:
- GET /api/v1/users/me
- PATCH /api/v1/users/me
- DELETE /api/v1/users/me

**Тесты**:
- Обновление `backend/tests/test_users.py` - E2E тесты

### Шаг 9: Сервисы для сессий и доменов (8h)

**Файлы для создания**:
1. `backend/src/services/session.py` - CRUD для сессий
2. `backend/src/services/domain.py` - CRUD для доменов и статистики

**Что делаем**:
- Создание, чтение, обновление, удаление сессий
- Создание, чтение, обновление, удаление доменов
- Агрегация статистики по доменам
- Логика синхронизации (получение последних изменений)

**Тесты**:
- `backend/tests/test_sessions.py` - Тесты сервисов сессий
- `backend/tests/test_domains.py` - Тесты сервисов доменов

### Шаг 10: Эндпоинты сессий (6h)

**Файлы для создания**:
1. `backend/src/api/v1/sessions.py` - Эндпоинты для сессий

**Что делаем**:
- GET /api/v1/sessions - список с пагинацией
- GET /api/v1/sessions/{session_id} - детали
- POST /api/v1/sessions - создание
- PUT /api/v1/sessions/{session_id} - обновление
- DELETE /api/v1/sessions/{session_id} - удаление
- GET /api/v1/sessions/sync - синхронизация

**Тесты**:
- Обновление `backend/tests/test_sessions.py` - E2E тесты

### Шаг 11: Эндпоинты доменов (4h)

**Файлы для создания**:
1. `backend/src/api/v1/domains.py` - Эндпоинты для доменов

**Что делаем**:
- GET /api/v1/domains - список с фильтрацией
- GET /api/v1/domains/{domain_id} - детали
- PUT /api/v1/domains/{domain_id} - обновление
- GET /api/v1/domains/stats - статистика

**Тесты**:
- Обновление `backend/tests/test_domains.py` - E2E тесты

### Шаг 12: Интеграция и роутинг (2h)

**Файлы для создания**:
1. `backend/src/api/v1/router.py` - Главный router с подключением всех эндпоинтов

**Что делаем**:
- Подключение всех роутеров
- Настройка middleware (CORS, error handling)
- Версионирование API

### Шаг 13: Тесты и документация (8h)

**Файлы для создания/обновления**:
1. `backend/tests/conftest.py` - Фикстуры для тестов
2. `backend/tests/test_api_integration.py` - Интеграционные тесты
3. `backend/README.md` - Документация по запуску и использованию
4. Обновление `docs/architecture.md` - Добавление описания API
5. Обновление `CHANGELOG.md` - Описание изменений

**Что делаем**:
- Настройка тестового окружения
- Интеграционные тесты полных сценариев
- Документация API (автогенерация через FastAPI)
- Обновление общей документации

## Порядок работы (пошаговый)

1. ✅ Шаг 1: Базовая структура и конфигурация
2. ✅ Шаг 2: Модели базы данных
3. ✅ Шаг 3: Pydantic схемы
4. ✅ Шаг 4: Утилиты безопасности
5. ✅ Шаг 5: Сервис аутентификации
6. ✅ Шаг 6: API Dependencies
7. ✅ Шаг 7: Эндпоинты аутентификации
8. ✅ Шаг 8: Эндпоинты пользователей
9. ✅ Шаг 9: Сервисы для сессий и доменов
10. ✅ Шаг 10: Эндпоинты сессий
11. ✅ Шаг 11: Эндпоинты доменов
12. ✅ Шаг 12: Интеграция и роутинг
13. ✅ Шаг 13: Тесты и документация

## Оценка времени

| Шаг | Задача | Время (ч) |
|-----|--------|-----------|
| 1 | Базовая структура и конфигурация | 4-6 |
| 2 | Модели базы данных | 6-8 |
| 3 | Pydantic схемы | 4 |
| 4 | Утилиты безопасности | 3 |
| 5 | Сервис аутентификации | 6 |
| 6 | API Dependencies | 3 |
| 7 | Эндпоинты аутентификации | 4 |
| 8 | Эндпоинты пользователей | 2 |
| 9 | Сервисы для сессий и доменов | 8 |
| 10 | Эндпоинты сессий | 6 |
| 11 | Эндпоинты доменов | 4 |
| 12 | Интеграция и роутинг | 2 |
| 13 | Тесты и документация | 8 |
| **Итого** | | **58-60 часов** |

Соответствует оценкам из backlog: BTE-011 (20h) + BTE-012 (12h) + BTE-013 (16h) = 48h + дополнительное время на тесты и документацию.

## Требования к тестам

### Покрытие тестами
- **Минимум 75%** покрытия для каждой директории
- Unit тесты для всех сервисов
- Integration тесты для всех API эндпоинтов
- Тесты безопасности (аутентификация, авторизация)

### Типы тестов
1. **Unit тесты**:
   - Сервисы (auth, user, session, domain)
   - Утилиты (security)
   - Валидация схем

2. **Integration тесты**:
   - Полные сценарии API (регистрация → вход → создание сессии → синхронизация)
   - Тесты с реальной базой данных (test DB)

3. **E2E тесты**:
   - Критические пользовательские сценарии

## Безопасность

1. **Аутентификация**:
   - Session-based аутентификация (session_token в БД)
   - Истечение сессий (по умолчанию 30 дней)
   - Валидация паролей (минимальная длина, сложность)
   - Автоматическая очистка истекших сессий

2. **Авторизация**:
   - Проверка прав доступа к ресурсам (только свои данные)
   - Валидация user_id во всех операциях

3. **Безопасность данных**:
   - Хеширование паролей (bcrypt)
   - Валидация всех входных данных (Pydantic)
   - Защита от SQL injection (SQLAlchemy ORM)

## Миграции

1. **Миграция 1**: Создание начальных таблиц (User, Session, Domain, Page)
2. Все миграции в отдельных файлах через Alembic
3. Не изменять существующие миграции задним числом

## Переменные окружения

```env
# Database
DATABASE_URL=sqlite:///./app.db

# Security
SECRET_KEY=your-secret-key-here
SESSION_EXPIRE_DAYS=30
PASSWORD_MIN_LENGTH=8

# API
API_V1_PREFIX=/api/v1

# Environment
ENVIRONMENT=development
DEBUG=true
```

## Запуск и разработка

1. **Установка зависимостей**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Настройка окружения**:
   ```bash
   cp .env.example .env
   # Отредактировать .env
   ```

3. **Миграции**:
   ```bash
   alembic upgrade head
   ```

4. **Запуск сервера**:
   ```bash
   uvicorn src.main:app --reload
   ```

5. **Тесты**:
   ```bash
   pytest
   pytest --cov=src --cov-report=html
   ```

## Дальнейшие шаги (после этого плана)

После завершения этого плана будет реализовано:
- ✅ Backend API для синхронизации (BTE-011)
- ✅ Аутентификация пользователей (BTE-012)
- ✅ Система облачного хранения (BTE-013)

Следующие задачи (Sprint 7-8):
- BTE-014: Синхронизация между устройствами (интеграция с frontend)
- BTE-015: Премиум-функции (расширенная аналитика)

## Решения по аутентификации

✅ **Выбрано**: Session-based аутентификация
- Хранение сессий в БД (AuthSession модель)
- Session token передается через заголовок `X-Session-Token` или cookie
- Истечение сессий: 30 дней
- Возможность отзыва доступа через удаление сессии

## Вопросы для обсуждения

1. Какая стратегия синхронизации предпочтительна: полная синхронизация или delta sync?
2. Нужна ли поддержка мягкого удаления (soft delete) для данных пользователей?
3. Какие лимиты на размер данных (количество сессий, доменов на пользователя)?
4. Как передавать session_token: через заголовок или cookie? (рекомендуется заголовок для расширений)

---

**Статус**: План для утверждения
**Дата создания**: 2024-11-02
