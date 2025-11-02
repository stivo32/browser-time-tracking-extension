# Руководство по миграциям базы данных

## Создание миграции

После создания или изменения моделей в `src/db/models.py`, создайте миграцию:

```bash
# Локально
alembic revision --autogenerate -m "Description of changes"

# Через Make
make migrate-create msg="Description of changes"

# В Docker
docker-compose exec api alembic revision --autogenerate -m "Description of changes"
```

## Применение миграций

```bash
# Локально
alembic upgrade head

# Через Make
make migrate

# В Docker
docker-compose exec api alembic upgrade head
```

## Откат миграции

```bash
alembic downgrade -1  # Откатить последнюю миграцию
alembic downgrade -n   # Откатить N миграций
alembic downgrade base # Откатить все миграции
```

## Создание первой миграции

После создания всех моделей создайте первую миграцию:

```bash
alembic revision --autogenerate -m "Initial tables"
alembic upgrade head
```

Это создаст таблицы:
- `users` - пользователи
- `auth_sessions` - сессии аутентификации
- `sessions` - сессии трекинга времени
- `domains` - домены
- `pages` - страницы

## Проверка миграций

```bash
# Список всех миграций
alembic history

# Текущая версия
alembic current

# Показать SQL без выполнения
alembic upgrade head --sql
```

