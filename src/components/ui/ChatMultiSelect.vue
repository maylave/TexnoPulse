<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted } from "vue";

const props = defineProps<{
  modelValue: string[] | string; // Надежная защита типов
  options: { id: string; title: string }[];
  placeholder?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLElement | null>(null);

// 🌟 ЗАЩИТА: Гарантируем, что всегда работаем с массивом
const safeModelValue = computed<string[]>(() => {
  if (!props.modelValue) return [];
  if (Array.isArray(props.modelValue)) return props.modelValue;
  if (typeof props.modelValue === "string")
    return props.modelValue.split(",").filter(Boolean);
  return [];
});

// Вычисляем выбранные чаты
const selectedOptions = computed(() => {
  return safeModelValue.value
    .map((id) => props.options.find((opt) => opt.id === id))
    .filter(Boolean) as { id: string; title: string }[];
});

// Добавление / удаление через чекбокс или клик по строке
const toggleOption = (id: string) => {
  const current = [...safeModelValue.value];
  const index = current.indexOf(id);

  if (index === -1) {
    current.push(id);
  } else {
    current.splice(index, 1);
  }

  emit("update:modelValue", current);
};

// Удаление по клику на крестик
const removeOption = (id: string) => {
  const current = safeModelValue.value.filter((val) => val !== id);
  emit("update:modelValue", current);
};

// Закрытие меню при клике вне компонента (Click Outside)
const handleClickOutside = (event: MouseEvent) => {
  if (
    isOpen.value &&
    inputRef.value &&
    !inputRef.value.contains(event.target as Node) &&
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target as Node)
  ) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", handleClickOutside);
});
</script>

<template>
  <div class="custom-multiselect">
    <!-- Поле (Input Trigger в стиле ChatInput) -->
    <div
      ref="inputRef"
      @click="isOpen = !isOpen"
      class="custom-input"
      :class="{ 'is-open': isOpen }"
    >
      <!-- 1. Стеклянная подложка (как в основном инпуте) -->
      <div class="custom-input-glass"></div>

      <!-- 2. Вращающаяся анимированная рамка при открытии -->
      <div class="custom-glow-wrap" :class="{ 'is-active': isOpen }">
        <div class="custom-glow-spin"></div>
      </div>

      <!-- 3. Контент поля -->
      <div class="custom-input-content">
        <!-- Плейсхолдер -->
        <span v-if="selectedOptions.length === 0" class="custom-placeholder">
          {{ placeholder || "Выберите чаты..." }}
        </span>

        <!-- Выбранные чаты (Чипсы) -->
        <div
          v-for="item in selectedOptions"
          :key="item.id"
          class="custom-chip"
          @click.stop
        >
          <span class="custom-chip-text">{{ item.title }}</span>
          <button
            type="button"
            @click.stop="removeOption(item.id)"
            class="custom-chip-btn"
            title="Удалить"
          >
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Иконка стрелочки -->
        <div class="custom-arrow" :class="{ 'is-open': isOpen }">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>

    <!-- Выпадающий список -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="custom-dropdown custom-scrollbar"
      >
        <div v-if="options.length === 0" class="custom-empty">
          Нет доступных чатов
        </div>

        <label
          v-for="option in options"
          :key="option.id"
          class="custom-option"
          :class="{ 'is-selected': safeModelValue.includes(option.id) }"
        >
          <input
            type="checkbox"
            :value="option.id"
            :checked="safeModelValue.includes(option.id)"
            @change="toggleOption(option.id)"
            class="custom-checkbox"
          />
          <span class="custom-option-text">
            {{ option.title }}
          </span>
        </label>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ============================================
   КАСТОМИЗИРУЕМЫЕ ТОКЕНЫ КОМПОНЕНТА
   (Наследуют ваши глобальные переменные из темы)
   ============================================ */
