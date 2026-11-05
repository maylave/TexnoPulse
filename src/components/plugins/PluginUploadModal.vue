<script setup lang="ts">
import { ref } from 'vue'
import { X, Upload, Sparkles, Code2, Palette, FileText, CheckCircle2, AlertCircle } from 'lucide-vue-next'
// import { usePluginStore } from '@/stores/plugins' // Закомментировано

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'published', plugin: any): void
}>()

// const pluginStore = usePluginStore() // Закомментировано

// Режим: 'form' (визуальный редактор) или 'file' (загрузка файла manifest.json)
const activeTab = ref<'form' | 'file'>('form')

const id = ref('')
const name = ref('')
const author = ref('')
const version = ref('1.0.0')
const categoryId = ref<'visual' | 'ai' | 'sync' | 'utils'>('visual')
const icon = ref('Sparkles')
const desc = ref('')
const styles = ref(`/* Кастомные стили и тема оформления */
:root[data-plugin-theme="my-theme"] {
  --color-primary: #a855f7 !important;
  --accent: #c084fc !important;
  --sidebar-bg: #0f0a1c !important;
}
`)
const code = ref(`export default {
  install(context) {
    console.log('Плагин активирован!');
    context.showNotification('${name.value || 'Мой плагин'}', 'Плагин успешно подключен!');
  },
  uninstall(context) {
    console.log('Плагин деактивирован.');
  }
};
`)

const errorMsg = ref('')
const successMsg = ref('')
const isPublishing = ref(false)

const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target?.result as string)
      if (parsed.id) id.value = parsed.id
      if (parsed.name) name.value = parsed.name
      if (parsed.author) author.value = parsed.author
      if (parsed.version) version.value = parsed.version
      if (parsed.categoryId) categoryId.value = parsed.categoryId
      if (parsed.icon) icon.value = parsed.icon
      if (parsed.desc) desc.value = parsed.desc
      if (parsed.styles) styles.value = parsed.styles
      if (parsed.code) code.value = parsed.code
      activeTab.value = 'form'
    } catch {
      errorMsg.value = 'Не удалось распарсить JSON файл манифеста'
    }
  }
  reader.readAsText(file)
}

