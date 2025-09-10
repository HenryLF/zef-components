# Zef-components

A lightweight library for creating reactive web components with state management, declarative templates, and seamless store integration.

Think of it as "React-at-home" - if your home is a 6kB JS script - or "a less-opinionated AlpineJS" that doesn't break CSP.

## Features

- 🔧 **Declarative Templates** - Use Mustache-like syntax for dynamic content
- ⚡ **Reactive State** - Automatically re-render parts of HTML when state changes
- 🔄 **State Management** - Global Zustand-powered store integration
- 🎯 **Event Handling** - Declarative event listener setup
- 🔁 **Loop Rendering** - Built-in `for-loop` directive for repetitive content
- 🎨 **Shadow DOM** - Optional shadow DOM support for style encapsulation
- 🏷️ **TypeScript** - Fully typed with comprehensive type definitions

## Installation

```bash
npm install zef-components
```

## Usage Guide

### Basic Component

Define your component:

```typescript
const counterHTML = `
  <div>
    <h2 re-render="count">Count: {{count}}</h2>
    <button id="inc">Increment</button>
  </div>
`;

Factory("my-counter", counterHTML, {
  state: { count: 0 },
  eventListener: {
    "#inc": [
      {
        event: "click",
        handler() {
          this.state.count++;
        },
      },
    ],
  },
});
```

Build your bundle with esbuild and import it in your html :

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <script type="module" src="./index.js"></script>
  </head>
  ....
</html>
```

Use it in your HTML:

```html
<body>
  <my-counter></my-counter>
</body>
```

### Template Syntax

#### Variable Interpolation

Reference any properties of the component's `state` or `store` using Mustache syntax:

```html
{{propertyName}} {{property.nestedProperty}}
```

Values are rendered as follows:

- For primitive values: `state.propertyName?.toString()`
- For functions: `state.propertyName?.call()?.toString()`

#### Ternary Expressions

Use ternary operators for conditional rendering:

```html
<div style="display:{{open?:'none'}};"></div>
```

Notes:

- True/false values must be strings delimited by `'`, `"`, or backticks
- Both expressions are optional (default to empty strings)
- Quotes are removed during rendering

#### Re-render Directive

Specify dependencies for reactive updates:

```html
<div re-render="date,person.age"></div>
```

This element will re-render when:

- The modified property path starts with a dependency
- A dependency starts with the modified property path

#### Loop Directive

Generate HTML through iteration:

```html
<div for-loop="item in collection">{{item.name}}</div>
<div for-loop="item of collection">{{item.name}}</div>
```

Supported collection types:

- Numbers: iterates from 0 to collection-1
- Arrays: iterates through each item

Note: Avoid using `re-render` on or inside `for-loop` directives. For complex reactivity, consider creating separate components.

### Query Selection

Use these methods to query elements within your component:

- `this.$(css)` - Alias for `querySelector`
- `this.$$(css)` - Alias for `querySelectorAll`

### Lifecycle Callbacks

Hook into component lifecycle events:

```typescript
Factory("my-component", html, {
  onMount() {
    // Fired after component is inserted into DOM
    // If you need attribute to initialize your
    // component's state this is where you do it.
  },
  onUnmount() {
    // Fired when component is removed from DOM
  },
  onRender(path) {
    // Fired after re-rendering, with the property path that triggered it
    // Warning: Can cause infinite loops if not handled carefully
  },
  onAttributeChanged(name, oldValue, newValue) {
    // Fired when observed attributes change
  },
  observedAttributes: ["data-value"], // Required for attribute change detection
});
```

### Input Value Interface

Components implement an HTMLInput-like interface:

```typescript
Factory("wc-test", html, {
  state: { count: 15 },
  value() {
    return this.state.count; // Updates component value on state changes
  },
});
```

The `input` event is only triggered when the computed value changes.

### Shadow DOM and Styling

Components use Shadow DOM by default for style encapsulation:

```typescript
Factory("my-component", html, {
  noShadowRoot: false, // Default, enables Shadow DOM
});

Factory("inline-component", html, {
  noShadowRoot: true, // Disables Shadow DOM for inline reactivity
});
```

When using Shadow DOM:

