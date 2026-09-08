export type Result<T> = {
    success: false,
    data?: undefined,
    error: string,
    errorMessage: string
} | {
    success: true,
    data: T,
    error?: undefined,
    errorMessage?: undefined,
}