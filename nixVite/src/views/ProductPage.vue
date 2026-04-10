<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppNavbar from '../components/AppNavbar.vue'
import { api } from '../services/api.resources'
import { useCartStore } from '../stores/cart'
import type { Product } from '../types'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

// --- Состояние ---
const product = ref<Product | null>(null)
const loading = ref(true)
const error = ref('')
const quantity = ref(1)
const selectedImage = ref('')

// Загрузка данных
onMounted(async () => {
  const id = route.params.id
  
  if (!id) {
    router.push('/catalog')
    return
  }

  try {
    loading.value = true
    // Вызов API для получения одного товара
    const data = await api.products.getById(id)
    product.value = data
    
    // Устанавливаем главное изображение
    selectedImage.value = data.image || data.thumbnail || ''
    
  } catch (err) {
    console.error('Failed to fetch product:', err)
    error.value = 'Товар не найден или произошла ошибка сети.'
  } finally {
    loading.value = false
  }
})

// --- Логика ---

const formatPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(price) + ' ₽'

const addToCart = () => {
  if (!product.value) return
  cartStore.addToCart(product.value, quantity.value)
  // Можно добавить toast уведомление
  alert(`Добавлено ${quantity.value} шт. "${product.value.title}"`)
}

const selectImage = (img: string) => {
  selectedImage.value = img
}

// Имитация похожих товаров (можно загружать через API)
const relatedProducts = ref<Product[]>([
  // Здесь должны быть реальные данные, пока заглушка
])
</script>

