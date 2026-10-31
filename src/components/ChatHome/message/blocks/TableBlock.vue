<!-- src/components/ChatHome/message/blocks/TableBlock.vue -->
<script setup lang="ts">
import type { TableContent } from "@/types/message";

defineProps<{
  block: TableContent;
}>();
</script>

<template>
  <div class="px-3 py-2 overflow-x-auto">
    <table class="w-full border-collapse text-xs">
      <tbody>
        <tr
          v-for="(row, rIdx) in block.rows"
          :key="rIdx"
          :class="
            rIdx === 0
              ? 'bg-white/10 font-semibold'
              : 'border-t border-white/10'
          "
        >
          <td
            v-for="(cell, cIdx) in row"
            :key="cIdx"
            class="px-2.5 py-1.5 border border-white/10 whitespace-nowrap"
          >
            {{ cell }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
