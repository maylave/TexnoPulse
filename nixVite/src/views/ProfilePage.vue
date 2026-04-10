<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api } from '../services/api.resources'
import { useAuthStore } from '../stores/auth'
import type { Order, User } from '../types'

const authStore = useAuthStore()

// --- Константы и Конфигурация ---
const STATUS_CONFIG: Record<string, { class: string; text: string }> = {
  delivered: { class: 'badge-success', text: 'ДОСТАВЛЕНО' },
  shipped: { class: 'badge-info', text: 'В ПУТИ' },
  processing: { class: 'badge-warning', text: 'СОБИРАЕТСЯ' },
  pending: { class: 'badge-ghost', text: 'ОЖИДАНИЕ' },
  cancelled: { class: 'badge-error', text: 'ОТМЕНА' },
}

// --- Состояние ---
const isSaving = ref(false)
const isLoadingOrders = ref(true)
const fileInput = ref<HTMLInputElement | null>(null)

const formState = ref({
  username: '',
  email: '',
  phone: '',
  city: ''
})

const orders = ref<Order[]>([])

// --- Хелперы ---
const formatPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(price) + ' ₽'

const getStatusConfig = (status: string) => 
  STATUS_CONFIG[status] || { class: 'badge-ghost', text: status.toUpperCase() }

const getYearsSince = (dateString?: string) => {
  if (!dateString) return 'Новичок'
  const years = new Date().getFullYear() - new Date(dateString).getFullYear()
  return years > 0 ? `${years} г.` : '< 1 г.'
}

// Синхронизация состояния пользователя (Store + LocalStorage)
const syncUserState = (newUserData: Partial<User>) => {
  if (!authStore.user) return
  
  // Обновляем реактивный стор
  authStore.user = { ...authStore.user, ...newUserData }
  
  // Обновляем персистентное хранилище
  localStorage.setItem('user', JSON.stringify(authStore.user))
}

const fillForm = (user: User) => {
  formState.value = {
    username: user.name || user.username || '',
    email: user.email || '',
    phone: user.phone || '',
    city: user.city || ''
  }
}

// --- Вычисляемая статистика ---
const stats = computed(() => {
  const totalOrders = orders.value.length
  const totalSpent = orders.value.reduce((sum, order) => sum + (order.total_price || 0), 0)
  const activeOrders = orders.value.filter(o => ['pending', 'processing'].includes(o.status)).length
  
  return [
    { label: 'Заказов', value: String(totalOrders) },
    { label: 'Потрачено', value: formatPrice(totalSpent) },
    { label: 'Активных', value: String(activeOrders) },
    { label: 'С нами', value: getYearsSince(authStore.user?.createdAt) }
  ]
})

// --- API Взаимодействие ---

const fetchOrders = async () => {
  isLoadingOrders.value = true
  try {
    const data = await api.orders.myOrders()
    orders.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Ошибка загрузки заказов:', error)
    orders.value = []
  } finally {
    isLoadingOrders.value = false
  }
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('avatar', file) 

  try {
    isSaving.value = true
    const { avatarUrl } = await api.profile.uploadAvatar(formData)
    
    if (avatarUrl) {
      syncUserState({ avatarUrl })
    }
  } catch (err: any) {
    alert(`Ошибка аватара: ${err.message}`)
  } finally {
    isSaving.value = false
    target.value = '' // Сброс input
  }
}

const saveSettings = async () => {
  isSaving.value = true
  try {
    const updatedUser = await api.profile.update({
      name: formState.value.username,
      email: formState.value.email,
      phone: formState.value.phone,
      city: formState.value.city
    })
    
    syncUserState(updatedUser)
    alert('Данные успешно сохранены!')
  } catch (err: any) {
    alert(`Ошибка сохранения: ${err.message}`)
  } finally {
    isSaving.value = false
  }
}

// --- Инициализация ---
onMounted(async () => {
  // 1. Заполняем форму из текущего стора
  if (authStore.user) {
    fillForm(authStore.user)
  } else {
    // 2. Если стора нет (F5), загружаем профиль
    try {
      const userData = await api.profile.get()
      authStore.user = userData // Pinia реактивность сработает сама
      localStorage.setItem('user', JSON.stringify(userData))
      fillForm(userData)
    } catch (e) {
      console.error('Не удалось загрузить профиль', e)
    }
  }

  // 3. Загружаем заказы параллельно или последовательно
  await fetchOrders()
})

// Триггер для скрытого input файла
const triggerFileInput = () => fileInput.value?.click()
</script>