.custom-multiselect {
  /* Поле ввода (берет стили из --input-*) */
  --ms-bg: var(--input-bg);
  --ms-border: var(--input-border);
  --ms-radius: var(--radius-lg, 1rem);
  --ms-blur: var(--input-blur);
  --ms-shadow: var(--input-shadow);
  --ms-text: var(--input-text);
  --ms-placeholder: var(--input-placeholder);

  /* Свечение рамки (берет стили из --input-glow-*) */
  --ms-glow-1: var(--input-glow);
  --ms-glow-2: var(--input-glow-2);
  --ms-glow-width: var(--input-glow-width);
  --ms-glow-speed: var(--input-glow-speed);
  --ms-glow-opacity: var(--input-glow-opacity);

  /* Чипсы выбранных элементов (берет стили из --attach-* и --color-accent) */
  --ms-chip-bg: color-mix(in srgb, var(--color-accent) 16%, var(--attach-bg));
  --ms-chip-bg-hover: color-mix(
    in srgb,
    var(--color-accent) 26%,
    var(--attach-bg)
  );
  --ms-chip-border: color-mix(
    in srgb,
    var(--color-accent) 35%,
    var(--attach-border)
  );
  --ms-chip-text: var(--attach-text);
  --ms-chip-radius: var(--radius-full);

  /* Выпадающее меню (берет стили из --menu-*) */
  --ms-menu-bg: var(--menu-bg);
  --ms-menu-border: var(--menu-border);
  --ms-menu-radius: var(--menu-radius);
  --ms-menu-blur: var(--menu-blur);
  --ms-menu-shadow: var(--menu-shadow);

  position: relative;
  width: 100%;
}

/* --- Главное поле (Контейнер) --- */
.custom-input {
  position: relative;
  z-index: 20;
  min-height: 40px;
  width: 100%;
  border-radius: var(--ms-radius);
  cursor: pointer;
  user-select: none;
}

/* --- Стекло (точь-в-точь как .ci-glass в инпуте чата) --- */
.custom-input-glass {
  position: absolute;
  inset: 0;
  border-radius: var(--ms-radius);
  background-color: var(--ms-bg);
  border: 1px solid var(--ms-border);
  backdrop-filter: blur(var(--ms-blur));
  -webkit-backdrop-filter: blur(var(--ms-blur));
  box-shadow:
    var(--ms-shadow),
    inset 0 2px 4px rgba(255, 255, 255, 0.05),
    inset 0 -1px 2px rgba(0, 0, 0, 0.2);
  transition: all var(--attach-anim) ease;
}

.custom-input:hover .custom-input-glass {
  background-color: color-mix(in srgb, var(--ms-bg) 85%, white 6%);
  border-color: var(--header-border-focus);
}

.custom-input.is-open .custom-input-glass {
  border-color: var(--header-border-focus);
  box-shadow:
    0 0 16px var(--header-glow-focus),
    inset 0 2px 4px rgba(255, 255, 255, 0.06);
}

/* --- Вращающаяся анимированная рамка (как .ci-glow-wrap) --- */
.custom-glow-wrap {
  position: absolute;
  inset: 0;
  border-radius: var(--ms-radius);
  padding: var(--ms-glow-width);
  pointer-events: none;
  overflow: hidden;
  opacity: 0;
  transition: opacity calc(400ms * var(--anim-scale)) ease;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
}

.custom-glow-wrap.is-active {
  opacity: 1;
}

.custom-glow-spin {
  position: absolute;
  inset: -150%;
  opacity: var(--ms-glow-opacity);
  background: conic-gradient(
    from 0deg,
    transparent 0%,
    var(--ms-glow-1) 20%,
    transparent 40%,
    transparent 50%,
    var(--ms-glow-2) 70%,
    transparent 90%,
    transparent 100%
  );
  animation: ms-spin var(--ms-glow-speed) linear infinite;
}

@keyframes ms-spin {
  to {
    transform: rotate(360deg);
  }
}

