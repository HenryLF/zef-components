import { StateType } from "./types";

export const TERNARY_REGEX =
  /\{\{(?<json>json::)?(?<path>[a-z0-9\.]*)\s*(?:\?)?\s*(['"`](?<trueVal>[^'"`]*)['"`])?\s*(?::)?\s*(['"`](?<falseVal>[^'"`]*)['"`])?\s*\}\}/gi;
export const FOR_LOOP_REGEX =
  /((?<index>\w+)\s*,\s*)?(?<name>\w+)\s+((in)|(of))\s+(?<path>[a-z0-9\.]+)/i;

export function parseJSON(json: string | null) {
  if (!json) return null;
  try {
    return JSON.parse(json.replaceAll("'", '"'));
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function marshallJSON(obj: any) {
  return JSON.stringify(obj).replaceAll('"', "'");
}

function unProxyfy(obj: object) {
  return JSON.parse(JSON.stringify(obj));
}

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
export function targetFromPath(obj: StateType, path: string) {
  const props = path.split(".").map((p) => p.trim());
  let target: any = obj;
  for (let prop of props) {
    if (typeof target === "object" && target != undefined && target[prop] != undefined) {
      target = maybeCall(target[prop]);
    } else {
      return null;
    }
  }
  return target;
}

export function parseHTMLDeclaration(rawHTML: string, object: StateType) {
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
    if ("json" in groups && groups["json"]) {
      return marshallJSON(value);
    }
    const rawValue = typeof value === "object" ? unProxyfy(value) : value;
    return rawValue?.toString();
  });
}
