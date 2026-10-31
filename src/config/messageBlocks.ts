// src/config/messageBlocks.ts
import TextBlock from "@/components/ChatHome/message/blocks/TextBlock.vue";
import CodeBlock from "@/components/ChatHome/message/blocks/CodeBlock.vue";
import ImageBlock from "@/components/ChatHome/message/blocks/ImageBlock.vue";
import FileBlock from "@/components/ChatHome/message/blocks/FileBlock.vue";
import ColorBlock from "@/components/ChatHome/message/blocks/ColorBlock.vue";
import ChecklistBlock from "@/components/ChatHome/message/blocks/ChecklistBlock.vue";
import TableBlock from "@/components/ChatHome/message/blocks/TableBlock.vue";
import DividerBlock from "@/components/ChatHome/message/blocks/DividerBlock.vue";
import AudioBlock from "@/components/ChatHome/message/blocks/AudioBlock.vue";
import VideoBlock from "@/components/ChatHome/message/blocks/VideoBlock.vue";
import StickerBlock from "@/components/ChatHome/message/blocks/StickerBlock.vue";
import PollBlock from "@/components/ChatHome/message/blocks/PollBlock.vue";
import CanvasBlock from "@/components/ChatHome/message/blocks/CanvasBlock.vue";

import type { Component } from "vue";
import type { Message } from "@/types/message";

type BlockType = Message["content"][number]["type"];

export interface BlockStyleConfig {
  component: Component | null;
  marginBottom?: string;
  fullWidth?: boolean;
  containerClass?: string;
}

export const blockConfig: Record<BlockType, BlockStyleConfig> = {
  text: {
    component: TextBlock,
    marginBottom: "px-3.5 py-2.5",
  },
  code: {
    component: CodeBlock,
    marginBottom: "",
    containerClass: "w-full",
  },
  image: {
    component: ImageBlock,
    marginBottom: "",
    fullWidth: true,
  },
  file: {
    component: FileBlock,
    marginBottom: "",
  },
  color: {
    component: ColorBlock,
    marginBottom: "",
  },
  checklist: {
    component: ChecklistBlock,
    marginBottom: "",
  },
  table: {
    component: TableBlock,
    marginBottom: "",
    containerClass: "w-full",
  },
  divider: {
    component: DividerBlock,
    marginBottom: "",
    containerClass: "w-full",
  },
  audio: {
    component: AudioBlock,
    marginBottom: "",
  },
  video: {
    component: VideoBlock,
    marginBottom: "",
    fullWidth: true,
  },
  sticker: {
    component: StickerBlock,
    marginBottom: "",
  },
  poll: {
    component: PollBlock,
    marginBottom: "",
  },
  canvas: {
    component: CanvasBlock,
    marginBottom: "",
    containerClass: "w-full",
  },
};
