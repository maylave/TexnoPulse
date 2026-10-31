<!-- src/components/modals/GlobalSearch.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import {
  Search,
  X,
  History,
  Sparkles,
  SlidersHorizontal,
  Quote,
  MessageSquare,
  Palette,
  FileText,
  CornerDownLeft,
  Layers
} from 'lucide-vue-next'
import {
  useGlobalSearch,
  type SearchScope
} from '@/composables/useGlobalSearch'
import { useModalStore } from '@/stores/appModal'

const modalStore = useModalStore()
const containerRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const listContainerRef = ref<HTMLElement | null>(null)

const isFocused = ref(false)

const {
  query,
  activeScope,
  cleanTerm,
  selectedIndex,
  recentSearches,
  groupedResults,
  flatResults,
  ensureAllChatsLoaded,
  setScope,
  applyRecent,
  removeRecent,
  clearRecent,
  navigateNext,
  navigatePrev,
  executeSelected,
  highlightText
} = useGlobalSearch()

const scopesList: {
  id: SearchScope
  label: string
  icon: any
}[] = [
  { id: 'all', label: 'Все', icon: Layers },
  { id: 'chat', label: 'Чаты', icon: MessageSquare },
  { id: 'message', label: 'Сообщения', icon: Quote },
  { id: 'setting', label: 'Настройки', icon: SlidersHorizontal },
  { id: 'color', label: 'Цвета', icon: Palette },
  { id: 'file', label: 'Файлы', icon: FileText },
  { id: 'cmd', label: 'Команды', icon: Sparkles }
]

// Выпадающая карточка открыта только при фокусе, наличии текста или выбранном фильтре
const isOpen = computed(() => {
  return isFocused.value || query.value.trim().length > 0 || activeScope.value !== 'all'
})

// Показывать ли результаты (при вводе любого текста ИЛИ выборе конкретной категории)
const showResults = computed(() => {
  return query.value.trim().length > 0 || activeScope.value !== 'all'
})

const handleClickOutside = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isFocused.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  nextTick(() => {
    inputRef.value?.focus()
  })
  if (typeof ensureAllChatsLoaded === 'function') {
    ensureAllChatsLoaded()
  }
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})

// Автоскролл к выбранному элементу при навигации стрелками
watch(selectedIndex, async newIdx => {
  if (newIdx < 0) return
  await nextTick()
  const activeEl = listContainerRef.value?.querySelector(
    '[data-active="true"]'
  ) as HTMLElement
  if (activeEl) {
    activeEl.scrollIntoView({ behavior: 'auto', block: 'nearest' })
  }
})

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!isFocused.value) isFocused.value = true
    navigateNext()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    navigatePrev()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    executeSelected()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    if (query.value || activeScope.value !== 'all') {
      clearInput()
    } else if (isFocused.value) {
      isFocused.value = false
      inputRef.value?.blur()
    } else {
      modalStore.close()
    }
  } else if (e.key === 'Backspace' && !query.value && activeScope.value !== 'all') {
    setScope('all')
  }
}

const onSelectScope = (scopeId: SearchScope) => {
  setScope(scopeId === activeScope.value ? 'all' : scopeId)
  inputRef.value?.focus()
}

const clearInput = () => {
  query.value = ''
  setScope('all')
  inputRef.value?.focus()
}
</script>

