import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	// CardTitle, // Optional, not used in this refactor
} from "@/components/ui/card";
import type { Photo } from "@/lib/indexeddb";
import { deletePhotoServerFn } from "@/server/photoActions";
import type { useRouter } from "@tanstack/react-router"; // Corrected import
import { Trash2 } from "lucide-react";
/**
 * @file PhotoGallery component for displaying photos.
 * Photos are passed as props, and deletion functionality is included.
 */
import type React from "react";
import { useState } from "react";
// import { cn } from "@/lib/utils"; // Not explicitly used yet, but good practice if complex conditional classes arise

interface PhotoGalleryProps {
	photos: Photo[];
	router: ReturnType<typeof useRouter>; // Accept router instance as a prop
}

/**
 * PhotoGallery component displays photos in a responsive grid.
 * It receives photos and router instance as props, and handles photo deletion.
 */
const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, router }) => {
	const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);

	// Loading and error states from useQuery are removed.
	// The component relies on the parent route loader for initial data.
	// It still handles the case where the photos prop is empty.

	if (!photos || photos.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center p-10 text-muted-foreground">
				{/* Basic Empty Icon (can be replaced) */}
				<svg
					className="h-8 w-8 mb-3"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
				>
					<title>No photos icon</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
					/>
				</svg>
				<p className="text-lg">No Photos Yet</p>
				<p className="text-sm">Upload some photos to see them here!</p>
			</div>
		);
	}

	const handleDeleteRequest = (photoId: string) => {
		setPhotoToDelete(photoId);
	};

	const handleConfirmDelete = async () => {
		if (!photoToDelete) return;

		try {
			// The server function expects an object with an 'id' property
			await deletePhotoServerFn({ id: photoToDelete });
			router.invalidate(); // Invalidate router cache to refetch photos
		} catch (error) {
			console.error("Failed to delete photo:", error);
			// Optionally, add user feedback here (e.g., toast notification)
			// For now, error is logged to console.
		} finally {
			setPhotoToDelete(null); // Close dialog regardless of outcome
		}
	};

	return (
		<div className="pb-4">
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
				{photos.map((photo) => (
					<Card
						key={photo.id}
						className="group relative overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out"
					>
						<CardContent className="p-0">
							{" "}
							{/* Remove padding for image to fill */}
							<img
								src={photo.data}
								alt={photo.name}
								className="w-full h-auto object-cover aspect-square transition-transform duration-300 ease-in-out group-hover:scale-105"
							/>
						</CardContent>
						<CardFooter className="p-2 flex justify-between items-center bg-gradient-to-t from-black/30 via-black/10 to-transparent">
							<p
								className="text-sm font-medium text-white truncate group-hover:whitespace-normal"
								title={photo.name}
								style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.5)" }}
							>
								{photo.name}
							</p>
							<AlertDialogTrigger asChild>
								<Button
									variant="destructive"
									size="icon"
									aria-label={`Delete photo ${photo.name}`}
									onClick={() => handleDeleteRequest(photo.id)}
									className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 focus:opacity-100" // Show on hover/focus
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</AlertDialogTrigger>
						</CardFooter>
					</Card>
				))}
			</div>

			{/* AlertDialog for Deletion Confirmation - Placed outside the loop */}
			<AlertDialog
				open={!!photoToDelete}
				onOpenChange={(isOpen) => {
					if (!isOpen) setPhotoToDelete(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the
							photo from your local storage.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setPhotoToDelete(null)}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							// Destructive variant is usually applied by default by Shadcn for AlertDialogAction,
							// but can be explicit if needed: className={buttonVariants({ variant: "destructive" })}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

export default PhotoGallery;
