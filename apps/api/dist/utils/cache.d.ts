export declare function cacheGet<T>(key: string): Promise<T | null>;
export declare function cacheSet(key: string, value: unknown, ttl?: number): Promise<void>;
export declare function cacheDel(pattern: string): Promise<void>;
//# sourceMappingURL=cache.d.ts.map