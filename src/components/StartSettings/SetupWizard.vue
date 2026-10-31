<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-[40px] bg-[var(--color-background)] transition-colors duration-500">
    
    <!-- Панель быстрых действий (Верхний правый угол) -->
    <div class="absolute right-[32px] top-[32px] flex gap-[12px]">
      <!-- Кнопка сетевых настроек -->
      <button 
        @click="toggleNetworkSettings"
        class="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[var(--color-surface-container)] border border-[var(--glass-border)] text-[var(--color-on-surface)] transition-all hover:scale-105 hover:bg-[var(--color-surface-container-high)] shadow-sm outline-none cursor-pointer"
        title="Сетевые настройки"
      >
        <svg class="h-[20px] w-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <!-- Переключатель темы -->
      <button 
        @click="toggleLightDark"
        class="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[var(--color-surface-container)] border border-[var(--glass-border)] text-[var(--color-on-surface)] transition-all hover:scale-105 hover:bg-[var(--color-surface-container-high)] shadow-sm outline-none cursor-pointer"
        title="Сменить тему"
      >
        <svg v-if="activeThemeId === 'paper'" class="h-[20px] w-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <svg v-else class="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </button>
    </div>

    <!-- Главная карточка -->
    <div class="relative w-full max-w-[480px] shrink-0 rounded-[24px] bg-[var(--color-surface)] border border-[var(--glass-border)] p-[40px] flex flex-col shadow-2xl transition-colors duration-500 overflow-hidden">
      
      <!-- Прогресс-бар (скрываем в режиме настроек сети) -->
      <div v-show="!isNetworkMode" class="mb-[32px] flex gap-[8px] w-full transition-opacity">
        <div 
          v-for="stepIndex in totalSteps" 
          :key="stepIndex"
          class="h-[4px] flex-1 rounded-full transition-colors duration-500 ease-out"
          :style="{ backgroundColor: currentStep >= stepIndex - 1 ? 'var(--color-accent)' : 'var(--color-surface-container-highest)' }"
        ></div>
      </div>

      <div class="min-h-[260px] flex w-full flex-col justify-center">
        <Transition mode="out-in" enter-active-class="transition-all duration-300 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" leave-active-class="transition-all duration-200 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
          
          <!-- РЕЖИМ: НАСТРОЙКИ СЕТИ -->
          <div v-if="isNetworkMode" class="flex w-full flex-col items-center text-center">
            <div class="mb-[24px] flex h-[80px] w-[80px] items-center justify-center rounded-full bg-[var(--color-surface-container)] border border-[var(--glass-border)] text-[var(--color-accent)] shadow-inner">
              <svg class="h-[40px] w-[40px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
              </svg>
            </div>
            <h2 class="mb-[8px] w-full text-[24px] font-semibold text-[var(--color-on-surface)] tracking-tight">
              Локальный узел
            </h2>
            <p class="mb-[24px] w-full text-[15px] text-[var(--color-on-surface-variant)] leading-relaxed">
              Настройка P2P-соединения для синхронизации.
            </p>

            <!-- Статус сервера -->
            <div class="mb-[24px] flex items-center gap-[8px] rounded-[12px] bg-[var(--color-surface-container-lowest)] px-[16px] py-[8px] border border-[var(--glass-border)]">
              <span class="relative flex h-[10px] w-[10px]">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" :class="isServerRunning ? 'bg-emerald-400' : 'bg-rose-400'"></span>
                <span class="relative inline-flex rounded-full h-[10px] w-[10px]" :class="isServerRunning ? 'bg-emerald-500' : 'bg-rose-500'"></span>
              </span>
              <span class="text-[14px] font-medium" :class="isServerRunning ? 'text-emerald-500' : 'text-rose-500'">
                {{ isServerRunning ? 'Сервер активен' : 'Ошибка порта' }}
              </span>
            </div>
            
            <div class="w-full max-w-[240px]">
              <label class="mb-[6px] block text-[13px] text-[var(--color-on-surface-variant)] text-left pl-[4px]">P2P Порт (WebSocket)</label>
              <input 
                v-model="p2pPort" 
                type="number" 
                class="w-full rounded-[12px] bg-[var(--color-surface-container-lowest)] border border-[var(--glass-border)] px-[20px] py-[12px] text-center text-[16px] font-mono text-[var(--color-on-surface)] transition-all outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
              >
            </div>
          </div>

          <!-- ШАГ 1: Введение -->
          <div v-else-if="currentStep === 0" class="flex w-full flex-col items-center text-center">
            <!-- (Оставлено без изменений, как в предыдущем коде) -->
            <div class="mb-[24px] flex h-[80px] w-[80px] items-center justify-center rounded-full bg-[var(--color-surface-container)] border border-[var(--glass-border)] text-[var(--color-accent)] shadow-inner">
              <svg class="h-[40px] w-[40px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h2 class="mb-[8px] w-full text-[24px] font-semibold text-[var(--color-on-surface)] tracking-tight">Настройка профиля</h2>
            <p class="w-full text-[15px] text-[var(--color-on-surface-variant)] leading-relaxed">Похоже, вы здесь впервые. Давайте подготовим ваше рабочее пространство.</p>
          </div>

          <!-- ШАГ 2: Имя -->
          <div v-else-if="currentStep === 1" class="flex w-full flex-col items-center text-center">
            <h2 class="mb-[8px] w-full text-[24px] font-semibold text-[var(--color-on-surface)] tracking-tight">Как к вам обращаться?</h2>
            <p class="mb-[32px] w-full text-[15px] text-[var(--color-on-surface-variant)] leading-relaxed">Это имя будет использоваться для персональных приветствий.</p>
            <div class="w-full max-w-[320px]">
              <input 
                ref="nameInput"
                v-model="userName" 
                type="text" 
                placeholder="Введите имя"
                autocomplete="off"
                spellcheck="false"
                class="w-full rounded-[12px] bg-transparent border border-[var(--glass-border)] px-[20px] py-[14px] text-center text-[16px] text-[var(--color-on-surface)] transition-all placeholder:text-[var(--color-on-surface-variant)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 outline-none autofill-fix"
                @keyup.enter="nextStep"
              >
              <p v-if="showError" class="mt-[8px] text-[13px] text-[var(--color-error)]">Пожалуйста, введите ваше имя</p>
            </div>
          </div>

          <!-- ШАГ 3: Выбор темы -->
          <div v-else-if="currentStep === 2" class="flex w-full flex-col items-center text-center">
            <!-- (Оставлено без изменений) -->
            <h2 class="mb-[8px] w-full text-[24px] font-semibold text-[var(--color-on-surface)] tracking-tight">Выберите оформление</h2>
            <div class="flex w-full flex-col gap-[12px] mt-[16px]">
              <button 
                v-for="(theme, key) in predefinedThemes" 
                :key="key"
                @click="applyTheme(key)"
                class="group relative flex items-center gap-[16px] rounded-[14px] border p-[16px] transition-all cursor-pointer"
                :class="activeThemeId === key ? 'border-[var(--color-accent)] bg-[var(--color-surface-container)] ring-2 ring-[var(--color-accent)]/20' : 'border-[var(--glass-border)] bg-[var(--color-surface-container-lowest)] hover:bg-[var(--color-surface-container)]'"
              >
                <div class="h-[18px] w-[18px] rounded-full shadow-sm border border-black/10" :style="{ backgroundColor: theme.colorHint }"></div>
                <span class="text-[15px] font-medium text-[var(--color-on-surface)]">{{ theme.name }}</span>
                <svg v-if="activeThemeId === key" class="absolute right-[16px] h-[22px] w-[22px] text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
              </button>
            </div>
          </div>

          <!-- ШАГ 4: Завершение -->
          <div v-else-if="currentStep === 3" class="flex w-full flex-col items-center text-center">
            <!-- (Оставлено без изменений) -->
            <div class="mb-[24px] flex h-[80px] w-[80px] items-center justify-center rounded-full bg-[var(--color-surface-container)] border border-[var(--glass-border)] text-[var(--color-accent)] shadow-inner"><svg class="h-[40px] w-[40px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            <h2 class="mb-[8px] w-full text-[24px] font-semibold text-[var(--color-on-surface)] tracking-tight">Всё готово, {{ userName }}!</h2>
          </div>
        </Transition>
      </div>

      <!-- Навигация -->
      <div class="mt-[40px] flex w-full items-center justify-between">
        
        <button 
          @click="handleBackAction"
          class="px-[16px] py-[8px] text-[15px] font-medium text-[var(--color-on-surface-variant)] transition-colors hover:text-[var(--color-on-surface)] outline-none cursor-pointer"
          :class="{ 'invisible': currentStep === 0 && !isNetworkMode }"
        >
          {{ isNetworkMode ? 'Вернуться' : 'Назад' }}
        </button>

        <button 
          @click="handlePrimaryAction" 
          class="group relative inline-flex items-center justify-center gap-[8px] rounded-[12px] px-[24px] py-[12px] text-[15px] font-semibold text-white transition-all outline-none active:scale-95 shadow-md cursor-pointer hover:brightness-110"
          style="background-color: var(--color-accent);"
        >
          <span>
            <template v-if="isNetworkMode">Применить порт</template>
            <template v-else-if="currentStep === totalSteps - 1">Завершить</template>
            <template v-else>Продолжить</template>
          </span>
          <svg v-if="!isNetworkMode && currentStep !== totalSteps - 1" class="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { predefinedThemes } from '@/config/themes.config';
