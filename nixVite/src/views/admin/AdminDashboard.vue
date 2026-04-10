<script setup lang="ts">
import { ref } from 'vue'


const weeklyStats = [
  { day: 'Пн', val: 40 },
  { day: 'Вт', val: 65 },
  { day: 'Ср', val: 35 },
  { day: 'Чт', val: 85 },
  { day: 'Пт', val: 55 },
  { day: 'Сб', val: 95 }, 
  { day: 'Вс', val: 70 }
];


const orders = ref([
  { id: '#8392', client: 'Алексей П.', amount: 189990, status: 'paid' },
  { id: '#8393', client: 'Мария С.', amount: 22000, status: 'pending' },
  { id: '#8394', client: 'Иван Д.', amount: 4500, status: 'failed' },
  { id: '#8395', client: 'Дмитрий К.', amount: 75000, status: 'paid' },
]);


const formatPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(price) + ' ₽';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'paid': return { class: 'badge-success', text: 'Оплачен' };
    case 'pending': return { class: 'badge-warning', text: 'В обработке' };
    case 'failed': return { class: 'badge-error', text: 'Отмена' };
    default: return { class: 'badge-ghost', text: status };
  }
};


const activeMenu = ref('dashboard');
</script>

<template>
  <div class="flex min-h-screen bg-base-100 text-base-content font-sans">
    
   
    <aside class="w-64 bg-base-200 border-r border-white/5 hidden md:flex flex-col fixed h-full z-20">
     
      <div class="h-16 flex items-center px-6 border-b border-white/5">
        <span class="text-xl font-bold text-white uppercase tracking-widest">Tech<span class="text-primary">Nova</span></span>
      </div>

     
      <ul class="menu p-4 gap-2 flex-1">
        <li>
          <a 
            @click="activeMenu = 'dashboard'"
            :class="{ 'active bg-primary/10 text-primary border-l-4 border-primary': activeMenu === 'dashboard' }"
            class="hover:bg-white/5 hover:text-white transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Дашборд
          </a>
        </li>
        <li>
          <a 
            @click="activeMenu = 'products'"
            :class="{ 'active bg-primary/10 text-primary border-l-4 border-primary': activeMenu === 'products' }"
            class="hover:bg-white/5 hover:text-white transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            Товары
          </a>
        </li>
        <li>
          <a 
            @click="activeMenu = 'orders'"
            :class="{ 'active bg-primary/10 text-primary border-l-4 border-primary': activeMenu === 'orders' }"
            class="hover:bg-white/5 hover:text-white transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            Заказы
          </a>
        </li>
        <li>
          <a class="hover:bg-white/5 hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Клиенты
          </a>
        </li>
      </ul>

  
      <div class="p-4 border-t border-white/5 bg-black/20">
        <div class="flex items-center gap-3">
          <div class="avatar online">
            <div class="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img src="https://via.placeholder.com/100/1b2838/66c0f4?text=AD" />
            </div>
          </div>
          <div>
            <div class="font-bold text-sm text-white">Artem Admin</div>
            <div class="text-xs text-base-content/50">SuperUser</div>
          </div>
        </div>
      </div>
    </aside>

    
    <main class="flex-1 md:ml-64 p-6 lg:p-10 overflow-y-auto">
      
      
      <header class="flex justify-between items-center mb-8">
        <h1 class="text-2xl font-bold text-white uppercase tracking-wide">Обзор системы</h1>
        <button class="btn btn-success btn-sm text-white shadow-lg shadow-success/20">
          + Добавить товар
        </button>
      </header>

      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
       
        <div class="stat bg-base-200 border border-white/5 rounded-lg shadow-md relative overflow-hidden group">
          <div class="stat-figure text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div class="stat-title text-base-content/60">Выручка (Сегодня)</div>
          <div class="stat-value text-white text-3xl">142k ₽</div>
          <div class="stat-desc text-success flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd" /></svg>
            12% к вчерашнему дню
          </div>
         
          <div class="absolute top-0 right-0 h-full w-1 bg-primary"></div>
        </div>

      
        <div class="stat bg-base-200 border border-white/5 rounded-lg shadow-md relative overflow-hidden">
          <div class="stat-figure text-secondary">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          </div>
          <div class="stat-title text-base-content/60">Новые заказы</div>
          <div class="stat-value text-white text-3xl">24</div>
          <div class="stat-desc text-secondary">5 новых за последний час</div>
          <div class="absolute top-0 right-0 h-full w-1 bg-secondary"></div>
        </div>

        
         <div class="stat bg-base-200 border border-white/5 rounded-lg shadow-md relative overflow-hidden">
          <div class="stat-figure text-accent">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <div class="stat-title text-base-content/60">Пользователи</div>
          <div class="stat-value text-white text-3xl">1,204</div>
          <div class="stat-desc text-error">▼ 1% отписок</div>
          <div class="absolute top-0 right-0 h-full w-1 bg-accent"></div>
        </div>

        
        <div class="stat bg-base-200 border border-white/5 rounded-lg shadow-md relative overflow-hidden">
          <div class="stat-figure text-info">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
          </div>
          <div class="stat-title text-base-content/60">Нагрузка CPU</div>
          <div class="stat-value text-white text-3xl">34%</div>
          <div class="stat-desc text-base-content/50">Стабильно</div>
          <div class="absolute top-0 right-0 h-full w-1 bg-info"></div>
        </div>
      </div>

    
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        <!-- График (CSS Only) -->
        <div class="lg:col-span-2 bg-base-200 border border-white/5 rounded-lg p-6 shadow-lg">
          <h3 class="text-lg font-bold text-white mb-6 uppercase tracking-wide border-b border-white/5 pb-2">Активность продаж</h3>
          
          <div class="h-64 flex items-end justify-between gap-2 sm:gap-4 pt-4">
            <div v-for="day in weeklyStats" :key="day.day" class="group relative w-full flex flex-col justify-end items-center h-full">
              <!-- Тултип -->
              <div class="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black text-white text-xs py-1 px-2 rounded transition-opacity whitespace-nowrap z-10">
                {{ day.val }} продаж
              </div>
              <!-- Бар -->
              <div 
                class="w-full max-w-[40px] bg-base-300 rounded-t-sm hover:bg-primary transition-all duration-300 cursor-pointer relative"
                :style="{ height: day.val + '%' }"
              ></div>
              <!-- Подпись дня -->
              <div class="text-xs text-base-content/50 mt-2 font-medium">{{ day.day }}</div>
            </div>
          </div>
        </div>

        <!-- Топ товаров -->
        <div class="bg-base-200 border border-white/5 rounded-lg p-6 shadow-lg">
          <h3 class="text-lg font-bold text-white mb-6 uppercase tracking-wide border-b border-white/5 pb-2">Топ товаров</h3>
          
          <div class="space-y-6">
            <div v-for="(item, idx) in ['RTX 4090', 'Intel i9-14900K', 'ASUS ROG Scar']" :key="idx">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-white font-medium">{{ item }}</span>
                <span class="text-base-content/60">{{ 90 - (idx * 15) }}%</span>
              </div>
              <progress 
                class="progress w-full h-2 bg-base-300" 
                :value="90 - (idx * 15)" 
                max="100"
                :class="idx === 0 ? 'progress-primary' : idx === 1 ? 'progress-success' : 'progress-warning'"
              ></progress>
            </div>
          </div>
        </div>
      </div>

      <!-- Таблица заказов -->
      <div class="bg-base-200 border border-white/5 rounded-lg shadow-lg overflow-hidden">
        <div class="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 class="text-lg font-bold text-white uppercase tracking-wide">Последние заказы</h3>
          <button class="btn btn-xs btn-ghost text-primary">Показать все</button>
        </div>
        
        <div class="overflow-x-auto">
          <table class="table w-full">
            <thead>
              <tr class="bg-base-300/50 text-base-content/70 uppercase text-xs">
                <th>ID</th>
                <th>Клиент</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th class="text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orders" :key="order.id" class="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                <td class="font-mono text-primary font-bold">{{ order.id }}</td>
                <td class="text-white font-medium">{{ order.client }}</td>
                <td class="font-mono">{{ formatPrice(order.amount) }}</td>
                <td>
                  <div 
                    class="badge text-[10px] font-bold uppercase px-3 gap-1"
                    :class="getStatusBadge(order.status).class"
                  >
                    {{ getStatusBadge(order.status).text }}
                  </div>
                </td>
                <td class="text-right">
                  <div class="join">
                    <button class="join-item btn btn-xs btn-square btn-ghost text-base-content/50 hover:text-white">✏️</button>
                    <button class="join-item btn btn-xs btn-square btn-ghost text-base-content/50 hover:text-error">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </main>
  </div>
</template>