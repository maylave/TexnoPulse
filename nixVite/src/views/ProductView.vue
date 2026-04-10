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

const product = ref<Product | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    // ИСПРАВЛЕНИЕ ЗДЕСЬ:
    // Приводим id к string, так как route.params.id может быть undefined или array
    const id = route.params.id as string
    
    if (!id) {
      error.value = 'ID товара не указан'
      loading.value = false
      return
    }

    // Загружаем товар по ID
    const data = await api.products.getById(id)
    product.value = data
  } catch (err) {
    console.error(err)
    error.value = 'Товар не найден или произошла ошибка загрузки'
  } finally {
    loading.value = false
  }
})

const addToCart = () => {
  if (product.value) {
    cartStore.addToCart(product.value, 1)
  }
}

const formatPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(price) + ' ₽'
</script>

<template>
  <AppNavbar />
  
  <div class="min-h-screen bg-base-100 py-10 px-4">
    <div class="max-w-6xl mx-auto">
      
      <!-- Кнопка Назад -->
      <button @click="router.back()" class="btn btn-ghost btn-sm mb-6 pl-0 hover:bg-transparent">
        ← Вернуться в каталог
      </button>

      <div v-if="loading" class="flex justify-center py-20">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div v-else-if="error" class="alert alert-error">
        <span>{{ error }}</span>
      </div>

      <div v-else-if="product" class="grid grid-cols-1 md:grid-cols-2 gap-10 bg-base-200 p-8 rounded-2xl shadow-2xl border border-white/5">
        
        <!-- Левая колонка: Фото -->
        <div class="bg-base-300/50 rounded-xl p-10 flex items-center justify-center relative overflow-hidden group">
           <img 
            :src="product.image || product.thumbnail" 
            :alt="product.title" 
            class="max-h-[400px] object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-500" 
          />
        </div>

        <!-- Правая колонка: Инфо -->
        <div class="flex flex-col justify-center">
          <div class="text-sm text-primary font-bold uppercase tracking-widest mb-2">
            {{ product.category }}
          </div>
          
          <h1 class="text-4xl font-bold text-white mb-4">{{ product.title }}</h1>
          
          <div class="text-3xl font-bold text-success mb-6">
            {{ formatPrice(product.price) }}
            <span v-if="product.old_price" class="text-lg text-base-content/40 line-through ml-4">
              {{ formatPrice(product.old_price) }}
            </span>
          </div>

          <p class="text-base-content/70 mb-8 leading-relaxed">
            {{ product.description || 'Описание отсутствует.' }}
          </p>

          <div class="flex gap-4">
            <button @click="addToCart" class="btn btn-primary btn-lg flex-1 shadow-lg shadow-primary/20">
              Добавить в корзину
            </button>
            <button class="btn btn-outline btn-lg">
              ♡
            </button>
          </div>

          <!-- Доп. характеристики (если есть) -->
          <div class="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4 text-sm">
             <div>
               <span class="block text-base-content/50">Бренд</span>
               <span class="font-bold text-white">{{ product.brand || 'Не указан' }}</span>
             </div>
             <div>
               <span class="block text-base-content/50">Наличие</span>
               <span class="font-bold text-success">В наличии</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>