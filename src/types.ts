import { StoreApi } from "zustand/vanilla";

export type StateType = {
  [key: string]: any;
};

export type BoundStoreType = {
  [key: string]: any;
};

export type GlobalStore = {
  [key: string]: any;
};

export interface FactoryOption<T extends StateType, K extends BoundStoreType> {
  observedAttributes?: string[];
  value?: (this: WebComponent<T, K>) => any;
  state?: T | ((this: WebComponent<T, K>) => T);

  onMount?: (this: WebComponent<T, K>) => void;
  onUnmount?: (this: WebComponent<T, K>) => void;
  onRender?: (this: WebComponent<T, K>, path: string) => void;

  onAttributeChanged?: (
    this: WebComponent<T, K>,
    name: string,
    oldValue: string,
    newValue: string
  ) => void;

  eventListener?: EventListenerRecord;
  storeListener?: K;
  noShadowRoot?: boolean;
}

export interface WebComponent<
  T extends StateType = StateType,
  K extends BoundStoreType = BoundStoreType
> extends HTMLElement {
  name: string;
  root: HTMLElement | ShadowRoot;
  rawHTML: string;

  state: T & Record<keyof K, () => any>;
  value: any;

  $: (css: string) => Element | null;
  $$: (css: string) => NodeListOf<Element>;

  $store: any;

  $$on: (css: string, ev: EventHandle) => void;
  $$off: (css: string, event: string) => void;

  reRenderProperty: (this: WebComponent<T, K>, pathname: string) => void;

  _globalStore: StoreApi<GlobalStore>;
  _dynamicFieldRecord: DynamicFieldsRecord;
  _eventListenerRecord: EventListenerRecord;
  _storeListenerRecord: [() => void];
  _valueUpdater: (this: WebComponent<T, K>) => any;
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
  handler: (this: WebComponent, ev: Event) => void;
  options?: EventListenerOptions;
};
