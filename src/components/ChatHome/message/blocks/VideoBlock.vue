<!-- src/components/ChatHome/message/blocks/VideoBlock.vue -->
<script setup lang="ts">
import type { VideoContent } from "@/types/message";
import { useModalStore } from "@/stores/appModal";
import { useMessagesStore } from "@/stores/messages";
import { useNodeStore } from "@/stores/node";
import { Play, Maximize2 } from "lucide-vue-next";

const props = defineProps<{
  block: VideoContent;
}>();

const modal = useModalStore();
const messagesStore = useMessagesStore();
const nodeStore = useNodeStore();

const openViewer = () => {
  const activeChatId = nodeStore.activeChatId;
  const currentMessages = messagesStore.messages.filter(
    (m) => !activeChatId || m.chatId === activeChatId,
  );

  const galleryItems: Array<{
    url: string;
    type: "image" | "video";
    title?: string;
  }> = [];

  for (const m of currentMessages) {
    if (!Array.isArray(m.content)) continue;
    for (const b of m.content) {
      if ((b as any).type === "image" && (b as any).url) {
        galleryItems.push({
          url: (b as any).url,
          type: "image",
          title: (b as any).alt || "Изображение",
        });
      } else if ((b as any).type === "video" && (b as any).url) {
        galleryItems.push({
          url: (b as any).url,
          type: "video",
          title: "Видео",
        });
      }
    }
  }

  let targetIndex = galleryItems.findIndex((it) => it.url === props.block.url);
  if (targetIndex === -1) {
    galleryItems.push({
      url: props.block.url,
      type: "video",
      title: "Видео",
    });
    targetIndex = galleryItems.length - 1;
  }

  modal.open("image-modal", {
    items: galleryItems,
    currentIndex: targetIndex,
  });
};
</script>

<template>
  <div
    class="group/video relative overflow-hidden max-w-[280px] sm:max-w-[360px] rounded-xl cursor-pointer bg-black/40 border border-white/10"
    @click="openViewer"
  >
    <video
      :src="block.url"
      class="w-full h-auto max-h-[300px] object-cover block"
      preload="metadata"
    />

    <!-- Оверлей с кнопкой воспроизведения -->
    <div
      class="absolute inset-0 bg-black/30 flex items-center justify-center transition-colors group-hover/video:bg-black/40"
    >
      <div
        class="size-12 rounded-full bg-black/60 border border-white/25 text-white flex items-center justify-center shadow-xl group-hover/video:scale-110 transition-transform backdrop-blur-sm"
      >
        <Play class="w-5 h-5 fill-white ml-0.5" />
      </div>
    </div>

    <!-- Кнопка разворота в угол -->
    <div
      class="absolute top-2 right-2 size-7 rounded-lg bg-black/60 text-white/80 opacity-0 group-hover/video:opacity-100 flex items-center justify-center transition-opacity"
      title="Развернуть видео"
    >
      <Maximize2 class="w-3.5 h-3.5" />
    </div>
  </div>
</template>
