<!-- src/components/ChatHome/message/blocks/ImageBlock.vue -->
<script setup lang="ts">
import type { Message } from "@/types/message";
import { useModalStore } from "@/stores/appModal";
import { useMessagesStore } from "@/stores/messages";
import { useNodeStore } from "@/stores/node";
import { Maximize2 } from "lucide-vue-next";

type ImageBlockType = Extract<Message["content"][number], { type: "image" }>;

const props = defineProps<{
  block: ImageBlockType;
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
    alt?: string;
  }> = [];

  for (const m of currentMessages) {
    if (!Array.isArray(m.content)) continue;
    for (const b of m.content) {
      if ((b as any).type === "image" && (b as any).url) {
        galleryItems.push({
          url: (b as any).url,
          type: "image",
          title: (b as any).alt || "Изображение",
          alt: (b as any).alt,
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
      type: "image",
      title: props.block.alt || "Изображение",
      alt: props.block.alt,
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
    class="group/img relative overflow-hidden max-w-[280px] sm:max-w-[340px] rounded-xl cursor-pointer"
    @click="openViewer"
  >
    <img
      :src="block.url"
      :alt="block.alt || 'Изображение'"
      class="w-full h-auto object-cover max-h-[340px] block transition-transform duration-200 group-hover/img:scale-[1.02]"
      loading="lazy"
    />

    <!-- Наложение иконки зума при наведении -->
    <div
      class="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]"
    >
      <div
        class="size-9 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center shadow-lg"
      >
        <Maximize2 class="w-4 h-4" />
      </div>
    </div>
  </div>
</template>
