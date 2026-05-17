export declare function registerTestUser(email?: string, password?: string, name?: string): Promise<{
    ok: boolean;
    data: {
        token: string;
        user: {
            id: string;
            email: string;
            name: string;
        };
    };
}>;
export declare function cleanupTestUser(email?: string): Promise<void>;
//# sourceMappingURL=helpers.d.ts.map