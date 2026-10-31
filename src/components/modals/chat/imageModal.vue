<!-- src/components/modals/chat/imageModal.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Film,
  Image as ImageIcon,
} from "lucide-vue-next";
import { useModalStore } from "@/stores/appModal";

export interface MediaGalleryItem {
  url: string;
  type?: "image" | "video";
  title?: string;
  alt?: string;
  size?: string;
}

export interface ImageModalPayload {
  url?: string;
  type?: "image" | "video";
  title?: string;
  items?: MediaGalleryItem[];
  currentIndex?: number;
}

const modal = useModalStore();

// Нормализация полезной нагрузки модалки
const payload = computed(() => {
  const p = modal.payload as ImageModalPayload | string | null;
  if (!p) return { items: [] as MediaGalleryItem[], currentIndex: 0 };
  if (typeof p === "string") {
    return {
      items: [{ url: p, type: isVideoUrl(p) ? "video" : "image" }],
      currentIndex: 0,
    };
  }
  if (Array.isArray((p as any).items) && (p as any).items.length > 0) {
    return {
      items: (p as any).items as MediaGalleryItem[],
      currentIndex: (p as any).currentIndex ?? 0,
    };
  }
  if (p.url) {
    return {
      items: [
        {
          url: p.url,
          type: p.type || (isVideoUrl(p.url) ? "video" : "image"),
          title: p.title,
        },
      ],
      currentIndex: 0,
    };
  }
  return { items: [] as MediaGalleryItem[], currentIndex: 0 };
});

function isVideoUrl(url: string): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) || url.startsWith("data:video/");
}

const items = computed<MediaGalleryItem[]>(() => payload.value.items);
const currentIndex = ref(payload.value.currentIndex || 0);

watch(
  () => payload.value.currentIndex,
  (val) => {
    if (val !== undefined && val >= 0 && val < items.value.length) {
      currentIndex.value = val;
    }
  },
  { immediate: true },
);

const currentItem = computed<MediaGalleryItem>(
  () =>
    items.value[currentIndex.value] || {
      url: "",
      type: "image",
      title: "Медиафайл",
    },
);

const isCurrentVideo = computed(() => {
  return currentItem.value.type === "video" || isVideoUrl(currentItem.value.url);
});

// --- Зум и панорамирование ---
const scale = ref(1);
const position = ref({ x: 0, y: 0 });
const rotation = ref(0);
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const hasMovedWhileDragging = ref(false);

const resetTransform = () => {
  scale.value = 1;
  position.value = { x: 0, y: 0 };
  rotation.value = 0;
};

// Сброс масштаба при смене слайда
watch(currentIndex, () => {
  resetTransform();
});

const zoomIn = () => {
  scale.value = Math.min(Number((scale.value + 0.25).toFixed(2)), 4);
};

const zoomOut = () => {
  scale.value = Math.max(Number((scale.value - 0.25).toFixed(2)), 0.5);
  if (scale.value <= 1) {
    position.value = { x: 0, y: 0 };
  }
};

const rotate = () => {
  rotation.value = (rotation.value + 90) % 360;
};

const toggleDoubleZoom = () => {
  if (isCurrentVideo.value) return;
  if (scale.value > 1.2) {
    resetTransform();
  } else {
    scale.value = 2.2;
  }
};

const handleWheel = (e: WheelEvent) => {
  if (isCurrentVideo.value) return;
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.2 : -0.2;
  const newScale = Math.min(Math.max(Number((scale.value + delta).toFixed(2)), 0.5), 4);
  scale.value = newScale;
  if (newScale <= 1) {
    position.value = { x: 0, y: 0 };
  }
};

// Перетаскивание мышью
const handleMouseDown = (e: MouseEvent) => {
  if (e.button !== 0 || scale.value <= 1 || isCurrentVideo.value) return;
  isDragging.value = true;
  hasMovedWhileDragging.value = false;
  dragStart.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y,
  };
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;
  hasMovedWhileDragging.value = true;
  position.value = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y,
  };
};

const handleMouseUp = () => {
  isDragging.value = false;
};

// --- Мобильные Touch жесты (Pinch-to-zoom + Swipe) ---
let initialTouchDist = 0;
let initialTouchScale = 1;
let touchStartX = 0;
let touchStartY = 0;

const handleTouchStart = (e: TouchEvent) => {
  if (e.touches.length === 2) {
    // Pinch to zoom
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    initialTouchDist = Math.hypot(dx, dy);
    initialTouchScale = scale.value;
  } else if (e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    if (scale.value > 1) {
      isDragging.value = true;
      dragStart.value = {
        x: touchStartX - position.value.x,
        y: touchStartY - position.value.y,
      };
    }
  }
};

