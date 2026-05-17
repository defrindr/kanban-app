import { z } from 'zod';
export declare const BoardJoinSchema: z.ZodObject<{
    boardId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    boardId: string;
}, {
    boardId: string;
}>;
export declare const BoardLeaveSchema: z.ZodObject<{
    boardId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    boardId: string;
}, {
    boardId: string;
}>;
export declare const ListCreateSchema: z.ZodObject<{
    boardId: z.ZodString;
    title: z.ZodString;
    position: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    boardId: string;
    title: string;
    position: number;
}, {
    boardId: string;
    title: string;
    position: number;
}>;
export declare const ListUpdateSchema: z.ZodObject<{
    listId: z.ZodString;
    title: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
    listId: string;
}, {
    title: string;
    listId: string;
}>;
export declare const ListDeleteSchema: z.ZodObject<{
    listId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    listId: string;
}, {
    listId: string;
}>;
export declare const CardCreateSchema: z.ZodObject<{
    listId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    position: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    title: string;
    position: number;
    listId: string;
    description?: string | undefined;
}, {
    title: string;
    position: number;
    listId: string;
    description?: string | undefined;
}>;
export declare const CardUpdateSchema: z.ZodObject<{
    cardId: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    assignees: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    position: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    cardId: string;
    title?: string | undefined;
    position?: number | undefined;
    description?: string | undefined;
    labels?: string[] | undefined;
    assignees?: string[] | undefined;
}, {
    cardId: string;
    title?: string | undefined;
    position?: number | undefined;
    description?: string | undefined;
    labels?: string[] | undefined;
    assignees?: string[] | undefined;
}>;
export declare const CardMoveSchema: z.ZodObject<{
    cardId: z.ZodString;
    fromListId: z.ZodString;
    toListId: z.ZodString;
    newPosition: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    cardId: string;
    fromListId: string;
    toListId: string;
    newPosition: number;
}, {
    cardId: string;
    fromListId: string;
    toListId: string;
    newPosition: number;
}>;
export declare const CardDeleteSchema: z.ZodObject<{
    cardId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    cardId: string;
}, {
    cardId: string;
}>;
export declare const CommentAddSchema: z.ZodObject<{
    cardId: z.ZodString;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    cardId: string;
    content: string;
}, {
    cardId: string;
    content: string;
}>;
//# sourceMappingURL=socket-validation.d.ts.map