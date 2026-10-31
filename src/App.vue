<script setup lang="ts">
import { RouterView } from "vue-router";

import { useGlobalHotkeys } from "@/composables/useGlobalHotkeys";

useGlobalHotkeys();
</script>

<template>
  <RouterView />

</template>
