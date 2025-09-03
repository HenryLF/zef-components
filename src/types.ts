export type EventHandle<T extends object> = {
  event: string;
  handler: (this: BaseComponent<T>, ev: Event) => void;
  option?: AddEventListenerOptions | boolean;
};
export type EventListernerRecord<T extends object> = Record<
  string,
  EventHandle<T>[]
>;

export type DynamicFieldsRecord<T extends object> = Record<
  keyof T | string,
  { id: string; raw: string }[]
>;

export interface BaseComponent<T extends object, K = unknown>
  extends HTMLElement {
  rawHTML: string;
  root: ShadowRoot | HTMLElement;
  name: string;
  state: T;
  readonly value: K;
  $: (css: string) => Element | null;
  $$: (css: string) => NodeListOf<Element>;
  destroy: () => void;
}

export interface FactoryOptions<T extends object> {
  state?: T | ((this: BaseComponent<T>) => T);
  value?: (this: BaseComponent<T>) => any;
  onMount?:  (this: BaseComponent<T>) => void   | Promise<void>;
  onUnMount?:  (this: BaseComponent<T>) => void;
  onRender?: (this: BaseComponent<T>, property: keyof T) => void;
  eventListener?: EventListernerRecord<T>;
  wrapperElement?: keyof HTMLElementTagNameMap | "none";
  noShadow?: true;
  onAttributeChange?: (
    this: BaseComponent<T>,
    name?: string,
    oldValue?: string,
    newValue?: string
  ) => void;
  observedAttibutes?: string[];
}
