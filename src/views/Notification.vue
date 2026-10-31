<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useNotificationSize } from '@/composables/notification/useNotificationSize'
import { X, Bell, MessageSquare, ShieldAlert } from 'lucide-vue-next'
import { api } from '@/api/client'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'

const route = useRoute()
const { moveToBottomRight, hideWindow } = useNotificationSize({ autoMove: false })

const title = ref(String(route.query.title || 'Snapi'))
const body = ref(String(route.query.body || 'Новое уведомление'))
const type = ref(String(route.query.type || 'info'))
const isVisible = ref(false)
const isCliOnly = ref(false)

let hideTimer: ReturnType<typeof setTimeout> | null = null

const closeNotification = async () => {
  if (hideTimer) clearTimeout(hideTimer)
  isVisible.value = false
  setTimeout(async () => {
    await hideWindow()
    if (isCliOnly.value) {
      try {
        const currentWin = getCurrentWebviewWindow()
        await currentWin.destroy()
      } catch {}
    }
  }, 300)
}

const showWithContent = async (payload: { title?: string; body?: string; type?: string; isCliNotificationOnly?: boolean }) => {
  if (payload.title) title.value = payload.title
  if (payload.body) body.value = payload.body
  if (payload.type) type.value = payload.type
  if (payload.isCliNotificationOnly) isCliOnly.value = true

  if (hideTimer) clearTimeout(hideTimer)
  
  await moveToBottomRight()
  isVisible.value = true

  // Автоматическое скрытие через 5 секунд
  hideTimer = setTimeout(() => {
    closeNotification()
  }, 5000)
}

onMounted(async () => {
  // 1. Проверяем, запустился ли процесс через CLI флаг --notification
  try {
    const cliData = await invoke<any>('get_cli_notification')
    if (cliData) {
      isCliOnly.value = true
      await showWithContent(cliData)
    } else if (route.query.title || route.query.body) {
      // 2. Или параметры через URL Query
      await showWithContent({
        title: String(route.query.title || 'Snapi Messenger'),
        body: String(route.query.body || 'Приложение запущено и работает в фоне!'),
        type: String(route.query.type || 'info')
      })
    }
  } catch (e) {
    if (route.query.title || route.query.body) {
      await showWithContent({
        title: String(route.query.title || 'Snapi Messenger'),
        body: String(route.query.body || 'Приложение запущено и работает в фоне!'),
        type: String(route.query.type || 'info')
      })
    }
  }

  // 3. Слушаем события по WebSocket на случай новых уведомлений от бэкенда
  const unbind = api.on('notification:custom' as any, (data: any) => {
    if (data) showWithContent(data)
  })

  onUnmounted(() => {
    unbind?.()
    if (hideTimer) clearTimeout(hideTimer)
  })
})
</script>

<template>
  <div class="h-screen w-screen p-2 flex items-center justify-center bg-transparent overflow-hidden">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-4 opacity-0 scale-95"
      enter-to-class="transform translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100 scale-100"
      leave-to-class="transform translate-y-4 opacity-0 scale-95"
    >
      <div
        v-if="isVisible"
        class="relative flex items-start justify-between w-full overflow-hidden p-4 rounded-2xl bg-[#1e293b]/95 backdrop-blur-xl border border-white/10 shadow-2xl select-none"
      >
        <div class="absolute inset-0 -z-10 bg-[var(--color-accent,#38bdf8)] opacity-10"></div>

        <div class="flex items-start gap-3 min-w-0 flex-1 pr-2">
          <!-- Иконка типа -->
          <div class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
            <MessageSquare v-if="type === 'message'" class="size-4.5" />
            <ShieldAlert v-else-if="type === 'device'" class="size-4.5" />
            <Bell v-else class="size-4.5" />
          </div>

          <div class="flex flex-col min-w-0 flex-1">
            <span class="text-xs font-semibold text-white truncate">
              {{ title }}
            </span>
            <span class="mt-0.5 text-xs text-slate-300 line-clamp-2 leading-relaxed">
              {{ body }}
            </span>
          </div>
        </div>

        <!-- Кнопка закрытия -->
        <button
          type="button"
          @click="closeNotification"
          class="shrink-0 p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
          title="Закрыть"
        >
          <X class="size-4" />
        </button>
      </div>
    </Transition>
  </div>
</template>
