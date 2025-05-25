import PhotoGallery from "@/components/PhotoGallery";
import PhotoUpload from "@/components/PhotoUpload";
import type { Photo } from "@/lib/indexeddb"; // Import Photo type for loader data
import { getPhotosServerFn } from "@/server/photoActions";
import { createFileRoute, useRouter } from "@tanstack/react-router";
/**
 * @file Defines the route for the photos page.
 * This page includes components for uploading and viewing photos.
 */
import React from "react";

/**
 * The main component for the /photos page.
 * It lays out the photo upload functionality and the photo gallery.
 */
function PhotosPageComponent() {
	const photos = Route.useLoaderData() as Photo[]; // Use type assertion for photos
	const router = useRouter(); // For potential use with PhotoUpload (invalidation)

	return (
		<div className="container mx-auto p-4 sm:p-6 md:p-8">
			<header className="text-center mb-8">
				<h1 className="text-3xl font-bold text-gray-800">Photo Management</h1>
				<p className="text-md text-gray-600">
					Upload new photos and browse your gallery.
				</p>
			</header>

			<section aria-labelledby="upload-section-title" className="mb-12">
				<h2 id="upload-section-title" className="sr-only">
					Upload Photos
				</h2>{" "}
				{/* Screen-reader only title */}
				<PhotoUpload router={router} />
			</section>

			<section aria-labelledby="gallery-section-title">
				<h2
					id="gallery-section-title"
					className="text-2xl font-semibold mb-6 text-gray-700 text-center"
				>
					Your Photo Gallery
				</h2>
				<PhotoGallery photos={photos} router={router} />
			</section>
		</div>
	);
}

/**
 * Route definition for the /photos path.
 * Utilizes createFileRoute from TanStack Router to link the path to the PhotosPageComponent.
 * Includes a loader to fetch photos using getPhotosServerFn.
 */
export const Route = createFileRoute("/photos")({
	loader: () => getPhotosServerFn(),
	component: PhotosPageComponent,
});
