<!-- src/components/ChatHome/chat-input/modals/VoiceRecorderModal.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import {
  X,
  Mic,
  Check,
  Square,
  Play,
  Pause,
  RotateCcw,
  AlertCircle,
} from "lucide-vue-next";

const emit = defineEmits<{
  close: [];
  confirm: [file: File];
}>();

const stream = ref<MediaStream | null>(null);
const mediaRecorder = ref<MediaRecorder | null>(null);
const audioChunks = ref<Blob[]>([]);

const isRecording = ref(false);
const isPaused = ref(false);
const recordingDuration = ref(0);
const timerInterval = ref<any>(null);

const audioBlob = ref<Blob | null>(null);
const audioUrl = ref<string | null>(null);
const isPlayingPreview = ref(false);
const previewAudioRef = ref<HTMLAudioElement>();
const errorMessage = ref<string | null>(null);

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const startRecording = async () => {
  errorMessage.value = null;
  audioChunks.value = [];
  recordingDuration.value = 0;
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
    audioUrl.value = null;
  }
  audioBlob.value = null;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    errorMessage.value = "Запись голоса не поддерживается в этом браузере";
    return;
  }

  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    stream.value = audioStream;

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : "audio/webm";

    const recorder = new MediaRecorder(audioStream, { mimeType });
    mediaRecorder.value = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunks.value.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(audioChunks.value, { type: mimeType });
      audioBlob.value = blob;
      audioUrl.value = URL.createObjectURL(blob);
      isRecording.value = false;
      clearInterval(timerInterval.value);
    };

    recorder.start(200);
    isRecording.value = true;
    isPaused.value = false;

    timerInterval.value = setInterval(() => {
      if (!isPaused.value) {
        recordingDuration.value++;
      }
    }, 1000);
  } catch (err: any) {
    console.error("Microphone access error:", err);
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      errorMessage.value = "Доступ к микрофону заблокирован в браузере";
    } else {
      errorMessage.value = "Не удалось получить доступ к микрофону";
    }
  }
};

const stopRecording = () => {
  if (mediaRecorder.value && mediaRecorder.value.state !== "inactive") {
    mediaRecorder.value.stop();
  }
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop());
    stream.value = null;
  }
};

const togglePause = () => {
  if (!mediaRecorder.value) return;
  if (isPaused.value) {
    mediaRecorder.value.resume();
    isPaused.value = false;
  } else {
    mediaRecorder.value.pause();
    isPaused.value = true;
  }
};

const togglePlayPreview = () => {
  const audio = previewAudioRef.value;
  if (!audio) return;

  if (isPlayingPreview.value) {
    audio.pause();
    isPlayingPreview.value = false;
  } else {
    audio.play();
    isPlayingPreview.value = true;
  }
};

const handleAudioEnded = () => {
  isPlayingPreview.value = false;
};

const handleConfirm = () => {
  if (!audioBlob.value) return;
  const fileName = `voice_${Date.now()}.webm`;
  const file = new File([audioBlob.value], fileName, {
    type: audioBlob.value.type || "audio/webm",
  });
  emit("confirm", file);
};

const cleanup = () => {
  clearInterval(timerInterval.value);
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop());
  }
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
  }
};

onMounted(() => {
  startRecording();
});

