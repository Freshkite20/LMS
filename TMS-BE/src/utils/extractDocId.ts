export const extractDocIdfromUrl = (url: string): string => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
        return match[1];
    }
    throw new Error("Invalid Google Doc URL");
};
