import {
  DynamicFieldsRecord,
  EventHandle,
  EventListernerRecord,
  FactoryOptions,
} from "./types";
import { parseTemplate, getId } from "./utils";

export function Factory<T extends object>(
  name: string,
  temp: string,
  options?: FactoryOptions<T>
) {
  class Component extends HTMLElement {
    rawHTML: string;
    root: ShadowRoot | HTMLElement;
    state: T;
    readonly name: string = name;

    /*value field for input-like behavior */
    private _value: any;
    get value() {
      return this._value;
    }
    set value(newValue: any) {
      if (newValue == this.value) return;
      this._value = newValue;
      this.dispatchEvent(new Event("input"));
    }
    static get observedAttributes() {
      return options?.observedAttibutes ?? [];
    }

    private dynamicFields: DynamicFieldsRecord<T> = {};
    private boundEventListener: EventListernerRecord<T> = {};
    private boundValueUpdater() {}
    constructor() {
      super();
      this.rawHTML = temp;
      if (options?.noShadow) {
        this.root = this;
      } else {
        this.root = this.attachShadow({ mode: "closed" });
      }
      /* set initial state */
      if (options?.state) {
        let initialState: T;
        if (typeof options.state === "function") {
          initialState = options.state.bind(this)();
        } else {
          initialState = options.state;
        }
        this.state = this.createReactiveState(initialState);
      } else {
        this.state = {} as T;
      }
      /* set initialize value */
      if (options?.value) {
        this.boundValueUpdater = options?.value?.bind(this);
      }
      this._value = this.boundValueUpdater();
    }
    /* Public utilities */
    $(css: string) {
      return this.root.querySelector(css);
    }
    $$(css: string) {
      return this.root.querySelectorAll(css);
    }
    destroy() {
      this.parentElement?.removeChild(this);
    }
    /* shadowed methoded */
    registerEventHandler(
      el: Element,
      css: string,
      { handler, event, option }: EventHandle<T>
    ) {
      const boundHandler = handler.bind(this);
      el.addEventListener(event, boundHandler, option);
      if (!this.boundEventListener[css]) {
        this.boundEventListener[css] = [];
      }
      this.boundEventListener[css].push({ event, handler: boundHandler });
    }

    attachListener() {
      for (let selector in options?.eventListener) {
          const css = selector.trim();
          const eventTargets = this.$$(selector.trim());
          /* register each target individualy */
          eventTargets.forEach((target) => {
            if (!options?.eventListener?.[selector]) return;
            for (let handle of options.eventListener[selector]) {
              this.registerEventHandler(target, css, handle);
            }
          });
      }
    }
    removeListener() {
      for (let css in this.boundEventListener) {
        const eventTargets = this.$$(css);
        eventTargets.forEach((target) => {
          for (let { event, handler } of this.boundEventListener[css]) {
            target.removeEventListener(event, handler);
          }
        });
      }
    }


    createReactiveState<T extends object>(initialState: T, path: string = ''): T {
      const handler = {
        get: (target: T, property: keyof T) => {
          const value = target[property];
          if (typeof value === "object" && value !== null) {
            const newPath = path ? `${path}.${property as string}` : property as string;
            return this.createReactiveState(value, newPath);
          }
          return value;
        },
        set: (target: T, property: keyof T, value: any) => {
          if (target[property] === value) return true;
          const newPath = path ? `${path}.${property as string}` : property as string;
          target[property] = value;
          if (typeof value === "object" && value !== null) {
            target[property] = this.createReactiveState(value, newPath);
          }
          this.updateDynamicField(newPath);
          const newValue = this.boundValueUpdater();
          if (this.value != newValue) {
            this.value = this.boundValueUpdater();
          }
          return true;
        },
      };

      return new Proxy(initialState, handler);
    }

    updateDynamicField(property: string) {
      let toUpdate = []
      for (const key in this.dynamicFields){
        if(property.startsWith(key)){
          toUpdate.push(...this.dynamicFields[key])
        }
      }
      console.log(property,toUpdate , this.dynamicFields)
      for (let { id, raw } of toUpdate) {
        /*fetch element by internal id*/
        let element = this.$(`[internal-id=${id}]`);
        if (!element) continue;
        /*rerender field*/
        element.outerHTML = parseTemplate(raw, this.state);

        /*reattach lost event handlers */
        for (let css in this.boundEventListener) {
          /* search for child event target */
          const eventTargets: Element[] = [
            ...Array.from(this.$$(`[internal-id=${id}] ${css}`)),
          ];
          /* check if self is event target*/
          if (element.matches(css)) {
            eventTargets.push(this.$(`[internal-id=${id}]`)!);
          }

          /* reattach event handlers*/
          eventTargets.forEach((target) => {
            this.boundEventListener[css].forEach(
              ({ event, handler, option }) => {
                target.addEventListener(event, handler, option);
              }
            );
          });
        }
      }
      options?.onRender?.bind(this)(property);
    }
    initialRender() {
      /* Import template */
      const rawTemp = document.createElement("template");
      rawTemp.innerHTML = this.rawHTML;
      /* Make wrapper */
      if (options?.wrapperElement == "none") {
        this.root.appendChild(rawTemp.content);
      } else {
        const wrapper = document.createElement(
          options?.wrapperElement ?? "main"
        );
        wrapper.appendChild(rawTemp.content);
        this.root.appendChild(wrapper);
      }
      /* Process dynamic fields *
      /*    - add internal id */
      this.$$("[re-render]").forEach((el) => {
        const id = getId();
        el.setAttribute("internal-id", id);
      });
      /*    - register dynamic field */
      this.$$("[re-render]").forEach((el) => {
        const dataAttr =
          el
            .getAttribute("re-render")
            ?.split(",")
            .map((e) => e.trim()) ?? [];
        const id = el.getAttribute("internal-id")!;
        for (let attr  of dataAttr) {
          if (!this.dynamicFields[attr]) {
            this.dynamicFields[attr] = [];
          }
          this.dynamicFields[attr].push({ id, raw: el.outerHTML });
        }
      });
      /*render full root*/
      this.root.innerHTML = parseTemplate(this.root.innerHTML, this.state);
      this.attachListener();
    }

    connectedCallback() {
      this.initialRender();
      options?.onMount?.bind(this)();
    }
    disconnectedCallback() {
      options?.onUnMount?.bind(this)();
      this.removeListener();
    }
    connectedMoveCallback() {
      console.log("Custom move-handling logic here.");
    }
    attributeChangedCallback(
      attrName: string,
      oldValue: string,
      newValue: string
    ) {
      console.log(attrName);
      options?.onAttributeChange?.bind(this)(attrName, oldValue, newValue);
    }
  }
  customElements.define(name, Component);
}
