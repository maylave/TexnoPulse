<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppNavbar from '../components/AppNavbar.vue'
import { api } from '../services/api.resources'
import { useCartStore } from '../stores/cart'
import type { Product } from '../types'

const router = useRouter()
const cartStore = useCartStore()

// --- Типы ---

type PartCategory = 'cpu' | 'gpu' | 'motherboard' | 'ram' | 'ssd' | 'psu' | 'case'

interface BuilderCategory {
  id: PartCategory
  name: string
  // Теперь храним SVG строку вместо эмодзи
  iconSvg: string 
}

// --- SVG Иконки (Heroicons style) ---
const icons = {
  cpu: '<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />',
  gpu: '<path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />', // Используем абстрактную иконку чипа/видео
  motherboard: '<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />',
  ram: '<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />',
  ssd: '<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />',
  psu: '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />',
  case: '<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />'
}

const builderCategories: BuilderCategory[] = [
  { id: 'cpu', name: 'Процессор', iconSvg: icons.cpu },
  { id: 'gpu', name: 'Видеокарта', iconSvg: icons.gpu },
  { id: 'motherboard', name: 'Материнская плата', iconSvg: icons.motherboard },
  { id: 'ram', name: 'Оперативная память', iconSvg: icons.ram },
  { id: 'ssd', name: 'Накопитель (SSD)', iconSvg: icons.ssd },
  { id: 'psu', name: 'Блок питания', iconSvg: icons.psu },
  { id: 'case', name: 'Корпус', iconSvg: icons.case },
]

const loading = ref(false)
const productsCache = ref<Product[]>([])

const selectedParts = ref<Record<PartCategory, Product | null>>({
  cpu: null,
  gpu: null,
  motherboard: null,
  ram: null,
  ssd: null,
  psu: null,
  case: null
})

const activeTab = ref<PartCategory>('cpu')

// --- Логика ---

const loadProducts = async () => {
  loading.value = true
  try {
    const response = await api.products.getAll({ limit: 100 }) 
    productsCache.value = Array.isArray(response) ? response : (response as any).data || []
  } catch (err) {
    console.error('Ошибка загрузки товаров:', err)
  } finally {
    loading.value = false
  }
}

const availableProducts = computed(() => {
  if (!productsCache.value.length) return []
  return productsCache.value.filter(p => p.category === activeTab.value)
})

const totalPrice = computed(() => {
  return Object.values(selectedParts.value).reduce((sum, part) => {
    return sum + (part ? part.price : 0)
  }, 0)
})

const selectedCount = computed(() => {
  return Object.values(selectedParts.value).filter(p => p !== null).length
})

const currentSelectedPart = computed(() => {
  return selectedParts.value[activeTab.value]
})

const selectPart = (product: Product) => {
  selectedParts.value[activeTab.value] = product
  
  const currentIndex = builderCategories.findIndex(c => c.id === activeTab.value)
  if (currentIndex !== -1 && currentIndex < builderCategories.length - 1) {
    activeTab.value = builderCategories[currentIndex + 1].id
  }
}

const removePart = (categoryId: PartCategory) => {
  selectedParts.value[categoryId] = null
}

const addBuildToCart = () => {
  const parts = Object.values(selectedParts.value).filter((p): p is Product => p !== null)
  
  if (parts.length === 0) {
    alert('Сборка пуста!')
    return
  }

  parts.forEach(part => {
    cartStore.addToCart(part, 1)
  })
  
  alert(`Добавлено ${parts.length} товаров в корзину на сумму ${formatPrice(totalPrice.value)}`)
  router.push('/cart')
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽'
}

onMounted(() => {
  loadProducts()
})
</script>

<template>
  <div class="min-h-screen bg-base-200 pb-20">
    <AppNavbar />

    <div class="bg-base-100 border-b border-base-300 py-6">
      <div class="container mx-auto px-4 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-primary">Конфигуратор ПК</h1>
          <p class="text-sm opacity-70 mt-1">Собери свою идеальную машину</p>
        </div>
        <div class="text-right">
          <div class="text-xs uppercase font-bold opacity-50">Итого</div>
          <div class="text-2xl font-bold text-success">{{ formatPrice(totalPrice) }}</div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <!-- Левая колонка: Навигация -->
      <div class="lg:col-span-3 space-y-2">
        <div class="card bg-base-100 shadow-xl overflow-hidden">
          <div class="list-menu bg-base-100">
            <button
              v-for="cat in builderCategories"
              :key="cat.id"
              @click="activeTab = cat.id"
              class="list-menu-row w-full text-left px-4 py-3 hover:bg-base-200 transition-colors flex items-center justify-between group"
              :class="{ 'bg-primary/10 text-primary border-r-4 border-primary': activeTab === cat.id }"
            >
              <div class="flex items-center gap-3">
                <!-- Рендеринг SVG иконки -->
                <span class="w-6 h-6 text-base-content/70 group-hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" v-html="cat.iconSvg"></svg>
                </span>
                <span class="font-medium">{{ cat.name }}</span>
              </div>
              <svg v-if="selectedParts[cat.id]" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        <button 
          @click="addBuildToCart"
          :disabled="selectedCount === 0"
          class="btn btn-primary btn-block shadow-lg mt-4"
        >
          Добавить сборку в корзину
        </button>
      </div>

      <!-- Правая колонка: Контент -->
      <div class="lg:col-span-9">
        
        <!-- Блок выбранного товара -->
        <div v-if="currentSelectedPart" class="mb-6">
           <div class="alert alert-success shadow-lg bg-base-100 border border-success/30">
              <div class="flex-1 flex items-center gap-4">
                 <div class="avatar placeholder">
                    <div class="bg-neutral text-neutral-content rounded-full w-12 flex items-center justify-center">
                       <!-- Иконка в кружочке -->
                       <span class="w-6 h-6">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" v-html="builderCategories.find(c => c.id === activeTab)?.iconSvg"></svg>
                       </span>
                    </div>
                 </div>
                 <div>
                    <h3 class="font-bold">{{ currentSelectedPart.title }}</h3>
                    <div class="text-xs opacity-70">{{ formatPrice(currentSelectedPart.price) }}</div>
                 </div>
              </div>
              <button @click="removePart(activeTab)" class="btn btn-sm btn-outline btn-error">Изменить</button>
           </div>
        </div>

        <!-- Список товаров для выбора -->
        <div v-else class="space-y-4">
          <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
            Выберите {{ builderCategories.find(c => c.id === activeTab)?.name }}
            <span class="badge badge-ghost">{{ availableProducts.length }}</span>
          </h2>

          <div v-if="loading" class="flex justify-center py-10">
             <span class="loading loading-spinner loading-lg"></span>
          </div>

          <div v-else-if="availableProducts.length === 0" class="alert alert-warning">
             <span>В данной категории пока нет товаров.</span>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div 
              v-for="product in availableProducts" 
              :key="product.id"
              class="card bg-base-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer border border-transparent hover:border-primary"
              @click="selectPart(product)"
            >
              <figure class="h-40 bg-base-200 p-4 relative">
                 <img :src="product.image || product.thumbnail" :alt="product.title" class="object-contain h-full" />
              </figure>
              <div class="card-body p-4">
                <h3 class="font-bold text-sm line-clamp-2 min-h-[2.5rem]">{{ product.title }}</h3>
                <div class="flex justify-between items-center mt-2">
                  <span class="text-primary font-bold">{{ formatPrice(product.price) }}</span>
                  <span class="btn btn-xs btn-circle btn-ghost">+</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>