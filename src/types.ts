import { StoreApi } from "zustand/vanilla";

export type GlobalStore = {
  [key: string]: any;
};

export interface FactoryOption<T extends object> {
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

  eventListener?: EventListenerRecord<T>;
  storeListener?: Record<Exclude<string, keyof T>, string>;
  noShadowRoot?: boolean;
}

export interface WebComponent<T extends object> extends HTMLElement {
  name: string;
  root: HTMLElement | ShadowRoot;
  rawHTML: string;

  state: T;
  value: any;

  $: (css: string) => Element | null;
  $$: (css: string) => NodeListOf<Element>;

  $store: any;

  $$on: (css: string, ev: EventHandle<T>) => void;
  $$off: (css: string, event: string) => void;

  reRenderProperty: (this: WebComponent<T>, pathname: string) => void;

  _globalStore: StoreApi<GlobalStore>;
  _dynamicFieldRecord: DynamicFieldsRecord;
  _eventListenerRecord: EventListenerRecord<T>;
  _storeListenerRecord: [() => void];
  _valueUpdater: (this: WebComponent<T>) => any;
}

export type DynamicFieldsRecord = Record<string, DynamicField[]>;

export type DynamicField = {
  id: string;
  type: "loop" | "declaration";
  raw: string;
};

export type EventListenerRecord<T extends object> = Record<
  string,
  EventHandle<T>[]
>;

export type EventHandle<T extends object> = {
  event: string;
  handler: (this: WebComponent<T>, ev: Event) => void;
  options?: EventListenerOptions;
};