<template>
  <div class="min-h-screen bg-base-100 text-base-content pb-20">
    <AppNavbar />

    <!-- Лоадер -->
    <div v-if="loading" class="flex justify-center items-center h-[80vh]">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error || !product" class="container mx-auto px-4 py-20 text-center">
      <h2 class="text-2xl font-bold text-error mb-4">{{ error || 'Товар не найден' }}</h2>
      <button @click="router.push('/catalog')" class="btn btn-primary">Вернуться в каталог</button>
    </div>

    <!-- Контент товара -->
    <div v-else class="container mx-auto px-4 py-10 animate-fade-in">
      
      <!-- Хлебные крошки -->
      <div class="text-sm text-base-content/50 mb-6">
        <router-link to="/" class="hover:text-primary">Главная</router-link>
        <span class="mx-2">/</span>
        <router-link to="/catalog" class="hover:text-primary">Каталог</router-link>
        <span class="mx-2">/</span>
        <span class="text-white">{{ product.category }}</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        
        <!-- Левая колонка: Галерея -->
        <div class="space-y-4">
          <!-- Главное изображение -->
          <div class="bg-base-200 rounded-xl p-8 flex items-center justify-center border border-white/5 relative group overflow-hidden">
             <img 
               :src="selectedImage" 
               :alt="product.title" 
               class="max-w-full max-h-[500px] object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105" 
             />
             <!-- Бейдж скидки -->
             <div v-if="product.discountPercentage" class="absolute top-4 left-4 badge badge-error text-white font-bold">
               -{{ product.discountPercentage }}%
             </div>
          </div>

          <!-- Миниатюры -->
          <div class="flex gap-4 overflow-x-auto pb-2">
            <div 
              v-for="(img, index) in [product.image, ...(product.images || [])]" 
              :key="index"
              @click="selectImage(img)"
              :class="[
                'w-20 h-20 rounded-lg border-2 cursor-pointer flex items-center justify-center bg-base-200 shrink-0 transition-all',
                selectedImage === img ? 'border-primary shadow-[0_0_10px_rgba(102,192,244,0.3)]' : 'border-transparent hover:border-white/20'
              ]"
            >
              <img :src="img" class="max-w-[80%] max-h-[80%] object-contain">
            </div>
          </div>
        </div>

        <!-- Правая колонка: Информация -->
        <div class="flex flex-col justify-center">
          <div class="text-sm text-primary uppercase font-bold tracking-wider mb-2">{{ product.brand || product.category }}</div>
          <h1 class="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">{{ product.title }}</h1>
          
          <!-- Рейтинг -->
          <div class="flex items-center gap-2 mb-6">
            <div class="rating rating-sm">
              <input type="radio" name="rating-1" class="mask mask-star-2 bg-orange-400" :checked="product.rating >= 1" disabled />
              <input type="radio" name="rating-1" class="mask mask-star-2 bg-orange-400" :checked="product.rating >= 2" disabled />
              <input type="radio" name="rating-1" class="mask mask-star-2 bg-orange-400" :checked="product.rating >= 3" disabled />
              <input type="radio" name="rating-1" class="mask mask-star-2 bg-orange-400" :checked="product.rating >= 4" disabled />
              <input type="radio" name="rating-1" class="mask mask-star-2 bg-orange-400" :checked="product.rating >= 5" disabled />
            </div>
            <span class="text-sm text-base-content/60">({{ product.rating }} / 5.0)</span>
          </div>

          <p class="text-base-content/80 mb-8 leading-relaxed">
            {{ product.description || 'Описание отсутствует. Это высокопроизводительное устройство, созданное для профессионалов и энтузиастов. Надежность, качество и передовые технологии в одном корпусе.' }}
          </p>

          <!-- Цена и Покупка -->
          <div class="bg-base-200/50 p-6 rounded-xl border border-white/5 mb-8">
            <div class="flex items-end gap-4 mb-6">
              <span class="text-4xl font-bold text-success">{{ formatPrice(product.price) }}</span>
              <span v-if="product.oldPrice" class="text-xl text-base-content/40 line-through mb-1">{{ formatPrice(product.oldPrice) }}</span>
            </div>

            <div class="flex flex-col sm:flex-row gap-4">
              <!-- Выбор количества -->
              <div class="join w-full sm:w-32">
                <button @click="quantity > 1 && quantity--" class="join-item btn btn-square bg-base-300 border-none hover:bg-primary hover:text-black">-</button>
                <input type="number" v-model.number="quantity" min="1" :max="product.stock" class="join-item input input-bordered w-full bg-base-300 border-none text-center text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                <button @click="quantity < (product.stock || 10) && quantity++" class="join-item btn btn-square bg-base-300 border-none hover:bg-primary hover:text-black">+</button>
              </div>

              <button 
                @click="addToCart" 
                class="btn btn-primary flex-1 text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                :disabled="!product.stock"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {{ product.stock ? 'В корзину' : 'Нет в наличии' }}
              </button>
            </div>
            
            <div v-if="product.stock" class="mt-4 text-xs text-success flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-success"></span>
              В наличии: {{ product.stock }} шт.
            </div>
          </div>

          <!-- Характеристики (Таблица) -->
          <div class="overflow-x-auto">
            <table class="table table-zebra w-full text-sm">
              <tbody>
                <tr>
                  <td class="text-base-content/60">Категория</td>
                  <td class="font-medium text-white">{{ product.category }}</td>
                </tr>
                <tr>
                  <td class="text-base-content/60">Бренд</td>
                  <td class="font-medium text-white">{{ product.brand || 'TechNova Generic' }}</td>
                </tr>
                <tr>
                  <td class="text-base-content/60">Артикул</td>
                  <td class="font-medium text-white">#{{ product.id }}</td>
                </tr>
                <tr>
                  <td class="text-base-content/60">Гарантия</td>
                  <td class="font-medium text-white">12 месяцев</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <!-- Похожие товары -->
      <section class="pt-10 border-t border-white/5">
        <h3 class="text-2xl font-bold text-white mb-6">Вам также может понравиться</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <!-- Здесь можно использовать компонент ProductCard, если он есть -->
           <div v-for="i in 4" :key="i" class="card bg-base-200 border border-white/5 p-4 animate-pulse">
              <div class="skeleton h-40 w-full mb-4"></div>
              <div class="skeleton h-4 w-3/4 mb-2"></div>
              <div class="skeleton h-4 w-1/2"></div>
           </div>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>