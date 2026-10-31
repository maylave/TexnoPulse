import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const iconsDir = path.join(rootDir, "src-tauri", "icons");

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Палитры для кастомизации и перекраски оформления
const THEMES = {
  sky: {
    primary: [56, 189, 248],    // #38bdf8
    secondary: [14, 165, 233],  // #0ea5e9
    darkBg1: [9, 13, 22],       // #090d16
    darkBg2: [30, 41, 59],      // #1e293b
    text: [248, 250, 252],      // #f8fafc
  },
  emerald: {
    primary: [16, 185, 129],
    secondary: [5, 150, 105],
    darkBg1: [6, 20, 15],
    darkBg2: [17, 43, 33],
    text: [240, 253, 244],
  },
  purple: {
    primary: [168, 85, 247],
    secondary: [147, 51, 234],
    darkBg1: [15, 10, 25],
    darkBg2: [35, 23, 58],
    text: [250, 245, 255],
  },
  rose: {
    primary: [244, 63, 94],
    secondary: [225, 29, 72],
    darkBg1: [25, 10, 14],
    darkBg2: [55, 23, 30],
    text: [255, 241, 242],
  },
};

const args = process.argv.slice(2);
const colorArg = args.find((a) => a.startsWith("--color="))?.split("=")[1] || "sky";
const theme = THEMES[colorArg] || THEMES.sky;

console.log(`[Installer Assets] Генерация брендовых изображений для темы: ${colorArg}`);

/**
 * Создание валидного 24-битного uncompressed Windows BMP
 */
function createBmp(width, height, pixelShader) {
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buf = Buffer.alloc(fileSize);

  // BMP Header (14 bytes)
  buf.write("BM", 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(0, 6);
  buf.writeUInt32LE(54, 10); // Offset to pixel array

  // DIB Header (BITMAPINFOHEADER - 40 bytes)
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22);
  buf.writeUInt16LE(1, 26); // Planes
  buf.writeUInt16LE(24, 28); // 24 bpp (RGB)
  buf.writeUInt32LE(0, 30); // BI_RGB
  buf.writeUInt32LE(pixelArraySize, 34);
  buf.writeInt32LE(2835, 38); // 72 DPI
  buf.writeInt32LE(2835, 42);
  buf.writeUInt32LE(0, 46);
  buf.writeUInt32LE(0, 50);

  let offset = 54;
  // BMP хранит строки снизу вверх
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixelShader(x, y, width, height);
      buf[offset++] = Math.max(0, Math.min(255, Math.round(b)));
      buf[offset++] = Math.max(0, Math.min(255, Math.round(g)));
      buf[offset++] = Math.max(0, Math.min(255, Math.round(r)));
    }
    // Выравнивание строки до 4 байт
    const padding = rowSize - width * 3;
    for (let p = 0; p < padding; p++) {
      buf[offset++] = 0;
    }
  }

  return buf;
}

// 1. Генерация sidebarImage (164 x 314 px) - фирменный левый баннер инсталлятора
const sidebarBmp = createBmp(164, 314, (x, y, w, h) => {
  const normY = y / h;
  const normX = x / w;

  // Базовый темный градиент фона
  let r = theme.darkBg1[0] * (1 - normY) + theme.darkBg2[0] * normY;
  let g = theme.darkBg1[1] * (1 - normY) + theme.darkBg2[1] * normY;
  let b = theme.darkBg1[2] * (1 - normY) + theme.darkBg2[2] * normY;

  // Центральный светящийся логотип Snapi (круг + акцентное кольцо)
  const centerX = w / 2;
  const centerY = 110;
  const dx = x - centerX;
  const dy = y - centerY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Мягкое неоновое свечение вокруг логотипа
  if (dist < 55) {
    const glow = Math.exp(-dist / 22);
    r += theme.primary[0] * glow * 0.45;
    g += theme.primary[1] * glow * 0.45;
    b += theme.primary[2] * glow * 0.45;
  }

  // Внутреннее светящееся кольцо
  if (dist >= 28 && dist <= 33) {
    const ringIntensity = 1 - Math.abs(dist - 30.5) / 2.5;
    r = r * (1 - ringIntensity) + theme.primary[0] * ringIntensity;
    g = g * (1 - ringIntensity) + theme.primary[1] * ringIntensity;
    b = b * (1 - ringIntensity) + theme.primary[2] * ringIntensity;
  }

  // Центральное ядро
  if (dist < 24) {
    const core = (1 - dist / 24);
    r = r * 0.3 + theme.secondary[0] * core * 0.9;
    g = g * 0.3 + theme.secondary[1] * core * 0.9;
    b = b * 0.3 + theme.secondary[2] * core * 0.9;
  }

  // Декоративная акцентная полоса справа
  if (x > w - 3) {
    r = theme.primary[0] * 0.7;
    g = theme.primary[1] * 0.7;
    b = theme.primary[2] * 0.7;
  }

  return [r, g, b];
});

fs.writeFileSync(path.join(iconsDir, "installer-sidebar.bmp"), sidebarBmp);
console.log(`>>> Создан баннер инсталлятора: ${path.join(iconsDir, "installer-sidebar.bmp")} (164x314)`);

// 2. Генерация headerImage (150 x 57 px) - компактный верхний баннер инсталлятора
const headerBmp = createBmp(150, 57, (x, y, w, h) => {
  const normX = x / w;
  const normY = y / h;

  let r = theme.darkBg1[0] * (1 - normX * 0.5) + theme.darkBg2[0] * (normX * 0.5);
  let g = theme.darkBg1[1] * (1 - normX * 0.5) + theme.darkBg2[1] * (normX * 0.5);
  let b = theme.darkBg1[2] * (1 - normX * 0.5) + theme.darkBg2[2] * (normX * 0.5);

  // Иконка-эмблема справа (x ≈ 120, y ≈ 28)
  const cx = 120;
  const cy = 28;
  const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

  if (dist < 18) {
    const glow = Math.exp(-dist / 8);
    r += theme.primary[0] * glow * 0.5;
    g += theme.primary[1] * glow * 0.5;
    b += theme.primary[2] * glow * 0.5;
  }
  if (dist >= 10 && dist <= 13) {
    const ring = 1 - Math.abs(dist - 11.5) / 1.5;
    r = r * (1 - ring) + theme.primary[0] * ring;
    g = g * (1 - ring) + theme.primary[1] * ring;
    b = b * (1 - ring) + theme.primary[2] * ring;
  }

  // Нижняя разделительная полоса
  if (y >= h - 1) {
    r = theme.primary[0] * 0.5;
    g = theme.primary[1] * 0.5;
    b = theme.primary[2] * 0.5;
  }

  return [r, g, b];
});

fs.writeFileSync(path.join(iconsDir, "installer-header.bmp"), headerBmp);
console.log(`>>> Создана шапка инсталлятора: ${path.join(iconsDir, "installer-header.bmp")} (150x57)`);
console.log(`[Installer Assets] Готово! Все активы инсталлятора успешно сгенерированы.`);
