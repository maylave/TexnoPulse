<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppNavbar from '../components/AppNavbar.vue'
import { api } from '../services/api.resources'
import { useCartStore } from '../stores/cart'
import type { Product } from '../types'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

// --- Состояние ---
const products = ref<Product[]>([])
const loading = ref(true)
const error = ref('')

// Фильтры
const searchQuery = ref((route.query.search as string) || '')
const selectedCategory = ref((route.query.category as string) || 'all')

const categories = [
  { id: 'all', name: 'Все' },
  { id: 'gpu', name: 'Видеокарты' },
  { id: 'cpu', name: 'Процессоры' },
  { id: 'laptop', name: 'Ноутбуки' },
  { id: 'periphery', name: 'Периферия' },
  { id: 'motherboard', name: 'Мат. платы' },
  { id: 'ssd', name: 'SSD' }
]

// --- Загрузка данных ---
const fetchProducts = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const params: any = {}
    if (selectedCategory.value !== 'all') {
      params.category = selectedCategory.value
    }
    const currentSearch = (route.query.search as string) || searchQuery.value
    
    if (currentSearch) {
      params.search = currentSearch
    }

    const response = await api.products.getAll(params)
    
    if (Array.isArray(response)) {
      products.value = response
    } else if ((response as any).data) {
      products.value = (response as any).data
    } else {
      products.value = []
    }
    
  } catch (err) {
    console.error('Failed to fetch products:', err)
    error.value = 'Не удалось загрузить товары.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProducts()
})

watch([selectedCategory], () => {
  router.push({ 
    query: { 
      ...route.query, 
      category: selectedCategory.value === 'all' ? undefined : selectedCategory.value,
      search: searchQuery.value || undefined
    } 
  })
  fetchProducts()
})

const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value
  return products.value.filter(product => {
    return product.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  })
})

// --- Хелперы ---
const formatPrice = (price: number | string) => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('ru-RU').format(num) + ' ₽';
};

const getCategoryName = (catId: string) => {
  return categories.find(c => c.id === catId)?.name ?? 'Оборудование';
};

// Функция добавления в корзину (теперь реальная)
const addToCart = async (product: Product) => {
  // Можно добавить локальное состояние загрузки для конкретной карточки, 
  // но для простоты вызываем метод стора
  await cartStore.addToCart(product, 1)
}
</script>

<template>
  <div class="min-h-screen bg-base-100 text-base-content pb-20">
    
    <AppNavbar />

    <!-- Панель поиска и фильтров -->
    <div class="bg-base-200/50 border-b border-white/5 py-4 sticky top-[80px] z-30 backdrop-blur-md">
       <div class="container mx-auto px-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div class="relative w-full md:max-w-md">
            <input 
              v-model="searchQuery"
              @keyup.enter="fetchProducts"
              type="text" 
              placeholder="Поиск оборудования..." 
              class="input input-bordered w-full bg-base-300 border-base-content/10 focus:border-primary text-white pl-10"
            />
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div class="text-sm text-base-content/50 font-medium">
            Найдено: {{ filteredProducts.length }}
          </div>
       </div>
    </div>

    <!-- Фильтры категорий -->
    <div class="container mx-auto px-4 py-6 overflow-x-auto">
      <div class="flex gap-3 min-w-max pb-2 scrollbar-hide">
        <button 
          v-for="cat in categories" 
          :key="cat.id"
          @click="selectedCategory = cat.id"
          :class="[
            'btn btn-sm rounded-full uppercase text-xs font-bold tracking-wide transition-all duration-300 border',
            selectedCategory === cat.id 
              ? 'btn-primary shadow-[0_0_15px_rgba(102,192,244,0.4)] border-primary text-white' 
              : 'btn-ghost text-base-content/60 hover:text-white border-white/10 hover:border-primary/50'
          ]"
        >
          {{ cat.name }}
        </button>
      </div>
    </div>

    <!-- Основной контент -->
    <main class="container mx-auto px-4">
      
      <div v-if="loading" class="flex justify-center py-20">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div v-else-if="error" class="alert alert-error shadow-lg mt-10">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{{ error }}</span>
        </div>
        <button @click="fetchProducts" class="btn btn-sm btn-ghost">Повторить</button>
      </div>

      <div v-else-if="filteredProducts.length === 0" class="text-center py-20">
        <div class="text-6xl mb-4 opacity-20">🔍</div>
        <h3 class="text-xl font-bold text-base-content/50">Ничего не найдено</h3>
        <p class="text-base-content/40 mt-2">Попробуйте изменить параметры поиска</p>
      </div>

      <!-- Сетка товаров с новой карточкой -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
        
        <div 
          v-for="product in filteredProducts" 
          :key="product.id"
          class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 group border border-base-200/50 relative overflow-hidden"
        >
          
          <!-- Бейджик (если есть скидка или новинка) -->
          <div v-if="product.old_price && product.old_price > product.price" 
               class="absolute top-3 left-3 z-10 badge badge-error text-white font-bold shadow-md">
            -{{ Math.round(((product.old_price - product.price) / product.old_price) * 100) }}%
          </div>

          <figure class="relative aspect-square overflow-hidden bg-base-200 cursor-pointer" @click="router.push(`/products/${product.id}`)">
            <img 
              :src="product.image || product.thumbnail || '/placeholder.jpg'" 
              :alt="product.title" 
              class="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500 ease-out"
            />
            
            <!-- Оверлей при наведении -->
            <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
              <div class="btn btn-white btn-sm gap-2 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Подробнее
              </div>
            </div>
          </figure>

          <div class="card-body p-4">
            <!-- Категория -->
            <div class="flex justify-between items-start mb-1">
              <span class="text-xs font-semibold uppercase tracking-wider text-primary opacity-80">
                {{ getCategoryName(product.category) }}
              </span>
              <!-- Рейтинг (если есть) -->
              <div v-if="product.rating" class="flex items-center gap-1 text-warning text-xs font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{{ Number(product.rating || 0).toFixed(1) }}</span>
              </div>
            </div>

            <!-- Название (Кликабельное) -->
            <h2 class="card-title text-base font-bold text-base-content line-clamp-2 min-h-[3rem] mb-2">
              <router-link :to="`/products/${product.id}`" class="hover:text-primary transition-colors">
                {{ product.title }}
              </router-link>
            </h2>

            <!-- Цена и Кнопка -->
            <div class="card-actions items-end justify-between mt-2">
              <div class="flex flex-col">
                <!-- Старая цена -->
                <span v-if="product.old_price && product.old_price > product.price" class="text-xs text-base-content/50 line-through">
                  {{ formatPrice(product.old_price) }}
                </span>
                <!-- Текущая цена -->
                <span class="text-xl font-bold text-primary">
                  {{ formatPrice(product.price) }}
                </span>
              </div>

              <button 
                @click.stop="addToCart(product)" 
                class="btn btn-square btn-primary btn-sm shadow-lg hover:scale-110 active:scale-95 transition-transform"
                title="Добавить в корзину"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>