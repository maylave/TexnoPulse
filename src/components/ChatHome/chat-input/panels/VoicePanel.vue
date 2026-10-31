<!-- src/components/ChatHome/chat-input/panels/VoicePanel.vue -->
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
const recordingDuration = ref(0);
const timerInterval = ref<any>(null);

const audioBlob = ref<Blob | null>(null);
const audioUrl = ref<string | null>(null);
const isPlaying = ref(false);
const audioElement = ref<HTMLAudioElement>();
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
    errorMessage.value = "Микрофон не поддерживается";
    return;
  }

  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.value = audioStream;

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const recorder = new MediaRecorder(audioStream, { mimeType });
    mediaRecorder.value = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.value.push(e.data);
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

    timerInterval.value = setInterval(() => {
      recordingDuration.value++;
    }, 1000);
  } catch (err) {
    errorMessage.value = "Доступ к микрофону заблокирован";
  }
};

const stopRecording = () => {
  if (mediaRecorder.value && mediaRecorder.value.state !== "inactive") {
    mediaRecorder.value.stop();
  }
  if (stream.value) {
    stream.value.getTracks().forEach((t) => t.stop());
    stream.value = null;
  }
};

const togglePlayback = () => {
  const a = audioElement.value;
  if (!a) return;
  if (isPlaying.value) {
    a.pause();
    isPlaying.value = false;
  } else {
    a.play();
    isPlaying.value = true;
  }
};

const handleConfirm = () => {
  if (!audioBlob.value) return;
  const file = new File([audioBlob.value], `voice_${Date.now()}.webm`, {
    type: audioBlob.value.type || "audio/webm",
  });
  emit("confirm", file);
};

const cleanup = () => {
  clearInterval(timerInterval.value);
  if (stream.value) {
    stream.value.getTracks().forEach((t) => t.stop());
  }
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
  }
};

onMounted(() => startRecording());
onBeforeUnmount(() => cleanup());
</script>

<template>
  <div
    class="mb-3 p-3.5 panel-glass flex items-center justify-between gap-3 z-20 relative text-white animate-scaleIn select-none"
  >
    <!-- Ошибка доступа -->
    <div v-if="errorMessage" class="flex items-center gap-2 text-xs text-rose-400">
      <AlertCircle class="w-4 h-4 shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Режим активной записи -->
    <div v-else-if="isRecording" class="flex items-center gap-3 min-w-0 flex-1">
      <div class="size-7 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
        <Mic class="w-4 h-4 animate-pulse" />
      </div>

      <span class="text-xs font-mono font-bold text-white tracking-wider">
        {{ formatTime(recordingDuration) }}
      </span>

      <!-- Эквалайзер -->
      <div class="flex items-center gap-1 h-5 flex-1 max-w-[120px]">
        <div
          v-for="i in 10"
          :key="i"
          class="w-1 bg-rose-400/80 rounded-full transition-all duration-150"
          :style="{
            height: `${Math.max(4, Math.sin(i * 0.7 + recordingDuration) * 16 + 4)}px`,
          }"
        ></div>
      </div>

      <button
        type="button"
        @click="stopRecording"
        class="px-2.5 py-1 rounded-lg bg-rose-500 text-white text-xs font-medium flex items-center gap-1 hover:bg-rose-400 transition-colors"
      >
        <Square class="w-3 h-3 fill-white" />
        <span>Стоп</span>
      </button>
    </div>

    <!-- Режим готовой записи -->
    <div v-else-if="audioUrl" class="flex items-center gap-3 min-w-0 flex-1">
      <audio
        ref="audioElement"
        :src="audioUrl"
        class="hidden"
        @ended="isPlaying = false"
      ></audio>

      <button
        type="button"
        @click="togglePlayback"
        class="size-7 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 hover:bg-sky-500 hover:text-white transition-colors"
      >
        <Pause v-if="isPlaying" class="w-3.5 h-3.5" />
        <Play v-else class="w-3.5 h-3.5 ml-0.5" />
      </button>

      <span class="text-xs font-mono text-white/70">
        {{ formatTime(recordingDuration) }}
      </span>

      <button
        type="button"
        @click="startRecording"
        class="text-xs text-white/50 hover:text-white flex items-center gap-1 transition-colors"
      >
        <RotateCcw class="w-3 h-3" /> Перезаписать
      </button>
    </div>

    <!-- Кнопки Отмена и Сохранить -->
    <div class="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        @click="$emit('close')"
        class="px-2.5 py-1.5 rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      >
        Отмена
      </button>

      <button
        v-if="audioBlob && !isRecording"
        type="button"
        @click="handleConfirm"
        class="px-3 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-medium flex items-center gap-1 hover:bg-sky-400 transition-all shadow-md shadow-sky-500/20"
      >
        <Check class="w-3.5 h-3.5" />
        <span>Прикрепить</span>
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
