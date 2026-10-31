<!-- src/components/ChatHome/chat-input/modals/CameraModal.vue -->
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
const isFlashing = ref(false);
const facingMode = ref<"user" | "environment">("user");

const startCamera = async () => {
  errorMessage.value = null;
  capturedImageUrl.value = null;
  capturedFile.value = null;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    errorMessage.value = "Камера не поддерживается вашим браузером";
    return;
  }

  try {
    if (stream.value) {
      stream.value.getTracks().forEach((track) => track.stop());
    }

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: facingMode.value,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    stream.value = mediaStream;
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream;
      await videoRef.value.play();
    }
  } catch (err: any) {
    console.error("Camera access error:", err);
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      errorMessage.value = "Доступ к камере заблокирован в настройках браузера";
    } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      errorMessage.value = "Камера не обнаружена на вашем устройстве";
    } else {
      errorMessage.value = "Не удалось запустить камеру";
    }
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

  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Эффект вспышки
  isFlashing.value = true;
  setTimeout(() => (isFlashing.value = false), 200);

  ctx.drawImage(video, 0, 0, width, height);

  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const fileName = `camera_photo_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: "image/jpeg" });
      capturedFile.value = file;
      capturedImageUrl.value = URL.createObjectURL(blob);
    },
    "image/jpeg",
    0.92,
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
    stream.value.getTracks().forEach((track) => track.stop());
    stream.value = null;
  }
  if (capturedImageUrl.value) {
    URL.revokeObjectURL(capturedImageUrl.value);
  }
};

onMounted(() => {
  startCamera();
});

onBeforeUnmount(() => {
  stopCamera();
});
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn"
    @click.self="$emit('close')"
  >
    <div
      class="w-full max-w-lg rounded-2xl border border-white/10 bg-[#121620]/95 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden text-white animate-scaleIn"
    >
      <!-- Шапка -->
      <div
        class="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.02]"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="size-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400"
          >
            <Camera class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-white leading-tight">
              Сделать снимок
            </h3>
            <p class="text-xs text-white/50 leading-tight">
              Веб-камера или фото с устройства
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="$emit('close')"
          class="size-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Видоискатель / Превью -->
      <div class="relative bg-black flex items-center justify-center min-h-[300px] overflow-hidden">
        <!-- Анимация вспышки -->
        <div
          v-if="isFlashing"
          class="absolute inset-0 bg-white z-30 pointer-events-none transition-opacity duration-200"
        ></div>

        <!-- Ошибка камеры (с кнопкой выбора файла) -->
        <div
          v-if="errorMessage"
          class="p-6 flex flex-col items-center justify-center text-center gap-3"
        >
          <div class="size-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertCircle class="w-6 h-6" />
          </div>
          <p class="text-sm font-medium text-white/90">
            {{ errorMessage }}
          </p>
          <p class="text-xs text-white/50 max-w-xs">
            Вы можете сделать фото через стандартное приложение камеры устройства или загрузить файл:
          </p>
          <button
            type="button"
            @click="fileInputFallbackRef?.click()"
            class="px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-semibold flex items-center gap-2 hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/25 mt-1"
          >
            <Upload class="w-4 h-4" /> Выбрать фото
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

        <!-- Превью сделанного снимка -->
        <div v-else-if="capturedImageUrl" class="w-full h-full flex items-center justify-center">
          <img
            :src="capturedImageUrl"
            class="max-h-[340px] w-full object-contain"
            alt="Снимок камеры"
          />
        </div>

        <!-- Живой стрим с камеры -->
        <div v-else class="w-full h-full relative flex items-center justify-center">
          <video
            ref="videoRef"
            autoplay
            playsinline
            muted
            class="w-full max-h-[340px] object-cover"
          ></video>

          <!-- Рамка видоискателя -->
          <div class="absolute inset-6 border border-white/20 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
            <div class="flex justify-between">
              <div class="w-4 h-4 border-t-2 border-l-2 border-sky-400"></div>
              <div class="w-4 h-4 border-t-2 border-r-2 border-sky-400"></div>
            </div>
            <div class="flex justify-between">
              <div class="w-4 h-4 border-b-2 border-l-2 border-sky-400"></div>
              <div class="w-4 h-4 border-b-2 border-r-2 border-sky-400"></div>
            </div>
          </div>

          <!-- Кнопка смены камеры (фронт / тыл) -->
          <button
            type="button"
            @click="switchCamera"
            class="absolute top-4 right-4 size-9 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all backdrop-blur-md"
            title="Переключить камеру"
          >
            <RefreshCw class="w-4 h-4" />
          </button>
        </div>

        <!-- Скрытый canvas для захвата кадра -->
        <canvas ref="canvasRef" class="hidden"></canvas>
      </div>

      <!-- Подвал с кнопками управления -->
      <div
        class="px-5 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between"
      >
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-1.5 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          Закрыть
        </button>

        <!-- Кнопки в режиме сделанного фото -->
        <div v-if="capturedImageUrl" class="flex items-center gap-2">
          <button
            type="button"
            @click="retakePhoto"
            class="px-4 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/15 text-white flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw class="w-3.5 h-3.5" /> Переснять
          </button>
          <button
            type="button"
            @click="handleConfirm"
            class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 text-white flex items-center gap-1.5 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25"
          >
            <Check class="w-3.5 h-3.5" /> Прикрепить снимок
          </button>
        </div>

        <!-- Кнопка спуска затвора -->
        <div v-else-if="!errorMessage" class="flex items-center">
          <button
            type="button"
            @click="takePhoto"
            class="size-12 rounded-full bg-white border-4 border-white/40 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all group"
            title="Сделать снимок"
          >
            <div class="size-9 rounded-full bg-sky-500 group-hover:bg-sky-400 transition-colors"></div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.15s ease-out forwards;
}
.animate-scaleIn {
  animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
