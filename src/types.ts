import { StoreApi } from "zustand/vanilla";

export type StateType = {
  [key: string]: any;
};

export type GlobalStore = {
  [key: string]: any;
};

export interface FactoryOption<T extends StateType> {
  observedAttributes?: string[];
  value?: (this: WebComponent<T>) => any;
  state?: T | ((this: WebComponent<T>) => T);

  onMount?: (this: WebComponent<T>) => void;
  onUnmount?: (this: WebComponent<T>) => void;
  onRender?: (this: WebComponent<T>, path: string) => void;

  onAttributeChanged?: (
    this: WebComponent<T>,
    name: string,
    oldValue: string,
    newValue: string
  ) => void;

  eventListener?: EventListenerRecord;
  storeListener?: Record<Exclude<string, keyof T>, string>;
  noShadowRoot?: boolean;
}

export interface WebComponent<T extends StateType> extends HTMLElement {
  name: string;
  root: HTMLElement | ShadowRoot;
  rawHTML: string;

  state: T;
  value: any;

  $: (css: string) => Element | null;
  $$: (css: string) => NodeListOf<Element>;

  $store: any;

  $$on: (css: string, ev: EventHandle) => void;
  $$off: (css: string, event: string) => void;

  reRenderProperty: (this: WebComponent<T>, pathname: string) => void;

  _globalStore: StoreApi<GlobalStore>;
  _dynamicFieldRecord: DynamicFieldsRecord;
  _eventListenerRecord: EventListenerRecord;
  _storeListenerRecord: [() => void];
  _valueUpdater: (this: WebComponent<T>) => any;
}

export type DynamicFieldsRecord = Record<string, DynamicField[]>;

export type DynamicField = {
  id: string;
  type: "loop" | "declaration";
  raw: string;
};

export type EventListenerRecord = Record<string, EventHandle[]>;

export type EventHandle = {
  event: string;
  handler: (this: WebComponent<StateType>, ev: Event) => void;
  options?: EventListenerOptions;
};
