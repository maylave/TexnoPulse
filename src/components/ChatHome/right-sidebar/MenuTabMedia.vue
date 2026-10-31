<!-- src/components/ChatHome/right-sidebar/tabs/MenuTabMedia.vue -->
<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useMessagesStore } from "@/stores/messages";
import MediaFilterTabs from "./FilterMedia.vue";

const props = defineProps<{
  chatId: string;
}>();

const messagesStore = useMessagesStore();
const activeFilter = ref("Все");

// Извлекаем медиа-блоки напрямую из загруженных сообщений текущего чата
const mediaItems = computed(() => {
  const chatMessages = messagesStore.messages.filter(
    (m) => m.chatId === props.chatId,
  );

  const items: Array<{
    type: "photo" | "video" | "file" | "code";
    src?: string;
    label: string;
    size?: string;
    duration?: string;
    code?: string;
  }> = [];

  for (const msg of chatMessages) {
    for (const block of msg.content) {
      if (block.type === "image") {
        items.push({
          type: "photo",
          src: block.url,
          label: block.alt || "Изображение",
        });
      } else if (block.type === "video") {
        items.push({
          type: "video",
          src: block.url,
          label: "Видеозапись",
          duration: "Видео",
        });
      } else if (block.type === "code") {
        items.push({
          type: "code",
          label: block.fileName || `snippet.${block.language || "txt"}`,
          size: `${block.code.length} симв.`,
          code: block.code,
        });
      } else if (block.type === "file") {
        items.push({
          type: "file",
          src: block.url,
          label: block.name || "Файл",
          size: block.size,
        });
      }
    }
  }

  return items.reverse();
});

// --- Пагинация и фильтры ---
const PAGE_SIZE = 12;
const currentPage = ref(0);

type AnimDirection = "vertical" | "slide-left" | "slide-right";
const animName = ref<AnimDirection>("vertical");

const isIndicatorHovered = ref(false);
const showArrowsTemp = ref(false);
let arrowsTimeout: ReturnType<typeof setTimeout> | null = null;

const filteredMedia = computed(() => {
  if (activeFilter.value === "Все") return mediaItems.value;
  const map: Record<string, string> = {
    Фото: "photo",
    Видео: "video",
    Файлы: "file",
    Код: "code",
  };
  const targetType = map[activeFilter.value];
  if (!targetType) return [];
  return mediaItems.value.filter((item) => item.type === targetType);
});

const pagedMedia = computed(() => {
  const start = currentPage.value * PAGE_SIZE;
  return filteredMedia.value.slice(start, start + PAGE_SIZE);
});

watch(
  () => props.chatId,
  () => {
    currentPage.value = 0;
  },
);

const handleItemClick = (item: any) => {
  if (item.src) {
    window.open(item.src, "_blank");
  }
};

// --- Логика страниц ---
const totalPages = computed(() =>
  Math.ceil(filteredMedia.value.length / PAGE_SIZE),
);
const hasNextPage = computed(() => currentPage.value < totalPages.value - 1);
const hasPrevPage = computed(() => currentPage.value > 0);
const arrowsVisible = computed(
  () => isIndicatorHovered.value || showArrowsTemp.value,
);

const flashArrows = () => {
  showArrowsTemp.value = true;
  if (arrowsTimeout) clearTimeout(arrowsTimeout);
  arrowsTimeout = setTimeout(() => {
    showArrowsTemp.value = false;
  }, 1200);
};

const nextPage = () => {
  if (!hasNextPage.value) return;
  animName.value = "slide-left";
  currentPage.value++;
  flashArrows();
};

const prevPage = () => {
  if (!hasPrevPage.value) return;
  animName.value = "slide-right";
  currentPage.value--;
  flashArrows();
};

const goToPage = (page: number) => {
  if (page === currentPage.value) return;
  animName.value = page > currentPage.value ? "slide-left" : "slide-right";
  currentPage.value = page;
};

const onFilterChange = (val: string) => {
  animName.value = "vertical";
  activeFilter.value = val;
  currentPage.value = 0;
};

const onWheel = (e: WheelEvent) => {
  if (e.deltaY > 0) nextPage();
  else if (e.deltaY < 0) prevPage();
};
</script>