/* --- Внутренний контент поля --- */
.custom-input-content {
  position: relative;
  z-index: 10;
  min-height: 40px;
  padding: 6px 10px;
  display: flex;
  flex-wrap: wrap;
  gap: var(--attach-gap);
  align-items: center;
}

.custom-placeholder {
  font-size: var(--font-size-label-md);
  color: var(--ms-placeholder);
  padding-left: var(--spacing-xs);
  user-select: none;
}

/* --- Чипсы (Выбранные элементы) --- */
.custom-chip {
  background-color: var(--ms-chip-bg);
  border: 1px solid var(--ms-chip-border);
  color: var(--ms-chip-text);
  padding: 3px 6px 3px 10px;
  border-radius: var(--ms-chip-radius);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all var(--attach-anim) ease;
  cursor: default;
}

.custom-chip:hover {
  background-color: var(--ms-chip-bg-hover);
}

.custom-chip-text {
  font-size: 11px;
  font-weight: 500;
  max-width: 125px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.custom-chip-btn {
  width: 16px;
  height: 16px;
  border-radius: var(--radius-full);
  background-color: var(--attach-icon-bg);
  color: var(--attach-muted);
  transition: all var(--attach-anim) ease;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
}

.custom-chip-btn svg {
  width: 10px;
  height: 10px;
}

.custom-chip-btn:hover {
  background-color: color-mix(
    in srgb,
    var(--attach-remove-hover) 25%,
    transparent
  );
  color: var(--attach-remove-hover);
}

/* --- Иконка стрелочки --- */
.custom-arrow {
  margin-left: auto;
  padding-right: 2px;
  color: var(--header-icon);
  transition:
    transform var(--menu-anim) ease,
    color var(--menu-anim) ease;
  width: 15px;
  height: 15px;
}

.custom-arrow.is-open {
  transform: rotate(180deg);
  color: var(--header-icon-active);
}

/* --- Выпадающее меню --- */
.custom-dropdown {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  z-index: 30;
  max-height: 12rem;
  overflow-y: auto;
  background-color: var(--ms-menu-bg);
  backdrop-filter: blur(var(--ms-menu-blur));
  -webkit-backdrop-filter: blur(var(--ms-menu-blur));
  border: 1px solid var(--ms-menu-border);
  border-radius: var(--ms-menu-radius);
  box-shadow: var(--ms-menu-shadow);
  padding: var(--menu-padding);
}

.custom-empty {
  padding: var(--spacing-md);
  font-size: var(--font-size-label-md);
  color: var(--menu-text-muted);
  text-align: center;
}

.custom-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 7px 10px;
  border-radius: var(--menu-item-radius);
  cursor: pointer;
  transition: background-color var(--menu-anim) ease;
}

.custom-option:hover {
  background-color: var(--menu-hover);
}

.custom-option.is-selected {
  background-color: color-mix(in srgb, var(--color-accent) 12%, transparent);
}

/* --- Чекбокс внутри меню --- */
.custom-checkbox {
  width: 14px;
  height: 14px;
  border-radius: var(--radius-sm);
  accent-color: var(--color-accent);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--glass-border);
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
}

.custom-checkbox:focus-visible {
  box-shadow: 0 0 0 2px var(--header-border-focus);
}

.custom-option-text {
  font-size: var(--font-size-label-md);
  color: var(--menu-text-muted);
  transition: color var(--menu-anim) ease;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.custom-option:hover .custom-option-text,
.custom-option.is-selected .custom-option-text {
  color: var(--menu-text);
}

/* --- Кастомный скроллбар --- */
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: color-mix(
    in srgb,
    var(--color-on-surface) 15%,
    transparent
  );
  border-radius: var(--radius-full);
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: color-mix(
    in srgb,
    var(--color-on-surface) 30%,
    transparent
  );
}

/* --- Анимация выпадания --- */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all var(--menu-anim) cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-5px) scaleY(0.95);
}
</style>
