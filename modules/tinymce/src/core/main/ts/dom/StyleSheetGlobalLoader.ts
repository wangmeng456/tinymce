import { Attr, Document, DomEvent, Element, Insert, ShadowDom, Traverse } from '@ephox/sugar';
import { Document as DomDocument } from '@ephox/dom-globals';
import { MutableEqMap, Result, LazyValue, Obj, LazyValues, Arr, Option, Cell } from '@ephox/katamari';
import { Eq } from '@ephox/dispute';
import { ReferrerPolicy } from '../api/SettingsTypes';
import Tools from '../api/util/Tools';

type Eq<A> = Eq.Eq<A>;
type MutableEqMap<K, V> = MutableEqMap.MutableEqMap<K, V>;
type RootNode = ShadowDom.RootNode;

// Since this is intended to be global, it needs to be mutable
export interface StyleSheetGlobalLoader {
  readonly load: (rootNode: RootNode, url: string) => LazyValue<Result<null, string>>;
  readonly loadAll: (root: RootNode, urls: string[]) => LazyValue<Array<Result<null, string>>>;
  readonly maxLoadTime: Cell<number>;
  readonly referrerPolicy: Cell<Option<ReferrerPolicy>>;
  readonly contentCssCors: Cell<boolean>;
}

const elementEq = <T> (): Eq<Element<T>> =>
  Eq.eq((e1, e2) => e1.dom() === e2.dom());

const createLinkTag = (doc: Element<DomDocument>, href: string, onload: () => void, onerror: () => void, referrerPolicy: Option<ReferrerPolicy>, contentCssCors: boolean) => {
  const link = Element.fromTag('link', doc.dom());
  Attr.setAll(link, {
    rel: 'stylesheet',
    type: 'text/css',
    href,
    async: false,
    defer: false
  });
  referrerPolicy.each((rp) => {
    // Note: Don't use link.referrerPolicy = ... here as it doesn't work on Safari
    Attr.set(link, 'referrerpolicy', rp);
  });
  if (contentCssCors) {
    Attr.set(link, 'crossOrigin', 'anonymous');
  }

  DomEvent.bind(link, 'onload', onload);
  DomEvent.bind(link, 'onerror', onerror);
  return link;
};

const rawLoad = (
  root: RootNode,
  href: string,
  maxLoadTime: number,
  referrerPolicy: Option<ReferrerPolicy>,
  contentCssCors: boolean
): LazyValue<Result<null, string>> => {
  return LazyValue.withTimeout((completer) => {
    const doc = Traverse.documentOrOwner(root);
    const onload = () => {
      completer(Result.value(null));
    };
    const onerror = () => {
      completer(Result.error('Error loading stylesheet'));
    };
    const link = createLinkTag(doc, href, onload, onerror, referrerPolicy, contentCssCors);
    Insert.append(root, link);
  }, () => Result.error('Error loading stylesheet: timeout'), maxLoadTime);
};

export const create = (): StyleSheetGlobalLoader => {

  const maxLoadTime = Cell<number>(5000);
  const referrerPolicy = Cell<Option<ReferrerPolicy>>(Option.none());
  const contentCssCors = Cell<boolean>(false);

  type Rec = Record<string, LazyValue<Result<null, string>>>;
  const registry: MutableEqMap<RootNode, Rec> = MutableEqMap.create(elementEq());
  registry.put(Document.getDocument(), {});

  const load = (root: RootNode, url: string): LazyValue<Result<null, string>> => {

    // TODO: would be nice if this could be a Cell
    const finalUrl = Tools._addCacheSuffix(url);

    const rec: Rec = registry.get(root).getOrThunk(() => {
      const r: Rec = {};
      registry.put(root, r);
      return r;
    });

    return Obj.get(rec, finalUrl).getOrThunk(() => {
      const lv = rawLoad(root, finalUrl, maxLoadTime.get(), referrerPolicy.get(), contentCssCors.get());
      rec[finalUrl] = lv;
      return lv;
    });
  };

  // TODO: do we need to turn this into a LazyValue<Result<Array<null>, string>? Or a LazyValue<Result<null>, string>?
  const loadAll = (root: RootNode, urls: string[]): LazyValue<Array<Result<null, string>>> => {
    return LazyValues.par(Arr.map(urls, (url) => load(root, url)));
  };

  return {
    load,
    loadAll,
    maxLoadTime,
    referrerPolicy,
    contentCssCors
  };
};

export const instance = create();