import { useThemeStore } from '@/stores/theme';

const themeStore = useThemeStore();
const emit = defineEmits(['complete']);

const totalSteps = 4;
const currentStep = ref(0);
const userName = ref('');
const showError = ref(false);
const nameInput = ref<HTMLInputElement | null>(null);
const activeThemeId = ref('aether');

// --- Стейт для Сетевых настроек ---
const isNetworkMode = ref(false);
const p2pPort = ref(8080);
const isServerRunning = ref(true); // В реальном коде обновлять через API

const toggleNetworkSettings = () => {
  isNetworkMode.value = !isNetworkMode.value;
};

const saveNetworkSettings = async () => {
  // Здесь будет вызов вашего API: await api.call('app:network:setPort', { newPort: p2pPort.value })
  console.log('Сохранение порта:', p2pPort.value);
  // Имитация успешного сохранения:
  isServerRunning.value = true;
  isNetworkMode.value = false;
};

const handlePrimaryAction = () => {
  if (isNetworkMode.value) {
    saveNetworkSettings();
    return;
  }
  nextStep();
};

const handleBackAction = () => {
  if (isNetworkMode.value) {
    isNetworkMode.value = false;
    return;
  }
  if (currentStep.value > 0) {
    currentStep.value--;
    showError.value = false;
  }
};

