/**
 * Cooud Elements monta o Payment Element do Stripe sem passar idioma nem país.
 * Este patch intercepta o construtor global do Stripe para forçar italiano e
 * Itália como país padrão de cobrança, independente do IP/idioma do visitante.
 */
type AnyFn = (...args: unknown[]) => any;

function forceItaly(options: any) {
  const opts = options || {};
  const dv = opts.defaultValues || {};
  const bd = dv.billingDetails || {};
  const addr = bd.address || {};
  opts.defaultValues = {
    ...dv,
    billingDetails: { ...bd, address: { ...addr, country: "IT" } },
  };
  return opts;
}

function proxyWith(target: any, prop: string, replacement: AnyFn) {
  try {
    Object.defineProperty(target, prop, {
      configurable: true,
      writable: true,
      enumerable: false,
      value: replacement,
    });
    if (target[prop] === replacement) return target;
  } catch {
    /* propriedade somente leitura */
  }
  try {
    return new Proxy(target, {
      get(obj, key, receiver) {
        if (key === prop) return replacement;
        const value = Reflect.get(obj, key, receiver);
        return typeof value === "function" ? value.bind(obj) : value;
      },
    });
  } catch {
    return target;
  }
}

export function patchStripeForItaly() {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (w.__italyStripeHookInstalled) return;
  w.__italyStripeHookInstalled = true;

  const wrap = (fn: AnyFn): AnyFn => {
    if (typeof fn !== "function" || (fn as any).__italyCheckoutPatched) return fn;
    const wrapped = function (key: string, opts: any) {
      const stripe = fn(key, { ...(opts || {}), locale: "it" });
      const origElements = stripe.elements.bind(stripe);
      const elementsFn = (eopts: any) => {
        const elements = origElements({ ...(eopts || {}), locale: "it" });
        const origCreate = elements.create.bind(elements);
        const createFn = (type: string, popts: any) =>
          origCreate(type, type === "payment" || type === "address" ? forceItaly(popts) : popts);
        return proxyWith(elements, "create", createFn as AnyFn);
      };
      return proxyWith(stripe, "elements", elementsFn as AnyFn);
    } as AnyFn;
    Object.keys(fn).forEach((k) => {
      try {
        (wrapped as any)[k] = (fn as any)[k];
      } catch {
        /* noop */
      }
    });
    (wrapped as any).__italyCheckoutPatched = true;
    return wrapped;
  };

  let current = wrap(w.Stripe);
  try {
    Object.defineProperty(window, "Stripe", {
      configurable: true,
      get: () => current,
      set: (fn: AnyFn) => {
        current = wrap(fn);
      },
    });
  } catch {
    /* noop */
  }
}