- Styles are encapsulated within the component
- Use `<slot>` elements to project light DOM content
- Set `noShadowRoot: true` for small reactive HTML blocks

### Event Handling

Declare event listeners in options or programmatically:

```typescript
// Option-based declaration
Factory("my-component", html, {
  eventListener: {
    ".btn": [
      {
        event: "click",
        handler() {
          /* ... */
        },
        options: { once: true },
      },
    ],
  },
});

// Programmatic registration
this.$$on(".btn", {
  event: "click",
  handler() {
    /* ... */
  },
});

// Deregistration
this.$$off(".btn", "click");
```

Note: Because a re-render will replace the element outer html, any event listener attached with addEventListener are lost. **_These Event listeners, however, will be automatically reattached after re-renders._**

### Global Store Integration

Access and manage global state with Zustand:

```typescript
// External store access
import { globalStore } from 'zef-components';
globalStore.setState({ user: { name: "John" } });

const html = `
<h1>{{localUser.name}}</h1>
`

// Component store binding
Factory("user-display", html, {
  storeListener: {
    localUser: "user" // Maps store.user to component state
  },
  onMount(){
    ...
    // Internal store access
      this.$store = { user: { name: "Jane" } };
  }
});

```

## API Reference

### Factory Options (`FactoryOption<T>`)

| Option               | Type                                                                                | Description                                   |
| -------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------- |
| `observedAttributes` | `string[]`                                                                          | Array of attributes to observe for changes    |
| `value`              | `(this: WebComponent<T>) => any`                                                    | Function that returns the component's value   |
| `state`              | `T \| ((this: WebComponent<T>) => T)`                                               | Component state object or factory function    |
| `onMount`            | `(this: WebComponent<T>) => void`                                                   | Lifecycle hook called when component mounts   |
| `onUnmount`          | `(this: WebComponent<T>) => void`                                                   | Lifecycle hook called when component unmounts |
| `onRender`           | `(this: WebComponent<T>, path: string) => void`                                     | Hook called after re-rendering                |
| `onAttributeChanged` | `(this: WebComponent<T>, name: string, oldValue: string, newValue: string) => void` | Called when observed attributes change        |
| `eventListener`      | `EventListenerRecord<T>`                                                            | Event listener configuration                  |
| `storeListener`      | `Record<Exclude<string, keyof T>, string>`                                          | Store binding configuration                   |
| `noShadowRoot`       | `boolean`                                                                           | Disable shadow DOM encapsulation              |

### Component Instance (`WebComponent<T>`)

This object inherits from all the methods of `HTMLElement`, including `remove()`, `getAttribute()`

| Property/Method              | Description                                      |
| ---------------------------- | ------------------------------------------------ |
| `state`                      | Reactive state object                            |
| `value`                      | Component's current value                        |
| `root`                       | Root element (shadow root or element itself)     |
| `$store`                     | Global store accessor                            |
| `$(css)`                     | Query single element                             |
| `$$(css)`                    | Query multiple elements                          |
| `$$on(css, eventHandle)`     | Register event listener                          |
| `$$off(css, event)`          | Remove event listener                            |
| `reRenderProperty(pathname)` | Manually trigger re-render for specific property |

### Types

```ts
type GlobalStore = {
  [key: string]: any;
};

type EventListenerRecord<T extends object> = Record<string, EventHandle<T>[]>;

type EventHandle<T extends object> = {
  event: string;
  handler: (this: WebComponent<T>, ev: Event) => void;
  options?: EventListenerOptions;
};
```

Keys of `EventListenerRecord` are css selectors.

`EventHandle` represent an event listener :

