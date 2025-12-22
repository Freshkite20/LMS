import { google } from "googleapis";
import { JWT } from "google-auth-library";
import path from "path";
import cloudinary from "../config/cloudinary.js";
// @ts-ignore
import { fileURLToPath } from 'url';

interface NoteWithImages {
    type: "text" | "image";
    value?: string;
    url?: string;
    alt?: string;
}

interface Subtopic {
    subtopic: string;
    content: NoteWithImages[];
    videos: string[];
    assignments: string[];
}

export interface DocumentJSON {
    title: string;
    description: string;
    category: string;
    phase: string;
    subtopics: Subtopic[];
}

export class GoogleDocService {
    static async fetchGoogleDocAsJson(docId: string): Promise<DocumentJSON | undefined> {
        try {
            const auth = new google.auth.GoogleAuth({
                keyFile: path.join(process.cwd(), "src/service-account.json"),
                scopes: [
                    "https://www.googleapis.com/auth/documents.readonly",
                    "https://www.googleapis.com/auth/drive.readonly",
                ],
            });

            const client = (await auth.getClient()) as JWT;
            const docs = google.docs({ version: "v1", auth: client });
            const res = await docs.documents.get({ documentId: docId });

            const content = res.data.body?.content || [];
            const inlineObjects = res.data.inlineObjects || {};

            const jsonResult: DocumentJSON = {
                title: "",
                description: "",
                category: "",
                phase: "",
                subtopics: [],
            };

            let currentSubtopic: Subtopic | null = null;
            let currentSection: "notes" | "videos" | "assignments" | null = "notes";
            let imageIndex = 0;

            for (const element of content) {
                const paragraph = element.paragraph;
                if (!paragraph) continue;

                const combinedText = (paragraph.elements || [])
                    .map((el) => el.textRun?.content?.trim() || "")
                    .join("")
                    .trim();

                // Section Heading Start
                if (combinedText.startsWith("Title:")) {
                    jsonResult.title = combinedText.replace("Title:", "").trim();
                    continue;
                }

                if (combinedText.startsWith("Description:")) {
                    jsonResult.description = combinedText.replace("Description:", "").trim();
                    continue;
                }

                if (combinedText.startsWith("Category:")) {
                    jsonResult.category = combinedText.replace("Category:", "").trim();
                    continue;
                }

                if (combinedText.startsWith("Phase:")) {
                    jsonResult.phase = combinedText.replace("Phase:", "").trim();
                    continue;
                }

                if (combinedText.startsWith("Subtopic:")) {
                    if (currentSubtopic) {
                        jsonResult.subtopics.push(currentSubtopic);
                    }
                    currentSubtopic = {
                        subtopic: combinedText.replace("Subtopic:", "").trim(),
                        content: [],
                        videos: [],
                        assignments: [],
                    };
                    currentSection = "notes";
                    continue;
                }

                if (combinedText.startsWith("YouTube Videos:")) {
                    currentSection = "videos";
                    continue;
                }

                if (combinedText.startsWith("Assignments:")) {
                    currentSection = "assignments";
                    continue;
                }

                // IMAGE
                const firstElement = paragraph.elements?.[0];
                const objectId = firstElement?.inlineObjectElement?.inlineObjectId;
                if (objectId && inlineObjects[objectId]) {
                    const embeddedObject = inlineObjects[objectId].inlineObjectProperties?.embeddedObject;
                    const sourceUri = embeddedObject?.imageProperties?.contentUri;
                    if (sourceUri && currentSubtopic) {
                        try {
                            const uploaded = await cloudinary.uploader.upload(sourceUri, {
                                folder: "google-docs-images",
                            });
                            currentSubtopic.content.push({
                                type: "image",
                                url: uploaded.secure_url,
                                alt: `Image ${imageIndex++}`,
                            });
                        } catch (uploadError) {
                            console.error(`Failed to upload image at index ${imageIndex}:`, uploadError);
                            // Optionally push a placeholder or just skip
                            currentSubtopic.content.push({
                                type: "text",
                                value: `[Image Upload Failed]`
                            });
                        }
                    }
                    continue;
                }

                // TEXT BLOCK
                if (combinedText && currentSubtopic) {
                    switch (currentSection) {
                        case "notes":
                            currentSubtopic.content.push({ type: "text", value: combinedText });
                            break;
                        case "videos":
                            currentSubtopic.videos.push(combinedText);
                            break;
                        case "assignments":
                            currentSubtopic.assignments.push(combinedText);
                            break;
                    }
                }
            }

            if (currentSubtopic) {
                jsonResult.subtopics.push(currentSubtopic);
            }

            if (!jsonResult.title || jsonResult.subtopics.length === 0) {
                if (!jsonResult.title) {
                    console.warn("Document parsed but no Title found.");
                }
            }

            return jsonResult;
        } catch (error: any) {
            if (error.message && error.message.includes("This operation is not supported for this document")) {
                console.error("Error: User provided a non-Google Doc file (e.g. .docx or .pdf)");
                throw new Error("The file provided is not a native Google Doc (likely .docx or PDF). Please open it in Drive and select 'File > Save as Google Docs' to convert it.");
            }

            console.error("Error fetching document:", error.message || error);
            if (error.response) {
                console.error("Google API Error Details:", JSON.stringify(error.response.data, null, 2));
            }
            throw new Error("Failed to parse Google Document: " + (error.message || "Unknown Error"));
        }
    }
}