const handleTouchMove = (e: TouchEvent) => {
  if (e.touches.length === 2) {
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    if (initialTouchDist > 0) {
      const factor = dist / initialTouchDist;
      scale.value = Math.min(Math.max(Number((initialTouchScale * factor).toFixed(2)), 0.5), 4);
    }
  } else if (e.touches.length === 1 && isDragging.value && scale.value > 1) {
    e.preventDefault();
    position.value = {
      x: e.touches[0].clientX - dragStart.value.x,
      y: e.touches[0].clientY - dragStart.value.y,
    };
  }
};

const handleTouchEnd = (e: TouchEvent) => {
  isDragging.value = false;
  if (e.touches.length === 0 && scale.value <= 1.05) {
    scale.value = 1;
    position.value = { x: 0, y: 0 };
    const changed = e.changedTouches[0];
    if (changed) {
      const diffX = changed.clientX - touchStartX;
      const diffY = changed.clientY - touchStartY;
      // Свайп влево/вправо для переключения фото
      if (Math.abs(diffX) > 50 && Math.abs(diffY) < 60) {
        if (diffX > 0) prev();
        else next();
      }
      // Свайп вниз для закрытия
      else if (diffY > 100 && Math.abs(diffX) < 80) {
        closeModal();
      }
    }
  }
};

// --- Навигация по галерее ---
const prev = () => {
  if (items.value.length <= 1) return;
  currentIndex.value =
    currentIndex.value === 0 ? items.value.length - 1 : currentIndex.value - 1;
};

const next = () => {
  if (items.value.length <= 1) return;
  currentIndex.value =
    currentIndex.value === items.value.length - 1 ? 0 : currentIndex.value + 1;
};

const goTo = (idx: number) => {
  if (idx >= 0 && idx < items.value.length) {
    currentIndex.value = idx;
  }
};

