/* External methods bound to the main Component.*/

import { EventListenerRecord, WebComponent } from "./types";
import {
  maybeCall,
  FOR_LOOP_REGEX,
  getId,
  parseDocumentFragment,
  targetFromPath,
  TERNARY_REGEX,
} from "./utils";

export function createReactiveProxy<T extends object>(
  this: WebComponent<T>,
  initialState: T,
  previousPath: string = ""
) {
  const handler = {
    get: (target: T, property: keyof T) => {
      const path = previousPath
        ? `${previousPath}.${property as string}`
        : (property as string);
      const value = target[property];
      if (typeof value === "object" && value !== null) {
        return createReactiveProxy.bind(this)(value, path);
      }
      return value;
    },
    set: (target: T, property: keyof T, value: any) => {
      if (target[property] === value) return true;
      const path = previousPath
        ? `${previousPath}.${property as string}`
        : (property as string);
      target[property] = value;
      if (typeof value === "object" && value !== null) {
        target[property] = createReactiveProxy.bind(this)(value, path);
      }
      const newValue = maybeCall(this._valueUpdater, this);
      if (this.value !== newValue) {
        this.value = newValue;
      }

      this.reRenderProperty(path);
      return true;
    },
  };
  //@ts-expect-error yeah yeah yeah proxy magic
  return new Proxy(initialState, handler);
}

export function initializeStoreListeners<T extends object>(
  this: WebComponent<T>,
  storeListener: Record<Exclude<string, keyof T>, string> | undefined,
  initialState: T
) {
  if (!storeListener) return;
  for (const key in storeListener) {
    const storeKey = storeListener[key];
    initialState[key] = () => this._globalStore.getState()[storeKey];
    const unsub = this._globalStore.subscribe(
      (store) => store[storeKey],
      //@ts-expect-error zustand middleware
      (currentVal: any) => {
        if (currentVal !== this.state[key]) {
          this.state[key] = currentVal;
          this.reRenderProperty(key);
        }
      }
    );
    this._storeListenerRecord.push(unsub);
  }
}

export function clearStoreListeners<T extends object>(this: WebComponent<T>) {
  this._storeListenerRecord.forEach((unsub) => unsub());
}

export function registerRerenders<T extends object>(this: WebComponent<T>) {
  this.$$("[re-render]").forEach((element) => {
    const reRenderAttr = element.getAttribute("re-render") ?? "";

    const id = getId();
    element.setAttribute("internal-id", id);

    const pathNames = reRenderAttr.split(",");
    for (let path of pathNames) {
      if (!this._dynamicFieldRecord[path]) {
        this._dynamicFieldRecord[path] = [];
      }
      this._dynamicFieldRecord[path].push({
        id,
        type: "declaration",
        raw: element.outerHTML,
      });
    }
  });
}

export function initializeEventListener<T extends object>(
  this: WebComponent<T>,
  eventListeners: EventListenerRecord<T>
) {
  for (let cssSelector in eventListeners) {
    for (let { event, handler, options } of eventListeners[cssSelector]) {
      const boundHandler = handler.bind(this);
      this.root.querySelectorAll(cssSelector).forEach((element) => {
        element.addEventListener(event, boundHandler, options);
      });
      if (!this._eventListenerRecord[cssSelector]) {
        this._eventListenerRecord[cssSelector] = [];
      }
      this._eventListenerRecord[cssSelector].push({
        event,
        handler: boundHandler,
        options,
      });
    }
  }
}

export function reattachEventListeners<T extends object>(
  this: WebComponent<T>,
  id: string
) {
  const target = this.root.querySelector(`[internal-id=${id}]`);
  if (!target) return;
  for (let cssSelector in this._eventListenerRecord) {
    for (let { event, handler, options } of this._eventListenerRecord[
      cssSelector
    ]) {
      if (target.matches(cssSelector)) {
        target.addEventListener(event, handler, options);
      }
      target.querySelectorAll(cssSelector).forEach((elements) => {
        elements.addEventListener(event, handler, options);
      });
    }
  }
}

export function registerForLoop<T extends object>(this: WebComponent<T>) {
  this.$$("[for-loop]").forEach((template) => {
    const forAttr = template.getAttribute("for-loop");
    const match = forAttr?.match(FOR_LOOP_REGEX);
    if (!match?.groups || !("path" in match.groups)) return;
    const { path } = match.groups;

    const raw = template.outerHTML;
    const id = getId();
    template.setAttribute("internal-id", id);

    if (!parseInt(path)) {
      /* only register as dynamic if not static number */
      if (!this._dynamicFieldRecord[path]) {
        this._dynamicFieldRecord[path] = [];
      }
      this._dynamicFieldRecord[path].push({ id, type: "loop", raw });
    }

    renderForLoop.bind(this)(raw, template);
  });
}

export function renderForLoop<T extends object>(
  this: WebComponent<T>,
  raw: string,
  container: Element
) {
  const template = parseDocumentFragment(raw).firstElementChild;
  if (!template) return;
  const templateHTML = template.innerHTML;
  const forAttr = template.getAttribute("for-loop");
  const match = forAttr?.match(FOR_LOOP_REGEX);
  if (!match?.groups || !("path" in match.groups) || !("name" in match.groups))
    return;
  const { path, name } = match.groups;

  const target = targetFromPath(this.state, path);
  const value = maybeCall(target);
  console.log(target, value)
  let compiledHTML: string = "";
  /* case path is a numeric value or correspond to a numeric value */
  if (typeof value == "number" || parseInt(path)) {
    const upperBound = typeof value == "number" ? value : parseInt(path);

    for (let i = 0; i < upperBound; i++) {
      compiledHTML += templateHTML.replaceAll(
        TERNARY_REGEX,
        (substring: string, ...args) => {
          const groups = args.at(-1);
          if (!groups || !("path" in groups)) return substring;
          return groups.path == name ? `${i}` : substring;
        }
      );
    }
  } else if (typeof value == "object" && target !== null) {
    /* case path correspond to an array */
    const index = match.groups.index;
    for (let key in value) {
      compiledHTML += templateHTML.replaceAll(
        TERNARY_REGEX,
        (substring: string, ...args) => {
          const groups = args.at(-1);
          if (!groups || !("path" in groups)) return substring;
          const { path: tempPath } = groups;
          if (tempPath.includes(name)) {
            return substring.replace(name, `${path}.${key}`);
          }
          if (tempPath === index) {
            return key;
          }
          return substring;
        }
      );
    }
  }

  container.innerHTML = compiledHTML;
}
