import { createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";

import {
  clearStoreListeners,
  createReactiveProxy,
  initializeEventListener,
  initializeStoreListeners,
  reattachEventListeners,
  registerForLoop,
  registerRerenders as registerReRenders,
  renderForLoop,
} from "./methods";
import {
  FactoryOption,
  DynamicFieldsRecord,
  WebComponent,
  EventListenerRecord,
  DynamicField,
  EventHandle,
  GlobalStore,
  StateType,
} from "./types";
import {
  maybeCall,
  parseDocumentFragment,
  parseHTMLDeclaration,
} from "./utils";

export const globalStore = createStore<GlobalStore>(
  //@ts-expect-error zustand middleware
  subscribeWithSelector(() => ({}))
);

export default function Factory<T extends StateType>(
  name: string,
  html: string,
  options?: FactoryOption<T>
) {
  class Component extends HTMLElement {
    static observedAttributes = options?.observedAttributes ?? [];

    state: T;
    _globalStore = globalStore;
    _value: any;
    get value() {
      return this._value;
    }
    set value(val: any) {
      this.dispatchEvent(
        new CustomEvent("input", {
          detail: { newValue: val, oldValue: this._value },
        })
      );
      this._value = val;
    }
    name: string = name;
    root: HTMLElement | ShadowRoot;
    rawHTML: string;

    _dynamicFieldRecord: DynamicFieldsRecord = {};
    _eventListenerRecord: EventListenerRecord = {};
    _storeListenerRecord: [() => void] = [() => {}];
    _valueUpdater: any;

    constructor() {
      super();

      const initialState = maybeCall(options?.state, this) ?? {};

      initializeStoreListeners.apply(this, [
        options?.storeListener,
        initialState,
      ]);

      this.state = createReactiveProxy.apply(this, [initialState]) as T;

      this._valueUpdater = options?.value ?? null;
      this._value = maybeCall(this._valueUpdater, this);

      this.rawHTML = html;

      if (!options?.noShadowRoot) {
        this.root = this.attachShadow({ mode: "closed" });
      } else {
        this.root = this;
      }
      /*Initial render*/
      const docFragment = parseDocumentFragment(this.rawHTML);
      this.root.appendChild(docFragment);
    }

    connectedCallback() {
      registerForLoop.apply(this);
      registerReRenders.apply(this);

      this.root.innerHTML = parseHTMLDeclaration(
        this.root.innerHTML,
        this.state
      );

      initializeEventListener.apply(this, [options?.eventListener ?? {}]);

      options?.onMount?.apply(this);
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
      options?.onAttributeChanged?.apply(this, [name, oldValue, newValue]);
    }

    reRenderProperty(this: WebComponent<StateType>, pathname: string) {
      /* Called on change of the `pathname` state property*/
      const fieldsToUpdate = Object.entries(this._dynamicFieldRecord).reduce<
        DynamicField[]
      >((acc, [key, updateData]) => {
        if (pathname.startsWith(key) || key.startsWith(pathname)) {
          acc.push(...updateData);
        }
        return acc;
      }, []);

      for (let { id, raw, type } of fieldsToUpdate) {
        const targetElement = this.root.querySelector(`[internal-id=${id}]`);
        if (!targetElement) continue;

        switch (type) {
          case "declaration":
            targetElement.outerHTML = parseHTMLDeclaration(raw, this.state);
            break;
          case "loop":
            renderForLoop.apply(this, [raw, targetElement]);
            targetElement.outerHTML = parseHTMLDeclaration(
              targetElement.outerHTML,
              this.state
            );
            break;
          default:
        }
        reattachEventListeners.apply(this, [id]);
      }
      options?.onRender?.apply(this, [pathname]);
    }

    disconnectedCallback() {
      clearStoreListeners.apply(this);
      options?.onUnmount?.apply(this);
    }

    /* magic method */
    get $store() {
      return this._globalStore.getState();
    }
    set $store(val: any) {
      this._globalStore.setState(val);
    }

    $(css: string) {
      return this.root.querySelector(css);
    }
    $$(css: string) {
      return this.root.querySelectorAll(css);
    }

    $$on(css: string, { event, handler, options }: EventHandle) {
      const boundHandler = handler.bind(this);
      if (!this._eventListenerRecord[css]) {
        this._eventListenerRecord[css] = [];
      }
      this._eventListenerRecord[css].push({
        event,
        handler: boundHandler,
        options,
      });
      this.$$(css)?.forEach((target) => {
        target.addEventListener(event, boundHandler, options);
      });
    }

    $$off(css: string, event: string) {
      if (!this._eventListenerRecord[css]) return;
      const toRemove = this._eventListenerRecord[css].filter(
        ({ event: eventName }) => {
          return eventName === event;
        }
      );
      for (const { event, handler, options } of toRemove) {
        this.$$(css)?.forEach((target) => {
          target.removeEventListener(event, handler, options);
        });
      }
      this._eventListenerRecord[css] = this._eventListenerRecord[css].filter(
        (handle) => {
          return !toRemove.includes(handle);
        }
      );
    }
  }
  customElements.define(name, Component);
}
