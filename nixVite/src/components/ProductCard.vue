<template>
  <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 group border border-base-200/50 relative overflow-hidden">
    
    <!-- Бейджик скидки (если есть) -->
    <div v-if="product.discountPercentage && product.discountPercentage > 0" 
         class="absolute top-3 left-3 z-10 badge badge-error text-white font-bold shadow-md animate-pulse">
      -{{ Math.round(product.discountPercentage) }}%
    </div>


    <figure class="relative aspect-square overflow-hidden bg-base-200">
      <img 
        :src="product.thumbnail || product.images?.[0] || '/placeholder.jpg'" 
        :alt="product.title" 
        class="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500 ease-out"
      />
      
    
      <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
        <router-link :to="`/product/${product.id}`" class="btn btn-white btn-sm gap-2 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Подробнее
        </router-link>
      </div>
    </figure>

    <div class="card-body p-4">
      <!-- Категория и Рейтинг -->
      <div class="flex justify-between items-start mb-1">
        <span class="text-xs font-semibold uppercase tracking-wider text-primary opacity-80">
          {{ product.category }}
        </span>
        <div v-if="product.rating" class="flex items-center gap-1 text-warning text-xs font-bold">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
         <!-- Используем Number() для гарантированного преобразования -->
<span>{{ Number(product.rating || 0).toFixed(1) }}</span>
        </div>
      </div>

      <!-- Название -->
      <h2 class="card-title text-base font-bold text-base-content line-clamp-2 min-h-4 mb-2">
        <router-link :to="`/product/${product.id}`" class="hover:text-primary transition-colors">
          {{ product.title }}
        </router-link>
      </h2>

      <!-- Цена и Кнопка -->
      <div class="card-actions items-end justify-between mt-2">
        <div class="flex flex-col">
          <!-- Старая цена (если есть скидка) -->
          <span v-if="product.discountPercentage && product.discountPercentage > 0" class="text-xs text-base-content/50 line-through">
            {{ formatPrice(calculateOriginalPrice) }}
          </span>
          <!-- Текущая цена -->
          <span class="text-xl font-bold text-primary">
            {{ formatPrice(product.price) }} ₽
          </span>
        </div>

        <button 
          @click="addToCart" 
          class="btn btn-square btn-primary btn-sm shadow-lg hover:scale-110 active:scale-95 transition-transform"
          :disabled="isAdding"
        >
          <span v-if="isAdding" class="loading loading-spinner loading-xs"></span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// import { useCartStore } from '@/stores/cart'
import type { Product } from '@/types'
import { computed, ref } from 'vue'


const props = defineProps<{
  product: Product
}>()

// const cartStore = useCartStore()
const isAdding = ref(false)

// Вычисляем исходную цену до скидки
const calculateOriginalPrice = computed(() => {
  if (!props.product.discountPercentage) return props.product.price
  return props.product.price / (1 - props.product.discountPercentage / 100)
})

const formatPrice = (price: number) => {
  return Math.round(price).toLocaleString('ru-RU')
}

const addToCart = async () => {
  isAdding.value = true
  // Имитация небольшой задержки для визуального эффекта
  await new Promise(resolve => setTimeout(resolve, 400))
  

  
  isAdding.value = false
}
</script>

<style scoped>
/* Дополнительные стили можно добавить здесь, но DaisyUI покрывает большинство нужд */
</style>