const submitPlugin = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  if (!id.value.trim() || !name.value.trim()) {
    errorMsg.value = 'Пожалуйста, укажите ID и Название плагина'
    return
  }

  isPublishing.value = true
  try {
    const payload = {
      id: id.value.trim().toLowerCase(),
      name: name.value.trim(),
      author: author.value.trim() || 'Сторонний автор',
      version: version.value.trim() || '1.0.0',
      categoryId: categoryId.value,
      icon: icon.value,
      desc: desc.value.trim() || 'Сторонний плагин для расширения возможностей Snapi',
      hasTheme: styles.value.trim().length > 0,
      styles: styles.value,
      code: code.value
    }

    // Эмуляция сетевого запроса к серверу (вместо pluginStore.uploadPlugin)
    await new Promise(resolve => setTimeout(resolve, 1500))
    const res = { plugin: payload }

    successMsg.value = 'Плагин успешно опубликован на сервер!'
    emit('published', res?.plugin)
    setTimeout(() => {
      emit('close')
    }, 1200)
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.error || err?.message || 'Ошибка публикации плагина на сервер'
  } finally {
    isPublishing.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
    <div 
      class="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-3xl bg-[#0e1322] border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] text-white overflow-hidden"
    >
      <!-- Шапка модалки -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
        <div class="flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Upload class="size-5" />
          </div>
          <div>
            <h2 class="text-base font-bold text-white">Загрузить сторонний плагин</h2>
            <p class="text-xs text-slate-400">Публикация расширения в каталог сервера Snapi</p>
          </div>
        </div>

        <button 
          @click="emit('close')"
          class="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X class="size-4" />
        </button>
      </div>

      <!-- Вкладки: конструктор / файл -->
      <div class="flex items-center gap-2 px-6 pt-4 border-b border-white/5">
        <button
          type="button"
          @click="activeTab = 'form'"
          class="pb-2 text-xs font-medium transition-colors border-b-2 cursor-pointer"
          :class="activeTab === 'form' ? 'text-purple-400 border-purple-400 font-semibold' : 'text-slate-400 border-transparent hover:text-white'"
        >
          Конструктор плагина
        </button>
        <button
          type="button"
          @click="activeTab = 'file'"
          class="pb-2 text-xs font-medium transition-colors border-b-2 cursor-pointer"
          :class="activeTab === 'file' ? 'text-purple-400 border-purple-400 font-semibold' : 'text-slate-400 border-transparent hover:text-white'"
        >
          Импорт из файла (JSON)
        </button>
      </div>

      <!-- Тело модалки -->
      <div class="flex-1 overflow-y-auto p-6 space-y-4">
        <!-- Вкладка файла -->
        <div v-if="activeTab === 'file'" class="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-2xl hover:border-purple-400/40 transition-colors">
          <FileText class="size-12 text-purple-400 mb-3" />
          <h4 class="text-sm font-semibold text-white mb-1">Выберите файл manifest.json</h4>
          <p class="text-xs text-slate-400 text-center max-w-sm mb-4">
            Загрузите подготовленный файл плагина с метаданными, CSS стилями и скриптом
          </p>
          <label class="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium cursor-pointer transition-colors">
            Обзор файлов
            <input type="file" accept=".json" class="hidden" @change="handleFileUpload" />
          </label>
        </div>

        <!-- Вкладка формы конструктора -->
        <div v-else class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-medium text-slate-300">ID плагина (латиница без пробелов)</label>
              <input 
                v-model="id" 
                type="text" 
                placeholder="cyber-violet-theme"
                class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-400 font-mono"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-medium text-slate-300">Название плагина</label>
              <input 
                v-model="name" 
                type="text" 
                placeholder="Cyber Violet Theme"
                class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-medium text-slate-300">Автор</label>
              <input 
                v-model="author" 
                type="text" 
                placeholder="Developer"
                class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-medium text-slate-300">Версия</label>
              <input 
                v-model="version" 
                type="text" 
                placeholder="1.0.0"
                class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-400 font-mono"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-medium text-slate-300">Категория</label>
              <select 
                v-model="categoryId"
                class="w-full px-3 py-2 rounded-xl bg-[#141b2e] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-400"
              >
                <option value="visual">Визуализация / Темы</option>
                <option value="ai">Нейросети / AI</option>
                <option value="utils">Утилиты / Инструменты</option>
                <option value="sync">Синхронизация</option>
              </select>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-slate-300">Краткое описание</label>
            <textarea 
              v-model="desc" 
              rows="2"
              placeholder="Опишите, какие возможности добавляет ваш плагин..."
              class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-400 resize-none"
            ></textarea>
          </div>

          <!-- Редактор темы (CSS) -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Palette class="size-3.5 text-purple-400" />
                <span>Стили темы оформления (CSS переменные)</span>
              </label>
              <span class="text-[10px] text-slate-400">Опционально</span>
            </div>
            <textarea 
              v-model="styles" 
              rows="4"
              class="w-full p-3 rounded-xl bg-[#070a13] border border-white/10 text-xs text-emerald-400 font-mono focus:outline-none focus:border-purple-400 resize-none"
            ></textarea>
          </div>

          <!-- Редактор JS кода -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Code2 class="size-3.5 text-purple-400" />
                <span>Код плагина (JavaScript модуль)</span>
              </label>
              <span class="text-[10px] text-slate-400">Хуки install / uninstall</span>
            </div>
            <textarea 
              v-model="code" 
              rows="4"
              class="w-full p-3 rounded-xl bg-[#070a13] border border-white/10 text-xs text-sky-300 font-mono focus:outline-none focus:border-purple-400 resize-none"
            ></textarea>
          </div>
        </div>

        <!-- Уведомления об ошибке или успехе -->
        <div v-if="errorMsg" class="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          <AlertCircle class="size-4 shrink-0" />
          <span>{{ errorMsg }}</span>
        </div>

        <div v-if="successMsg" class="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <CheckCircle2 class="size-4 shrink-0" />
          <span>{{ successMsg }}</span>
        </div>
      </div>

      <!-- Подвал действий -->
      <div class="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.02]">
        <button 
          @click="emit('close')"
          class="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          Отмена
        </button>

        <button 
          @click="submitPlugin"
          :disabled="isPublishing"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-medium shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Sparkles class="size-4" />
          <span>{{ isPublishing ? 'Публикация на сервер...' : 'Опубликовать на сервер' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>