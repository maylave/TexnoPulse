<!-- src/components/ChatHome/chat/ChatHeader.vue -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { BellRing, Settings as SettingsIcon } from "lucide-vue-next";
import { useAppStore } from "@/stores/appLayout";
import { useNodeStore } from "@/stores/node";
import { useModalStore } from "@/stores/appModal";
import { api } from "@/api/client";
import UiNodeAvatar from "@/components/ui/UiNodeAvatar.vue";

interface Props {

  title?: string;
}

const props = defineProps<Props>();

const appStore = useAppStore();
const nodeStore = useNodeStore();
const modalStore = useModalStore();


const activeNode = computed(() =>
  nodeStore.nodes.find(
    (n) => n.id === nodeStore.activeChatId && n.type === "chat",
  ),
);
const chatMeta = computed(() => activeNode.value?.metaDate.chat);
const displayTitle = computed(
  () => props.title ?? activeNode.value?.label ?? "Чат",
);


const layout = {
  toggleRightInfo: () => {
    console.log("Toggle right info");
  },
};

const searchQuery = ref("");
const isSearchFocused = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);

const isTestingNotification = ref(false);

const handleTestNotification = async () => {
  if (isTestingNotification.value) return;
  isTestingNotification.value = true;
  try {
    await api.request("notification:test");
  } catch (e) {
    console.error("Ошибка проверки уведомления:", e);
  } finally {
    setTimeout(() => {
      isTestingNotification.value = false;
    }, 1500);
  }
};

const isExpanded = (): boolean =>
  isSearchFocused.value || searchQuery.value.length > 0;

const activateSearch = (): void => {
  searchInput.value?.focus();
};

const handleSearch = (): void => {
  console.log("Search query:", searchQuery.value);
};

const clearSearch = (): void => {
  searchQuery.value = "";
  searchInput.value?.focus();
};
</script>

<template>
  <div class="py-5">
    <div class="flex items-center gap-3">
      <div class="flex items-center"></div>

      <h3
        @click="appStore.toggleRightSidebar"
        class="liquid-glass hdr-title relative font-medium text-headline-md tracking-tight py-3 rounded-xl w-full overflow-hidden cursor-pointer flex items-center"
      >
    
        <UiNodeAvatar
          class="absolute top-1 left-1 border border-white/10 z-25"
          :label="displayTitle"
          :icon="chatMeta?.icon"
          :color="chatMeta?.iconColor"
          :image-url="chatMeta?.avatarUrl"
          :size="40"
        />
        <div class="relative pl-14">{{ displayTitle }}</div>
      </h3>

      <div class="relative flex-1 flex items-center justify-end pr-10 gap-3">
       
        <div
          @click="activateSearch"
          class="liquid-glass hdr-search flex items-center gap-2 h-12 px-2.5 rounded-full border backdrop-blur-xl overflow-hidden cursor-text"
          :class="[
            isExpanded() ? 'hdr-search-open pr-3' : '',
            isSearchFocused ? 'hdr-search-focus' : '',
          ]"
        >
          <svg
            class="hdr-icon w-5 h-5 flex-shrink-0 transition-colors duration-200"
            :class="{ 'hdr-icon-active': isSearchFocused }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          <input
            ref="searchInput"
            v-model="searchQuery"
            @input="handleSearch"
            @focus="isSearchFocused = true"
            @blur="isSearchFocused = false"
            type="text"
            placeholder="Поиск по чату..."
            class="hdr-input min-w-0 bg-transparent focus:outline-none text-sm transition-opacity duration-200"
            :class="
              isExpanded()
                ? 'flex-1 opacity-100 delay-100'
                : 'w-0 opacity-0 pointer-events-none'
            "
          />

          <button
            v-if="searchQuery"
            @click.stop="clearSearch"
            class="hdr-icon hdr-clear flex-shrink-0 p-1 rounded-full transition-colors"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.hdr-title {
  color: var(--header-text);
  background: var(--header-glass-bg);
  border: 1px solid var(--header-border);
  transition:
    background-color var(--header-anim) ease-out,
    border-color var(--header-anim) ease-out;
}
.hdr-title:hover {
  background: color-mix(in srgb, var(--header-glass-bg), var(--header-hover));
}

/* Поиск */
.hdr-search {
  width: var(--header-search-width);
  background: var(--header-glass-bg);
  border-color: var(--header-border);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition:
    width var(--header-anim) ease-out,
    background-color var(--header-anim) ease-out,
    border-color var(--header-anim) ease-out,
    box-shadow var(--header-anim) ease-out;
}

.hdr-search-open {
  width: var(--header-search-width-open);
}

.hdr-search-focus {
  background: var(--header-glass-bg-focus);
  border-color: var(--header-border-focus);
  box-shadow: 0 10px 15px var(--header-glow-focus);
}

.hdr-icon {
  color: var(--header-icon);
}

.hdr-icon-active {
  color: var(--header-icon-active);
}

.hdr-input {
  color: var(--header-text);
}

.hdr-input::placeholder {
  color: var(--header-placeholder);
}

.hdr-clear {
  color: var(--header-icon);
}

.hdr-clear:hover {
  color: var(--header-icon-hover);
  background: var(--header-hover);
}
</style>
