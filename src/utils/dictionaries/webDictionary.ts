// src/utils/dictionaries/webDictionary.ts
import type { CodeCompletionDefinition } from "../codeCompletions";

export const WEB_COMPLETIONS: CodeCompletionDefinition[] = [
  // --- CSS Свойства ---
  { word: "display", kind: "property", hint: "Тип отображения элемента", detail: "CSS property", insertText: "display: flex;" },
  { word: "flex", kind: "property", hint: "Свойства flex-элемента", detail: "CSS property", insertText: "flex: 1;" },
  { word: "flex-direction", kind: "property", hint: "Направление главной оси flex", detail: "CSS property", insertText: "flex-direction: column;" },
  { word: "flex-wrap", kind: "property", hint: "Перенос flex-элементов", detail: "CSS property", insertText: "flex-wrap: wrap;" },
  { word: "justify-content", kind: "property", hint: "Выравнивание по главной оси", detail: "CSS property", insertText: "justify-content: center;" },
  { word: "align-items", kind: "property", hint: "Выравнивание по поперечной оси", detail: "CSS property", insertText: "align-items: center;" },
  { word: "align-self", kind: "property", hint: "Выравнивание отдельного flex-элемента", detail: "CSS property" },
  { word: "gap", kind: "property", hint: "Отступы между строками и колонками", detail: "CSS property", insertText: "gap: 16px;" },

  { word: "grid", kind: "property", hint: "CSS Grid раскладка", detail: "CSS property" },
  { word: "grid-template-columns", kind: "property", hint: "Шаблон колонок Grid", detail: "CSS property", insertText: "grid-template-columns: repeat(3, 1fr);" },
  { word: "grid-template-rows", kind: "property", hint: "Шаблон строк Grid", detail: "CSS property" },

  { word: "position", kind: "property", hint: "Тип позиционирования", detail: "CSS property", insertText: "position: relative;" },
  { word: "top", kind: "property", hint: "Смещение сверху", detail: "CSS property" },
  { word: "bottom", kind: "property", hint: "Смещение снизу", detail: "CSS property" },
  { word: "left", kind: "property", hint: "Смещение слева", detail: "CSS property" },
  { word: "right", kind: "property", hint: "Смещение справа", detail: "CSS property" },
  { word: "z-index", kind: "property", hint: "Порядок наложения по оси Z", detail: "CSS property", insertText: "z-index: 10;" },

  { word: "width", kind: "property", hint: "Ширина элемента", detail: "CSS property", insertText: "width: 100%;" },
  { word: "height", kind: "property", hint: "Высота элемента", detail: "CSS property", insertText: "height: 100%;" },
  { word: "min-width", kind: "property", hint: "Минимальная ширина", detail: "CSS property" },
  { word: "max-width", kind: "property", hint: "Максимальная ширина", detail: "CSS property" },
  { word: "min-height", kind: "property", hint: "Минимальная высота", detail: "CSS property" },
  { word: "max-height", kind: "property", hint: "Максимальная высота", detail: "CSS property" },

  { word: "margin", kind: "property", hint: "Внешние отступы", detail: "CSS property", insertText: "margin: 0 auto;" },
  { word: "margin-top", kind: "property", hint: "Внешний отступ сверху", detail: "CSS property" },
  { word: "margin-bottom", kind: "property", hint: "Внешний отступ снизу", detail: "CSS property" },
  { word: "margin-left", kind: "property", hint: "Внешний отступ слева", detail: "CSS property" },
  { word: "margin-right", kind: "property", hint: "Внешний отступ справа", detail: "CSS property" },

  { word: "padding", kind: "property", hint: "Внутренние отступы", detail: "CSS property", insertText: "padding: 12px 16px;" },
  { word: "padding-top", kind: "property", hint: "Внутренний отступ сверху", detail: "CSS property" },
  { word: "padding-bottom", kind: "property", hint: "Внутренний отступ снизу", detail: "CSS property" },
  { word: "padding-left", kind: "property", hint: "Внутренний отступ слева", detail: "CSS property" },
  { word: "padding-right", kind: "property", hint: "Внутренний отступ справа", detail: "CSS property" },

  { word: "background", kind: "property", hint: "Фон элемента", detail: "CSS property" },
  { word: "background-color", kind: "property", hint: "Цвет фона", detail: "CSS property", insertText: "background-color: #ffffff;" },
  { word: "background-image", kind: "property", hint: "Фоновое изображение", detail: "CSS property", insertText: "background-image: url();" },
  { word: "background-size", kind: "property", hint: "Размер фонового изображения", detail: "CSS property", insertText: "background-size: cover;" },
  { word: "background-position", kind: "property", hint: "Позиция фона", detail: "CSS property", insertText: "background-position: center;" },

  { word: "border", kind: "property", hint: "Граница элемента", detail: "CSS property", insertText: "border: 1px solid rgba(255, 255, 255, 0.1);" },
  { word: "border-radius", kind: "property", hint: "Скругление углов", detail: "CSS property", insertText: "border-radius: 12px;" },
  { word: "border-color", kind: "property", hint: "Цвет границы", detail: "CSS property" },
  { word: "box-shadow", kind: "property", hint: "Тень блока", detail: "CSS property", insertText: "box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);" },
  { word: "backdrop-filter", kind: "property", hint: "Фильтр фона (размытие glassmorphism)", detail: "CSS property", insertText: "backdrop-filter: blur(20px);" },

  { word: "color", kind: "property", hint: "Цвет текста", detail: "CSS property", insertText: "color: #ffffff;" },
  { word: "font-size", kind: "property", hint: "Размер шрифта", detail: "CSS property", insertText: "font-size: 14px;" },
  { word: "font-weight", kind: "property", hint: "Насыщенность шрифта", detail: "CSS property", insertText: "font-weight: 600;" },
  { word: "font-family", kind: "property", hint: "Семейство шрифтов", detail: "CSS property" },
  { word: "line-height", kind: "property", hint: "Межстрочный интервал", detail: "CSS property", insertText: "line-height: 1.5;" },
  { word: "text-align", kind: "property", hint: "Выравнивание текста", detail: "CSS property", insertText: "text-align: center;" },
  { word: "text-decoration", kind: "property", hint: "Оформление текста (подчеркивание)", detail: "CSS property" },
  { word: "text-overflow", kind: "property", hint: "Обрезание текста многоточием", detail: "CSS property", insertText: "text-overflow: ellipsis;" },
  { word: "white-space", kind: "property", hint: "Обработка пробельных символов", detail: "CSS property", insertText: "white-space: nowrap;" },

  { word: "opacity", kind: "property", hint: "Прозрачность элемента", detail: "CSS property", insertText: "opacity: 0.8;" },
  { word: "overflow", kind: "property", hint: "Поведение при переполнении контентом", detail: "CSS property", insertText: "overflow: hidden;" },
  { word: "overflow-x", kind: "property", hint: "Горизонтальное переполнение", detail: "CSS property", insertText: "overflow-x: auto;" },
  { word: "overflow-y", kind: "property", hint: "Вертикальное переполнение", detail: "CSS property", insertText: "overflow-y: auto;" },
  { word: "cursor", kind: "property", hint: "Вид курсора мыши", detail: "CSS property", insertText: "cursor: pointer;" },
  { word: "pointer-events", kind: "property", hint: "Реакция на события мыши", detail: "CSS property", insertText: "pointer-events: none;" },
  { word: "user-select", kind: "property", hint: "Выделение текста", detail: "CSS property", insertText: "user-select: none;" },

  { word: "transition", kind: "property", hint: "Плавный переход свойств", detail: "CSS property", insertText: "transition: all 0.2s ease;" },
  { word: "transform", kind: "property", hint: "Трансформация элемента", detail: "CSS property", insertText: "transform: scale(1.05);" },
  { word: "animation", kind: "property", hint: "CSS анимация", detail: "CSS property" },

  // --- HTML5 Теги ---
  { word: "div", kind: "snippet", hint: "HTML блочный контейнер <div>", detail: "HTML tag", insertText: "<div>\n  \n</div>" },
  { word: "span", kind: "snippet", hint: "HTML строчный элемент <span>", detail: "HTML tag", insertText: "<span></span>" },
  { word: "button", kind: "snippet", hint: "HTML кнопка <button>", detail: "HTML tag", insertText: "<button type=\"button\">\n  \n</button>" },
  { word: "input", kind: "snippet", hint: "HTML поле ввода <input>", detail: "HTML tag", insertText: "<input type=\"text\" placeholder=\"\" />" },
  { word: "textarea", kind: "snippet", hint: "HTML многострочное поле <textarea>", detail: "HTML tag", insertText: "<textarea rows=\"3\"></textarea>" },
  { word: "form", kind: "snippet", hint: "HTML форма <form>", detail: "HTML tag", insertText: "<form @submit.prevent=\"\">\n  \n</form>" },
  { word: "table", kind: "snippet", hint: "HTML таблица <table>", detail: "HTML tag", insertText: "<table>\n  <thead>\n    <tr><th></th></tr>\n  </thead>\n  <tbody>\n    <tr><td></td></tr>\n  </tbody>\n</table>" },
  { word: "template", kind: "snippet", hint: "Шаблон компонента <template>", detail: "Vue/HTML template", insertText: "<template>\n  \n</template>" },
  { word: "script", kind: "snippet", hint: "Скрипт <script setup lang=\"ts\">", detail: "Vue/HTML script", insertText: "<script setup lang=\"ts\">\n\n</script>" },
  { word: "style", kind: "snippet", hint: "Стили <style scoped>", detail: "Vue/HTML style", insertText: "<style scoped>\n\n</style>" },
];
