export function getId() {
  const now = window.performance.now();
  const timeSeed = [0, 1].map((_, id) =>
    String.fromCharCode(
      Math.floor((now % Math.pow(26, id + 1)) / Math.pow(26, id)) + 65
    )
  );
  return `${timeSeed.join("")}${Math.floor(Math.random() * 1_000)
    .toString()
    .padStart(3, "0")}`;
}

export function importDataSrc(target: Element | Document | ShadowRoot) {
  target.querySelectorAll("[data-src]").forEach((element) => {
    const src = element.getAttribute("data-src")!;
    element.setAttribute("src", src);
  });
}

export function parseTemplate(rawHTML: string, object: Record<string, any>) {
  return rawHTML.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return object[key]?.toString() || "";
  });
}
