# Zef Components - TypeScript Documentation

A lightweight, reactive Web Component library with full TypeScript support.

## Factory Function

```typescript
function Factory<T extends object>(
  name: string,
  temp: string,
  options?: FactoryOptions<T>
): void
```

### Type Parameters
- `T extends object`: The type of the component's state object

### Parameters
- `name: string`: The custom element name (must contain a hyphen)
- `temp: string`: The HTML template string
- `options?: FactoryOptions<T>`: Configuration options for the component

## FactoryOptions Type

```typescript
interface FactoryOptions<T extends object> {
  state?: T | ((this: BaseComponent<T>) => T);
  value?: (this: BaseComponent<T>) => any;
  onMount?: (this: BaseComponent<T>) => void;
  onUnMount?: (this: BaseComponent<T>) => void;
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
```

### Option Details

#### state
Defines the component's reactive state.

**Type:**
```typescript
T | ((this: BaseComponent<T>) => T)
```

- Can be a static state object of type `T`
- Or a factory function that returns a state object of type `T`

#### value
Defines the component's value property.

**Type:**
```typescript
(this: BaseComponent<T>) => any
```

- Function that returns the component's current value
- Triggers an "input" event when the value changes

#### onMount
Callback executed when the component is connected to the DOM.

**Type:**
```typescript
(this: BaseComponent<T>) => void
```

#### onUnMount
Callback executed when the component is disconnected from the DOM.

**Type:**
```typescript
(this: BaseComponent<T>) => void
```

#### onRender
Callback executed after a property update and re-render.

**Type:**
```typescript
(this: BaseComponent<T>, property: keyof T) => void
```

- Receives the name of the property that triggered the update
- Avoid setting state in this callback to prevent infinite loops

#### eventListener
Defines event handlers for elements within the component.

**Type:**
```typescript
EventListernerRecord<T> = Record<string, EventHandle<T>[]>
```

Where:
```typescript
type EventHandle<T extends object> = {
  event: string;
  handler: (this: BaseComponent<T>, ev: Event) => void;
  option?: AddEventListenerOptions | boolean;
};
```

- Keys are CSS selectors
- Values are arrays of event handlers for elements matching the selector

#### wrapperElement
Specifies a wrapper element for the component's content.

**Type:**
```typescript
keyof HTMLElementTagNameMap | "none"
```

- Use standard HTML element names
- Use "none" to avoid creating a wrapper element
- Defaults to "main" if not specified

#### noShadow
Disables Shadow DOM encapsulation when set to `true`.

**Type:**
```typescript
true | undefined
```

#### onAttributeChange
Callback executed when observed attributes change.

**Type:**
```typescript
(
  this: BaseComponent<T>,
  name?: string,
  oldValue?: string,
  newValue?: string
) => void
```

#### observedAttibutes
Array of attribute names to observe for changes.

**Type:**
```typescript
string[]
```

## BaseComponent Interface

```typescript
interface BaseComponent<T extends object, K = any> extends HTMLElement {
  rawHTML: string;
  root: ShadowRoot | HTMLElement;
  state: T;
  readonly value: K;
  name: string;
  
  $(css: string): Element | null;
  $$(css: string): NodeListOf<Element>;
  destroy(): void;
}
```

### Properties
- `rawHTML: string`: The original template string
- `root: ShadowRoot | HTMLElement`: The component's root element
- `state: T`: The component's reactive state
- `value: K`: The component's current value (readonly)
- `name: string`: The component's name

### Methods
- `$(css: string): Element | null`: Query selector within the component's root
- `$$(css: string): NodeListOf<Element>`: Query selector all within the component's root
- `destroy(): void`: Removes the component from the DOM

## Template Utilities

### parseTemplate Function

```typescript
function parseTemplate(rawHTML: string, object: object): string
```

Processes template expressions in the format:
- `{{property.path}}` - Simple property access
- `{{property.path? 'true text' : 'false text'}}` - Ternary expression
- `{{property.path? 'true text'}}` - Ternary with only true case (false case empty)

### getId Function

```typescript
function getId(): string
```

Generates a unique ID for internal use in the template system.

## Event Handling

Event handlers are bound to the component instance and have access to:
- `this.state`: The component's current state
- `this.value`: The component's current value
- All methods and properties of the BaseComponent

## Reactive System

The library uses JavaScript Proxies to create reactive state objects. When a state property changes:

1. The proxy setter is triggered
2. Elements with `re-render` attributes that depend on the changed property are updated
3. The component's value is recalculated
4. If the value changed, an "input" event is dispatched
5. The `onRender` callback is executed (if defined)

## Best Practices

1. **State Updates**: Modify state only in event handlers or lifecycle methods
2. **DOM Manipulation**: Use the `onRender` callback for additional DOM updates
3. **Event Listeners**: Register event listeners through the `eventListener` option for automatic cleanup
4. **Re-render Attributes**: Use the `re-render` attribute sparingly to optimize performance
5. **Type Safety**: Define precise types for your component state to get full TypeScript benefits

## Example with Type Definitions

```typescript
interface MyComponentState {
  count: number;
  message: string;
  items: string[];
}

Factory<MyComponentState>('my-component', `
  <div>
    <p>{{message}}</p>
    <p re-render="count">Count: {{count}}</p>
    <button id="increment">Add</button>
  </div>
`, {
  state: {
    count: 0,
    message: 'Hello World',
    items: []
  },
  value() {
    return this.state.count;
  },
  eventListener: {
    '#increment': [{
      event: 'click',
      handler() {
        this.state.count++;
      }
    }]
  },
  onRender(property) {
    if (property === 'count') {
      console.log(`Count changed to: ${this.state.count}`);
    }
  }
});
```