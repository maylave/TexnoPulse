import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
	{
		path: '/',
		name: 'Home',
		component: () => import('../views/HomeView.vue') // Lazy loading
	},
	{
		path: '/product/:id',
		name: 'ProductDetails',
		component: () => import('../views/ProductView.vue'),
		props: true
	},
	{
		path: '/cart',
		name: 'Cart',
		component: () => import('../views/CartView.vue')
	},
	{
		path: '/auth',
		name: 'Auth',
		component: () => import('../views/AuthPage.vue')
	},
	{
		path: '/catalog',
		name: 'Catalog',
		component: () => import('../views/CatalogPage.vue')
	},
	{
		path: '/cart',
		name: 'Cart',
		component: () => import('../views/CartPage.vue')
	},
	{
		path: '/profile',
		name: 'Profile',
		component: () => import('../views/ProfilePage.vue')
	},
	{
		path: '/product/:id',
		name: 'ProductDetail',
		component: () => import('../views/ProductPage.vue')
	},
	{
		path: '/pcBuilder',
		name: 'PcBuilder',
		component: () => import('../views/PcBuilderPage.vue')
	},
	{
		path: '/adminDash',
		name: 'AdminDash',
		component: () => import('../views/admin/AdminDashboard.vue')
	},
	{
		path: '/admin',
		name: 'AdminPanel',
		component: () => import('../views/admin/AdminPage.vue'),
		meta: { requiresAuth: true, isAdmin: true } // Мета-теги для защиты (опционально)
	},
	{
		path: '/:pathMatch(.*)*',
		name: 'NotFound',
		component: () => import('../views/404.vue')
	}
]

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes
})

export default router
