<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../services/api.resources'
import { useAuthStore } from '../stores/auth'; // <--- 1. Импортируем стор

const router = useRouter()
const authStore = useAuthStore() // <--- 2. Создаем экземпляр стора

// Состояние интерфейса
const mode = ref<'login' | 'register'>('login')
const isAgreementOpen = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const showLoginPass = ref(false)  // Для поля входа
const showRegPass = ref(false)    // Для поля регистрации
// Данные форм
const loginForm = ref({
  email: '',
  password: ''
})

const registerForm = ref({
  username: '',
  email: '',
  password: '',
  agree: false
})

// --- Валидация ---
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const passwordErrors = computed(() => {
  const errors: string[] = []
  const pass = registerForm.value.password
  if (pass.length > 0 && pass.length < 8) errors.push('Минимум 8 символов')
  if (pass.length > 0 && !/[A-Z]/.test(pass)) errors.push('Заглавная буква (A-Z)')
  if (pass.length > 0 && !/[a-z]/.test(pass)) errors.push('Строчная буква (a-z)')
  if (pass.length > 0 && !/[0-9]/.test(pass)) errors.push('Цифра (0-9)')
  if (pass.length > 0 && !/[!@#$%^&*]/.test(pass)) errors.push('Спецсимвол (!@#$...)')
  return errors
})

const isPasswordValid = computed(() => passwordErrors.value.length === 0 && registerForm.value.password.length >= 8)

const isRegisterValid = computed(() => {
  return (
    registerForm.value.username.length > 2 &&
    isValidEmail(registerForm.value.email) &&
    isPasswordValid.value &&
    registerForm.value.agree
  )
})

const isLoginValid = computed(() => {
  return loginForm.value.email.length > 0 && loginForm.value.password.length > 0
})

// --- Обработчики ---

const handleLogin = async () => {
  if (!isLoginValid.value) return
  
  isLoading.value = true
  errorMessage.value = ''

  try {
    // Используем метод из стора, он сам обновит user и token
    await authStore.login({
      login: loginForm.value.email, 
      password: loginForm.value.password
    })
    // Роутинг происходит внутри store.login(), поэтому здесь ничего не нужно
  } catch (error: any) {
    console.error('Login error:', error)
    const errData = error.message ? JSON.parse(error.message.split(': ')[1] || '{}') : {}
    errorMessage.value = errData.error || 'Неверный логин или пароль'
  } finally {
    isLoading.value = false
  }
}

const handleRegister = async () => {
  if (!isRegisterValid.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    // 1. Регистрация
    await api.auth.register({
      username: registerForm.value.username,
      email: registerForm.value.email,
      password: registerForm.value.password
    })

    // 2. Авто-вход через API (так как мы не используем store.register для входа)
    const loginResponse = await api.auth.login({
      login: registerForm.value.email,
      password: registerForm.value.password
    })

    // 3. ВАЖНО: Обновляем стор вручную, чтобы Navbar увидел изменения мгновенно
    authStore.token = loginResponse.token
    authStore.user = loginResponse.user
    
    localStorage.setItem('authToken', loginResponse.token)
    localStorage.setItem('user', JSON.stringify(loginResponse.user))

    // 4. Переход на главную
    router.push('/') 

  } catch (error: any) {
    console.error('Register/Login error:', error)
    
    let errMsg = 'Ошибка при регистрации'
    try {
        const jsonStr = error.message.substring(error.message.indexOf('{'))
        const jsonObj = JSON.parse(jsonStr)
        errMsg = jsonObj.error || errMsg
    } catch (e) {
        errMsg = error.message
    }

    if (errMsg.includes('Неверный email или пароль')) {
         errorMessage.value = 'Регистрация успешна! Пожалуйста, войдите вручную.'
         mode.value = 'login'
         loginForm.value.email = registerForm.value.email
         loginForm.value.password = registerForm.value.password
    } else {
         errorMessage.value = errMsg
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-base-100 relative overflow-hidden font-sans text-base-content selection:bg-primary selection:text-primary-content p-4">
    
    <!-- Фон -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

    <!-- Карточка -->
    <div class="relative z-10 w-full max-w-md">
      <div class="bg-base-200/90 backdrop-blur-xl border border-primary/20 rounded-lg shadow-2xl overflow-hidden transition-all duration-300 hover:border-primary/50">
        
        <!-- Лого -->
        <div class="pt-8 pb-2 text-center">
          <h1 class="text-3xl font-bold tracking-widest text-white uppercase drop-shadow-[0_0_15px_rgba(102,192,244,0.6)]">
            Texno<span class="text-primary">Pulse</span>
          </h1>
        </div>

        <!-- Табы -->
        <div class="flex border-b border-white/10 bg-black/20 mt-4">
          <button 
            @click="mode = 'login'"
            :disabled="isLoading"
            :class="['flex-1 py-4 text-sm font-bold uppercase tracking-wide transition-colors relative outline-none', mode === 'login' ? 'text-primary' : 'text-base-content/50 hover:text-white']"
          >
            Вход
            <div v-if="mode === 'login'" class="absolute bottom-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_10px_var(--color-primary)]"></div>
          </button>
          <button 
            @click="mode = 'register'"
            :disabled="isLoading"
            :class="['flex-1 py-4 text-sm font-bold uppercase tracking-wide transition-colors relative outline-none', mode === 'register' ? 'text-primary' : 'text-base-content/50 hover:text-white']"
          >
            Регистрация
            <div v-if="mode === 'register'" class="absolute bottom-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_10px_var(--color-primary)]"></div>
          </button>
        </div>

        <!-- Сообщение об ошибке -->
        <div v-if="errorMessage" class="mx-8 mt-4 p-3 bg-error/20 border border-error text-error text-sm rounded text-center animate-pulse break-words">
          {{ errorMessage }}
        </div>

        <div class="p-8">
          
          <!-- === ВХОД === -->
          <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="space-y-5 animate-fade-in">
            <div class="form-control w-full">
              <label class="label"><span class="label-text text-xs uppercase text-base-content/70">Email</span></label>
              <input v-model="loginForm.email" type="text" class="input input-bordered w-full bg-base-300 border-base-content/10 focus:border-primary text-white" placeholder="user@example.com" />
            </div>

            <div class="form-control w-full">
              <label class="label"><span class="label-text text-xs uppercase text-base-content/70">Пароль</span></label>
              <div class="relative">
                <input 
                  v-model="loginForm.password" 
                  :type="showLoginPass ? 'text' : 'password'" 
                  class="input input-bordered w-full bg-base-300 border-base-content/10 focus:border-primary text-white pr-10" 
                  placeholder="••••••••" 
                />
                <button 
                  type="button"
                  @click="showLoginPass = !showLoginPass"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-primary"
                >
                  <!-- Иконка Глаза (Открытый) -->
                  <svg v-if="!showLoginPass" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <!-- Иконка Глаза (Закрытый) -->
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
            </div>

            <button :disabled="!isLoginValid || isLoading" type="submit" class="btn btn-primary w-full mt-4 uppercase font-bold disabled:opacity-50 disabled:cursor-not-allowed">
              <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
              <span v-else>Войти</span>
            </button>
            
            <div class="text-center mt-2">
              <a href="#" class="text-xs text-base-content/50 hover:text-primary transition-colors">Забыли пароль?</a>
            </div>
          </form>

          <!-- === РЕГИСТРАЦИЯ === -->
          <form v-else @submit.prevent="handleRegister" class="space-y-4 animate-fade-in">
            
            <!-- Имя -->
            <div class="form-control w-full">
              <label class="label"><span class="label-text text-xs uppercase text-base-content/70">Имя пользователя</span></label>
              <input v-model="registerForm.username" type="text" class="input input-bordered w-full bg-base-300 border-base-content/10 focus:border-primary text-white" placeholder="CyberUser" />
              <label v-if="registerForm.username.length > 0 && registerForm.username.length < 3" class="label">
                <span class="label-text-alt text-error">Минимум 3 символа</span>
              </label>
            </div>

            <!-- Email -->
            <div class="form-control w-full">
              <label class="label"><span class="label-text text-xs uppercase text-base-content/70">Email</span></label>
              <input v-model="registerForm.email" type="email" class="input input-bordered w-full bg-base-300 border-base-content/10 focus:border-primary text-white" placeholder="mail@example.com" />
              <label v-if="registerForm.email.length > 0 && !isValidEmail(registerForm.email)" class="label">
                <span class="label-text-alt text-error">Некорректный Email</span>
              </label>
            </div>

            <!-- Пароль -->
            <div class="form-control w-full">
              <label class="label"><span class="label-text text-xs uppercase text-base-content/70">Пароль</span></label>
              <div class="relative">
                <input 
                  v-model="registerForm.password" 
                  :type="showRegPass ? 'text' : 'password'" 
                  class="input input-bordered w-full bg-base-300 border-base-content/10 focus:border-primary text-white pr-10" 
                  placeholder="••••••••" 
                />
                <button 
                  type="button"
                  @click="showRegPass = !showRegPass"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-primary"
                >
                   <svg v-if="!showRegPass" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
              
              <!-- Список ошибок пароля -->
              <div v-if="passwordErrors.length > 0" class="mt-2 p-2 bg-base-300/50 rounded border border-error/30">
                <p class="text-[10px] uppercase text-base-content/50 mb-1">Требования к паролю:</p>
                <ul class="text-xs text-error space-y-1">
                  <li v-for="(err, index) in passwordErrors" :key="index" class="flex items-center">
                    <span class="mr-2">•</span> {{ err }}
                  </li>
                </ul>
              </div>
            </div>

            <!-- Чекбокс соглашения -->
            <div class="form-control mt-2">
              <label class="label cursor-pointer justify-start gap-3">
                <input type="checkbox" v-model="registerForm.agree" class="checkbox checkbox-sm checkbox-primary" />
                <span class="label-text text-xs text-base-content/70">
                  Я согласен с 
                  <a href="#" @click.prevent="isAgreementOpen = true" class="text-primary hover:underline">Пользовательским соглашением</a>
                </span>
              </label>
            </div>

            <button :disabled="!isRegisterValid || isLoading" type="submit" class="btn btn-primary w-full mt-4 uppercase font-bold disabled:opacity-50 disabled:cursor-not-allowed">
              <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
              <span v-else>Создать аккаунт</span>
            </button>
          </form>

        </div>
      </div>
    </div>

    <!-- === МОДАЛЬНОЕ ОКНО СОГЛАШЕНИЯ === -->
    <dialog :class="['modal modal-bottom sm:modal-middle', isAgreementOpen ? 'modal-open' : '']">
      <div class="modal-box bg-base-200 border border-primary/20 text-base-content">
        <h3 class="font-bold text-lg text-primary uppercase mb-4">Пользовательское соглашение</h3>
        <div class="max-h-[60vh] overflow-y-auto pr-2 text-sm space-y-3 text-base-content/80 custom-scrollbar">
           <p>1. <strong>Общие положения.</strong> Настоящее соглашение регулирует отношения между администрацией интернет-магазина TexnoPulse и пользователем сайта.</p>
           <p>2. <strong>Конфиденциальность.</strong> Мы собираем только необходимые данные для обработки заказов (Email, Имя). Ваши данные защищены протоколами шифрования.</p>
           <p>3. <strong>Ответственность.</strong> Администрация не несет ответственности за временные сбои в работе сайта, вызванные форс-мажорными обстоятельствами или/DDoS-атаками.</p>
           <p>4. <strong>Правила поведения.</strong> Запрещено использование скриптов для автоматического сбора данных, спам в отзывах и попытки взлома аккаунтов других пользователей.</p>
           <p>5. <strong>Возврат товара.</strong> Возврат технического средства надлежащего качества возможен в течение 14 дней при сохранении товарного вида и упаковки.</p>
           <p>6. <strong>Изменения.</strong> Администрация оставляет за собой право изменять данное соглашение без предварительного уведомления.</p>
        </div>
        <div class="modal-action">
          <form method="dialog">
            <button @click="isAgreementOpen = false" class="btn btn-sm btn-primary">Понятно</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="isAgreementOpen = false">close</button>
      </form>
    </dialog>

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #2a475e; border-radius: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #66c0f4; }
</style>