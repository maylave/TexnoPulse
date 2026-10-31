// src/utils/dictionaries/generalCodeDictionary.ts
import type { CodeCompletionDefinition } from "../codeCompletions";

export const GENERAL_CODE_COMPLETIONS: CodeCompletionDefinition[] = [
  // --- Git & CLI Commands ---
  { word: "git status", kind: "snippet", hint: "Текущий статус репозитория", detail: "Git CLI", insertText: "git status" },
  { word: "git add .", kind: "snippet", hint: "Добавить все файлы в индекс", detail: "Git CLI", insertText: "git add ." },
  { word: "git commit -m", kind: "snippet", hint: "Создать коммит с сообщением", detail: "Git CLI", insertText: "git commit -m \"\"" },
  { word: "git push", kind: "snippet", hint: "Отправить коммиты на удаленный сервер", detail: "Git CLI", insertText: "git push origin main" },
  { word: "git pull", kind: "snippet", hint: "Стянуть изменения с удаленного сервера", detail: "Git CLI", insertText: "git pull" },
  { word: "git checkout -b", kind: "snippet", hint: "Создать и переключиться на новую ветку", detail: "Git CLI", insertText: "git checkout -b feature/" },
  { word: "git merge", kind: "snippet", hint: "Слияние веток", detail: "Git CLI", insertText: "git merge " },
  { word: "git log --oneline", kind: "snippet", hint: "Компактная история коммитов", detail: "Git CLI", insertText: "git log --oneline -n 10" },

  // --- Package Managers ---
  { word: "npm install", kind: "snippet", hint: "Установка зависимостей проекта", detail: "npm CLI", insertText: "npm install " },
  { word: "npm run dev", kind: "snippet", hint: "Запуск dev-сервера", detail: "npm CLI", insertText: "npm run dev" },
  { word: "npm run build", kind: "snippet", hint: "Сборка production-бандла", detail: "npm CLI", insertText: "npm run build" },
  { word: "pnpm add", kind: "snippet", hint: "Установка пакета через pnpm", detail: "pnpm CLI", insertText: "pnpm add " },
  { word: "cargo run", kind: "snippet", hint: "Компиляция и запуск Rust проекта", detail: "Cargo CLI", insertText: "cargo run" },
  { word: "cargo build --release", kind: "snippet", hint: "Сборка релизного бинарника Rust", detail: "Cargo CLI", insertText: "cargo build --release" },

  // --- Rust Keywords & Constructs ---
  { word: "fn", kind: "keyword", hint: "Объявление функции", detail: "fn name() -> Type {}", insertText: "fn name() {\n    \n}", languages: ["rust"] },
  { word: "let mut", kind: "keyword", hint: "Изменяемая переменная", detail: "let mut x = val;", insertText: "let mut ", languages: ["rust"] },
  { word: "pub", kind: "keyword", hint: "Публичная видимость", detail: "pub fn / pub struct", languages: ["rust"] },
  { word: "struct", kind: "class", hint: "Объявление структуры", detail: "struct Name {}", insertText: "struct Name {\n    \n}", languages: ["rust", "c", "cpp", "go"] },
  { word: "impl", kind: "keyword", hint: "Блок реализации методов", detail: "impl Name {}", insertText: "impl Name {\n    \n}", languages: ["rust"] },
  { word: "trait", kind: "interface", hint: "Объявление трейта", detail: "trait Name {}", insertText: "trait Name {\n    \n}", languages: ["rust"] },
  { word: "match", kind: "keyword", hint: "Сопоставление с образцом", detail: "match val { ... }", insertText: "match val {\n    _ => {}\n}", languages: ["rust"] },
  { word: "println!", kind: "function", hint: "Вывод строки с форматированием", detail: "println!(\"{}\", val);", insertText: "println!(\"{}\", );", languages: ["rust"] },

  // --- Go Keywords & Constructs ---
  { word: "package", kind: "keyword", hint: "Объявление пакета Go", detail: "package main", insertText: "package main", languages: ["go"] },
  { word: "func", kind: "keyword", hint: "Объявление функции Go", detail: "func name() {}", insertText: "func name() {\n    \n}", languages: ["go"] },
  { word: "defer", kind: "keyword", hint: "Отложенное выполнение вызова", detail: "defer f.Close()", languages: ["go"] },
  { word: "go", kind: "keyword", hint: "Запуск горутины", detail: "go func()", languages: ["go"] },
  { word: "chan", kind: "keyword", hint: "Канал Go", detail: "chan Type", languages: ["go"] },
  { word: "fmt.Println", kind: "function", hint: "Вывод в stdout", detail: "fmt.Println(...)", insertText: "fmt.Println()", languages: ["go"] },

  // --- C / C++ Keywords & Functions ---
  { word: "#include", kind: "snippet", hint: "Директива включения заголовочного файла", detail: "preprocessor", insertText: "#include <iostream>", languages: ["c", "cpp"] },
  { word: "int main()", kind: "snippet", hint: "Точка входа программы на C/C++", detail: "int main(int argc, char* argv[])", insertText: "int main() {\n    \n    return 0;\n}", languages: ["c", "cpp"] },
  { word: "std::cout", kind: "function", hint: "Вывод в поток stdout", detail: "std::cout << val << std::endl;", insertText: "std::cout <<  << std::endl;", languages: ["cpp"] },
  { word: "std::vector", kind: "class", hint: "Динамический массив STL", detail: "std::vector<Type> vec;", insertText: "std::vector<> ", languages: ["cpp"] },
  { word: "std::string", kind: "class", hint: "Строка C++ STL", detail: "std::string s;", languages: ["cpp"] },
  { word: "printf", kind: "function", hint: "Форматированный вывод C", detail: "printf(format, ...)", insertText: "printf(\"%s\\n\", );", languages: ["c", "cpp"] },
];