- `event` is the type of the event to listen to eg. `click`
- `handler` is the listener, it **_will be bound to the component_**, do not expect `this` to be the event target
- `options` are the same as [addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#syntax)

## Examples

### Todo List Component

```typescript
import Factory from "zef-components";
const todoHTML = /*html*/ `
  <div>
    <h2>Todo List</h2>
    <form>
      <input type="text">
      <button type="submit" >Add</button>
    </form>
    <ul for-loop="index,item in items">
    <li>
      <span>{{item.text}}</span>
      <button class="delete" index={{index}} >Delete</button>
    </li>
    </ul>
  </div>
`;

Factory<{ items: { text: string }[] }>("wc-test", todoHTML, {
  state: {
    items: [],
  },
  eventListener: {
    form: [
      {
        event: "submit",
        handler(e) {
          e.preventDefault();
          const input = this.$("input") as HTMLInputElement;
          this.state.items.unshift({ text: input.value });
          input.value = "";
        },
      },
    ],
    ".delete": [
      {
        event: "click",
        handler(ev) {
          const idAttr = (ev.target as HTMLButtonElement).getAttribute("index");
          const id = parseInt(idAttr ?? "");
          this.state.items = this.state.items.filter((_, k) => k != id);
        },
      },
    ],
  },
});
```

## Developer experience

### Building components

You can use this esbuild config :

```js
// esbuild.config.mjs
import { build, context } from "esbuild";
const arg = process.argv.at(-1);

const config = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  outdir: "dist",
  minify: true,
};

if (arg == "dev") {
  const ctx = await context({
    ...config,
    minify: false,
  });
  await ctx.watch();
} else {
  await build({
    ...config,
  });
}
```

Usage :

```bash
node esbuild.config.mjs
# or dev mode :
node esbuild.config.mjs dev
```

### Highlighting and completion

In VSCode you can edit your settings to have a shortcut toggling on and off the html mode :

```json
// keybindings.json
[
  ...,
    {
        "key": "ctrl+shift+h", // Your preferred shortcut
        "command": "workbench.action.editor.changeLanguageMode",
        "args": "html",
        "when": "editorLangId != 'html'" // Set HTML only when not already HTML
    },
    {
        "key": "ctrl+shift+h", //Also here
        "command": "workbench.action.editor.changeLanguageMode",
        "args": "ts", //Set to your default language
        "when": "editorLangId == 'html'"
    }
]
```

There is also this extension : [es6-string-html](https://marketplace.visualstudio.com/items?itemName=Tobermory.es6-string-html). That highlights your string if you place a `/*html*/` before.

### Patterns

Here are some patterns that i've found usefull.

#### Event Handles

Declaring many event handle can be very verbose, I would suggest you define a helper method like :

```tsx
const playHandle = (event: string, play: boolean) => ({
  event,
  handler(this: WebComponent<StateType>) {
    this.state.playing = play;
    ... //event listener logic
  },
});
```

And then use it like this :

```ts

Factory<StateType>("hi-fi", html, {
  ...
  eventListener: {
    ".container": [
      openHandle("mouseenter", true),
      openHandle("mouseleave", false),
    ],
    ".record": [
      playHandle("mousedown", false),
      playHandle("mouseup", true),
      playHandle("touchstart", false),
      playHandle("touchend", true),
    ],
  ...
  }
  })

```

Which feels better to me.

#### Reactive Style

~~Sometimes~~ Frequently a well placed templated `style` tag might be smarter than relying on the elements style attribute.
For instance :

```html
<div class="record">
  <div style="{{open?'auto':'none'}}" class="id"></div>
  <div class="picture"></div>
  <div style="{{open?'auto':'none'}}" class="name"></div>
</div>
```

Will be challenging to work with the more and more elements share this behavior.

Whereas this looks waaay better, and make it easier to work with complex CSS:

```html
<style>
  .modal {
    opacity : {{open?'1': "0";}}
  }
</style>
<div class="record">
  <div class="modal id"></div>
  <div class="picture"></div>
  <div class="modal name"></div>
</div>
```

You don't have to put all your component's style inside a `<style>` tag. You can also import a stylesheet via a `<link>`, and still have a small `<style>` tag with your reactive css rules.

#### Working with children

If you have enabled shadow root (the default), all the "light DOM" child of your component will be casted in any unamed `<slot>` tag of your html.

You can use named slot as well, see [Using templates and slots](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots).

If your want to listen to children you'll need to set up a MutationObserver like so.

```ts

Factory("hifi-spectrum", graphHtml, {
  ....,
  onMount() {
    const callback = () => {
      /*updating logic*/
    };
    const observer = new MutationObserver(callback);
    observer.observe(this, { childList: true });
    /*call the callback at least once for initialization*/
    callback();
  },
  ....
});
```

If this comes up a lot, it could be added as an option.
