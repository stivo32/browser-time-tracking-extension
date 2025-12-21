# 🔐 Поток аутентификации: Расширение ↔ Backend

## Архитектура

Регистрация и авторизация выполняются на **отдельной веб-странице на сервере**, куда пользователь переходит из расширения.

### Преимущества этого подхода:

1. ✅ **Больше места** для форм регистрации/логина
2. ✅ **Лучший UX** - стандартные веб-формы
3. ✅ **Гибкость** - легко добавить OAuth, восстановление пароля и т.д.
4. ✅ **Безопасность** - токены передаются через postMessage API

## 🔄 Поток работы

### 1. Пользователь открывает Settings в расширении

```
Расширение → Options Page → Секция "Cloud Sync"
```

### 2. Нажатие "Sign In / Register"

```
Options Page → Открывается веб-страница http://localhost:8000/static/auth.html
```

### 3. Регистрация/Логин на веб-странице

Пользователь заполняет форму на сервере:
- **Register**: Email, Password, Full Name (optional)
- **Login**: Email, Password

### 4. После успешной авторизации

```
Auth Page → postMessage → Options Page → Сохранение токена в chrome.storage
```

### 5. Токен используется для API запросов

Все последующие запросы к API включают заголовок:
```
X-Session-Token: <session_token>
```

## 📁 Структура файлов

```
backend/
└── src/
    └── static/
        └── auth.html          # Веб-страница для регистрации/логина

src/
└── options/
    ├── options.html          # Страница настроек расширения
    └── options.js            # Логика открытия auth страницы и обработки callback
```

## 🚀 Использование

### В расширении (Options Page)

1. Откройте настройки расширения:
   - Правый клик на иконке → "Параметры"
   - Или через `chrome://extensions/` → "Параметры"

2. В секции "Cloud Sync":
   - Укажите API URL (по умолчанию: `http://localhost:8000`)
   - Нажмите "Sign In / Register"

3. Откроется веб-страница авторизации

4. После успешной авторизации:
   - Страница автоматически закроется
   - Токен сохранится в расширении
   - Статус изменится на "Connected as <email>"

### На веб-странице

1. Выберите вкладку "Login" или "Register"
2. Заполните форму
3. После успешной авторизации:
   - Если открыто из расширения → автоматически закроется и передаст токен
   - Если открыто напрямую → покажет сообщение об успехе

## 🔧 Технические детали

### Передача токена

```javascript
// В auth.html после успешной авторизации
if (window.opener && window.opener !== window) {
    window.opener.postMessage({
        type: 'AUTH_SUCCESS',
        session_token: data.session.session_token,
        user: data.user,
    }, '*');
    window.close();
}
```

### Получение токена в расширении

```javascript
// В options.js
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'AUTH_SUCCESS') {
        const { session_token, user } = event.data;
        
        // Сохранить в chrome.storage
        chrome.storage.local.set({
            session_token: session_token,
            user: user,
        });
    }
});
```

### Использование токена в API запросах

```javascript
// Все API запросы автоматически включают токен
fetch('http://localhost:8000/api/v1/sessions', {
    headers: {
        'X-Session-Token': sessionToken,
    },
});
```

## 🧪 Тестирование

### 1. Запустите Backend

```bash
cd backend
docker-compose up -d
```

### 2. Откройте страницу авторизации

Прямо в браузере:
```
http://localhost:8000/static/auth.html
```

### 3. Или через расширение

1. Установите расширение
2. Откройте Options Page
3. Нажмите "Sign In / Register"

### 4. Проверьте регистрацию

1. Заполните форму регистрации
2. После успеха проверьте в консоли браузера:
   ```javascript
   localStorage.getItem('session_token')
   ```

### 5. Проверьте логин

1. Войдите с теми же данными
2. Проверьте, что токен сохранился

## 🔒 Безопасность

### Текущая реализация

- ✅ Токены хранятся в `chrome.storage.local` (зашифровано браузером)
- ✅ Токены передаются через `postMessage` (безопасный канал)
- ✅ Токены имеют срок действия (30 дней)
- ✅ Автоматическая очистка истекших сессий

### Рекомендации для production

- ⚠️ Используйте HTTPS для auth страницы
- ⚠️ Добавьте проверку origin в postMessage
- ⚠️ Используйте более короткий срок жизни токенов
- ⚠️ Добавьте refresh tokens
- ⚠️ Реализуйте CSRF защиту

## 📝 API Endpoints

### Регистрация
```
POST /api/v1/auth/register
Body: { email, password, full_name? }
Response: { session: { session_token, expires_at }, user: {...} }
```

### Логин
```
POST /api/v1/auth/login
Body: { email, password }
Response: { session: { session_token, expires_at }, user: {...} }
```

### Получить текущего пользователя
```
GET /api/v1/auth/me
Headers: { X-Session-Token: <token> }
Response: { id, email, full_name, ... }
```

### Выход
```
POST /api/v1/auth/logout
Headers: { X-Session-Token: <token> }
Response: 204 No Content
```

## 🎯 Следующие шаги

После успешной авторизации можно:

1. ✅ Синхронизировать данные с бэкендом
2. ✅ Получать статистику с сервера
3. ✅ Использовать премиум функции (если есть)
4. ✅ Работать с данными на нескольких устройствах
