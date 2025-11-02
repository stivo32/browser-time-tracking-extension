# Browser Time Tracking - Backend API

Backend API для Browser Time Tracking Extension (Фаза 2).

## Технологии

- Python 3.12
- FastAPI
- SQLAlchemy 2.0 (async)
- SQLite (для MVP)
- Alembic (миграции)
- Pydantic v2
- pytest (тесты)

## Установка и запуск

### Вариант 1: Локальная разработка

#### 1. Создание виртуального окружения

```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows
```

#### 2. Установка зависимостей

```bash
pip install -r requirements.txt
```

#### 3. Настройка окружения

Скопируйте `.env.example` в `.env` и настройте:

```bash
cp .env.example .env
```

Отредактируйте `.env` файл, особенно `SECRET_KEY`.

#### 4. Настройка базы данных

Создайте миграции:

```bash
alembic revision --autogenerate -m "Initial tables"
alembic upgrade head
```

#### 5. Запуск сервера

```bash
uvicorn src.main:app --reload
```

Или используя Make:

```bash
make run
```

Сервер будет доступен по адресу: `http://localhost:8000`

Документация API (Swagger): `http://localhost:8000/docs`

### Вариант 2: Docker (рекомендуется для разработки)

#### 1. Настройка окружения

Скопируйте `.env.example` в `.env`:

```bash
cp .env.example .env
```

#### 2. Запуск в Docker

```bash
# Сборка и запуск
docker-compose up -d

# Или с логами
docker-compose up

# Остановка
docker-compose down
```

Или используя Make:

```bash
make docker-build  # Сборка образа
make docker-up     # Запуск контейнера
make docker-down   # Остановка контейнера
make docker-logs   # Просмотр логов
```

#### 3. Применение миграций в Docker

```bash
docker-compose exec api alembic upgrade head
```

Или через shell:

```bash
make docker-shell
# Затем внутри контейнера:
alembic upgrade head
```

Сервер будет доступен по адресу: `http://localhost:8000`

## Тестирование

```bash
# Все тесты
pytest

# С покрытием
pytest --cov=src --cov-report=html

# Отдельный файл
pytest tests/test_auth.py
```

## Структура проекта

```
backend/
├── src/
│   ├── main.py              # FastAPI приложение
│   ├── config.py            # Конфигурация
│   ├── db/                  # База данных
│   │   ├── database.py      # Подключение и сессии
│   │   ├── base.py          # Base model
│   │   └── models.py         # SQLAlchemy модели
│   ├── schemas/             # Pydantic схемы
│   ├── api/                 # API эндпоинты
│   │   └── v1/
│   ├── services/            # Бизнес-логика
│   └── utils/               # Утилиты
├── tests/                   # Тесты
├── migrations/              # Alembic миграции
└── requirements.txt         # Зависимости
```

## Аутентификация

Используется session-based аутентификация:
- Session token передается через заголовок `X-Session-Token`
- Сессии хранятся в БД (модель `AuthSession`)
- Истечение сессий: 30 дней (по умолчанию)

## Разработка

### Использование Makefile

Доступные команды:

```bash
make help          # Показать все доступные команды
make install       # Установить зависимости
make run           # Запустить сервер
make test          # Запустить тесты
make test-cov      # Запустить тесты с покрытием
make lint          # Проверить код линтерами
make format        # Отформатировать код
make migrate       # Применить миграции
make migrate-create msg="Description"  # Создать новую миграцию
```

### Форматирование

```bash
make format
# или вручную:
black src tests
ruff check src tests
```

### Создание миграций

```bash
# Автогенерация миграции
make migrate-create msg="Description"
# или вручную:
alembic revision --autogenerate -m "Description"

# Применение миграций
make migrate
# или вручную:
alembic upgrade head

# Откат миграции
alembic downgrade -1
```

### Docker команды

```bash
make docker-build   # Собрать образ
make docker-up      # Запустить контейнеры
make docker-down    # Остановить контейнеры
make docker-logs    # Просмотр логов
make docker-shell   # Войти в контейнер
```

## Переменные окружения

См. `.env.example` для полного списка переменных.

Основные:
- `DATABASE_URL` - URL базы данных
- `SECRET_KEY` - Секретный ключ (обязательно изменить!)
- `SESSION_EXPIRE_DAYS` - Срок действия сессий в днях
- `DEBUG` - Режим отладки

