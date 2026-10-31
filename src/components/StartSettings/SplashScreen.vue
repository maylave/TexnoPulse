<template>
  <Transition
    leave-active-class="transition-all duration-700 ease-in-out"
    leave-from-class="opacity-100 scale-100 blur-0"
    leave-to-class="opacity-0 scale-105 blur-md"
  >
    <div
      v-if="isVisible"
      class="fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-[var(--color-background)] p-[var(--spacing-lg)] text-[var(--color-on-surface)] select-none"
    >
      <!-- 1. АТМОСФЕРНЫЙ ФОН -->
      <div class="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div class="bg-grid absolute inset-0 opacity-[0.03]"></div>
        <div 
          class="ambient-glow h-[450px] w-[450px] shrink-0 rounded-full opacity-20 blur-[110px]"
          style="background: radial-gradient(circle, var(--color-accent) 0%, transparent 70%);"
        ></div>
      </div>

      <div class="h-[40px] shrink-0"></div>

      <!-- 2. ЦЕНТРАЛЬНЫЙ БЛОК: Иконка, Название и Персональное приветствие -->
      <div class="relative z-10 flex w-full max-w-[460px] flex-col items-center text-center">
        
        <!-- Анимированная иконка -->
        <div class="relative mb-[var(--spacing-xl)] flex h-[144px] w-[144px] shrink-0 items-center justify-center">
          <div class="pulse-ring absolute h-[112px] w-[112px] rounded-full border border-[var(--color-accent)] opacity-0"></div>
          <div class="pulse-ring-delayed absolute h-[112px] w-[112px] rounded-full border border-[var(--color-accent)] opacity-0"></div>
          <div class="spin-slow absolute h-[144px] w-[144px] rounded-full border border-dashed border-[var(--glass-border)] opacity-70"></div>

          <img 
            src="@/assets/icon.ico" 
            alt="Snapi" 
            class="logo-pop relative z-10 h-[112px] w-[112px] shrink-0 drop-shadow-2xl"
          >
        </div>

        <!-- Название приложения -->
        <h1 class="reveal-up-1 w-full text-center text-[var(--font-size-display)] font-[var(--font-size-display--font-weight)] leading-[var(--font-size-display--line-height)] tracking-[var(--font-size-display--letter-spacing)] text-[var(--color-on-surface)]">
          Snapi
        </h1>

        <!-- Динамическое и случайное приветствие -->
        <div class="reveal-up-2 mt-[var(--spacing-sm)] flex flex-col gap-1">
          <p class="w-full text-center text-[var(--font-size-headline-md)] text-[var(--color-on-surface)]">
            {{ timeBasedGreeting }}
          </p>
          <p class="w-full text-center text-[var(--font-size-body-lg)] text-[var(--color-accent)]">
            {{ randomMotivationalPhrase }}
          </p>
        </div>
      </div>

      <!-- 3. НИЖНИЙ БЛОК: Статус и полоса загрузки -->
      <div class="reveal-up-3 relative z-10 flex w-full max-w-[340px] flex-col items-center gap-[var(--spacing-md)] pb-[var(--spacing-md)]">
        
        <div class="flex min-h-[24px] w-full items-center justify-center">
          <Transition
            mode="out-in"
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-1"
          >
            <span :key="currentStatusIndex" class="w-full text-center text-[var(--font-size-body-md)] text-[var(--color-on-surface-variant)]">
              {{ statusMessages[currentStatusIndex] }}
            </span>
          </Transition>
        </div>

        <div class="h-[6px] w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-surface-container-highest)]">
          <div
            class="relative h-full rounded-[var(--radius-full)] transition-all duration-200 ease-out"
            :style="{ 
              width: `${progress}%`, 
              backgroundColor: 'var(--color-accent)',
              boxShadow: '0 0 12px var(--color-accent)'
            }"
          >
            <div class="shimmer absolute inset-0"></div>
          </div>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

// Определяем входные параметры. Если имя не передано, используем дефолтное.
const props = withDefaults(defineProps<{
  userName?: string
}>(), {
  userName: 'Гость'
});

const emit = defineEmits<{
  (e: 'finished'): void;
}>();

const isVisible = ref(true);
const progress = ref(0);
const currentStatusIndex = ref(0);

// Вспомогательная функция для случайного элемента массива
const getRandomPhrase = (phrases: string[]) => phrases[Math.floor(Math.random() * phrases.length)];

// Словари случайных фраз для разного времени суток
const morningPhrases = [
  'Отличный день для новых идей!',
  'Время творить и создавать.',
  'Продуктивного утра и свежих мыслей!',
  'Пусть этот день будет успешным.'
];

const dayPhrases = [
  'Продолжаем в том же духе!',
  'Заметки ждут ваших мыслей.',
  'Отличный момент, чтобы всё структурировать.',
  'Работа кипит, синхронизация работает.'
];

