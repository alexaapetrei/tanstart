import {
	type Photo,
	addPhoto as dbAddPhoto,
	deletePhoto as dbDeletePhoto,
	getAllPhotos as dbGetAllPhotos,
} from "@/lib/indexeddb"; // Assuming @/ is an alias for src/
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Schema for adding a photo (Omit 'id' from Photo)
const addPhotoSchema = z.object({
	name: z.string().min(1, { message: "Photo name cannot be empty." }),
	type: z.string().regex(/^image\/.+/, { message: "Invalid image type." }), // e.g., image/jpeg, image/png
	data: z.string().min(1, { message: "Photo data cannot be empty." }),
});

// Schema for deleting a photo (just the id)
const deletePhotoSchema = z.object({
	id: z.string().min(1, { message: "Photo ID cannot be empty." }), // Using min(1) as IndexedDB uses crypto.randomUUID() which is a string
});

/**
 * Server function to retrieve all photos.
 */
export const getPhotosServerFn = createServerFn({
	method: "GET",
	fn: async () => {
		try {
			const photos = await dbGetAllPhotos();
			return photos;
		} catch (error) {
			console.error("Error getting photos:", error);
			// Depending on how createServerFn handles errors,
			// you might throw a specific error object or return an error response.
			// For now, re-throwing or letting it be caught by a global handler.
			throw new Error("Failed to retrieve photos.");
		}
	},
});

/**
 * Server function to add a new photo.
 * Input is validated using Zod.
 */
export const addPhotoServerFn = createServerFn({
	method: "POST",
	schema: addPhotoSchema,
	fn: async (validatedPhotoData: Omit<Photo, "id">) => {
		try {
			const newPhotoId = await dbAddPhoto(validatedPhotoData);
			return newPhotoId;
		} catch (error) {
			console.error("Error adding photo:", error);
			throw new Error("Failed to add photo.");
		}
	},
});

/**
 * Server function to delete a photo by its ID.
 * Input (photo ID) is validated using Zod.
 */
export const deletePhotoServerFn = createServerFn({
	method: "POST",
	schema: deletePhotoSchema,
	fn: async (validatedData: { id: string }) => {
		try {
			await dbDeletePhoto(validatedData.id);
			// Typically, a successful deletion doesn't return content,
			// or returns a success status/message.
			// For now, void is fine as per IndexedDB function.
		} catch (error) {
			console.error("Error deleting photo:", error);
			throw new Error("Failed to delete photo.");
		}
	},
});

// Ensure Photo type can be used if needed by consumers of these server functions,
// though it's primarily used internally by the DB functions.
export type { Photo };
