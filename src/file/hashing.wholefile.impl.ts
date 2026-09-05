
export async function fetchAndHashWholeFile(url: string){
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
    }

    const data = await response.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", data);

    const hash =  Array.from(
        new Uint8Array(digest),
        byte => byte.toString(16).padStart(2, "0"),
    ).join("");

    return {
        hash,
        bytes: data.byteLength
    }
}