<template>
  <div>
    <MediaFilterTabs :tab="activeFilter" @update:tab="onFilterChange" />

    <div class="relative min-h-[200px]" @wheel.prevent="onWheel">
      <!-- Пустой список -->
      <div
        v-if="filteredMedia.length === 0"
        class="absolute inset-0 flex items-center justify-center text-xs text-white/40"
      >
        Нет вложений в этом чате
      </div>

      <!-- Сетка медиафайлов -->
      <Transition v-else :name="animName" mode="out-in">
        <div
          :key="`${activeFilter}-${currentPage}`"
          class="grid grid-cols-3 gap-1.5 pr-5"
        >
          <div
            v-for="(item, index) in pagedMedia"
            :key="index"
            class="aspect-square rounded-xl overflow-hidden relative group cursor-pointer bg-white/[0.03] border border-white/[0.06] hover:border-sky-400/50 transition-colors"
            @click="handleItemClick(item)"
          >
            <!-- Фото -->
            <img
              v-if="item.type === 'photo'"
              :src="item.src"
              :alt="item.label"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />

            <!-- Видео -->
            <div
              v-else-if="item.type === 'video'"
              class="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/[0.04] to-white/[0.01]"
            >
              <div
                class="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/25 transition-colors duration-200"
              >
                <svg
                  class="w-4 h-4 text-white/80 ml-0.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span
                class="absolute bottom-1.5 right-1.5 text-[8px] text-white/60 bg-black/50 px-1 py-0.5 rounded-md backdrop-blur-sm"
              >
                {{ item.duration || "Медиа" }}
              </span>
            </div>

            <!-- Код -->
            <div
              v-else-if="item.type === 'code'"
              class="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-slate-800/50 to-slate-900/50"
            >
              <svg
                class="w-7 h-7 text-sky-400/50 group-hover:text-sky-400/90 transition-colors duration-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                />
              </svg>
              <span
                v-if="item.size"
                class="text-[8px] text-white/30 bg-black/20 px-1.5 py-0.5 rounded-full"
              >
                {{ item.size }}
              </span>
            </div>

            <!-- Документы и Файлы -->
            <div
              v-else
              class="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-white/[0.03] to-white/[0.01]"
            >
              <svg
                class="w-7 h-7 text-white/20 group-hover:text-white/35 transition-colors duration-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span
                v-if="item.size"
                class="text-[8px] text-white/30 bg-black/20 px-1.5 py-0.5 rounded-full"
              >
                {{ item.size }}
              </span>
            </div>

            <!-- Затемнение при наведении с названием файла -->
            <div
              class="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-200 flex flex-col justify-end p-1.5 opacity-0 group-hover:opacity-100"
            >
              <span
                class="text-[9px] text-white truncate font-medium drop-shadow-md leading-tight"
              >
                {{ item.label }}
              </span>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Боковой индикатор страниц -->
      <div
        v-if="totalPages > 1"
        class="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5"
        @mouseenter="isIndicatorHovered = true"
        @mouseleave="isIndicatorHovered = false"
      >
        <button
          :disabled="!hasPrevPage"
          class="p-0.5 rounded-md transition-all duration-300"
          :class="[
            arrowsVisible && hasPrevPage
              ? 'opacity-100 translate-y-0 text-white/40 hover:text-white hover:bg-white/[0.08]'
              : 'opacity-0 -translate-y-1 pointer-events-none text-white/10',
          ]"
          @click="prevPage"
        >
          <svg
            class="w-2.5 h-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="3"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>

        <button
          v-for="page in totalPages"
          :key="page"
          class="rounded-full transition-all duration-300"
          :class="
            page - 1 === currentPage
              ? 'w-1 h-4 bg-sky-400/70'
              : 'w-1 h-1.5 bg-white/15 hover:bg-white/30'
          "
          @click="goToPage(page - 1)"
        />

        <button
          :disabled="!hasNextPage"
          class="p-0.5 rounded-md transition-all duration-300"
          :class="[
            arrowsVisible && hasNextPage
              ? 'opacity-100 translate-y-0 text-white/40 hover:text-white hover:bg-white/[0.08]'
              : 'opacity-0 translate-y-1 pointer-events-none text-white/10',
          ]"
          @click="nextPage"
        >
          <svg
            class="w-2.5 h-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="3"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