<template>
  <!-- Жесткая ширина sm:w-[540px] + shrink-0 защищают от сплющивания родительским flex -->
  <div
    ref="containerRef"
    class="relative mx-auto flex w-[calc(100vw-2rem)] sm:w-[540px] shrink-0 flex-col gap-2.5"
    @keydown="onKeyDown"
  >
    <!-- 1. ЧИСТЫЙ ИНПУТ (Работает сразу как общий поиск без выбора типа) -->
    <div
      class="relative flex h-12 w-full items-center gap-3 rounded-2xl border px-4 shadow-lg backdrop-blur-xl transition-colors duration-150"
      :class="[
        isOpen
          ? 'border-(--color-accent,#4ea8ff)/60 bg-[#0d1522]/95'
          : 'border-white/10 bg-[#0d1522]/75 hover:border-white/20'
      ]"
      @click="inputRef?.focus()"
    >
      <Search
        class="h-4 w-4 shrink-0 transition-colors duration-150"
        :class="isOpen ? 'text-(--color-accent,#4ea8ff)' : 'text-white/40'"
      />

      <!-- Небольшой бейдж, если выбрана конкретная категория -->
      <div
        v-if="activeScope !== 'all'"
        class="flex shrink-0 items-center gap-1 rounded-lg bg-(--color-accent,#4ea8ff)/15 px-2 py-0.5 text-xs font-medium text-(--color-accent,#4ea8ff)"
      >
        <span>{{ scopesList.find(s => s.id === activeScope)?.label }}</span>
        <button
          type="button"
          @mousedown.prevent="setScope('all')"
          class="ml-0.5 hover:text-white"
        >
          <X class="h-3 w-3" />
        </button>
      </div>

      <!-- Поле ввода -->
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        placeholder="Поиск..."
        class="h-full min-w-0 flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none"
        @focus="isFocused = true"
      />

      <!-- Кнопка очистки -->
      <button
        v-if="query || activeScope !== 'all'"
        type="button"
        @mousedown.prevent="clearInput"
        class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X class="h-3.5 w-3.5" />
      </button>
    </div>

    <!-- 2. ЛЕВИТИРУЮЩЕЕ ОКНО В ВОЗДУХЕ -->
    <Transition name="float-panel">
      <div
        v-if="isOpen"
        class="flex max-h-[65vh] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d1522]/95 text-white shadow-[0_24px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl"
      >
        <!-- Быстрые пилюли фильтрации («Все» = общий поиск) -->
        <div class="flex items-center gap-1.5 overflow-x-auto border-b border-white/[0.06] px-3 py-2.5 no-scrollbar">
          <button
            v-for="s in scopesList"
            :key="s.id"
            type="button"
            @mousedown.prevent="onSelectScope(s.id)"
            class="flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition-colors duration-150"
            :class="
              activeScope === s.id
                ? 'bg-(--color-accent,#4ea8ff) text-white'
                : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white'
            "
          >
            <component :is="s.icon" class="h-3.5 w-3.5" />
            <span>{{ s.label }}</span>
          </button>
        </div>

        <!-- Контентная часть -->
        <div
          ref="listContainerRef"
          class="flex-1 overflow-y-auto p-2 custom-scrollbar"
        >
          <!-- СОСТОЯНИЕ А: Пустой ввод -> Показываем историю -->
          <div v-if="!showResults" class="flex flex-col">
            <template v-if="recentSearches.length > 0">
              <div class="flex items-center justify-between px-2.5 py-1.5 text-[11px] font-medium text-white/40">
                <span>Недавние</span>
                <button
                  type="button"
                  @mousedown.prevent="clearRecent"
                  class="hover:text-white/80 transition-colors"
                >
                  Очистить
                </button>
              </div>

              <div class="flex flex-col gap-0.5">
                <div
                  v-for="recent in recentSearches"
                  :key="recent"
                  @mousedown.prevent="applyRecent(recent)"
                  class="group flex items-center justify-between rounded-xl px-2.5 py-2 text-sm text-white/75 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <History class="h-3.5 w-3.5 shrink-0 text-white/30 group-hover:text-white/60" />
                    <span class="truncate">{{ recent }}</span>
                  </div>
                  <button
                    type="button"
                    @mousedown.stop.prevent="removeRecent(recent)"
                    class="opacity-0 group-hover:opacity-100 text-white/30 hover:text-rose-400 p-0.5 transition-opacity"
                  >
                    <X class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </template>

            <div v-else class="py-6 text-center text-xs text-white/35">
              Начните печатать для общего поиска...
            </div>
          </div>

          <!-- СОСТОЯНИЕ Б: Ничего не найдено -->
          <div
            v-else-if="flatResults.length === 0"
            class="flex flex-col items-center justify-center py-8 text-center"
          >
            <p class="text-sm text-white/45">
              Ничего не найдено по запросу «<span class="text-white/85">{{ cleanTerm || query }}</span>»
            </p>
            <button
              v-if="activeScope !== 'all'"
              type="button"
              @mousedown.prevent="setScope('all')"
              class="mt-2 text-xs text-(--color-accent,#4ea8ff) hover:underline"
            >
              Искать во всех категориях
            </button>
          </div>

          <!-- СОСТОЯНИЕ В: Результаты поиска -->
          <div v-else class="flex flex-col gap-3">
            <div
              v-for="group in groupedResults"
              :key="group.category"
              class="flex flex-col"
            >
              <div class="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                {{ group.category }}
              </div>

              <div class="flex flex-col gap-0.5">
                <button
                  v-for="item in group.items"
                  :key="item.id"
                  :data-active="flatResults[selectedIndex]?.id === item.id"
                  @mousedown.prevent="item.action()"
                  @mouseenter="selectedIndex = flatResults.findIndex(r => r.id === item.id)"
                  type="button"
                  class="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors focus-visible:outline-none"
                  :class="
                    flatResults[selectedIndex]?.id === item.id
                      ? 'bg-white/10 text-white'
                      : 'text-white/80 hover:bg-white/[0.05]'
                  "
                >
                  <!-- Превью картинки, цвет или иконка -->
                  <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.04]"
                    :class="item.colorClass"
                  >
                    <img
                      v-if="item.thumbnailUrl"
                      :src="item.thumbnailUrl"
                      alt=""
                      class="h-full w-full object-cover"
                    />
                    <div
                      v-else-if="item.swatchHex"
                      class="h-3.5 w-3.5 rounded-full border border-white/20"
                      :style="{ backgroundColor: item.swatchHex }"
                    />
                    <component
                      v-else
                      :is="item.icon"
                      class="h-4 w-4"
                    />
                  </div>

                  <!-- Текст результата с подсветкой -->
                  <div class="flex min-w-0 flex-1 flex-col">
                    <div class="flex items-center gap-2">
                      <span class="truncate text-sm font-medium">
                        <template v-for="(part, i) in highlightText(item.title, cleanTerm)" :key="i">
                          <span v-if="part.highlight" class="text-(--color-accent,#4ea8ff)">
                            {{ part.text }}
                          </span>
                          <template v-else>{{ part.text }}</template>
                        </template>
                      </span>
                      <span
                        v-if="item.badge"
                        class="shrink-0 rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] text-white/50"
                      >
                        {{ item.badge }}
                      </span>
                    </div>

                    <span
                      v-if="item.subtitle"
                      class="truncate text-xs text-white/45"
                    >
                      <template v-for="(part, i) in highlightText(item.subtitle, cleanTerm)" :key="i">
                        <span v-if="part.highlight" class="text-(--color-accent,#4ea8ff)/80">
                          {{ part.text }}
                        </span>
                        <template v-else>{{ part.text }}</template>
                      </template>
                    </span>
                  </div>

                  <CornerDownLeft
                    class="h-3.5 w-3.5 shrink-0 text-white/30 opacity-0 transition-opacity"
                    :class="{ 'opacity-100': flatResults[selectedIndex]?.id === item.id }"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.float-panel-enter-active,
.float-panel-leave-active {
  transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}
.float-panel-enter-from,
.float-panel-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 9999px;
}
</style>
