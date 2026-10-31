// src/services/aiService.ts
import { pipeline, env } from "@huggingface/transformers";

// Настраиваем окружение для локальной работы (чтобы не было проблем с воркерами)
env.allowLocalModels = false;
env.useBrowserCache = true;

class AIService {
  private correctorPipeline: any = null;
  private isLoading = false;

  // Загружаем легкую модель для исправления текста (например, T5, настроенную под грамматику)
  async loadModel(onProgress?: (progress: any) => void) {
    if (this.correctorPipeline) return;
    if (this.isLoading) return;

    this.isLoading = true;
    try {
      // Используем быструю и легкую языковую модель (например, маленькую t5 или специфическую grammar-check)
      this.correctorPipeline = await pipeline(
        "text2text-generation",
        "Xenova/t5-small", // Весит около 240 МБ, идеально для тестов и быстрой работы
        { progress_callback: onProgress },
      );
    } catch (e) {
      console.error("Ошибка загрузки локальной модели ИИ:", e);
    } finally {
      this.isLoading = false;
    }
  }

  // Метод исправления текста
  async fixText(text: string): Promise<string> {
    if (!this.correctorPipeline) {
      await this.loadModel();
    }
    if (!this.correctorPipeline) return text;

    try {
      // Промт для модели
      const prompt = `fix grammar and spelling: ${text}`;
      const output = await this.correctorPipeline(prompt, {
        max_new_tokens: 128,
        do_sample: false,
      });

      return output[0]?.generated_text || text;
    } catch (e) {
      console.error("Ошибка генерации ИИ:", e);
      return text;
    }
  }
}

export const aiService = new AIService();
