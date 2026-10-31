<!-- src/components/ChatHome/right-sidebar/MenuTabDevices.vue -->
<script lang="ts" setup>
import { computed, ref } from "vue";
import { useNodeStore } from "@/stores/node";

const nodeStore = useNodeStore();

const availableChats = computed(() =>
  nodeStore.nodes
    .filter((n) => n.type === "chat")
    .map((c) => ({ id: c.id, title: c.label })),
);

interface SyncDevice {
  id: string;
  name: string;
  ipAddress: string;
  online: boolean;
  sendStatus: "allowed" | "pending" | "blocked";
}

const devices = ref<SyncDevice[]>([
  {
    id: "test-pc-01",
    name: "Рабочий ПК (Локальный)",
    ipAddress: "127.0.0.1",
    online: true,
    sendStatus: "allowed",
  },
]);

const activeDeviceId = ref<string | null>(null);
const deviceSyncing = ref<string | null>(null);

const devicePreferences = ref<
  Record<
    string,
    {
      status: "allowed" | "pending" | "blocked";
      mode: "full" | "restricted";
      maxFileSize: number;
      syncAllChats: boolean;
      allowedChats: string[];
    }
  >
>({});

const toggleDeviceSettings = (device: SyncDevice) => {
  if (activeDeviceId.value === device.id) {
    activeDeviceId.value = null;
    return;
  }
  activeDeviceId.value = device.id;
  if (!devicePreferences.value[device.id]) {
    devicePreferences.value[device.id] = {
      status: device.sendStatus,
      mode: "restricted",
      maxFileSize: 25,
      syncAllChats: true,
      allowedChats: availableChats.value.map((c) => c.id),
    };
  }
};

const saveDeviceSettings = (device: SyncDevice) => {
  const prefs = devicePreferences.value[device.id];
  if (!prefs) return;
  device.sendStatus = prefs.status;
  activeDeviceId.value = null;
};

const syncWithDevice = (id: string) => {
  deviceSyncing.value = id;
  setTimeout(() => {
    deviceSyncing.value = null;
  }, 800);
};
</script>

<template>
  <div class="relative h-full flex flex-col">
    <div class="flex items-center justify-between mb-3 px-1">
      <p
        class="text-[10px] font-semibold text-white/40 uppercase tracking-wider"
      >
        Устройства в сети
      </p>
      <button
        type="button"
        class="text-[10px] text-sky-400 hover:text-sky-300 transition-colors"
        @click="syncWithDevice('all')"
      >
        {{ deviceSyncing === "all" ? "Синхронизация…" : "Синхр. всё" }}
      </button>
    </div>

    <div class="space-y-2">
      <div
        v-for="device in devices"
        :key="device.id"
        class="rounded-xl bg-white/[0.02] border border-white/5 p-3 transition-all"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium text-white flex items-center gap-2">
              {{ device.name }}
              <span
                class="w-2 h-2 rounded-full"
                :class="
                  device.online
                    ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                    : 'bg-white/20'
                "
              />
            </p>
            <p class="text-[10px] text-white/40 mt-0.5">
              IP: {{ device.ipAddress }}
            </p>
          </div>

          <button
            type="button"
            class="p-1.5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-300"
            :class="{
              'rotate-180 bg-white/10 text-white': activeDeviceId === device.id,
            }"
            @click="toggleDeviceSettings(device)"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        <div v-if="activeDeviceId !== device.id" class="mt-3">
          <button
            type="button"
            :disabled="
              device.sendStatus !== 'allowed' || deviceSyncing === device.id
            "
            class="w-full text-xs font-medium py-1.5 rounded-lg border border-sky-400/30 text-sky-400 hover:bg-sky-400/10 transition-colors disabled:opacity-30"
            @click="syncWithDevice(device.id)"
          >
            {{
              device.sendStatus !== "allowed"
                ? "Доступ запрещен"
                : deviceSyncing === device.id
                  ? "Синхронизация..."
                  : "Синхронизировать"
            }}
          </button>
        </div>

        <div
          v-if="activeDeviceId === device.id && devicePreferences[device.id]"
          class="mt-4 pt-3 border-t border-white/5 space-y-3"
        >
          <div class="space-y-1.5">
            <label class="text-[10px] font-semibold text-white/50 uppercase">
              Статус доступа
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                class="px-2 py-1.5 text-[11px] rounded-lg border transition-all"
                :class="
                  devicePreferences[device.id].status === 'allowed'
                    ? 'bg-green-500/20 border-green-500 text-white'
                    : 'border-white/10 text-white/40'
                "
                @click="devicePreferences[device.id].status = 'allowed'"
              >
                Разрешен
              </button>
              <button
                type="button"
                class="px-2 py-1.5 text-[11px] rounded-lg border transition-all"
                :class="
                  devicePreferences[device.id].status !== 'allowed'
                    ? 'bg-red-500/20 border-red-500 text-white'
                    : 'border-white/10 text-white/40'
                "
                @click="devicePreferences[device.id].status = 'blocked'"
              >
                Запрещен
              </button>
            </div>
          </div>

          <div class="flex gap-2 pt-1">
            <button
              type="button"
              class="flex-1 py-1.5 text-[11px] text-white/50 hover:bg-white/5 rounded-lg"
              @click="activeDeviceId = null"
            >
              Отмена
            </button>
            <button
              type="button"
              class="flex-1 py-1.5 text-[11px] bg-sky-500 text-white rounded-lg hover:brightness-110"
              @click="saveDeviceSettings(device)"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
