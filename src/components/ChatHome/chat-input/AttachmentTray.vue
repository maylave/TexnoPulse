<template>
  <div class="att-tray absolute bottom-full left-0 right-0 z-10 flex flex-wrap px-2 pb-3">
    <div class="att-chip">
      <div class="att-icon">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      </div>

      <div class="min-w-0">
        <div class="att-name truncate">Название_файла.pdf</div>
        <div class="att-meta">PDF · 818.5 KB</div>
      </div>

      <button type="button" class="att-remove" title="Убрать">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.att-tray {
  gap: var(--attach-gap);
}

.att-chip {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 16rem;
  padding: 0.5rem 0.75rem;
  background: var(--attach-bg);
  border: 1px solid var(--attach-border);
  border-radius: var(--attach-radius);
  backdrop-filter: blur(var(--attach-blur));
  -webkit-backdrop-filter: blur(var(--attach-blur));
  color: var(--attach-text);
}

.att-icon {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background: var(--attach-icon-bg);
  color: var(--attach-muted);
}

.att-name {
  font-size: 0.8125rem;
  font-weight: 500;
}

.att-meta {
  font-size: 0.6875rem;
  color: var(--attach-muted);
}

.att-remove {
  flex-shrink: 0;
  padding: 0.25rem;
  border-radius: 9999px;
  color: var(--attach-muted);
  transition:
    color var(--attach-anim) ease,
    background-color var(--attach-anim) ease;
}
.att-remove:hover {
  color: var(--attach-remove-hover);
  background: var(--attach-icon-bg);
}
</style>