<template>
  <div class="min-h-screen bg-base-200 py-10 px-4 sm:px-6 lg:px-8">
    <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      <!-- Левая колонка: Профиль -->
      <aside class="lg:col-span-1">
        <div class="bg-base-100 border border-base-300 rounded-xl p-6 text-center sticky top-24 shadow-lg">
          
          <!-- Аватар -->
          <div class="relative w-32 h-32 mx-auto mb-4 group cursor-pointer" @click="triggerFileInput">
            <img 
              :src="authStore.user?.avatarUrl || 'https://via.placeholder.com/150/1b2838/66c0f4?text=User'" 
              alt="Avatar" 
              class="w-full h-full rounded-full object-cover border-4 border-primary/20 group-hover:border-primary transition-all"
            />
            <div class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span class="text-xs font-bold text-white">Изменить</span>
            </div>
          </div>
          <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*" class="hidden" />
          
          <h2 class="text-2xl font-bold text-base-content">{{ authStore.user?.name || authStore.user?.username || 'Пользователь' }}</h2>
          <p class="text-sm text-base-content/60 mb-6">{{ authStore.user?.email }}</p>

          <!-- Статистика -->
          <div class="grid grid-cols-2 gap-y-4 gap-x-2 border-t border-base-300 pt-6">
            <div v-for="(stat, idx) in stats" :key="idx" class="text-center p-2 rounded-lg hover:bg-base-200 transition-colors">
              <div class="text-lg font-bold text-primary">{{ stat.value }}</div>
              <div class="text-[10px] uppercase font-bold text-base-content/50 tracking-wide">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Правая колонка: Контент -->
      <main class="lg:col-span-3 space-y-8">
        
        <!-- Настройки -->
        <section class="bg-base-100 border border-base-300 rounded-xl overflow-hidden shadow-sm">
          <div class="p-6 border-b border-base-300"><h3 class="text-lg font-bold">Личные данные</h3></div>
          <div class="p-6">
            <form @submit.prevent="saveSettings" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="form-control">
                  <label class="label"><span class="label-text">Имя</span></label>
                  <input v-model="formState.username" type="text" class="input input-bordered bg-base-200" placeholder="Ваше имя" />
                </div>
                <div class="form-control">
                  <label class="label"><span class="label-text">Email</span></label>
                  <input v-model="formState.email" type="email" class="input input-bordered bg-base-200" placeholder="example@mail.com" />
                </div>
                <div class="form-control">
                  <label class="label"><span class="label-text">Телефон</span></label>
                  <input v-model="formState.phone" type="tel" class="input input-bordered bg-base-200" placeholder="+7 (999) ..." />
                </div>
                <div class="form-control">
                  <label class="label"><span class="label-text">Город</span></label>
                  <input v-model="formState.city" type="text" class="input input-bordered bg-base-200" placeholder="Москва" />
                </div>
              </div>
              <button type="submit" class="btn btn-primary" :class="{ 'loading': isSaving }" :disabled="isSaving">
                Сохранить изменения
              </button>
            </form>
          </div>
        </section>

        <!-- История заказов -->
        <section class="bg-base-100 border border-base-300 rounded-xl overflow-hidden shadow-sm">
          <div class="p-6 border-b border-base-300 flex justify-between items-center">
            <h3 class="text-lg font-bold">История заказов</h3>
            <button @click="fetchOrders" class="btn btn-ghost btn-sm" :disabled="isLoadingOrders">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
          
          <div class="p-0 min-h-[200px]">
            <div v-if="isLoadingOrders" class="p-10 flex justify-center">
               <span class="loading loading-spinner loading-md"></span>
            </div>

            <div v-else-if="orders.length === 0" class="p-10 text-center text-base-content/50 flex flex-col items-center">
              <span class="text-4xl mb-2">📦</span>
              <p>У вас пока нет заказов.</p>
              <router-link to="/catalog" class="link link-primary mt-2">Перейти в каталог</router-link>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="table w-full">
                <thead class="bg-base-200">
                  <tr>
                    <th>Заказ</th>
                    <th>Дата</th>
                    <th>Сумма</th>
                    <th>Статус</th>
                    <th class="text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="order in orders" :key="order.id" class="hover:bg-base-200/50 transition-colors">
                    <td>
                      <div class="font-bold">#{{ order.id }}</div>
                      <div class="text-xs opacity-50">{{ order.items?.length || 0 }} товаров</div>
                    </td>
                    <td>{{ new Date(order.created_at).toLocaleDateString('ru-RU') }}</td>
                    <td class="font-mono font-bold">{{ formatPrice(order.total_price) }}</td>
                    <td>
                      <div class="badge badge-sm" :class="getStatusConfig(order.status).class">
                        {{ getStatusConfig(order.status).text }}
                      </div>
                    </td>
                    <td class="text-right">
                      <button class="btn btn-ghost btn-xs">Подробнее</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>
    </div>
  </div>
</template>