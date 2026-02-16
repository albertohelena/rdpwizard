export interface ApiResponse<T = unknown> {
    data?: T;
    error?: string;
    details?: Record<string, string[]>;
}

export interface ApiErrorResponse {
    error: string;
    retryAfter?: number;
    details?: Record<string, string[]>;
}

export interface StreamEvent {
    text?: string;
    done?: boolean;
    error?: string;
    tokensUsed?: {
        prompt: number;
        completion: number;
        total: number;
    };
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
