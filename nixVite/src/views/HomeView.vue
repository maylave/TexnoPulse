<template>
  <AppNavbar />
  <div class="space-y-16 pb-16 min-h-screen bg-base-100">
    
    <!-- 1. HERO SECTION -->
    <section class="hero min-h-[80vh] bg-base-200 relative overflow-hidden rounded-b-3xl shadow-inner">
      <div class="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=2042" 
          alt="Gaming PC Setup" 
          class="w-full h-full object-cover opacity-20 mix-blend-overlay"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-base-200 via-base-200/80 to-transparent"></div>
      </div>

      <div class="hero-content text-center relative z-10 max-w-4xl mx-auto pt-10">
        <div class="max-w-2xl animate-fade-in-up">
          <h1 class="mb-6 text-5xl md:text-7xl font-extrabold tracking-tight text-base-content leading-tight drop-shadow-lg">
            Твой идеальный <span class="text-primary">PC</span> уже здесь
          </h1>
          <p class="mb-8 text-lg md:text-xl opacity-90 font-light text-base-content/90">
            Лучшие комплектующие от ведущих брендов. Собери свою мечту или выбери готовую конфигурацию с гарантией качества.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <router-link to="/catalog" class="btn btn-primary btn-lg px-8 shadow-lg shadow-primary/30 hover:scale-105 transition-transform border-none">
              Перейти в каталог
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </router-link>
            <button class="btn btn-outline btn-lg px-8 hover:bg-base-100 hover:border-primary hover:text-primary transition-colors">
              Конфигуратор ПК
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. КАТЕГОРИИ -->
    <section class="container mx-auto px-4">
      <div class="text-center mb-10">
        <h2 class="text-3xl font-bold mb-2 text-white">Популярные категории</h2>
        <div class="w-20 h-1 bg-primary mx-auto rounded-full shadow-[0_0_10px_var(--color-primary)]"></div>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div v-for="cat in categories" :key="cat.name" class="card bg-base-200 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group border border-white/5 hover:-translate-y-1 hover:border-primary/50">
          <figure class="px-4 pt-4 bg-base-300/30 rounded-t-box aspect-video overflow-hidden relative">
            <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
            <img :src="cat.image" :alt="cat.name" class="rounded-xl object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
          </figure>
          <div class="card-body items-center text-center p-4">
            <h3 class="font-bold text-lg text-white group-hover:text-primary transition-colors">{{ cat.name }}</h3>
            <p class="text-xs opacity-60">{{ cat.count }} товаров</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. ХИТЫ ПРОДАЖ (Из API) -->
    <section class="container mx-auto px-4">
      <div class="flex justify-between items-end mb-8">
        <div>
          <h2 class="text-3xl font-bold mb-2 text-white">Хиты продаж 🔥</h2>
          <p class="opacity-70 text-base-content/70">Выбор наших покупателей на этой неделе</p>
        </div>
        <router-link to="/catalog" class="btn btn-ghost btn-sm text-primary hidden sm:inline-flex hover:bg-primary/10">
          Смотреть все
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        </router-link>
      </div>

      <!-- Лоадер -->
      <div v-if="loading" class="flex justify-center py-20 min-h-[300px] items-center">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <!-- Сетка товаров -->
      <div v-else-if="featuredProducts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ProductCard 
          v-for="product in featuredProducts" 
          :key="product.id" 
          :product="product" 
        />
      </div>

      <!-- Пустое состояние -->
      <div v-else class="text-center py-10 bg-base-200/50 rounded-lg border border-white/5">
        <p class="text-base-content/50">На данный момент нет рекомендованных товаров.</p>
        <button @click="fetchFeatured" class="btn btn-sm btn-outline mt-4">Обновить</button>
      </div>
      
      <div class="mt-8 text-center sm:hidden">
        <router-link to="/catalog" class="btn btn-outline btn-primary w-full">Смотреть весь каталог</router-link>
      </div>
    </section>

  </div>
  <AppFooter/>
</template>

<script lang="ts" setup>
import type { Product } from '@/types'
import { onMounted, ref } from 'vue'
import AppFooter from '../components/AppFooter.vue'
import AppNavbar from '../components/AppNavbar.vue'
import ProductCard from '../components/ProductCard.vue'
import { api } from '../services/api.resources'

// --- Данные категорий ---
const categories = [
  { name: 'Видеокарты', count: 124, image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=400' },
  { name: 'Процессоры', count: 85, image: 'https://images.unsplash.com/photo-1555618568-9b531d27f5a7?auto=format&fit=crop&q=80&w=400' },
  { name: 'Материнские платы', count: 62, image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400' },
  { name: 'SSD Накопители', count: 98, image: 'https://images.unsplash.com/photo-1628557044797-f21a177c37ec?auto=format&fit=crop&q=80&w=400' },
]

// --- Состояние товаров ---
const featuredProducts = ref<Product[]>([])
const loading = ref(true)

// Функция загрузки
const fetchFeatured = async () => {
  try {
    loading.value = true
    // Вызываем метод из API сервиса
    const response = await api.products.getFeatured()
    featuredProducts.value = response
  } catch (err) {
    console.error('Failed to fetch featured products:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchFeatured()
})
</script>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>