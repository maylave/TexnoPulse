<template>
  <div class="navbar bg-base-100/95 backdrop-blur-md sticky top-0 z-50 shadow-lg border-b border-white/5 h-20">
  
    <!-- START: Лого и Мобильное меню -->
    <div class="navbar-start">
      <div class="dropdown">
        <label tabindex="0" class="btn btn-ghost lg:hidden text-base-content hover:text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" /></svg>
        </label>
        <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-100 p-4 shadow-2xl bg-base-200 rounded-box w-64 border border-white/5 text-base-content">
          <li><router-link to="/" class="hover:bg-primary/20 hover:text-primary">Главная</router-link></li>
          <li><router-link to="/catalog" class="hover:bg-primary/20 hover:text-primary">Каталог</router-link></li>
          <li><router-link to="/pcBuilder" class="hover:bg-primary/20 hover:text-primary">Конфигуратор</router-link></li>
          <li><router-link to="/support" class="hover:bg-primary/20 hover:text-primary">Поддержка</router-link></li>
        </ul>
      </div>
      
      <router-link to="/" class="btn btn-ghost text-xl normal-case hover:bg-transparent p-0">
        <h1 class="text-2xl font-bold tracking-widest text-white uppercase drop-shadow-[0_0_10px_rgba(102,192,244,0.4)]">
          Texno<span class="text-primary">Pulse</span>
        </h1>
      </router-link>
    </div>

    <!-- CENTER: Поиск (Десктоп) -->
    <div class="navbar-center hidden lg:flex">
      <div class="form-control relative group">
        <input 
          v-model="searchQuery"
          @keyup.enter="handleSearch"
          type="text" 
          placeholder="Поиск видеокарт, процессоров..." 
          class="input input-bordered w-96 bg-base-200/50 border-white/10 focus:border-primary focus:bg-base-100 text-base-content placeholder-base-content/40 transition-all pl-10" 
        />
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>

    <!-- END: Меню, Профиль, Корзина, Выход -->
    <div class="navbar-end gap-2">
      
      <!-- Десктоп меню -->
      <ul class="menu menu-horizontal px-1 font-medium hidden lg:flex text-base-content/80">
        <li><router-link to="/catalog" class="hover:text-primary transition-colors">Каталог</router-link></li>
        <li><router-link to="/pcBuilder" class="hover:text-primary transition-colors">Конфигуратор</router-link></li>
        <li><router-link to="/support" class="hover:text-primary transition-colors">Поддержка</router-link></li>
      </ul>


      <router-link 
  v-if="authStore.isAuthenticated && authStore.user?.role === 'admin'"
  to="/admin" 
  class="btn btn-ghost btn-sm text-warning hover:text-warning-content"
>
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  Админка
</router-link>
      <router-link 
        v-if="authStore.isAuthenticated"
        to="/profile" 
        class="btn btn-ghost btn-circle tooltip tooltip-bottom" 
        data-tip="Профиль"
      >
        <div class="avatar online">
          <div class="w-9 rounded-full ring ring-primary/30 ring-offset-base-100 ring-offset-1 overflow-hidden bg-base-300 flex items-center justify-center">
            <!-- Если есть аватар, показываем картинку -->
            <img 
              v-if="authStore.user?.avatarUrl || authStore.user?.image" 
              :src="authStore.user?.avatarUrl || authStore.user?.image" 
              alt="Avatar"
              class="w-full h-full object-cover"
            />
            <!-- Иначе показываем инициалы -->
            <span v-else class="text-xs font-bold text-primary-content">
              {{ getInitials(authStore.userName) }}
            </span>
          </div>
        </div>
      </router-link>

      <!-- Кнопка Входа (если не авторизован) -->
      <router-link 
        v-else
        to="/auth" 
        class="btn btn-ghost btn-circle tooltip tooltip-bottom" 
        data-tip="Войти"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </router-link>
      
      <!-- Кнопка ВЫХОДА (только если авторизован) -->
      <button 
        v-if="authStore.isAuthenticated"
        @click="handleLogout"
        class="btn btn-ghost btn-circle tooltip tooltip-bottom text-error hover:bg-error/10 hover:text-error-content"
        data-tip="Выйти"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
      
      <!-- Кнопка Корзины -->
      <router-link to="/cart" class="btn btn-ghost btn-circle tooltip tooltip-bottom" data-tip="Корзина">
        <div class="indicator">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span v-if="cartStore.totalItems > 0" class="badge badge-sm badge-primary indicator-item font-bold animate-bounce-short">
            {{ cartStore.totalItems }}
          </span>
        </div>
      </router-link>
     
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'; // Добавили watch
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()

const searchQuery = ref('')

// Хелпер для инициалов
const getInitials = (name?: string) => {
  if (!name) return 'U'
  return name.substring(0, 2).toUpperCase()
}

// Инициализация при загрузке страницы (если пользователь обновил страницу)
onMounted(() => {
  // Если токена нет в реактивном сторе, но есть в LS -> восстанавливаем
  if (!authStore.token && localStorage.getItem('authToken')) {
    authStore.initAuth()
  }
})

// Обработчик выхода
const handleLogout = () => {
  authStore.logout()
  cartStore.clearCart()
}

// Поиск
const handleSearch = () => {
  if (!searchQuery.value.trim()) return
  router.push({ 
    path: '/catalog', 
    query: { search: searchQuery.value } 
  })
}
</script>

<style scoped>
@keyframes bounce-short {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-25%); }
}
.animate-bounce-short {
  animation: bounce-short 0.5s ease-in-out;
}
</style>