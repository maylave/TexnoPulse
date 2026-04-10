<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../services/api.resources'; // Используем твой API клиент
import { useCartStore } from '../stores/cart'

const router = useRouter()
const cartStore = useCartStore()

// --- Состояние ---
const isCheckingOut = ref(false)

// --- Вычисляемые свойства ---
const cartItems = computed(() => cartStore.items)
const subtotal = computed(() => cartStore.totalPrice)
const totalCount = computed(() => cartStore.totalItems)

// Логика доставки
const SHIPPING_THRESHOLD = 100000
const SHIPPING_COST = 1500

const shippingCost = computed(() => {
  return subtotal.value >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
})

const total = computed(() => subtotal.value + shippingCost.value)

// --- Хелперы ---
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽'
}

// --- Действия ---

const updateQuantity = async (productId: string | number, delta: number) => {
  const item = cartItems.value.find(i => String(i.product.id) === String(productId))
  if (!item) return

  const newQty = item.quantity + delta
  const maxStock = item.product.stock || 10 
  
  // Ограничиваем количество от 1 до макс. наличия
  if (newQty >= 1 && newQty <= maxStock) {
    await cartStore.updateQuantity(String(productId), newQty)
  }
}

const removeItem = async (productId: string | number) => {
  await cartStore.removeFromCart(String(productId))
}

const clearCart = () => {
  if (confirm('Вы уверены, что хотите очистить корзину?')) {
    cartStore.clearCart()
  }
}

