// src/utils/dictionaries/russianVocabulary.ts
import type { WordEntry } from "@/stores/wordFrequency";

export const RUSSIAN_VOCABULARY: WordEntry[] = [
  // Приветствия и прощания
  { word: "привет", count: 35, lastUsed: Date.now(), category: "learned", hint: "Приветствие" },
  { word: "здравствуйте", count: 25, lastUsed: Date.now(), category: "learned", hint: "Вежливое приветствие" },
  { word: "добрый день", count: 20, lastUsed: Date.now(), category: "learned", hint: "Приветствие" },
  { word: "доброе утро", count: 18, lastUsed: Date.now(), category: "learned", hint: "Приветствие" },
  { word: "добрый вечер", count: 16, lastUsed: Date.now(), category: "learned", hint: "Приветствие" },
  { word: "пока", count: 18, lastUsed: Date.now(), category: "learned", hint: "Прощание" },
  { word: "до свидания", count: 15, lastUsed: Date.now(), category: "learned", hint: "Прощание" },
  { word: "до скорого", count: 12, lastUsed: Date.now(), category: "learned", hint: "Прощание" },
  { word: "увидимся", count: 11, lastUsed: Date.now(), category: "learned", hint: "Прощание" },

  // Благодарность и вежливость
  { word: "спасибо", count: 30, lastUsed: Date.now(), category: "learned", hint: "Благодарность" },
  { word: "большое спасибо", count: 22, lastUsed: Date.now(), category: "learned", hint: "Благодарность" },
  { word: "пожалуйста", count: 24, lastUsed: Date.now(), category: "learned", hint: "Вежливый ответ/просьба" },
  { word: "не за что", count: 15, lastUsed: Date.now(), category: "learned" },
  { word: "извините", count: 17, lastUsed: Date.now(), category: "learned" },
  { word: "прошу прощения", count: 10, lastUsed: Date.now(), category: "learned" },

  // Согласие, подтверждение и статус
  { word: "хорошо", count: 28, lastUsed: Date.now(), category: "learned" },
  { word: "отлично", count: 24, lastUsed: Date.now(), category: "learned" },
  { word: "договорились", count: 20, lastUsed: Date.now(), category: "learned" },
  { word: "понял", count: 25, lastUsed: Date.now(), category: "learned" },
  { word: "принял", count: 19, lastUsed: Date.now(), category: "learned" },
  { word: "сейчас сделаю", count: 18, lastUsed: Date.now(), category: "learned" },
  { word: "готово", count: 26, lastUsed: Date.now(), category: "learned" },
  { word: "сделал", count: 22, lastUsed: Date.now(), category: "learned" },
  { word: "проверил", count: 19, lastUsed: Date.now(), category: "learned" },
  { word: "работает", count: 23, lastUsed: Date.now(), category: "learned" },
  { word: "согласен", count: 14, lastUsed: Date.now(), category: "learned" },
  { word: "конечно", count: 18, lastUsed: Date.now(), category: "learned" },
  { word: "верно", count: 15, lastUsed: Date.now(), category: "learned" },
  { word: "точно", count: 16, lastUsed: Date.now(), category: "learned" },
  { word: "супер", count: 21, lastUsed: Date.now(), category: "learned" },
  { word: "класс", count: 18, lastUsed: Date.now(), category: "learned" },

  // Вопросы и просьбы
  { word: "как дела", count: 16, lastUsed: Date.now(), category: "learned" },
  { word: "что думаешь", count: 14, lastUsed: Date.now(), category: "learned" },
  { word: "подскажи пожалуйста", count: 18, lastUsed: Date.now(), category: "learned" },
  { word: "проверь пожалуйста", count: 17, lastUsed: Date.now(), category: "learned" },
  { word: "можешь посмотреть", count: 20, lastUsed: Date.now(), category: "learned" },
  { word: "помоги разобраться", count: 15, lastUsed: Date.now(), category: "learned" },
  { word: "когда будет готово", count: 13, lastUsed: Date.now(), category: "learned" },
  { word: "какой статус", count: 14, lastUsed: Date.now(), category: "learned" },
  { word: "скинь ссылку", count: 12, lastUsed: Date.now(), category: "learned" },

  // Разработка и IT термины
  { word: "проект", count: 20, lastUsed: Date.now(), category: "custom" },
  { word: "задача", count: 19, lastUsed: Date.now(), category: "custom" },
  { word: "ошибка", count: 18, lastUsed: Date.now(), category: "custom" },
  { word: "баг", count: 22, lastUsed: Date.now(), category: "custom" },
  { word: "фича", count: 17, lastUsed: Date.now(), category: "custom" },
  { word: "коммит", count: 18, lastUsed: Date.now(), category: "custom" },
  { word: "ветка", count: 16, lastUsed: Date.now(), category: "custom" },
  { word: "сервер", count: 19, lastUsed: Date.now(), category: "custom" },
  { word: "клиент", count: 17, lastUsed: Date.now(), category: "custom" },
  { word: "фронтенд", count: 18, lastUsed: Date.now(), category: "custom" },
  { word: "бэкенд", count: 18, lastUsed: Date.now(), category: "custom" },
  { word: "база данных", count: 16, lastUsed: Date.now(), category: "custom" },
  { word: "интерфейс", count: 19, lastUsed: Date.now(), category: "custom" },
  { word: "компонент", count: 21, lastUsed: Date.now(), category: "custom" },
  { word: "тестирование", count: 14, lastUsed: Date.now(), category: "custom" },
  { word: "деплой", count: 16, lastUsed: Date.now(), category: "custom" },
  { word: "релиз", count: 15, lastUsed: Date.now(), category: "custom" },
  { word: "настройки", count: 19, lastUsed: Date.now(), category: "custom" },
  { word: "документация", count: 15, lastUsed: Date.now(), category: "custom" },
];
