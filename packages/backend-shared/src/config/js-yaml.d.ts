/**
 * Type declarations for js-yaml
 * Provides basic type support for js-yaml module
 */

declare module 'js-yaml' {
  export function load(input: string | Buffer): any;
  export function dump(data: any, options?: any): string;
  export function safeLoad(input: string | Buffer): any;
  export function safeDump(data: any, options?: any): string;
}
