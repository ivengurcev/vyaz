export {
    default, 
    Activity,
    Children,
    Component,
    Fragment,
    Profiler,
    PureComponent,
    StrictMode,
    Suspense,
    act,
    cache,
    cacheSignal,
    captureOwnerStack,
    cloneElement,
    createContext,
    createElement,
    createRef,
    forwardRef,
    isValidElement,
    lazy,
    memo,
    startTransition,
    unstable_useCacheRefresh,
    // use,
    useActionState,
    // useCallback,
    // useContext,
    useDebugValue,
    // useDeferredValue,
    // useEffect,
    useEffectEvent,
    useId,
    useImperativeHandle,
    useInsertionEffect,
    // useLayoutEffect,
    // useMemo,
    useOptimistic,
    useReducer,
    // useRef,
    // useState,
    useSyncExternalStore,
    // useTransition,
    version
} from '__realreact';
export function useState(value) { return [value, () => {}] }
export function useEffect(callback/*, changer*/) { callback?.() }
export function useLayoutEffect(callback/*, changer*/) { callback?.() }
export function useRef() { return {current: null} }
export function useMemo(callback) { return callback?.() }
export function useCallback(callback) { return callback}
// export function useReducer() {}
export function useDeferredValue() {}
export function useTransition() {}
export function useContext() { return {}}
export function use(p) { return p instanceof Promise ? p : Promise.resolve(p) }