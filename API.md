# Snapi Plugin API

Спецификация интерфейса прикладного программирования для разработки расширений Snapi.

Каждый плагин экспортирует методы жизненного цикла:

```javascript
export default {
  install(snapi) {
    // Инициализация плагина
  },
  uninstall(snapi) {
    // Очистка ресурсов
  }
};
```

---

## 1. snapi.storage

Изолированное постоянное хранилище плагина. Ключи изолированы префиксом идентификатора плагина и не имеют доступа к данным других плагинов или сессии пользователя.

### snapi.storage.get(key, defaultValue)
Возвращает сохраненное значение по ключу. Если ключ отсутствует, возвращает `defaultValue` или `null`.

```javascript
const value = snapi.storage.get('settings', { count: 0 });
```

### snapi.storage.set(key, value)
Сохраняет значение любого сериализуемого типа.

```javascript
snapi.storage.set('settings', { count: 1 });
```

### snapi.storage.remove(key)
Удаляет запись по ключу.

```javascript
snapi.storage.remove('settings');
```

### snapi.storage.clear()
Удаляет все записи текущего плагина.

```javascript
snapi.storage.clear();
```

---

## 2. snapi.messages

Регистрация и обработка пользовательских блоков сообщений в чате.

### snapi.messages.registerBlock(type, definition)
Регистрирует обработчик для типа блока сообщения. 

Параметры `definition`:
* `render(container, block)`: функция монтирования интерфейса в DOM-элемент `container`. Может возвращать функцию очистки при размонтировании.
* `containerClass`: CSS-классы внешнего контейнера (необязательно).
* `marginBottom`: отступы блока (необязательно).

```javascript
snapi.messages.registerBlock('crypto-rate', {
  render(container, block) {
    container.innerHTML = `<div class="p-2 bg-emerald-500/10 text-emerald-400 font-mono text-xs">Курс: ${block.rate}</div>`;
    return () => {
      // Очистка при размонтировании сообщения
    };
  }
});
```

### snapi.messages.unregisterBlock(type)
Удаляет регистрацию пользовательского типа сообщения.

```javascript
snapi.messages.unregisterBlock('crypto-rate');
```

### snapi.messages.getBlock(type)
Возвращает зарегистрированное определение блока или `undefined`.

```javascript
const def = snapi.messages.getBlock('crypto-rate');
```

---

## 3. snapi.ui

Управление интерфейсными элементами и уведомлениями.

### snapi.ui.showToast(text, type)
Отображает всплывающее текстовое уведомление внизу экрана. Параметр `type` принимает значения `'info'`, `'success'`, `'error'`.

```javascript
snapi.ui.showToast('Действие выполнено', 'success');
```

### snapi.ui.showNotification(title, body)
Вызывает системное уведомление операционной системы через Notification API.

```javascript
snapi.ui.showNotification('Таймер', 'Время вышло');
```

### snapi.ui.addFloatingWidget(options)
Создает плавающий контейнер поверх интерфейса приложения. Возвращает объект с методом `remove()`.

Параметры `options`:
* `id`: строковый идентификатор элемента (необязательно).
* `html`: начальная HTML-разметка (необязательно).
* `position`: позиционирование (`'bottom-right'`, `'bottom-left'`, `'top-right'`, `'top-left'`).
* `onMount(container)`: функция обратного вызова после добавления в DOM.

```javascript
const widget = snapi.ui.addFloatingWidget({
  position: 'bottom-right',
  html: '<button id="my-btn">Кнопка</button>',
  onMount(el) {
    el.querySelector('#my-btn').addEventListener('click', () => {});
  }
});

// Удаление виджета
widget.remove();
```

---

## 4. snapi.theme

Управление переменными оформления интерфейса.

### snapi.theme.setTokens(tokens)
Устанавливает CSS-переменные оформления с высоким приоритетом.

```javascript
snapi.theme.setTokens({
  '--color-accent': '#00f2fe',
  '--color-background': '#050811'
});
```

### snapi.theme.reset()
Сбрасывает установленные плагином стили оформления.

```javascript
snapi.theme.reset();
```

---

## 5. snapi.events

Шина событий для взаимодействия между компонентами и расширениями.

### snapi.events.on(event, handler)
Подписка на событие.

```javascript
function onUpdate(data) {}
snapi.events.on('data:changed', onUpdate);
```

### snapi.events.off(event, handler)
Отписка от события.

```javascript
snapi.events.off('data:changed', onUpdate);
```

### snapi.events.emit(event, ...args)
Публикация события с передачей аргументов.

```javascript
snapi.events.emit('data:changed', { id: 1 });
```
