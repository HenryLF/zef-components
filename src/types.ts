export type EventHandle<T extends object> = {
  event: string;
  handler: (this: BaseComponent<T>, ev: Event) => void;
  option?: AddEventListenerOptions | boolean;
};
export type EventListernerRecord<T extends object> = Record<
  string,
  EventHandle<T>[]
>;

export type DynamicFieldsRecord<T> =
  | Record<keyof T, { id: string; raw: string }[]>
  | {};

export class BaseComponent<T extends object, K = unknown> extends HTMLElement {
  rawHTML: string;
  root: ShadowRoot;
  name: string;
  state: T;
  readonly value: K;
  $: (css: string) => HTMLElement | null;
  $$: (css: string) => HTMLElement[] | null;
  destroy: () => void;
}

export interface FactoryOptions<T extends object> {
  state?: T | ((this: Omit<BaseComponent<T>, "state">) => T);
  value?: (this: BaseComponent<T>) => any;
  onMount?: (this: BaseComponent<T>) => void;
  onUnMount?: (this: BaseComponent<T>) => void;
  onRender?: (this: Omit<BaseComponent<T>, "state"> & {readonly state : T} , property : keyof T) => void;
  eventListener?: EventListernerRecord<T>;
  wrapperElement?: keyof HTMLElementTagNameMap | "none";
  noShadow?: true;
  onAttributeChange?: (
    this: BaseComponent<T>,
    name?: string,
    oldValue?: string,
    newValue?: string
  ) => void;
  observedAttibutes?:string[]
}
