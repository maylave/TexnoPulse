<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const products = ref<any[]>([])
const isLoading = ref(true)
const showModal = ref(false)
const isEditing = ref(false)
const currentProduct = ref<any>(null)

// Форма товара
const form = ref({
  title: '',
  price: 0,
  old_price: null,
  category: 'gpu',
  image: '',
  description: '',
  stock: 10,
  brand: '',
  is_featured: false
})

onMounted(async () => {
  // Проверка прав на фронтенде (для безопасности UI)
  if (!authStore.isAuthenticated || authStore.user?.role !== 'admin') {
    alert('Доступ запрещен')
    router.push('/')
    return
  }
  
  await fetchProducts()
})

const fetchProducts = async () => {
  isLoading.value = true
  try {
    const token = localStorage.getItem('authToken')
    const res = await fetch('http://localhost:3000/api/admin/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!res.ok) throw new Error('Failed to fetch')
    products.value = await res.json()
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  isEditing.value = false
  form.value = {
    title: '', price: 0, old_price: null, category: 'gpu', 
    image: '', description: '', stock: 10, brand: '', is_featured: false
  }
  showModal.value = true
}

const openEditModal = (product: any) => {
  isEditing.value = true
  currentProduct.value = product
  form.value = { ...product }
  showModal.value = true
}

const saveProduct = async () => {
  const token = localStorage.getItem('authToken')
  const url = isEditing.value 
    ? `http://localhost:3000/api/admin/products/${currentProduct.value.id}`
    : 'http://localhost:3000/api/admin/products'
  
  const method = isEditing.value ? 'PUT' : 'POST'

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(form.value)
    })

    if (!res.ok) throw new Error('Save failed')
    
    showModal.value = false
    await fetchProducts() // Обновляем список
  } catch (e) {
    alert('Ошибка сохранения')
  }
}

const deleteProduct = async (id: number) => {
  if (!confirm('Удалить товар?')) return
  
  const token = localStorage.getItem('authToken')
  try {
    const res = await fetch(`http://localhost:3000/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!res.ok) throw new Error('Delete failed')
    await fetchProducts()
  } catch (e) {
    alert('Ошибка удаления')
  }
}
</script>

<template>
  <div class="min-h-screen bg-base-100 p-8">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-white">Админ-панель: Товары</h1>
        <button @click="openCreateModal" class="btn btn-primary">+ Добавить товар</button>
      </div>

      <!-- Таблица товаров -->
      <div class="overflow-x-auto bg-base-200 rounded-lg shadow-xl">
        <table class="table w-full">
          <thead>
            <tr class="text-base-content/70">
              <th>Фото</th>
              <th>Название</th>
              <th>Категория</th>
              <th>Цена</th>
              <th>Приоритет</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in products" :key="p.id" class="hover:bg-white/5">
              <td>
                <div class="w-12 h-12 rounded overflow-hidden">
                  <img :src="p.image" class="w-full h-full object-cover" />
                </div>
              </td>
              <td class="font-bold">{{ p.title }}</td>
              <td>{{ p.category }}</td>
              <td>{{ p.price }} ₽</td>
              <td>
                <span v-if="p.is_featured" class="badge badge-warning">TOP</span>
                <span v-else class="badge badge-ghost">Обычный</span>
              </td>
              <td class="space-x-2">
                <button @click="openEditModal(p)" class="btn btn-xs btn-outline btn-info">Ред.</button>
                <button @click="deleteProduct(p.id)" class="btn btn-xs btn-outline btn-error">Удал.</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Модальное окно создания/редактирования -->
      <dialog :class="['modal modal-bottom sm:modal-middle', showModal ? 'modal-open' : '']">
        <div class="modal-box bg-base-200">
          <h3 class="font-bold text-lg mb-4">{{ isEditing ? 'Редактирование' : 'Новый товар' }}</h3>
          
          <div class="grid grid-cols-2 gap-4">
            <input v-model="form.title" placeholder="Название" class="input input-bordered w-full col-span-2" />
            <input v-model.number="form.price" type="number" placeholder="Цена" class="input input-bordered" />
            <input v-model.number="form.old_price" type="number" placeholder="Старая цена" class="input input-bordered" />
            
            <select v-model="form.category" class="select select-bordered w-full">
              <option value="gpu">Видеокарты</option>
              <option value="cpu">Процессоры</option>
              <option value="laptop">Ноутбуки</option>
            </select>
            
            <input v-model="form.image" placeholder="URL картинки" class="input input-bordered w-full col-span-2" />
            <textarea v-model="form.description" placeholder="Описание" class="textarea textarea-bordered w-full col-span-2"></textarea>
            
            <label class="flex items-center gap-2 cursor-pointer col-span-2">
              <input type="checkbox" v-model="form.is_featured" class="checkbox checkbox-primary" />
              <span class="label-text">Показывать на главной (Приоритет)</span>
            </label>
          </div>

          <div class="modal-action">
            <button @click="showModal = false" class="btn btn-ghost">Отмена</button>
            <button @click="saveProduct" class="btn btn-primary">Сохранить</button>
          </div>
        </div>
      </dialog>
    </div>
  </div>
</template>