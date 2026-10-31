<template>
  <div class="bg-[var(--color-background)] h-screen w-full overflow-hidden relative">
    
    <!-- Этап 1: Мастер первоначальной настройки -->
    <SetupWizard 
      v-if="showSetup"
      @complete="onSetupComplete"
    />

    <!-- Этап 2: Кинематографичная заставка загрузки -->
    <SplashScreen 
      v-if="showSplash"
      :user-name="userName"
      @finished="onSplashFinished"
    />

    <!-- Уведомление об ошибке сервера с кнопкой "Повторить" -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-4 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-4 opacity-0"
    >
      <div 
        v-if="serverError" 
        class="fixed bottom-[var(--spacing-lg)] right-[var(--spacing-lg)] z-[100] flex min-w-[320px] items-center justify-between gap-[var(--spacing-md)] rounded-[var(--radius-md)] bg-[var(--color-error-container)] px-[var(--spacing-md)] py-[12px] text-[var(--color-on-error-container)] shadow-2xl border border-[var(--color-error)]/30"
      >
        <div class="flex items-center gap-[12px]">
          <!-- Иконка ошибки -->
          <svg class="h-6 w-6 shrink-0 text-[var(--color-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div class="flex flex-col">
            <span class="text-[11px] font-bold uppercase tracking-wider opacity-70">Связь с ядром потеряна</span>
            <span class="text-[14px] font-mono font-medium">{{ serverError }}</span>
          </div>
        </div>

        <!-- Кнопка повторного подключения -->
        <button 
          @click="checkServerHealth"
          :disabled="isRetrying"
          class="flex h-8 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-error)] px-3 text-[13px] font-semibold text-[var(--color-on-error)] transition-all hover:brightness-110 active:scale-95 disabled:opacity-70"
        >
          <svg v-if="isRetrying" class="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span v-else>Повторить</span>
        </button>
      </div>
    </Transition>

  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import SetupWizard from '@/components/StartSettings/SetupWizard.vue';
import SplashScreen from '@/components/StartSettings/SplashScreen.vue';

const router = useRouter();

const showSetup = ref(false);
const showSplash = ref(false);
const userName = ref('');
const serverError = ref<string | null>(null);
const isRetrying = ref(false);

const checkServerHealth = async () => {
  isRetrying.value = true;
  serverError.value = null;

  try {
    // В реальном проекте раскомментируйте вызов API:
    // const status = await api.call('app:network:status');
    // if (!status) throw new Error('Offline');
    
    // Искусственная задержка для имитации запроса к бэкенду
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    // Чтобы протестировать появление ошибки, раскомментируйте строку ниже:
    // throw new Error('Testing error UI');

    // Если сервер доступен, проверяем профиль пользователя
    initAppFlow();
  } catch (error) {
    serverError.value = 'ERR_CORE_OFFLINE';
    showSetup.value = false;
    showSplash.value = false;
  } finally {
    isRetrying.value = false;
  }
};

const initAppFlow = () => {
  const savedName = localStorage.getItem('snapi_user_name');
  
  if (savedName && savedName !== '[object Object]') {
    userName.value = savedName;
    showSplash.value = true;
  } else {
    localStorage.removeItem('snapi_user_name');
    showSetup.value = true;
  }
};

onMounted(() => {
  checkServerHealth();
});

const onSetupComplete = (data: { userName: string, theme: string }) => {
  userName.value = data.userName;
  localStorage.setItem('snapi_user_name', data.userName);
  
  showSetup.value = false;
  showSplash.value = true;
};

const onSplashFinished = () => {
  showSplash.value = false;
  router.push({ name: 'home' });
};
</script>