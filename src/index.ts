import { createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import {
  clearStoreListeners,
  createReactiveProxy,
  initializeEventListener,
  initializePropsListeners,
  initializeStoreListeners,
  reattachEventListeners,
  registerForLoop,
  registerIfBlock,
  registerReRenders,
  renderForLoop,
  renderIfBlock,
  updateProps,
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
  StoreUpdater,
  PropListenerRecord,
  BoundState,
} from "./types";
import {
  marshallJSON,
  maybeCall,
  parseDocumentFragment,
  parseHTMLDeclaration,
  parseJSON,
} from "./utils";

export const globalStore = createStore<GlobalStore>(
  //@ts-expect-error zustand middleware
  subscribeWithSelector(immer(() => ({})))
);

export { parseJSON, marshallJSON };

export default function Factory<
  T extends StateType,
  K extends BoundState = BoundState,
  L extends BoundState = BoundState
>(name: string, html: string, options?: FactoryOption<T, K, L>) {
  const observedAttributes: string[] = [];
  if (options?.observedAttributes) {
    observedAttributes.push(...options.observedAttributes);
  }
  if (options?.props) {
    observedAttributes.push(
      ...Object.values(options.props).map((prop) => prop.replace("json::", ""))
    );
  }

  class Component extends HTMLElement {
    static observedAttributes = observedAttributes;
    state: T & Record<keyof K, () => any> & Record<keyof L, () => string>;
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
    _propsListenerRecord: PropListenerRecord = {};
    _valueUpdater: any;

    constructor() {
      super();

      const initialState = maybeCall(options?.state, this) ?? {};

      initializePropsListeners.apply(this, [options?.props, initialState]);

      initializeStoreListeners.apply(this, [
        options?.storeListener,
        initialState,
      ]);

      this.state = createReactiveProxy.apply(this, [initialState]) as T &
        Record<keyof K, any> &
        Record<keyof L, any>;

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
      registerIfBlock.apply(this);
      registerForLoop.apply(this);
      registerReRenders.apply(this);

      this.root.innerHTML = parseHTMLDeclaration(
        this.root.innerHTML,
        this.state
      );

      initializeEventListener.apply(this, [options?.eventListener ?? {}]);
      //@ts-expect-error user provided method
      options?.onMount?.apply(this);
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
      updateProps.apply(this, [name, oldValue, newValue]);
      //@ts-expect-error user provided method
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
          case "loop":
            renderForLoop.apply(this, [raw, targetElement]);
            break;
          case "ifblock":
            renderIfBlock.apply(this, [pathname, raw, targetElement]);
          default:
        }
        targetElement.outerHTML = parseHTMLDeclaration(
          targetElement.outerHTML,
          this.state
        );
        reattachEventListeners.apply(this, [id]);
      }
      //@ts-expect-error user provided method
      options?.onRender?.apply(this, [pathname]);
    }

    disconnectedCallback() {
      clearStoreListeners.apply(this);
      //@ts-expect-error user provided method
      options?.onUnmount?.apply(this);
    }

    /* magic method */
    $getStore() {
      return this._globalStore.getState();
    }
    $setStore(updater: StoreUpdater) {
      this._globalStore.setState(updater);
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
        ({ event: recordedEvent }) => {
          return recordedEvent === event;
        }
      );
      for (const { event, handler, options } of toRemove) {
        this.$$(css)?.forEach((target) => {
          target.removeEventListener(event, handler, options);
        });
      }

      this._eventListenerRecord[css] = this._eventListenerRecord[css].filter(
        ({ event: recordedEvent }) => {
          return recordedEvent != event;
        }
      );
    }
  }
  customElements.define(name, Component);
}
