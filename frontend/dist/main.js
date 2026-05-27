const query = new URLSearchParams(window.location.search);
const useMockApi = query.get("mock") === "1";
const apiBase = query.get("api") ?? "http://localhost:8080";
const apiModeNode = document.querySelector("#api-mode");
const apiBaseNode = document.querySelector("#api-base");
const contentOutputNode = document.querySelector("#content-output");
const apiOutputNode = document.querySelector("#api-output");
function printNode(node, value) {
    if (!node) {
        return;
    }
    node.textContent = JSON.stringify(value, null, 2);
}
async function fetchContent() {
    const response = await fetch("./content/chapters/chapter-1.json");
    const payload = await response.json();
    printNode(contentOutputNode, payload);
}
function mockPath(path) {
    if (path === "/api/puzzles") {
        return "./mocks/puzzles.json";
    }
    if (path === "/api/progress") {
        return "./mocks/progress.json";
    }
    return "./mocks/health.json";
}
async function fetchApi(path) {
    const url = useMockApi ? mockPath(path) : `${apiBase}${path}`;
    const response = await fetch(url, {
        credentials: "include",
    });
    return await response.json();
}
async function fetchApiData() {
    const [health, puzzles] = await Promise.all([
        fetchApi("/api/health"),
        fetchApi("/api/puzzles"),
    ]);
    printNode(apiOutputNode, { health, puzzles });
}
async function boot() {
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
