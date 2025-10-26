# 🚀 Руководство по запуску и тестированию Chrome расширения

## 📋 Предварительные требования

- Node.js 18+ 
- Chrome браузер
- npm или yarn

## 🔧 Установка и сборка

### 1. Установка зависимостей
```bash
npm install
```

### 2. Сборка расширения
```bash
npm run build
```

Это создаст папку `dist/` с готовым расширением, включая все необходимые иконки.

## 🧪 Тестирование расширения

### Способ 1: Загрузка в Chrome (рекомендуемый)

1. **Откройте Chrome** и перейдите в `chrome://extensions/`

2. **Включите режим разработчика** (Developer mode) в правом верхнем углу

3. **Нажмите "Загрузить распакованное расширение"** (Load unpacked)

4. **Выберите папку `dist/`** из вашего проекта

5. **Расширение будет установлено** и появится в списке

### Способ 2: Автоматическая перезагрузка при разработке

1. **Запустите dev сервер:**
```bash
npm run dev
```

2. **В Chrome Extensions** нажмите кнопку "Обновить" (🔄) рядом с вашим расширением

3. **Изменения будут применяться автоматически**

## 🎯 Тестирование функциональности

### Проверка popup
1. Нажмите на иконку расширения в панели инструментов
2. Должен открыться popup с интерфейсом "Time Tracker"
3. Проверьте, что отображается статус "Tracking"

### Проверка content script
1. Откройте любую веб-страницу
2. Откройте DevTools (F12)
3. В консоли должны быть логи от content script

### Проверка background script
1. В `chrome://extensions/` найдите ваше расширение
2. Нажмите "Подробности" (Details)
3. Нажмите "Проверить представления" (Inspect views: background page)
4. Проверьте консоль background script

### Проверка options page
1. Правый клик на иконке расширения
2. Выберите "Параметры" (Options)
3. Должна открыться страница настроек

## 🐛 Отладка

### Chrome DevTools
- **Popup**: Правый клик на popup → "Проверить элемент"
- **Content Script**: Обычные DevTools на странице
- **Background**: chrome://extensions/ → "Проверить представления"

### Логи
```javascript
// В content script
console.log('Content script loaded');

// В background script  
console.log('Background script loaded');

// В popup
console.log('Popup loaded');
```

## 🔄 Обновление расширения

При изменении кода:

1. **Пересоберите проект:**
```bash
npm run build
```

2. **Обновите расширение** в Chrome:
   - Нажмите кнопку "Обновить" (🔄) в chrome://extensions/
   - Или перезагрузите страницу с расширением

## 📁 Структура собранного расширения

```
dist/
├── manifest.json          # Манифест расширения
├── background.js          # Background script
├── content.js            # Content script  
├── popup.js              # Popup script
├── popup.css             # Popup стили
├── options.js            # Options script
├── options.css           # Options стили
├── icons/                # Иконки расширения
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── src/                  # HTML файлы
    ├── popup/
    └── options/
```

## ⚠️ Возможные проблемы

### Ошибка "Invalid manifest"
- Проверьте синтаксис `manifest.json`
- Убедитесь, что все файлы существуют

### Content script не загружается
- Проверьте права доступа в manifest
- Убедитесь, что content script указан правильно

### Popup не открывается
- Проверьте путь к popup.html в manifest
- Убедитесь, что popup.js загружается

## 🎉 Готово!

### ✅ **Проблемы решены:**
- ✅ **Иконки созданы** - все PNG файлы (16x16, 32x32, 48x48, 128x128)
- ✅ **Пути в манифесте исправлены** - background.js и content.js в корне
- ✅ **Автоматическая сборка** - все исправления применяются автоматически

### 🚀 **Теперь расширение готово к установке:**

1. **Сборка:** `npm run build`
2. **Установка:** Загрузите папку `dist/` в Chrome
3. **Тестирование:** Проверьте popup, content script, background script

### 📁 **Финальная структура:**
```
dist/
├── manifest.json          # ✅ Исправленные пути
├── background.js          # ✅ Background script
├── content.js            # ✅ Content script  
├── popup.js              # ✅ Popup script
├── options.js            # ✅ Options script
├── *.css                 # ✅ Стили
├── icons/                # ✅ Иконки (созданы автоматически)
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── src/                  # ✅ HTML файлы
    ├── popup/
    └── options/
```

**Расширение полностью готово к использованию!** 🎉
