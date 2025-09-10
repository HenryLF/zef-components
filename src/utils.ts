export const TERNARY_REGEX =
  /\{\{(?<path>[a-z0-9\.]*)\s*(?:\?)?\s*(['"`](?<trueVal>[^'"`]*)['"`])?\s*(?::)?\s*(['"`](?<falseVal>[^'"`]*)['"`])?\s*\}\}/gi;
export const FOR_LOOP_REGEX =
  /((?<index>\w+)\s*,\s*)?(?<name>\w+)\s+((in)|(of))\s+(?<path>[a-z0-9\.]+)/i;

export function parseDocumentFragment(rawHTML: string) {
  const template = document.createElement("template");
  template.innerHTML = rawHTML;
  return template.content.cloneNode(true) as DocumentFragment;
}

export function maybeCall<T>(k: T | ((this: any) => T), thisObj: any = {}) {
  if (typeof k == "function") {
    return k.bind(thisObj)();
  }
  return k;
}

export function getId() {
  const timeSeed = Math.floor(performance.now() * 1_00);
  const randSeed = Math.floor(Math.random() * 1_00);
  const randLetter = Math.floor(Math.random() * 24);
  return `${String.fromCharCode(65 + randLetter)}${timeSeed.toString(
    34
  )}${randSeed.toString(34)}`;
}
export function targetFromPath<T extends object>(obj: T, path: string) {
  const props = path.split(".").map((p) => p.trim());
  let target: any = obj;
  for (let prop of props) {
    if (typeof target === "object" && target[prop] != undefined) {
      target = target[prop];
    } else {
      return null;
    }
  }
  return target;
}

export function parseHTMLDeclaration<T extends object>(
  rawHTML: string,
  object: T
) {
  return rawHTML.replaceAll(TERNARY_REGEX, (substr: string, ...args) => {
    const groups = args.at(-1);
    if (!groups || !("path" in groups)) return substr;

    const { path } = groups;
    const trueVal = groups.trueVal ?? "";
    const falseVal = groups.falseVal ?? "";

    const target = targetFromPath(object, path);
    const value = maybeCall(target);

    if (trueVal || falseVal) {
      return value ? trueVal : falseVal;
    }
    return value?.toString();
  });
}