const eveningPhrases = [
  'Время подвести итоги дня.',
  'Уютного вечера и спокойной работы.',
  'Самое время записать главные мысли за день.',
  'Отличная работа сегодня!'
];

const nightPhrases = [
  'Не засиживайтесь слишком допоздна!',
  'Время для самых спокойных размышлений.',
  'Система работает, пока вы отдыхаете.',
  'Спокойной ночи и светлых идей завтра.'
];

// 1. Формируем основу приветствия (Доброе утро, Артём!)
const timeBasedGreeting = computed(() => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return `Доброе утро, ${props.userName}!`;
  if (hour >= 12 && hour < 18) return `Добрый день, ${props.userName}!`;
  if (hour >= 18 && hour < 23) return `Добрый вечер, ${props.userName}!`;
  return `Доброй ночи, ${props.userName}!`;
});

// 2. Подбираем случайную фразу один раз при загрузке компонента
const randomMotivationalPhrase = ref('');

const initRandomPhrase = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) randomMotivationalPhrase.value = getRandomPhrase(morningPhrases);
  else if (hour >= 12 && hour < 18) randomMotivationalPhrase.value = getRandomPhrase(dayPhrases);
  else if (hour >= 18 && hour < 23) randomMotivationalPhrase.value = getRandomPhrase(eveningPhrases);
  else randomMotivationalPhrase.value = getRandomPhrase(nightPhrases);
};

const statusMessages = [
  'Инициализация ядра...',
  'Проверка локальной базы...',
  'Подготовка рабочего пространства...',
  'Запуск'
];

let progressInterval: ReturnType<typeof setInterval> | null = null;

const finishSplash = () => {
  if (progressInterval) clearInterval(progressInterval);
  progress.value = 100;
  currentStatusIndex.value = statusMessages.length - 1;

  setTimeout(() => {
    isVisible.value = false;
    setTimeout(() => emit('finished'), 650);
  }, 400);
};

onMounted(() => {
  initRandomPhrase(); // Генерируем фразу при старте

  const totalDuration = 2400;
  const stepTime = 40;
  const increment = 100 / (totalDuration / stepTime);

  progressInterval = setInterval(() => {
    if (progress.value < 100) {
      progress.value = Math.min(100, progress.value + increment);

      if (progress.value > 85) currentStatusIndex.value = 3;
      else if (progress.value > 55) currentStatusIndex.value = 2;
      else if (progress.value > 25) currentStatusIndex.value = 1;
    } else {
      finishSplash();
    }
  }, stepTime);
});

onUnmounted(() => {
  if (progressInterval) clearInterval(progressInterval);
});
</script>

<style scoped>
/* CSS стили остаются полностью без изменений, как в предыдущем шаге */
.bg-grid {
  background-size: 32px 32px;
  background-image: 
    linear-gradient(to right, var(--color-on-surface) 1px, transparent 1px),
    linear-gradient(to bottom, var(--color-on-surface) 1px, transparent 1px);
}

.ambient-glow {
  animation: breathe calc(5s * var(--anim-scale, 1)) ease-in-out infinite alternate;
}

@keyframes breathe {
  0% { transform: scale(0.85); opacity: 0.12; }
  100% { transform: scale(1.15); opacity: 0.28; }
}

.logo-pop {
  animation: logoPop calc(0.8s * var(--anim-scale, 1)) cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes logoPop {
  0% { opacity: 0; transform: scale(0.6) translateY(15px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.pulse-ring {
  animation: pulseRing calc(2.6s * var(--anim-scale, 1)) cubic-bezier(0.16, 1, 0.3, 1) infinite;
}
.pulse-ring-delayed {
  animation: pulseRing calc(2.6s * var(--anim-scale, 1)) cubic-bezier(0.16, 1, 0.3, 1) 1.3s infinite;
}

@keyframes pulseRing {
  0% { transform: scale(0.95); opacity: 0.45; }
  100% { transform: scale(1.75); opacity: 0; }
}

.spin-slow {
  animation: spin calc(24s * var(--anim-scale, 1)) linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.reveal-up-1 {
  opacity: 0;
  animation: revealUp calc(0.7s * var(--anim-scale, 1)) cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
}
.reveal-up-2 {
  opacity: 0;
  animation: revealUp calc(0.7s * var(--anim-scale, 1)) cubic-bezier(0.16, 1, 0.3, 1) 0.35s forwards;
}
.reveal-up-3 {
  opacity: 0;
  animation: revealUp calc(0.7s * var(--anim-scale, 1)) cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
}

@keyframes revealUp {
  0% { opacity: 0; transform: translateY(14px); }
  100% { opacity: 1; transform: translateY(0); }
}

.shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.45) 50%,
    transparent 100%
  );
  animation: shimmerMove calc(1.2s * var(--anim-scale, 1)) infinite;
}

@keyframes shimmerMove {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>