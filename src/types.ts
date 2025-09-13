import { StoreApi } from "zustand/vanilla";

export type StateType = {
  [key: string]: any;
};

export type GlobalStore = {
  [key: string]: any;
};

export interface FactoryOption<
  T extends StateType,
  K extends StateType,
  L extends StateType
> {
  observedAttributes?: string[];
  value?: (this: WebComponent<T, K, L>) => any;
  state?: T | ((this: WebComponent<T, K, L>) => T);
  props?: L;

  onMount?: (this: WebComponent<T, K>) => void;
  onUnmount?: (this: WebComponent<T, K, L>) => void;
  onRender?: (this: WebComponent<T, K, L>, path: string) => void;

  onAttributeChanged?: (
    this: WebComponent<T, K, L>,
    name: string,
    oldValue: string,
    newValue: string
  ) => void;

  eventListener?: EventListenerRecord;
  storeListener?: K;
  noShadowRoot?: boolean;
}

export type StoreUpdater<R = void> = (
  arg: GlobalStore
) => R extends void ? void : never;

export interface WebComponent<
  T extends StateType = StateType,
  K extends StateType = StateType,
  L extends StateType = StateType
> extends HTMLElement {
  name: string;
  root: HTMLElement | ShadowRoot;
  rawHTML: string;

  state: T & Record<keyof K, () => any> & Record<keyof L, () => string | any>;
  value: any;

  $: (css: string) => Element | null;
  $$: (css: string) => NodeListOf<Element>;

  $getStore: () => GlobalStore;
  $setStore: (updater: StoreUpdater) => void;

  $$on: (css: string, ev: EventHandle) => void;
  $$off: (css: string, event: string) => void;

  reRenderProperty: (this: WebComponent<T, K, L>, pathname: string) => void;

  _globalStore: StoreApi<GlobalStore>;
  _dynamicFieldRecord: DynamicFieldsRecord;
  _eventListenerRecord: EventListenerRecord;
  _storeListenerRecord: [() => void];
  _propsListenerRecord: PropListenerRecord;
  _valueUpdater: (this: WebComponent<T, K, L>) => any;
}

export type DynamicFieldsRecord = Record<string, DynamicField[]>;

export type DynamicField = {
  id: string;
  type: "loop" | "declaration";
  raw: string;
};

export type EventListenerRecord = Record<string, EventHandle[]>;
export type PropListenerRecord = Record<
  string,
  {
    type: "string" | "json";
    key: string;
  }
>;

export type EventHandle = {
  event: string;
  handler: (this: WebComponent, ev: Event) => void;
  options?: EventListenerOptions;
};
