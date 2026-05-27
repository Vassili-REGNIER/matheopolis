type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

type ChapterContent = {
  id: string;
  title: string;
  dialogues: Array<{ speaker: string; text: string }>;
  miniGame: {
    id: string;
    type: string;
    difficulty: string;
  };
};

const query = new URLSearchParams(window.location.search);
const useMockApi = query.get("mock") === "1";
const apiBase = query.get("api") ?? "http://localhost:8080";

const apiModeNode = document.querySelector<HTMLParagraphElement>("#api-mode");
const apiBaseNode = document.querySelector<HTMLParagraphElement>("#api-base");
const contentOutputNode = document.querySelector<HTMLPreElement>("#content-output");
const apiOutputNode = document.querySelector<HTMLPreElement>("#api-output");

function printNode(node: HTMLElement | null, value: unknown): void {
  if (!node) {
    return;
  }
  node.textContent = JSON.stringify(value, null, 2);
}

async function fetchContent(): Promise<void> {
  const response = await fetch("./content/chapters/chapter-1.json");
  const payload = (await response.json()) as ChapterContent;
  printNode(contentOutputNode, payload);
}

function mockPath(path: string): string {
  if (path === "/api/puzzles") {
    return "./mocks/puzzles.json";
  }
  if (path === "/api/progress") {
    return "./mocks/progress.json";
  }
  return "./mocks/health.json";
}

async function fetchApi<T>(path: string): Promise<ApiEnvelope<T>> {
  const url = useMockApi ? mockPath(path) : `${apiBase}${path}`;
  const response = await fetch(url, {
    credentials: "include",
  });
  return (await response.json()) as ApiEnvelope<T>;
}

async function fetchApiData(): Promise<void> {
  const [health, puzzles] = await Promise.all([
    fetchApi<Record<string, unknown>>("/api/health"),
    fetchApi<{ items: Array<Record<string, unknown>> }>("/api/puzzles"),
  ]);

  printNode(apiOutputNode, { health, puzzles });
}

async function boot(): Promise<void> {
  if (apiModeNode) {
    apiModeNode.textContent = useMockApi ? "Mode mock actif" : "Mode backend réel";
  }
  if (apiBaseNode) {
    apiBaseNode.textContent = `API: ${useMockApi ? "mock local" : apiBase}`;
  }

  await fetchContent();
  await fetchApiData();
}

void boot();