// --- Скачивание и открытие ---
const downloadCurrent = () => {
  const url = currentItem.value.url;
  if (!url) return;
  const a = document.createElement("a");
  a.href = url;
  a.download = currentItem.value.title || `media_${Date.now()}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const openInNewTab = () => {
  const url = currentItem.value.url;
  if (url) window.open(url, "_blank");
};

const closeModal = () => {
  modal.close();
};

// Клавиатурные шорткаты
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    closeModal();
  } else if (e.key === "ArrowLeft") {
    prev();
  } else if (e.key === "ArrowRight") {
    next();
  } else if (e.key === "+" || e.key === "=") {
    zoomIn();
  } else if (e.key === "-") {
    zoomOut();
  } else if (e.key === "0") {
    resetTransform();
  } else if (e.key === "r" || e.key === "R") {
    rotate();
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("mouseup", handleMouseUp);
});
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex flex-col bg-(--bg-modal-overlay) backdrop-blur-xl select-none overflow-hidden animate-fadeIn"
    @wheel="handleWheel"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- Верхняя панель управления (Toolbar) -->
    <header
      class="h-14 px-4 sm:px-6 flex items-center justify-between gap-3 bg-black/40 border-b border-white/10 backdrop-blur-md z-30 shrink-0 text-white"
    >
      <!-- Левая часть: счетчик и заголовок -->
      <div class="flex items-center gap-3 min-w-0">
        <div
          v-if="items.length > 1"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-mono font-medium text-white/90 shrink-0"
        >
          <span>{{ currentIndex + 1 }}</span>
          <span class="opacity-40">/</span>
          <span>{{ items.length }}</span>
        </div>

        <div class="flex items-center gap-2 truncate">
          <Film v-if="isCurrentVideo" class="w-4 h-4 text-sky-400 shrink-0" />
          <ImageIcon v-else class="w-4 h-4 text-purple-400 shrink-0" />
          <span class="text-xs sm:text-sm font-medium text-white/90 truncate">
            {{ currentItem.title || currentItem.alt || (isCurrentVideo ? "Видео" : "Изображение") }}
          </span>
        </div>
      </div>

      <!-- Правая часть: кнопки зума, поворота, скачивания и закрытия -->
      <div class="flex items-center gap-1 sm:gap-2 shrink-0">
        <!-- Кнопки зума (только для изображений) -->
        <template v-if="!isCurrentVideo">
          <button
            type="button"
            @click="zoomOut"
            :disabled="scale <= 0.5"
            class="size-8 sm:size-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            title="Уменьшить (-)"
          >
            <ZoomOut class="w-4 h-4" />
          </button>

          <!-- Индикатор масштаба -->
          <button
            type="button"
            @click="resetTransform"
            class="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-mono text-white/80 border border-white/10 transition-colors"
            title="Сбросить масштаб (0)"
          >
            {{ Math.round(scale * 100) }}%
          </button>

          <button
            type="button"
            @click="zoomIn"
            :disabled="scale >= 4"
            class="size-8 sm:size-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            title="Увеличить (+)"
          >
            <ZoomIn class="w-4 h-4" />
          </button>

          <button
            type="button"
            @click="rotate"
            class="size-8 sm:size-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all hidden sm:flex"
            title="Повернуть на 90° (R)"
          >
            <RotateCw class="w-4 h-4" />
          </button>

          <div class="w-px h-5 bg-white/10 mx-0.5 hidden sm:block"></div>
        </template>

        <!-- Скачать -->
        <button
          type="button"
          @click="downloadCurrent"
          class="size-8 sm:size-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
          title="Скачать файл"
        >
          <Download class="w-4 h-4" />
        </button>

        <!-- Открыть в новой вкладке -->
        <button
          type="button"
          @click="openInNewTab"
          class="size-8 sm:size-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all hidden sm:flex"
          title="Открыть оригинал в новой вкладке"
        >
          <ExternalLink class="w-4 h-4" />
        </button>

        <!-- Закрыть -->
        <button
          type="button"
          @click="closeModal"
          class="size-8 sm:size-9 ml-1 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all shadow-sm"
          title="Закрыть (Esc)"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Основная область просмотра (Viewer Area) -->
    <main
      class="relative flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-6"
      @mousedown="handleMouseDown"
      @dblclick="toggleDoubleZoom"
      :class="{
        'cursor-grab': scale > 1 && !isDragging && !isCurrentVideo,
        'cursor-grabbing': isDragging,
      }"
    >
      <!-- Контейнер медиа с трансформацией -->
      <div
        class="transition-transform duration-75 ease-out max-w-full max-h-full flex items-center justify-center"
        :style="{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale}) rotate(${rotation}deg)`,
        }"
      >
        <!-- Видеоплеер -->
        <video
          v-if="isCurrentVideo"
          :src="currentItem.url"
          controls
          autoplay
          playsinline
          class="max-w-[92vw] max-h-[78vh] rounded-2xl shadow-2xl bg-black border border-white/10"
        />

        <!-- Просмотр изображения -->
        <img
          v-else
          :src="currentItem.url"
          :alt="currentItem.title || currentItem.alt || 'Изображение'"
          class="max-w-[90vw] max-h-[76vh] object-contain rounded-xl shadow-2xl pointer-events-none transition-shadow"
          loading="eager"
        />
      </div>

      <!-- Боковые стрелки переключения галереи (Next / Prev) -->
      <template v-if="items.length > 1">
        <button
          type="button"
          @click.stop="prev"
          class="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 size-10 sm:size-12 rounded-2xl bg-black/50 hover:bg-black/75 border border-white/15 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-xl z-20"
          title="Предыдущее (←)"
        >
          <ChevronLeft class="w-6 h-6" />
        </button>

        <button
          type="button"
          @click.stop="next"
          class="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 size-10 sm:size-12 rounded-2xl bg-black/50 hover:bg-black/75 border border-white/15 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-xl z-20"
          title="Следующее (→)"
        >
          <ChevronRight class="w-6 h-6" />
        </button>
      </template>
    </main>

    <!-- Нижняя полоса миниатюр (Thumbnail Strip) -->
    <footer
      v-if="items.length > 1"
      class="h-20 px-4 py-2 flex items-center justify-center gap-2 bg-black/40 border-t border-white/10 backdrop-blur-md z-30 shrink-0 overflow-x-auto custom-scrollbar"
    >
      <button
        v-for="(it, idx) in items"
        :key="it.url + idx"
        type="button"
        @click="goTo(idx)"
        class="relative size-14 rounded-xl overflow-hidden border transition-all duration-150 shrink-0 hover:opacity-100"
        :class="[
          currentIndex === idx
            ? 'ring-2 ring-sky-400 border-sky-400 scale-105 opacity-100 shadow-lg'
            : 'border-white/15 opacity-60 hover:border-white/30',
        ]"
      >
        <video
          v-if="it.type === 'video' || isVideoUrl(it.url)"
          :src="it.url"
          class="w-full h-full object-cover pointer-events-none"
        />
        <img
          v-else
          :src="it.url"
          :alt="it.title || 'Миниатюра'"
          class="w-full h-full object-cover pointer-events-none"
          loading="lazy"
        />

        <div
          v-if="it.type === 'video' || isVideoUrl(it.url)"
          class="absolute inset-0 bg-black/30 flex items-center justify-center"
        >
          <Film class="w-3.5 h-3.5 text-white drop-shadow" />
        </div>
      </button>
    </footer>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.animate-fadeIn {
  animation: fadeIn 0.18s ease-out forwards;
}

.custom-scrollbar::-webkit-scrollbar {
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}
</style>
