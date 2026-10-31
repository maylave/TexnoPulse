<!-- src/components/settings/UiServerStatus.vue -->
<script setup lang="ts">
import { CheckCircle2, AlertCircle } from "lucide-vue-next";
import { api } from "@/api/client";
</script>

<template>
  <div class="flex flex-col gap-2 rounded-xl bg-black/20 p-4 border border-white/5 text-xs w-full mb-3 mt-2">
    <div class="flex items-center justify-between">
      <span class="text-on-surface-variant">Текущий порт бэкенда:</span>
      <span class="font-mono text-sm font-semibold text-sky-400">
        {{ api.currentPort.value || 'Не задан' }}
      </span>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-on-surface-variant">Статус соединения:</span>
      <span 
        class="flex items-center gap-1.5 font-medium" 
        :class="api.status.value === 'open' ? 'text-emerald-400' : 'text-amber-400'"
      >
        <CheckCircle2 v-if="api.status.value === 'open'" class="size-3.5" />
        <AlertCircle v-else class="size-3.5" />
        {{ 
          api.status.value === 'open' 
            ? 'Подключено' 
            : (api.status.value === 'connecting' ? 'Подключение...' : 'Отключено') 
        }}
      </span>
    </div>
  </div>
</template>