const checkout = async () => {
  if (cartItems.value.length === 0 || isCheckingOut.value) return

  isCheckingOut.value = true
  
  try {
    // 1. Отправляем заказ на сервер через API
    // Предположим, что бэкенд сам берет товары из сессии/корзины пользователя или мы передаем ID товаров
    // В твоем api.resources метод checkout принимает payload (адрес, комментарий)
    
    const orderPayload = {
      address: '', // Можно добавить форму адреса перед этим шагом
      comment: ''
    }

    const newOrder = await api.orders.checkout(orderPayload)
    
    // 2. Если успех — очищаем локальную корзину (синхронизация)
    cartStore.clearCart()
    
    // 3. Перенаправляем в профиль или на страницу успеха
    alert(`Заказ #${newOrder.id} успешно оформлен!`)
    router.push('/profile') 
    
  } catch (error: any) {
    console.error('Checkout error:', error)
    alert(error.message || 'Ошибка при оформлении заказа. Попробуйте позже.')
  } finally {
    isCheckingOut.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-base-200 text-base-content py-10 px-4">
    
    <div class="container mx-auto max-w-6xl">
      
      <!-- Заголовок -->
      <div class="flex justify-between items-end mb-8 border-b border-base-300 pb-4">
        <div>
          <h1 class="text-3xl font-bold text-base-content uppercase tracking-wider">Корзина</h1>
          <p class="text-sm text-base-content/50 mt-1">{{ totalCount }} товаров</p>
        </div>
        <button 
          v-if="cartItems.length > 0"
          @click="clearCart" 
          class="text-xs text-error hover:text-error-content transition-colors uppercase font-bold flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Очистить всё
        </button>
      </div>

      <!-- Пустая корзина -->
      <div v-if="cartItems.length === 0" class="text-center py-20 bg-base-100 rounded-xl border border-base-300 shadow-sm animate-fade-in">
        <div class="text-6xl mb-4 opacity-20">🛒</div>
        <h2 class="text-xl font-bold text-base-content mb-2">Ваша корзина пуста</h2>
        <p class="text-base-content/50 mb-6">Но это легко исправить в нашем каталоге</p>
        <router-link to="/catalog" class="btn btn-primary btn-wide shadow-lg shadow-primary/20">Перейти в каталог</router-link>
      </div>

      <!-- Контент корзины -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
        
        <!-- Список товаров -->
        <div class="lg:col-span-2 space-y-4">
          
          <div 
            v-for="item in cartItems" 
            :key="item.product.id"
            class="bg-base-100 border border-base-300 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center sm:items-start transition-all hover:border-primary/50 hover:shadow-md group"
          >
            
            <!-- Картинка -->
            <div class="w-full sm:w-32 h-32 bg-base-200 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative border border-base-300">
              <img :src="item.product.image || item.product.thumbnail" :alt="item.product.title" class="max-w-[80%] max-h-[80%] object-contain mix-blend-normal transition-transform group-hover:scale-105">
              
              <button 
                @click="removeItem(String(item.product.id))"
                class="absolute top-2 right-2 btn btn-circle btn-xs btn-error btn-outline opacity-0 group-hover:opacity-100 transition-opacity"
                title="Удалить"
              >✕</button>
            </div>

            <!-- Информация -->
            <div class="flex-grow w-full text-center sm:text-left">
              <div class="text-xs text-primary uppercase font-bold mb-1">{{ item.product.category }}</div>
              <h3 class="text-lg font-bold text-base-content leading-tight mb-2 line-clamp-2">{{ item.product.title }}</h3>
              
              <div class="text-xl font-bold text-success sm:hidden mb-2">
                {{ formatPrice(item.product.price * item.quantity) }}
              </div>

              <!-- Контролы количества -->
              <div class="flex items-center justify-center sm:justify-start gap-3 mt-2">
                <div class="join border border-base-300 rounded-lg overflow-hidden">
                  <button 
                    @click="updateQuantity(String(item.product.id), -1)" 
                    class="join-item btn btn-sm btn-square bg-base-200 border-none hover:bg-primary hover:text-white disabled:opacity-30"
                    :disabled="item.quantity <= 1"
                  >-</button>
                  <input 
                    type="text" 
                    :value="item.quantity" 
                    readonly
                    class="join-item btn btn-sm w-12 bg-base-100 border-none text-base-content cursor-default focus:outline-none"
                  />
                  <button 
                    @click="updateQuantity(String(item.product.id), 1)" 
                    class="join-item btn btn-sm btn-square bg-base-200 border-none hover:bg-primary hover:text-white disabled:opacity-30"
                    :disabled="item.quantity >= (item.product.stock || 10)"
                  >+</button>
                </div>
                
                <button 
                  @click="removeItem(String(item.product.id))"
                  class="sm:hidden btn btn-sm btn-ghost text-error"
                >
                  Удалить
                </button>
              </div>
            </div>

            <!-- Цена (Desktop) -->
            <div class="hidden sm:block text-right shrink-0 pl-4 border-l border-base-300 min-w-[120px]">
              <div class="text-2xl font-bold text-success">
                {{ formatPrice(item.product.price * item.quantity) }}
              </div>
              <div class="text-xs text-base-content/40 mt-1">
                {{ formatPrice(item.product.price) }} / шт.
              </div>
            </div>

          </div>
        </div>

        <!-- Сводка заказа -->
        <div class="lg:col-span-1">
          <div class="bg-base-100 border border-base-300 rounded-xl p-6 sticky top-24 shadow-xl">
            <h3 class="text-xl font-bold text-base-content uppercase mb-6">Итого</h3>
            
            <div class="space-y-3 text-sm mb-6 border-b border-base-300 pb-6">
              <div class="flex justify-between text-base-content/70">
                <span>Товары ({{ totalCount }})</span>
                <span>{{ formatPrice(subtotal) }}</span>
              </div>
              <div class="flex justify-between text-base-content/70">
                <span>Доставка</span>
                <span :class="{ 'text-success font-bold': shippingCost === 0 }">
                  {{ shippingCost === 0 ? 'Бесплатно' : formatPrice(shippingCost) }}
                </span>
              </div>
              <div v-if="subtotal < SHIPPING_THRESHOLD" class="text-xs text-warning bg-warning/10 p-2 rounded">
                До бесплатной доставки еще {{ formatPrice(SHIPPING_THRESHOLD - subtotal) }}
              </div>
            </div>

            <div class="flex justify-between items-center mb-8">
              <span class="text-lg font-bold text-base-content">К оплате</span>
              <span class="text-3xl font-black text-primary">
                {{ formatPrice(total) }}
              </span>
            </div>

            <button 
              @click="checkout"
              class="btn btn-primary w-full py-4 text-lg uppercase font-bold shadow-lg hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="isCheckingOut || cartItems.length === 0"
            >
              <span v-if="isCheckingOut" class="loading loading-spinner"></span>
              <span v-else>Оформить заказ</span>
            </button>

            <div class="mt-4 flex items-center justify-center gap-2 text-xs text-base-content/40">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Безопасная оплата</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>