const applyTheme = (themeKey: string) => {
  activeThemeId.value = themeKey;
  themeStore.setVars(predefinedThemes[themeKey].vars);
};

const toggleLightDark = () => {
  const newTheme = activeThemeId.value === 'paper' ? 'aether' : 'paper';
  applyTheme(newTheme);
};

const nextStep = async () => {
  if (currentStep.value === 1) {
    if (userName.value.trim() === '') {
      showError.value = true;
      return;
    }
    showError.value = false;
  }

  if (currentStep.value === totalSteps - 1) {
    emit('complete', { userName: userName.value.trim(), theme: activeThemeId.value });
  } else {
    currentStep.value++;
  }
};

watch(currentStep, async (newStep) => {
  if (newStep === 1 && !isNetworkMode.value) {
    await nextTick();
    nameInput.value?.focus();
  }
});
</script>

<style scoped>
.autofill-fix:-webkit-autofill,
.autofill-fix:-webkit-autofill:hover, 
.autofill-fix:-webkit-autofill:focus, 
.autofill-fix:-webkit-autofill:active{
    -webkit-box-shadow: 0 0 0 30px var(--color-surface) inset !important;
    -webkit-text-fill-color: var(--color-on-surface) !important;
    transition: background-color 5000s ease-in-out 0s;
}
</style>