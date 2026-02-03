export interface AIResponse {
    imageUrl: string;
    status: "done" | "failed";
}
export declare const runVirtualTryOn: (personImage: Buffer, garmentImageUrl: string, garmentDescription: string) => Promise<AIResponse>;
//# sourceMappingURL=ai.service.d.ts.map