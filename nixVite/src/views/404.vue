<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'; // Если используешь роутер

const router = useRouter();

// Эффект "декодирования" текста при загрузке
const glitchText = ref('404');
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';

const scrambleText = () => {
  let iterations = 0;
  const interval = setInterval(() => {
    glitchText.value = glitchText.value
      .split('')
      .map((letter, index) => {
        if (index < iterations) return '404'[index];
        return chars[Math.floor(Math.random() * chars.length)];
      })
      .join('');
    
    if (iterations >= 3) clearInterval(interval);
    iterations += 1 / 3;
  }, 30);
};

// Запуск эффекта при монтировании
setTimeout(scrambleText, 500);

const goHome = () => {
   router.push('/'); // Для Vue Router
  console.log('Navigate to Home');
};
</script>

<template>
  <div class="relative min-h-screen w-full bg-base-100 flex flex-col items-center justify-center overflow-hidden selection:bg-primary selection:text-primary-content">
    
    <!-- 1. Фоновая 3D Сетка (Grid) -->
    <div class="absolute inset-0 z-0 opacity-30 pointer-events-none perspective-grid">
      <div class="w-[200%] h-[200%] absolute top-[-50%] left-[-50%] animate-grid-move"
           style="
             background-image: 
               linear-gradient(to right, rgba(102, 192, 244, 0.1) 1px, transparent 1px),
               linear-gradient(to bottom, rgba(102, 192, 244, 0.1) 1px, transparent 1px);
             background-size: 40px 40px;
             transform: perspective(500px) rotateX(60deg);
           ">
      </div>
    </div>

    <!-- 2. Сканирующая линия -->
    <div class="absolute top-0 left-0 w-full h-1 bg-primary/40 blur-[2px] z-20 animate-scan pointer-events-none"></div>

    <!-- Контент -->
    <div class="relative z-10 text-center px-4 max-w-lg">
      
      <!-- Глитч Текст -->
      <div class="relative inline-block mb-4 group cursor-default">
        <h1 class="text-[120px] md:text-[160px] font-black text-white leading-none select-none glitch-effect">
          {{ glitchText }}
        </h1>
        <!-- Псевдо-элементы для глитча реализованы через CSS ниже -->
      </div>

      <h2 class="text-2xl md:text-3xl font-bold text-white uppercase tracking-[0.2em] mb-4 drop-shadow-md">
        Системный сбой
      </h2>
      
      <p class="text-base-content/60 mb-10 text-sm md:text-base leading-relaxed">
        Запрашиваемый вами сектор данных не найден или был перемещен в другой кластер памяти.
      </p>
      
      <!-- Кнопка возврата -->
      <button 
        @click="goHome"
        class="group relative px-8 py-4 bg-transparent border-2 border-primary text-primary font-bold uppercase tracking-widest overflow-hidden transition-all hover:text-base-100 hover:shadow-[0_0_30px_rgba(102,192,244,0.6)]"
      >
        <span class="relative z-10">Вернуться на базу</span>
        <!-- Фон кнопки при ховере -->
        <div class="absolute inset-0 bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></div>
      </button>

    </div>
  </div>
</template>

<style scoped>
/* Анимация движения сетки */
@keyframes gridMove {
  0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
  100% { transform: perspective(500px) rotateX(60deg) translateY(40px); }
}
.animate-grid-move {
  animation: gridMove 2s linear infinite;
}

/* Анимация сканера */
@keyframes scan {
  0% { top: -10%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 110%; opacity: 0; }
}
.animate-scan {
  animation: scan 3s linear infinite;
}

/* Глитч эффект на чистом CSS для заголовка */
.glitch-effect {
  position: relative;
  text-shadow: 2px 2px var(--color-primary);
  animation: glitch-skew 3s infinite linear alternate-reverse;
}

.glitch-effect::before,
.glitch-effect::after {
  content: attr(data-text) "404"; /* Фиксируем контент */
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--color-base-100); /* Цвет фона страницы, чтобы перекрывать оригинал */
  opacity: 0.8;
}

.glitch-effect::before {
  color: #ff00c1;
  z-index: -1;
  clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
  transform: translate(-2px, -2px);
  animation: glitch-anim-1 2.5s infinite linear alternate-reverse;
}

.glitch-effect::after {
  color: #00fff9;
  z-index: -2;
  clip-path: polygon(0 60%, 100% 60%, 100% 100%, 0 100%);
  transform: translate(2px, 2px);
  animation: glitch-anim-2 3s infinite linear alternate-reverse;
}

@keyframes glitch-anim-1 {
  0% { clip-path: inset(20% 0 80% 0); }
  20% { clip-path: inset(60% 0 10% 0); }
  40% { clip-path: inset(40% 0 50% 0); }
  60% { clip-path: inset(80% 0 5% 0); }
  80% { clip-path: inset(10% 0 70% 0); }
  100% { clip-path: inset(30% 0 20% 0); }
}

@keyframes glitch-anim-2 {
  0% { clip-path: inset(10% 0 60% 0); }
  20% { clip-path: inset(30% 0 10% 0); }
  40% { clip-path: inset(80% 0 5% 0); }
  60% { clip-path: inset(15% 0 70% 0); }
  80% { clip-path: inset(50% 0 20% 0); }
  100% { clip-path: inset(5% 0 80% 0); }
}
</style>