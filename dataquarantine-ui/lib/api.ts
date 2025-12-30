export interface SystemMetrics {
    total_processed: number;
    total_valid: number;
    total_invalid: number;
    validation_rate: number;
    throughput: number;
    error_breakdown: Record<string, number>;
}

export interface QuarantineRecord {
    id: string;
    topic: string;
    partition: number;
    offset: number;
    timestamp: string;
    key?: string;
    value: any;
    error_type: string;
    error_message: string;
    schema_name: string;
    schema_version: string;
    meta_data: any;
    created_at: string;
}

export interface QuarantineResponse {
    items: QuarantineRecord[];
    total: number;
    page: number;
    page_size: number;
}

export async function fetchMetrics(): Promise<SystemMetrics> {
    try {
        const res = await fetch('/api/metrics');
        if (!res.ok) {
            console.error("Fetch metrics failed", res.status);
            throw new Error('Failed to fetch metrics');
        }
        return res.json();
    } catch (e) {
        console.error(e);
        // Return fallback data if API is not reachable (e.g. during dev before backend start)
        return {
            total_processed: 0,
            total_valid: 0,
            total_invalid: 0,
            validation_rate: 0,
            throughput: 0,
            error_breakdown: {}
        };
    }
}

export async function fetchQuarantineRecords(
    page = 1,
    pageSize = 10,
    topic?: string,
    errorType?: string
): Promise<QuarantineResponse> {
    const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString()
    });

    if (topic && topic !== 'All Topics') params.append('topic', topic);
    if (errorType && errorType !== 'All Error Types') params.append('error_type', errorType);

    try {
        const res = await fetch(`/api/quarantine/records?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch quarantine records');
        return res.json();
    } catch (e) {
        console.error(e);
        return { items: [], total: 0, page, page_size: pageSize };
    }
}
