const extensionToLanguage: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  vue: "vue",
  py: "python",
  json: "json",
  html: "html",
  css: "css",
  scss: "scss",
  md: "markdown",
  yml: "yaml",
  yaml: "yaml",
  sh: "bash",
  bash: "bash",
  sql: "sql",
  php: "php",
  go: "go",
  rs: "rust",
  java: "java",
  c: "c",
  cpp: "cpp",
  cs: "csharp",
  lua: "lua",
  xml: "xml",
  txt: "plaintext",
};

export const getLanguageFromFileName = (fileName: string): string => {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return extensionToLanguage[ext] ?? "plaintext";
};
