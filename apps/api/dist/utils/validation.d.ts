import { z } from 'zod';
export declare const CuidSchema: z.ZodString;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export declare const CreateBoardSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
}>;
export declare const UpdateBoardSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    name?: string | undefined;
}, {
    description?: string | undefined;
    name?: string | undefined;
}>;
export declare const CreateListSchema: z.ZodObject<{
    boardId: z.ZodString;
    title: z.ZodString;
    position: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    boardId: string;
    title: string;
    position?: number | undefined;
}, {
    boardId: string;
    title: string;
    position?: number | undefined;
}>;
export declare const UpdateListSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    position?: number | undefined;
}, {
    title?: string | undefined;
    position?: number | undefined;
}>;
export declare const CreateCardSchema: z.ZodObject<{
    listId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    title: string;
    listId: string;
    position?: number | undefined;
    description?: string | undefined;
}, {
    title: string;
    listId: string;
    position?: number | undefined;
    description?: string | undefined;
}>;
export declare const UpdateCardSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    assignees: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    description?: string | undefined;
    labels?: string[] | undefined;
    assignees?: string[] | undefined;
}, {
    title?: string | undefined;
    description?: string | undefined;
    labels?: string[] | undefined;
    assignees?: string[] | undefined;
}>;
export declare const MoveCardSchema: z.ZodObject<{
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
export declare const CreateCardLabelSchema: z.ZodObject<{
    name: z.ZodString;
    color: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    color: string;
}, {
    name: string;
    color?: string | undefined;
}>;
export declare const DeleteCardLabelSchema: z.ZodObject<{
    labelId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    labelId: string;
}, {
    labelId: string;
}>;
export declare const CreateCommentSchema: z.ZodObject<{
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
}, {
    content: string;
}>;
export declare const UpdateCommentSchema: z.ZodObject<{
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
}, {
    content: string;
}>;
export declare const AddCardAssigneeSchema: z.ZodObject<{
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
}, {
    userId: string;
}>;
export declare const DeleteCardAssigneeSchema: z.ZodObject<{
    assigneeId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    assigneeId: string;
}, {
    assigneeId: string;
}>;
export type CreateBoardInput = z.infer<typeof CreateBoardSchema>;
export type UpdateBoardInput = z.infer<typeof UpdateBoardSchema>;
export type CreateListInput = z.infer<typeof CreateListSchema>;
export type UpdateListInput = z.infer<typeof UpdateListSchema>;
export type CreateCardInput = z.infer<typeof CreateCardSchema>;
export type UpdateCardInput = z.infer<typeof UpdateCardSchema>;
export type MoveCardInput = z.infer<typeof MoveCardSchema>;
//# sourceMappingURL=validation.d.ts.map