// back/src/seed-chat.ts
import { db } from "./db/db.js"; // или путь к вашему файлу экспорта db
import { nodes } from "./db/sqema.js"; // путь к схеме

async function main() {
  await db
    .insert(nodes)
    .values({
      id: "hello",
      type: "chat", // Обязательное поле по схеме
      name: "Общий чат",
    })
    .onConflictDoNothing();

  console.log("Чат 'hello' успешно добавлен в таблицу nodes!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Ошибка при создании чата:", err);
  process.exit(1);
});
