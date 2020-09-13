import { Typo as T } from './index';
declare global {
  interface Window {
    Typo: any
  }
}
if (typeof window !== 'undefined' && window.Typo === undefined) {
  window.Typo = T;
}
