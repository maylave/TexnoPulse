import { defineStore } from "pinia";
import { ref } from "vue";

export type Side = "left" | "right";
const WIDTH_MAP: Record<number, string> = {
  1: "max-w-xl",
  2: "max-w-2xl",
  3: "max-w-3xl",
  4: "max-w-4xl",
  5: "max-w-5xl",
  6: "max-w-6xl",
  7: "max-w-7xl",
  8: "max-w-[90rem]",
};
export const useChatSettingsStore = defineStore("chatSettings", () => {
  const splitBySender = ref(true);
  const colorBySender = ref(false);
  const singleSide = ref<Side>("left");
  const widthSizePanel = ref<number>(5);
  
  const getMaxWidthClass = (offset = 0): string => {
    const rawSize = Number(widthSizePanel.value) + offset;
    const clampedSize = Math.max(1, Math.min(8, rawSize));
    return WIDTH_MAP[clampedSize] ?? "max-w-4xl";
  };
  const getSide = (isOwn: boolean): Side => {
    if (!splitBySender.value) return singleSide.value;
    return isOwn ? "right" : "left";
  };

  return {
    splitBySender,
    colorBySender,
    singleSide,
    widthSizePanel,
    getSide,
    getMaxWidthClass,
  };
});
