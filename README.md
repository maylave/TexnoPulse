# Snapi App (Tauri v2 + Vue 3 + Node.js Backend)

Кроссплатформенный десктопный мессенджер с локальной базой SQLite и P2P-синхронизацией.

---

## 🛠️ Разработка (Development)

В корне проекта доступны готовые команды:

### 1. Запуск десктопного приложения в режиме разработки (Tauri Window):
```bash
npm run dev:tauri
```
- Запускает `vite` на `http://localhost:1420` и открывает окно Tauri.
- Бэкенд автоматически запускается приложением в фоне (или подхватывает запущенный сервер).

### 2. Одновременный запуск всего стека с Hot-Reload (в браузере):
```bash
npm run dev:all
```
- Запускает **Backend** (`server/src/index.ts`) в режиме `tsx watch` (автоперезагрузка при правках кода на TypeScript).
- Запускает **Frontend** (`Vite` на `http://localhost:1420`) с моментальным HMR.

### 3. Раздельный запуск:
```bash
npm run dev           # Только фронтенд (Vite)
npm run dev:server    # Только бэкенд с автоперезагрузкой (tsx watch)
```

---

## 📦 Сборка и релиз (Production)

### 1. Собрать автономный бинарник сервера (`server.exe`):
```bash
npm run build:server
```
- Компилирует TypeScript через `esbuild` в единый бандл.
- Упаковывает со средой выполнения в компактный исполняемый файл `server.exe` (~50 МБ).
- Копирует файл в `src-tauri/binaries/snapi-server-x86_64-pc-windows-msvc.exe`.

### 2. Собрать готовый установщик приложения (NSIS Setup .exe):
```bash
npm run build:app
```
- Автоматически выполняет сборку сервера, сборку фронтенда и упаковку инсталлятора.
- Готовый установщик появится в:  
  `src-tauri/target/release/bundle/nsis/Snapi_0.1.0_x64-setup.exe`

---

## 💾 Хранение данных

- База данных SQLite автоматически инициализируется по пути:  
  `%APPDATA%\Snapi\local.db` (на Windows: `C:\Users\<Имя>\AppData\Roaming\Snapi\local.db`).
- Данные изолированы, защищены от прав доступа и сохраняются при обновлениях приложения.
