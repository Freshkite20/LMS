import { Request, Response, NextFunction } from "express";

import { CoursesService } from "../services/coursesService.js";
import { GoogleDocService } from "../services/googleDocService.js";
import { extractDocIdfromUrl } from "../utils/extractDocId.js";

export class DocToCourseController {
    static async createCourseFromDocs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { docLink } = req.body;

            const docId = extractDocIdfromUrl(docLink);
            console.log("Processing Doc ID:", docId);

            const parsedJson = await GoogleDocService.fetchGoogleDocAsJson(docId);
            console.log("✅ Parsed JSON Structure:", JSON.stringify(parsedJson, null, 2));


            if (!parsedJson) {
                throw new Error("Google Doc could not be fetched or parsed.");
            }


            // Determine template type based on content
            let hasVideo = false;
            let hasImage = false;

            for (const sub of parsedJson.subtopics) {
                if (sub.videos && sub.videos.length > 0) hasVideo = true;
                if (sub.content && sub.content.some(c => c.type === 'image')) hasImage = true;
            }

            let templateType = 'text-only';
            if (hasVideo) {
                templateType = 'text-video';
            } else if (hasImage) {
                templateType = 'text-image';
            }

            // 1. Create the Course using CoursesService
            const courseInput = {
                title: parsedJson.title || "Untitled From Doc",
                description: parsedJson.description || "Imported from Google Doc",
                category: parsedJson.category || "General",
                templateType: templateType,
                difficulty: "beginner",
                estimatedDuration: "0" // Provide default duration to satisfy model requirement
            };

            const createdCourse = await CoursesService.createCourse(courseInput);
            console.log("\n\n********************************************************");
            console.log("✅✅✅ COURSE CREATED SUCCESSFULLY ✅✅✅");
            console.log("👉 Course ID:", createdCourse.id);
            console.log("👉 Title:", createdCourse.title);
            console.log("********************************************************\n\n");

            // 2. Create Sections (Topics)
            let orderIndex = 1;
            for (const sub of parsedJson.subtopics) {
                // Combine notes and images into a single content string (Markdown-like)
                let contentBuilder = "";

                for (const item of sub.content) {
                    if (item.type === 'text' && item.value) {
                        contentBuilder += item.value + "\n\n";
                    } else if (item.type === 'image' && item.url) {
                        contentBuilder += `![Image](${item.url})\n\n`;
                    }
                }

                // Append assignment info if any
                if (sub.assignments && sub.assignments.length > 0) {
                    contentBuilder += "### Assignments\n" + sub.assignments.map(a => `- ${a}`).join("\n") + "\n";
                }

                const sectionInput = {
                    title: sub.subtopic,
                    content: contentBuilder.trim(),
                    videoUrl: sub.videos.length > 0 ? sub.videos[0] : null,
                    imageUrl: null, // First image could be used as cover if needed, specifically skipping for now
                    orderIndex: orderIndex++,
                    duration: 0
                };

                await CoursesService.addSection(createdCourse.id, sectionInput);
            }

            res.status(201).json({ success: true, courseId: createdCourse.id, message: "Course created successfully from Google Doc" });
        } catch (err) {
            console.error("❌ Error creating course:", err);
            next(err);
        }
    }
}
