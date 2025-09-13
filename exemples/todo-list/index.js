"use strict";
(() => {
  // node_modules/zustand/esm/vanilla.mjs
  var createStoreImpl = (createState) => {
    let state;
    const listeners = /* @__PURE__ */ new Set();
    const setState = (partial, replace) => {
      const nextState = typeof partial === "function" ? partial(state) : partial;
      if (!Object.is(nextState, state)) {
        const previousState = state;
        state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
        listeners.forEach((listener) => listener(state, previousState));
      }
    };
    const getState = () => state;
    const getInitialState = () => initialState;
    const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };
    const api = { setState, getState, getInitialState, subscribe };
    const initialState = state = createState(setState, getState, api);
    return api;
  };
  var createStore = ((createState) => createState ? createStoreImpl(createState) : createStoreImpl);

  // node_modules/zustand/esm/middleware.mjs
  var subscribeWithSelectorImpl = (fn) => (set2, get, api) => {
    const origSubscribe = api.subscribe;
    api.subscribe = ((selector, optListener, options) => {
      let listener = selector;
      if (optListener) {
        const equalityFn = (options == null ? void 0 : options.equalityFn) || Object.is;
        let currentSlice = selector(api.getState());
        listener = (state) => {
          const nextSlice = selector(state);
          if (!equalityFn(currentSlice, nextSlice)) {
            const previousSlice = currentSlice;
            optListener(currentSlice = nextSlice, previousSlice);
          }
        };
        if (options == null ? void 0 : options.fireImmediately) {
          optListener(currentSlice, currentSlice);
        }
      }
      return origSubscribe(listener);
    });
    const initialState = fn(set2, get, api);
    return initialState;
  };
  var subscribeWithSelector = subscribeWithSelectorImpl;

  // node_modules/immer/dist/immer.mjs
  var NOTHING = Symbol.for("immer-nothing");
  var DRAFTABLE = Symbol.for("immer-draftable");
  var DRAFT_STATE = Symbol.for("immer-state");
  var errors = true ? [
    // All error codes, starting by 0:
    function(plugin) {
      return `The plugin for '${plugin}' has not been loaded into Immer. To enable the plugin, import and call \`enable${plugin}()\` when initializing your application.`;
    },
    function(thing) {
      return `produce can only be called on things that are draftable: plain objects, arrays, Map, Set or classes that are marked with '[immerable]: true'. Got '${thing}'`;
    },
    "This object has been frozen and should not be mutated",
    function(data) {
      return "Cannot use a proxy that has been revoked. Did you pass an object from inside an immer function to an async process? " + data;
    },
    "An immer producer returned a new value *and* modified its draft. Either return a new value *or* modify the draft.",
    "Immer forbids circular references",
    "The first or second argument to `produce` must be a function",
    "The third argument to `produce` must be a function or undefined",
    "First argument to `createDraft` must be a plain object, an array, or an immerable object",
    "First argument to `finishDraft` must be a draft returned by `createDraft`",
    function(thing) {
      return `'current' expects a draft, got: ${thing}`;
    },
    "Object.defineProperty() cannot be used on an Immer draft",
    "Object.setPrototypeOf() cannot be used on an Immer draft",
    "Immer only supports deleting array indices",
    "Immer only supports setting array indices and the 'length' property",
    function(thing) {
      return `'original' expects a draft, got: ${thing}`;
    }
    // Note: if more errors are added, the errorOffset in Patches.ts should be increased
    // See Patches.ts for additional errors
  ] : [];
  function die(error, ...args) {
    if (true) {
      const e = errors[error];
      const msg = typeof e === "function" ? e.apply(null, args) : e;
      throw new Error(`[Immer] ${msg}`);
    }
    throw new Error(
      `[Immer] minified error nr: ${error}. Full error at: https://bit.ly/3cXEKWf`
    );
  }
  var getPrototypeOf = Object.getPrototypeOf;
  function isDraft(value) {
    return !!value && !!value[DRAFT_STATE];
  }
  function isDraftable(value) {
    if (!value)
      return false;
    return isPlainObject(value) || Array.isArray(value) || !!value[DRAFTABLE] || !!value.constructor?.[DRAFTABLE] || isMap(value) || isSet(value);
  }
  var objectCtorString = Object.prototype.constructor.toString();
  function isPlainObject(value) {
    if (!value || typeof value !== "object")
      return false;
    const proto = getPrototypeOf(value);
    if (proto === null) {
      return true;
    }
    const Ctor = Object.hasOwnProperty.call(proto, "constructor") && proto.constructor;
    if (Ctor === Object)
      return true;
    return typeof Ctor == "function" && Function.toString.call(Ctor) === objectCtorString;
  }
  function each(obj, iter) {
    if (getArchtype(obj) === 0) {
      Reflect.ownKeys(obj).forEach((key) => {
        iter(key, obj[key], obj);
      });
    } else {
      obj.forEach((entry, index) => iter(index, entry, obj));
    }
  }
  function getArchtype(thing) {
    const state = thing[DRAFT_STATE];
    return state ? state.type_ : Array.isArray(thing) ? 1 : isMap(thing) ? 2 : isSet(thing) ? 3 : 0;
  }
  function has(thing, prop) {
    return getArchtype(thing) === 2 ? thing.has(prop) : Object.prototype.hasOwnProperty.call(thing, prop);
  }
  function set(thing, propOrOldValue, value) {
    const t = getArchtype(thing);
    if (t === 2)
      thing.set(propOrOldValue, value);
    else if (t === 3) {
      thing.add(value);
    } else
      thing[propOrOldValue] = value;
  }
  function is(x, y) {
    if (x === y) {
      return x !== 0 || 1 / x === 1 / y;
    } else {
      return x !== x && y !== y;
    }
  }
  function isMap(target) {
    return target instanceof Map;
  }
  function isSet(target) {
    return target instanceof Set;
  }
  function latest(state) {
    return state.copy_ || state.base_;
  }
  function shallowCopy(base, strict) {
    if (isMap(base)) {
      return new Map(base);
    }
    if (isSet(base)) {
      return new Set(base);
    }
    if (Array.isArray(base))
      return Array.prototype.slice.call(base);
    const isPlain = isPlainObject(base);
    if (strict === true || strict === "class_only" && !isPlain) {
      const descriptors = Object.getOwnPropertyDescriptors(base);
      delete descriptors[DRAFT_STATE];
      let keys = Reflect.ownKeys(descriptors);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const desc = descriptors[key];
        if (desc.writable === false) {
          desc.writable = true;
          desc.configurable = true;
        }
        if (desc.get || desc.set)
          descriptors[key] = {
            configurable: true,
            writable: true,
            // could live with !!desc.set as well here...
            enumerable: desc.enumerable,
            value: base[key]
          };
      }
      return Object.create(getPrototypeOf(base), descriptors);
    } else {
      const proto = getPrototypeOf(base);
      if (proto !== null && isPlain) {
        return { ...base };
      }
      const obj = Object.create(proto);
      return Object.assign(obj, base);
    }
  }
  function freeze(obj, deep = false) {
    if (isFrozen(obj) || isDraft(obj) || !isDraftable(obj))
      return obj;
    if (getArchtype(obj) > 1) {
      Object.defineProperties(obj, {
        set: { value: dontMutateFrozenCollections },
        add: { value: dontMutateFrozenCollections },
        clear: { value: dontMutateFrozenCollections },
        delete: { value: dontMutateFrozenCollections }
      });
    }
    Object.freeze(obj);
    if (deep)
      Object.values(obj).forEach((value) => freeze(value, true));
    return obj;
  }
  function dontMutateFrozenCollections() {
    die(2);
  }
  function isFrozen(obj) {
    return Object.isFrozen(obj);
  }
  var plugins = {};
  function getPlugin(pluginKey) {
    const plugin = plugins[pluginKey];
    if (!plugin) {
      die(0, pluginKey);
    }
    return plugin;
  }
  var currentScope;
  function getCurrentScope() {
    return currentScope;
  }
  function createScope(parent_, immer_) {
    return {
      drafts_: [],
      parent_,
      immer_,
      // Whenever the modified draft contains a draft from another scope, we
      // need to prevent auto-freezing so the unowned draft can be finalized.
      canAutoFreeze_: true,
      unfinalizedDrafts_: 0
    };
  }
  function usePatchesInScope(scope, patchListener) {
    if (patchListener) {
      getPlugin("Patches");
      scope.patches_ = [];
      scope.inversePatches_ = [];
      scope.patchListener_ = patchListener;
    }
  }
  function revokeScope(scope) {
    leaveScope(scope);
    scope.drafts_.forEach(revokeDraft);
    scope.drafts_ = null;
  }
  function leaveScope(scope) {
    if (scope === currentScope) {
      currentScope = scope.parent_;
    }
  }
  function enterScope(immer22) {
    return currentScope = createScope(currentScope, immer22);
  }
  function revokeDraft(draft) {
    const state = draft[DRAFT_STATE];
    if (state.type_ === 0 || state.type_ === 1)
      state.revoke_();
    else
      state.revoked_ = true;
  }
  function processResult(result, scope) {
    scope.unfinalizedDrafts_ = scope.drafts_.length;
    const baseDraft = scope.drafts_[0];
    const isReplaced = result !== void 0 && result !== baseDraft;
    if (isReplaced) {
      if (baseDraft[DRAFT_STATE].modified_) {
        revokeScope(scope);
        die(4);
      }
      if (isDraftable(result)) {
        result = finalize(scope, result);
        if (!scope.parent_)
          maybeFreeze(scope, result);
      }
      if (scope.patches_) {
        getPlugin("Patches").generateReplacementPatches_(
          baseDraft[DRAFT_STATE].base_,
          result,
          scope.patches_,
          scope.inversePatches_
        );
      }
    } else {
      result = finalize(scope, baseDraft, []);
    }
    revokeScope(scope);
    if (scope.patches_) {
      scope.patchListener_(scope.patches_, scope.inversePatches_);
    }
    return result !== NOTHING ? result : void 0;
  }
  function finalize(rootScope, value, path) {
    if (isFrozen(value))
      return value;
    const state = value[DRAFT_STATE];
    if (!state) {
      each(
        value,
        (key, childValue) => finalizeProperty(rootScope, state, value, key, childValue, path)
      );
      return value;
    }
    if (state.scope_ !== rootScope)
      return value;
    if (!state.modified_) {
      maybeFreeze(rootScope, state.base_, true);
      return state.base_;
    }
    if (!state.finalized_) {
      state.finalized_ = true;
      state.scope_.unfinalizedDrafts_--;
      const result = state.copy_;
      let resultEach = result;
      let isSet2 = false;
      if (state.type_ === 3) {
        resultEach = new Set(result);
        result.clear();
        isSet2 = true;
      }
      each(
        resultEach,
        (key, childValue) => finalizeProperty(rootScope, state, result, key, childValue, path, isSet2)
      );
      maybeFreeze(rootScope, result, false);
      if (path && rootScope.patches_) {
        getPlugin("Patches").generatePatches_(
          state,
          path,
          rootScope.patches_,
          rootScope.inversePatches_
        );
      }
    }
    return state.copy_;
  }
  function finalizeProperty(rootScope, parentState, targetObject, prop, childValue, rootPath, targetIsSet) {
    if (childValue === targetObject)
      die(5);
    if (isDraft(childValue)) {
      const path = rootPath && parentState && parentState.type_ !== 3 && // Set objects are atomic since they have no keys.
      !has(parentState.assigned_, prop) ? rootPath.concat(prop) : void 0;
      const res = finalize(rootScope, childValue, path);
      set(targetObject, prop, res);
      if (isDraft(res)) {
        rootScope.canAutoFreeze_ = false;
      } else
        return;
    } else if (targetIsSet) {
      targetObject.add(childValue);
    }
    if (isDraftable(childValue) && !isFrozen(childValue)) {
      if (!rootScope.immer_.autoFreeze_ && rootScope.unfinalizedDrafts_ < 1) {
        return;
      }
      finalize(rootScope, childValue);
      if ((!parentState || !parentState.scope_.parent_) && typeof prop !== "symbol" && (isMap(targetObject) ? targetObject.has(prop) : Object.prototype.propertyIsEnumerable.call(targetObject, prop)))
        maybeFreeze(rootScope, childValue);
    }
  }
  function maybeFreeze(scope, value, deep = false) {
    if (!scope.parent_ && scope.immer_.autoFreeze_ && scope.canAutoFreeze_) {
      freeze(value, deep);
    }
  }
  function createProxyProxy(base, parent) {
    const isArray = Array.isArray(base);
    const state = {
      type_: isArray ? 1 : 0,
      // Track which produce call this is associated with.
      scope_: parent ? parent.scope_ : getCurrentScope(),
      // True for both shallow and deep changes.
      modified_: false,
      // Used during finalization.
      finalized_: false,
      // Track which properties have been assigned (true) or deleted (false).
      assigned_: {},
      // The parent draft state.
      parent_: parent,
      // The base state.
      base_: base,
      // The base proxy.
      draft_: null,
      // set below
      // The base copy with any updated values.
      copy_: null,
      // Called by the `produce` function.
      revoke_: null,
      isManual_: false
    };
    let target = state;
    let traps = objectTraps;
    if (isArray) {
      target = [state];
      traps = arrayTraps;
    }
    const { revoke, proxy } = Proxy.revocable(target, traps);
    state.draft_ = proxy;
    state.revoke_ = revoke;
    return proxy;
  }
  var objectTraps = {
    get(state, prop) {
      if (prop === DRAFT_STATE)
        return state;
      const source = latest(state);
      if (!has(source, prop)) {
        return readPropFromProto(state, source, prop);
      }
      const value = source[prop];
      if (state.finalized_ || !isDraftable(value)) {
        return value;
      }
      if (value === peek(state.base_, prop)) {
        prepareCopy(state);
        return state.copy_[prop] = createProxy(value, state);
      }
      return value;
    },
    has(state, prop) {
      return prop in latest(state);
    },
    ownKeys(state) {
      return Reflect.ownKeys(latest(state));
    },
    set(state, prop, value) {
      const desc = getDescriptorFromProto(latest(state), prop);
      if (desc?.set) {
        desc.set.call(state.draft_, value);
        return true;
      }
      if (!state.modified_) {
        const current2 = peek(latest(state), prop);
        const currentState = current2?.[DRAFT_STATE];
        if (currentState && currentState.base_ === value) {
          state.copy_[prop] = value;
          state.assigned_[prop] = false;
          return true;
        }
        if (is(value, current2) && (value !== void 0 || has(state.base_, prop)))
          return true;
        prepareCopy(state);
        markChanged(state);
      }
      if (state.copy_[prop] === value && // special case: handle new props with value 'undefined'
      (value !== void 0 || prop in state.copy_) || // special case: NaN
      Number.isNaN(value) && Number.isNaN(state.copy_[prop]))
        return true;
      state.copy_[prop] = value;
      state.assigned_[prop] = true;
      return true;
    },
    deleteProperty(state, prop) {
      if (peek(state.base_, prop) !== void 0 || prop in state.base_) {
        state.assigned_[prop] = false;
        prepareCopy(state);
        markChanged(state);
      } else {
        delete state.assigned_[prop];
      }
      if (state.copy_) {
        delete state.copy_[prop];
      }
      return true;
    },
    // Note: We never coerce `desc.value` into an Immer draft, because we can't make
    // the same guarantee in ES5 mode.
    getOwnPropertyDescriptor(state, prop) {
      const owner = latest(state);
      const desc = Reflect.getOwnPropertyDescriptor(owner, prop);
      if (!desc)
        return desc;
      return {
        writable: true,
        configurable: state.type_ !== 1 || prop !== "length",
        enumerable: desc.enumerable,
        value: owner[prop]
      };
    },
    defineProperty() {
      die(11);
    },
    getPrototypeOf(state) {
      return getPrototypeOf(state.base_);
    },
    setPrototypeOf() {
      die(12);
    }
  };
  var arrayTraps = {};
  each(objectTraps, (key, fn) => {
    arrayTraps[key] = function() {
      arguments[0] = arguments[0][0];
      return fn.apply(this, arguments);
    };
  });
  arrayTraps.deleteProperty = function(state, prop) {
    if (isNaN(parseInt(prop)))
      die(13);
    return arrayTraps.set.call(this, state, prop, void 0);
  };
  arrayTraps.set = function(state, prop, value) {
    if (prop !== "length" && isNaN(parseInt(prop)))
      die(14);
    return objectTraps.set.call(this, state[0], prop, value, state[0]);
  };
  function peek(draft, prop) {
    const state = draft[DRAFT_STATE];
    const source = state ? latest(state) : draft;
    return source[prop];
  }
  function readPropFromProto(state, source, prop) {
    const desc = getDescriptorFromProto(source, prop);
    return desc ? `value` in desc ? desc.value : (
      // This is a very special case, if the prop is a getter defined by the
      // prototype, we should invoke it with the draft as context!
      desc.get?.call(state.draft_)
    ) : void 0;
  }
  function getDescriptorFromProto(source, prop) {
    if (!(prop in source))
      return void 0;
    let proto = getPrototypeOf(source);
    while (proto) {
      const desc = Object.getOwnPropertyDescriptor(proto, prop);
      if (desc)
        return desc;
      proto = getPrototypeOf(proto);
    }
    return void 0;
  }
  function markChanged(state) {
    if (!state.modified_) {
      state.modified_ = true;
      if (state.parent_) {
        markChanged(state.parent_);
      }
    }
  }
  function prepareCopy(state) {
    if (!state.copy_) {
      state.copy_ = shallowCopy(
        state.base_,
        state.scope_.immer_.useStrictShallowCopy_
      );
    }
  }
  var Immer2 = class {
    constructor(config) {
      this.autoFreeze_ = true;
      this.useStrictShallowCopy_ = false;
      this.produce = (base, recipe, patchListener) => {
        if (typeof base === "function" && typeof recipe !== "function") {
          const defaultBase = recipe;
          recipe = base;
          const self = this;
          return function curriedProduce(base2 = defaultBase, ...args) {
            return self.produce(base2, (draft) => recipe.call(this, draft, ...args));
          };
        }
        if (typeof recipe !== "function")
          die(6);
        if (patchListener !== void 0 && typeof patchListener !== "function")
          die(7);
        let result;
        if (isDraftable(base)) {
          const scope = enterScope(this);
          const proxy = createProxy(base, void 0);
          let hasError = true;
          try {
            result = recipe(proxy);
            hasError = false;
          } finally {
            if (hasError)
              revokeScope(scope);
            else
              leaveScope(scope);
          }
          usePatchesInScope(scope, patchListener);
          return processResult(result, scope);
        } else if (!base || typeof base !== "object") {
          result = recipe(base);
          if (result === void 0)
            result = base;
          if (result === NOTHING)
            result = void 0;
          if (this.autoFreeze_)
            freeze(result, true);
          if (patchListener) {
            const p = [];
            const ip = [];
            getPlugin("Patches").generateReplacementPatches_(base, result, p, ip);
            patchListener(p, ip);
          }
          return result;
        } else
          die(1, base);
      };
      this.produceWithPatches = (base, recipe) => {
        if (typeof base === "function") {
          return (state, ...args) => this.produceWithPatches(state, (draft) => base(draft, ...args));
        }
        let patches, inversePatches;
        const result = this.produce(base, recipe, (p, ip) => {
          patches = p;
          inversePatches = ip;
        });
        return [result, patches, inversePatches];
      };
      if (typeof config?.autoFreeze === "boolean")
        this.setAutoFreeze(config.autoFreeze);
      if (typeof config?.useStrictShallowCopy === "boolean")
        this.setUseStrictShallowCopy(config.useStrictShallowCopy);
    }
    createDraft(base) {
      if (!isDraftable(base))
        die(8);
      if (isDraft(base))
        base = current(base);
      const scope = enterScope(this);
      const proxy = createProxy(base, void 0);
      proxy[DRAFT_STATE].isManual_ = true;
      leaveScope(scope);
      return proxy;
    }
    finishDraft(draft, patchListener) {
      const state = draft && draft[DRAFT_STATE];
      if (!state || !state.isManual_)
        die(9);
      const { scope_: scope } = state;
      usePatchesInScope(scope, patchListener);
      return processResult(void 0, scope);
    }
    /**
     * Pass true to automatically freeze all copies created by Immer.
     *
     * By default, auto-freezing is enabled.
     */
    setAutoFreeze(value) {
      this.autoFreeze_ = value;
    }
    /**
     * Pass true to enable strict shallow copy.
     *
     * By default, immer does not copy the object descriptors such as getter, setter and non-enumrable properties.
     */
    setUseStrictShallowCopy(value) {
      this.useStrictShallowCopy_ = value;
    }
    applyPatches(base, patches) {
      let i;
      for (i = patches.length - 1; i >= 0; i--) {
        const patch = patches[i];
        if (patch.path.length === 0 && patch.op === "replace") {
          base = patch.value;
          break;
        }
      }
      if (i > -1) {
        patches = patches.slice(i + 1);
      }
      const applyPatchesImpl = getPlugin("Patches").applyPatches_;
      if (isDraft(base)) {
        return applyPatchesImpl(base, patches);
      }
      return this.produce(
        base,
        (draft) => applyPatchesImpl(draft, patches)
      );
    }
  };
  function createProxy(value, parent) {
    const draft = isMap(value) ? getPlugin("MapSet").proxyMap_(value, parent) : isSet(value) ? getPlugin("MapSet").proxySet_(value, parent) : createProxyProxy(value, parent);
    const scope = parent ? parent.scope_ : getCurrentScope();
    scope.drafts_.push(draft);
    return draft;
  }
  function current(value) {
    if (!isDraft(value))
      die(10, value);
    return currentImpl(value);
  }
  function currentImpl(value) {
    if (!isDraftable(value) || isFrozen(value))
      return value;
    const state = value[DRAFT_STATE];
    let copy;
    if (state) {
      if (!state.modified_)
        return state.base_;
      state.finalized_ = true;
      copy = shallowCopy(value, state.scope_.immer_.useStrictShallowCopy_);
    } else {
      copy = shallowCopy(value, true);
    }
    each(copy, (key, childValue) => {
      set(copy, key, currentImpl(childValue));
    });
    if (state) {
      state.finalized_ = false;
    }
    return copy;
  }
  var immer = new Immer2();
  var produce = immer.produce;

  // node_modules/zustand/esm/middleware/immer.mjs
  var immerImpl = (initializer) => (set2, get, store) => {
    store.setState = (updater, replace, ...args) => {
      const nextState = typeof updater === "function" ? produce(updater) : updater;
      return set2(nextState, replace, ...args);
    };
    return initializer(store.setState, get, store);
  };
  var immer2 = immerImpl;

  // src/utils.ts
  var TERNARY_REGEX = /\{\{(?<json>json::)?(?<path>[a-z0-9\.]*)\s*(?:\?)?\s*(['"`](?<trueVal>[^'"`]*)['"`])?\s*(?::)?\s*(['"`](?<falseVal>[^'"`]*)['"`])?\s*\}\}/gi;
  var FOR_LOOP_REGEX = /((?<index>\w+)\s*,\s*)?(?<name>\w+)\s+((in)|(of))\s+(?<path>[a-z0-9\.]+)/i;
  function parseJSON(json) {
    if (!json) return null;
    try {
      return JSON.parse(json.replaceAll("'", '"'));
    } catch (e) {
      console.error(e);
      return null;
    }
  }
  function marshallJSON(obj) {
    return JSON.stringify(obj).replaceAll('"', "'");
  }
  function unProxyfy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  function parseDocumentFragment(rawHTML) {
    const template = document.createElement("template");
    template.innerHTML = rawHTML;
    return template.content.cloneNode(true);
  }
  function maybeCall(k, thisObj = {}) {
    if (typeof k == "function") {
      return k.bind(thisObj)();
    }
    return k;
  }
  function getId() {
    const timeSeed = Math.floor(performance.now() * 100);
    const randSeed = Math.floor(Math.random() * 100);
    const randLetter = Math.floor(Math.random() * 24);
    return `${String.fromCharCode(65 + randLetter)}${timeSeed.toString(
      34
    )}${randSeed.toString(34)}`;
  }
  function targetFromPath(obj, path) {
    const props = path.split(".").map((p) => p.trim());
    let target = obj;
    for (let prop of props) {
      if (typeof target === "object" && target != void 0 && target[prop] != void 0) {
        target = maybeCall(target[prop]);
      } else {
        return null;
      }
    }
    return target;
  }
  function parseHTMLDeclaration(rawHTML, object) {
    return rawHTML.replaceAll(TERNARY_REGEX, (substr, ...args) => {
      const groups = args.at(-1);
      if (!groups || !("path" in groups)) return substr;
      const { path } = groups;
      const trueVal = groups.trueVal ?? "";
      const falseVal = groups.falseVal ?? "";
      const target = targetFromPath(object, path);
      const value = maybeCall(target);
      if (trueVal || falseVal) {
        return value ? trueVal : falseVal;
      }
      if ("json" in groups && groups["json"]) {
        return marshallJSON(value);
      }
      const rawValue = typeof value === "object" ? unProxyfy(value) : value;
      return rawValue?.toString();
    });
  }

  // src/methods.ts
  function createReactiveProxy(initialState, previousPath = "") {
    const handler = {
      get: (target, property) => {
        const path = previousPath ? `${previousPath}.${property}` : property;
        const value = target[property];
        if (typeof value === "object" && value !== null) {
          return createReactiveProxy.apply(this, [value, path]);
        }
        return value;
      },
      set: (target, property, value) => {
        if (target[property] === value) return true;
        const path = previousPath ? `${previousPath}.${property}` : property;
        target[property] = value;
        if (typeof value === "object" && value !== null) {
          target[property] = createReactiveProxy.apply(this, [value, path]);
        }
        const newValue = maybeCall(this._valueUpdater, this);
        if (this.value !== newValue) {
          this.value = newValue;
        }
        this.reRenderProperty(path);
        return true;
      }
    };
    return new Proxy(initialState, handler);
  }
  function initializePropsListeners(propsListener, initialState) {
    if (!propsListener) return;
    for (const key in propsListener) {
      const propName = propsListener[key];
      const attrValue = this.getAttribute(propName);
      if (propName.startsWith("json::")) {
        initialState[key] = () => parseJSON(attrValue);
        const realPropName = propName.replace("json::", "");
        this._propsListenerRecord[realPropName] = { type: "json", key };
        continue;
      }
      initialState[key] = () => attrValue;
      this._propsListenerRecord[propName] = { type: "string", key };
    }
  }
  function updateProps(name, _, newValue) {
    if (!(name in this._propsListenerRecord)) return;
    const { type, key } = this._propsListenerRecord[name];
    if (type == "json") {
      const parsed = parseJSON(newValue);
      this.state[key] = () => parsed;
    } else {
      this.state[key] = () => newValue;
    }
  }
  function initializeStoreListeners(storeListener, initialState) {
    if (!storeListener) return;
    for (const key in storeListener) {
      const storePath = storeListener[key];
      const storeKeys = storePath.split(".");
      const getStorePath = (store) => storeKeys.reduce((acc, prop) => {
        if (acc && prop in acc) {
          return acc[prop];
        }
        return null;
      }, store);
      initialState[key] = () => getStorePath(this.$getStore());
      const unsub = this._globalStore.subscribe(
        (store) => getStorePath(store),
        //@ts-expect-error zustand middleware
        (currentVal) => {
          if (currentVal !== this.state[key]) {
            this.state[key] = () => currentVal;
            this.reRenderProperty(key);
          }
        }
      );
      this._storeListenerRecord.push(unsub);
    }
  }
  function clearStoreListeners() {
    this._storeListenerRecord.forEach((unsub) => unsub());
  }
  function registerReRenders() {
    this.$$("[re-render]").forEach((element) => {
      const reRenderAttr = element.getAttribute("re-render") ?? "";
      const id = getId();
      element.setAttribute("internal-id", id);
      const pathNames = reRenderAttr.split(",");
      for (let path of pathNames) {
        if (!this._dynamicFieldRecord[path]) {
          this._dynamicFieldRecord[path] = [];
        }
        this._dynamicFieldRecord[path].push({
          id,
          type: "declaration",
          raw: element.outerHTML
        });
      }
    });
  }
  function initializeEventListener(eventListeners) {
    for (let cssSelector in eventListeners) {
      for (let eventHandle of eventListeners[cssSelector]) {
        this.$$on(cssSelector, eventHandle);
      }
    }
  }
  function reattachEventListeners(id) {
    const target = this.$(`[internal-id=${id}]`);
    if (!target) return;
    for (let cssSelector in this._eventListenerRecord) {
      for (let { event, handler, options } of this._eventListenerRecord[cssSelector]) {
        if (target.matches(cssSelector)) {
          target.addEventListener(event, handler, options);
        }
        target.querySelectorAll(cssSelector).forEach((elements) => {
          elements.addEventListener(event, handler, options);
        });
      }
    }
  }
  function registerIfBlock() {
    this.$$("[if]").forEach((template) => {
      const ifAttr = template.getAttribute("if");
      if (!ifAttr) return;
      const raw = template.innerHTML;
      const id = getId();
      template.setAttribute("internal-id", id);
      if (!this._dynamicFieldRecord[ifAttr]) {
        this._dynamicFieldRecord[ifAttr] = [];
      }
      this._dynamicFieldRecord[ifAttr].push({
        type: "ifblock",
        raw,
        id
      });
      renderIfBlock.apply(this, [ifAttr, raw, template]);
    });
  }
  function renderIfBlock(key, raw, container) {
    if (targetFromPath(this.state, key)) {
      container.innerHTML = raw;
    } else {
      container.innerHTML = "";
    }
  }
  function registerForLoop() {
    this.$$("[for-loop]").forEach((template) => {
      const forAttr = template.getAttribute("for-loop");
      const match = forAttr?.match(FOR_LOOP_REGEX);
      if (!match?.groups || !("path" in match.groups)) return;
      const { path } = match.groups;
      const raw = template.outerHTML;
      const id = getId();
      template.setAttribute("internal-id", id);
      if (!parseInt(path)) {
        if (!this._dynamicFieldRecord[path]) {
          this._dynamicFieldRecord[path] = [];
        }
        this._dynamicFieldRecord[path].push({ id, type: "loop", raw });
      }
      renderForLoop.apply(this, [raw, template]);
    });
  }
  function renderForLoop(raw, container) {
    const template = parseDocumentFragment(raw).firstElementChild;
    if (!template) return;
    const templateHTML = template.innerHTML;
    const forAttr = template.getAttribute("for-loop");
    const match = forAttr?.match(FOR_LOOP_REGEX);
    if (!match?.groups || !("path" in match.groups) || !("name" in match.groups))
      return;
    const { path, name } = match.groups;
    const target = targetFromPath(this.state, path);
    const value = maybeCall(target);
    let compiledHTML = "";
    if (typeof value == "number" || parseInt(path)) {
      const upperBound = typeof value == "number" ? value : parseInt(path);
      for (let i = 0; i < upperBound; i++) {
        compiledHTML += templateHTML.replaceAll(
          TERNARY_REGEX,
          (substring, ...args) => {
            const groups = args.at(-1);
            if (!groups || !("path" in groups)) return substring;
            return groups.path == name ? `${i}` : substring;
          }
        );
      }
    } else if (typeof value == "object" && target !== null) {
      const index = match.groups.index;
      for (let key in value) {
        compiledHTML += templateHTML.replaceAll(
          TERNARY_REGEX,
          (substring, ...args) => {
            const groups = args.at(-1);
            if (!groups || !("path" in groups)) return substring;
            const { path: tempPath } = groups;
            if (tempPath.includes(name)) {
              return substring.replace(name, `${path}.${key}`);
            }
            if (tempPath === index) {
              return key;
            }
            return substring;
          }
        );
      }
    }
    container.innerHTML = compiledHTML;
  }

  // src/index.ts
  var globalStore = createStore(
    //@ts-expect-error zustand middleware
    subscribeWithSelector(immer2(() => ({})))
  );
  function Factory(name, html, options) {
    const observedAttributes = [];
    if (options?.observedAttributes) {
      observedAttributes.push(...options.observedAttributes);
    }
    if (options?.props) {
      observedAttributes.push(
        ...Object.values(options.props).map((prop) => prop.replace("json::", ""))
      );
    }
    class Component extends HTMLElement {
      constructor() {
        super();
        this._globalStore = globalStore;
        this.name = name;
        this._dynamicFieldRecord = {};
        this._eventListenerRecord = {};
        this._storeListenerRecord = [() => {
        }];
        this._propsListenerRecord = {};
        const initialState = maybeCall(options?.state, this) ?? {};
        initializePropsListeners.apply(this, [options?.props, initialState]);
        initializeStoreListeners.apply(this, [
          options?.storeListener,
          initialState
        ]);
        this.state = createReactiveProxy.apply(this, [initialState]);
        this._valueUpdater = options?.value ?? null;
        this._value = maybeCall(this._valueUpdater, this);
        this.rawHTML = html;
        if (!options?.noShadowRoot) {
          this.root = this.attachShadow({ mode: "closed" });
        } else {
          this.root = this;
        }
        const docFragment = parseDocumentFragment(this.rawHTML);
        this.root.appendChild(docFragment);
      }
      static {
        this.observedAttributes = observedAttributes;
      }
      get value() {
        return this._value;
      }
      set value(val) {
        this.dispatchEvent(
          new CustomEvent("input", {
            detail: { newValue: val, oldValue: this._value }
          })
        );
        this._value = val;
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
        options?.onMount?.apply(this);
      }
      attributeChangedCallback(name2, oldValue, newValue) {
        updateProps.apply(this, [name2, oldValue, newValue]);
        options?.onAttributeChanged?.apply(this, [name2, oldValue, newValue]);
      }
      reRenderProperty(pathname) {
        const fieldsToUpdate = Object.entries(this._dynamicFieldRecord).reduce((acc, [key, updateData]) => {
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
        options?.onRender?.apply(this, [pathname]);
      }
      disconnectedCallback() {
        clearStoreListeners.apply(this);
        options?.onUnmount?.apply(this);
      }
      /* magic method */
      $getStore() {
        return this._globalStore.getState();
      }
      $setStore(updater) {
        this._globalStore.setState(updater);
      }
      $(css) {
        return this.root.querySelector(css);
      }
      $$(css) {
        return this.root.querySelectorAll(css);
      }
      $$on(css, { event, handler, options: options2 }) {
        const boundHandler = handler.bind(this);
        if (!this._eventListenerRecord[css]) {
          this._eventListenerRecord[css] = [];
        }
        this._eventListenerRecord[css].push({
          event,
          handler: boundHandler,
          options: options2
        });
        this.$$(css)?.forEach((target) => {
          target.addEventListener(event, boundHandler, options2);
        });
      }
      $$off(css, event) {
        if (!this._eventListenerRecord[css]) return;
        const toRemove = this._eventListenerRecord[css].filter(
          ({ event: recordedEvent }) => {
            return recordedEvent === event;
          }
        );
        for (const { event: event2, handler, options: options2 } of toRemove) {
          this.$$(css)?.forEach((target) => {
            target.removeEventListener(event2, handler, options2);
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

  // exemples/todo-list/index.ts
  var todoHTML = (
    /*html*/
    `
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
`
  );
  Factory("todo-list", todoHTML, {
    state: {
      items: []
    },
    eventListener: {
      form: [
        {
          event: "submit",
          handler(e) {
            e.preventDefault();
            const input = this.$("input");
            this.state.items.unshift({ text: input.value });
            input.value = "";
          }
        }
      ],
      ".delete": [
        {
          event: "click",
          handler(ev) {
            const idAttr = ev.target.getAttribute("index");
            const id = parseInt(idAttr ?? "");
            this.state.items = this.state.items.filter((_, k) => k != id);
          }
        }
      ]
    }
  });
})();
