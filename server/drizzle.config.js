import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
    schema: './src/db/sqema.ts', // Путь к вашему файлу со схемой
    out: './drizzle', // Папка для генерации миграций (создастся автоматически)
    dialect: 'sqlite',
    dbCredentials: {
        url: process.env.DB_FILE_NAME
    }
});
//# sourceMappingURL=drizzle.config.js.map