onBeforeUnmount(() => {
  cleanup();
});
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
    @click.self="$emit('close')"
  >
    <div
      class="w-full max-w-md rounded-2xl border border-white/10 bg-[#121620]/95 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden text-white animate-scaleIn"
    >
      <!-- Шапка -->
      <div
        class="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.02]"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="size-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400"
          >
            <Mic class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-white leading-tight">
              Голосовое сообщение
            </h3>
            <p class="text-xs text-white/50 leading-tight">
              Запись и прослушивание
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

      <!-- Центральная область записи / превью -->
      <div class="p-8 flex flex-col items-center justify-center gap-5">
        <!-- Ошибка микрофона -->
        <div
          v-if="errorMessage"
          class="flex flex-col items-center gap-3 text-center"
        >
          <div class="size-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertCircle class="w-6 h-6" />
          </div>
          <p class="text-sm font-medium text-white/90">
            {{ errorMessage }}
          </p>
          <button
            type="button"
            @click="startRecording"
            class="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-medium transition-colors"
          >
            Попробовать снова
          </button>
        </div>

        <!-- Режим активной записи -->
        <template v-else-if="isRecording">
          <!-- Пульсирующий индикатор и таймер -->
          <div class="relative flex items-center justify-center">
            <div
              class="absolute size-28 rounded-full bg-rose-500/20 animate-ping"
              :class="{ 'opacity-0': isPaused }"
            ></div>
            <div
              class="size-20 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/30 text-white z-10"
            >
              <Mic class="w-8 h-8 animate-pulse" />
            </div>
          </div>

          <div class="flex flex-col items-center gap-1">
            <span class="text-2xl font-mono font-bold tracking-wider text-white">
              {{ formatTime(recordingDuration) }}
            </span>
            <span class="text-xs text-rose-400 font-medium">
              {{ isPaused ? "Пауза записи" : "Идет запись..." }}
            </span>
          </div>

          <!-- Волны эквалайзера -->
          <div class="flex items-center gap-1.5 h-8">
            <div
              v-for="i in 16"
              :key="i"
              class="w-1 bg-rose-400 rounded-full transition-all duration-150"
              :style="{
                height: isPaused
                  ? '6px'
                  : `${Math.max(6, Math.sin(i * 0.8 + recordingDuration) * 24 + 10)}px`,
                opacity: isPaused ? '0.3' : '0.8',
              }"
            ></div>
          </div>

          <!-- Кнопки управления записью -->
          <div class="flex items-center gap-4 mt-2">
            <button
              type="button"
              @click="togglePause"
              class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
            >
              <Pause v-if="!isPaused" class="w-4 h-4" />
              <Play v-else class="w-4 h-4" />
              <span>{{ isPaused ? "Продолжить" : "Пауза" }}</span>
            </button>

            <button
              type="button"
              @click="stopRecording"
              class="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg shadow-rose-500/25 transition-all"
            >
              <Square class="w-4 h-4 fill-white" />
              <span>Завершить</span>
            </button>
          </div>
        </template>

        <!-- Режим прослушивания готовой записи -->
        <template v-else-if="audioUrl">
          <audio
            ref="previewAudioRef"
            :src="audioUrl"
            class="hidden"
            @ended="handleAudioEnded"
          ></audio>

          <div class="flex flex-col items-center gap-3 w-full">
            <button
              type="button"
              @click="togglePlayPreview"
              class="size-16 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 transition-transform active:scale-95"
            >
              <Pause v-if="isPlayingPreview" class="w-7 h-7" />
              <Play v-else class="w-7 h-7 ml-1" />
            </button>

            <span class="text-xs text-white/60 font-mono">
              Длительность: {{ formatTime(recordingDuration) }}
            </span>

            <div class="w-full px-4">
              <audio :src="audioUrl" controls class="w-full h-8 opacity-80" />
            </div>
          </div>
        </template>
      </div>

      <!-- Подвал -->
      <div
        class="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between"
      >
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-1.5 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          Отмена
        </button>

        <div v-if="audioBlob && !isRecording" class="flex items-center gap-2">
          <button
            type="button"
            @click="startRecording"
            class="px-4 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/15 text-white flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw class="w-3.5 h-3.5" /> Заново
          </button>
          <button
            type="button"
            @click="handleConfirm"
            class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 text-white flex items-center gap-1.5 hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/25"
          >
            <Check class="w-3.5 h-3.5" /> Прикрепить голосовое
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
  }
}
.animate-fadeIn {
  animation: fadeIn 0.15s ease-out forwards;
}
.animate-scaleIn {
  animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
