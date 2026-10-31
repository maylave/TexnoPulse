<!-- src/components/ChatHome/chat-input/panels/CameraPanel.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import {
  X,
  Camera,
  Check,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  Upload,
} from "lucide-vue-next";

const emit = defineEmits<{
  close: [];
  confirm: [file: File];
}>();

const videoRef = ref<HTMLVideoElement>();
const canvasRef = ref<HTMLCanvasElement>();
const fileInputFallbackRef = ref<HTMLInputElement>();

const stream = ref<MediaStream | null>(null);
const capturedImageUrl = ref<string | null>(null);
const capturedFile = ref<File | null>(null);
const errorMessage = ref<string | null>(null);
const facingMode = ref<"user" | "environment">("user");

const startCamera = async () => {
  errorMessage.value = null;
  capturedImageUrl.value = null;
  capturedFile.value = null;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    errorMessage.value = "Камера не поддерживается";
    return;
  }

  try {
    if (stream.value) {
      stream.value.getTracks().forEach((t) => t.stop());
    }

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: facingMode.value,
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    });

    stream.value = mediaStream;
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream;
      await videoRef.value.play();
    }
  } catch (err: any) {
    errorMessage.value = "Доступ к веб-камере ограничен";
  }
};

const switchCamera = () => {
  facingMode.value = facingMode.value === "user" ? "environment" : "user";
  startCamera();
};

const takePhoto = () => {
  const video = videoRef.value;
  const canvas = canvasRef.value;
  if (!video || !canvas) return;

  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(video, 0, 0, w, h);

  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
      capturedFile.value = file;
      capturedImageUrl.value = URL.createObjectURL(blob);
    },
    "image/jpeg",
    0.9,
  );
};

const retakePhoto = () => {
  if (capturedImageUrl.value) {
    URL.revokeObjectURL(capturedImageUrl.value);
  }
  capturedImageUrl.value = null;
  capturedFile.value = null;
};

const handleFallbackFile = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files?.[0]) {
    emit("confirm", input.files[0]);
  }
};

const handleConfirm = () => {
  if (capturedFile.value) {
    emit("confirm", capturedFile.value);
  }
};

const stopCamera = () => {
  if (stream.value) {
    stream.value.getTracks().forEach((t) => t.stop());
    stream.value = null;
  }
  if (capturedImageUrl.value) {
    URL.revokeObjectURL(capturedImageUrl.value);
  }
};

onMounted(() => startCamera());
onBeforeUnmount(() => stopCamera());
</script>

<template>
  <div
    class="mb-3 p-3.5 panel-glass flex flex-col gap-2.5 z-20 relative text-white animate-scaleIn select-none"
  >
    <!-- Шапка панели -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div
          class="size-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0"
        >
          <Camera class="w-3.5 h-3.5" />
        </div>
        <span class="text-xs font-semibold text-white/90">
          Снимок с камеры
        </span>
      </div>

      <button
        type="button"
        @click="$emit('close')"
        class="size-6 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Область камеры -->
    <div class="relative w-full h-40 bg-black/40 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
      <!-- Ошибка / выбор файла -->
      <div v-if="errorMessage" class="flex flex-col items-center gap-2 text-center p-3">
        <AlertCircle class="w-5 h-5 text-amber-400" />
        <span class="text-xs text-white/70">{{ errorMessage }}</span>
        <button
          type="button"
          @click="fileInputFallbackRef?.click()"
          class="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs hover:bg-white/20 transition-colors flex items-center gap-1.5"
        >
          <Upload class="w-3.5 h-3.5" /> Выбрать фото
        </button>
        <input
          ref="fileInputFallbackRef"
          type="file"
          accept="image/*"
          capture="environment"
          class="hidden"
          @change="handleFallbackFile"
        />
      </div>

      <!-- Превью снимка -->
      <img
        v-else-if="capturedImageUrl"
        :src="capturedImageUrl"
        class="w-full h-full object-contain"
      />

      <!-- Живой стрим -->
      <div v-else class="w-full h-full relative flex items-center justify-center">
        <video ref="videoRef" autoplay playsinline muted class="w-full h-full object-cover"></video>

        <!-- Кнопка переключения камеры -->
        <button
          type="button"
          @click="switchCamera"
          class="absolute top-2 right-2 size-7 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
        >
          <RefreshCw class="w-3 h-3" />
        </button>
      </div>

      <canvas ref="canvasRef" class="hidden"></canvas>
    </div>

    <!-- Подвал панели -->
    <div class="flex items-center justify-between text-xs">
      <button
        type="button"
        @click="$emit('close')"
        class="px-3 py-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      >
        Отмена
      </button>

      <!-- Если сделан снимок -->
      <div v-if="capturedImageUrl" class="flex items-center gap-2">
        <button
          type="button"
          @click="retakePhoto"
          class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw class="w-3.5 h-3.5" /> Переснять
        </button>
        <button
          type="button"
          @click="handleConfirm"
          class="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-white font-medium flex items-center gap-1.5 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20"
        >
          <Check class="w-3.5 h-3.5" /> Сохранить
        </button>
      </div>

      <!-- Кнопка затвора -->
      <button
        v-else-if="!errorMessage"
        type="button"
        @click="takePhoto"
        class="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/20"
      >
        <Camera class="w-3.5 h-3.5" /> Сделать снимок
      </button>
    </div>
  </div>
</template>

<style scoped>
.panel-glass {
  background-color: var(--input-bg, rgba(15, 23, 42, 0.65));
  border: 1px solid var(--input-border, rgba(255, 255, 255, 0.1));
  backdrop-filter: blur(var(--input-blur, 24px));
  -webkit-backdrop-filter: blur(var(--input-blur, 24px));
  box-shadow:
    var(--input-shadow, 0 8px 32px rgba(0, 0, 0, 0.3)),
    inset 0 2px 4px rgba(255, 255, 255, 0.05),
    inset 0 -1px 2px rgba(0, 0, 0, 0.2);
  border-radius: 20px;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.animate-scaleIn {
  animation: scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
