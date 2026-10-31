<!-- src/components/ui/ContextMenu.vue -->
<script lang="ts" setup>
import {
  ref,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
  computed,
} from "vue";
import { storeToRefs } from "pinia";
import { useContextMenuStore } from "@/stores/contexMenu";

const store = useContextMenuStore();
const { isOpen, menuItems, style, placement, currentVariant } =
  storeToRefs(store);
const menuEl = ref<HTMLElement | null>(null);

// ФИЛЬТРАЦИЯ: Показываем только подходящие пункты
const visibleItems = computed(() => {
  const v = currentVariant.value;
  return menuItems.value.filter((item) => {
    // Сепараторы всегда показываем, если они не скрыты явно
    if (item.separator) return true;

    // Если у пункта нет variant, он виден везде
    if (!item.variant) return true;

    // Иначе проверяем совпадение
    return item.variant === v;
  });
});

// ... (логика позиционирования и закрытия остается прежней) ...
watch(isOpen, async (open) => {
  if (!open) return;
  await nextTick();
  const el = menuEl.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const margin = 8;
  let dx = 0,
    dy = 0;
  if (rect.right > window.innerWidth - margin)
    dx = window.innerWidth - margin - rect.right;
  if (rect.left < margin) dx = margin - rect.left;
  if (rect.bottom > window.innerHeight - margin)
    dy = window.innerHeight - margin - rect.bottom;
  if (rect.top < margin) dy = margin - rect.top;
  if (dx || dy) store.moveBy(dx, dy);
});

function onOutsideMouseDown(e: MouseEvent) {
  if (!isOpen.value) return;
  if (menuEl.value && !menuEl.value.contains(e.target as Node)) store.close();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") store.close();
}

onMounted(() => {
  window.addEventListener("mousedown", onOutsideMouseDown);
  window.addEventListener("keydown", onKeydown);
});
onBeforeUnmount(() => {
  window.removeEventListener("mousedown", onOutsideMouseDown);
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="ctx">
      <ul
        v-if="isOpen"
        ref="menuEl"
        class="ctx-menu fixed z-50 select-none"
        :class="[
          placement === 'top' ? 'origin-bottom-left' : 'origin-top-left',
          currentVariant === 'compact' ? 'ctx-menu--compact' : '',
        ]"
        :style="style"
        @contextmenu.prevent
      >
        <template v-for="item in visibleItems" :key="item.id">
          <li v-if="item.separator" class="ctx-separator" />
          <li
            v-else
            class="ctx-item"
            :class="[
              item.danger ? 'ctx-danger' : '',
              item.colorClass,
              item.disabled ? 'ctx-disabled' : '',
            ]"
            @click="store.runItem(item)"
          >
            <span v-if="item.icon" class="ctx-icon">
              <!-- Поддержка и эмодзи, и Lucide-иконок -->
              <component
                :is="item.icon"
                v-if="typeof item.icon !== 'string'"
                class="w-4 h-4"
              />
              <span v-else>{{ item.icon }}</span>
            </span>

            <span class="flex-1 truncate">{{ item.label }}</span>

            <!-- В компактном режиме шорткаты можно скрывать для экономии места -->
            <span
              v-if="item.shortcut && currentVariant !== 'compact'"
              class="ctx-shortcut"
            >
              {{ item.shortcut }}
            </span>
          </li>
        </template>
      </ul>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Базовые стили */
.ctx-menu {
  width: var(--menu-width, 220px);
  margin: 0;
  padding: var(--menu-padding, 6px);
  list-style: none;
  background: var(--menu-bg);
  color: var(--menu-text);
  font-size: 0.875rem;
  border: 1px solid var(--menu-border);
  border-radius: var(--menu-radius);
  box-shadow: var(--menu-shadow);
  backdrop-filter: blur(var(--menu-blur));
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); /* Плавная анимация смены размера */
}

/* КОМПАКТНЫЙ РЕЖИМ */
.ctx-menu--compact {
  width: auto;
  min-width: 160px;
  max-width: 200px;
  padding: 4px;
}

.ctx-menu--compact .ctx-item {
  padding: 0.4rem 0.6rem;
  gap: 0.5rem;
  font-size: 0.8rem;
}

/* Обычные стили пунктов */
.ctx-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--menu-item-radius);
  cursor: pointer;
  transition: background-color 80ms ease;
}

.ctx-item:hover:not(.ctx-disabled) {
  background: var(--menu-hover);
}

.ctx-icon {
  width: 1.25rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ctx-shortcut {
  font-size: 0.75rem;
  color: var(--menu-text-muted);
  opacity: 0.7;
}

.ctx-danger {
  color: var(--menu-danger);
}
.ctx-disabled {
  opacity: 0.4;
  pointer-events: none;
}

.ctx-separator {
  height: 1px;
  margin: 0.25rem 0.5rem;
  background: var(--menu-border);
}

/* Анимации */
.ctx-enter-active,
.ctx-leave-active {
  transition:
    opacity var(--menu-anim) ease,
    transform var(--menu-anim) ease;
}
.ctx-enter-from,
.ctx-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
