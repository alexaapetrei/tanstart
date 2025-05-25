// Photo type from indexeddb is not explicitly needed if addPhotoServerFn infers from Zod
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { addPhotoServerFn } from "@/server/photoActions";
import type { useRouter } from "@tanstack/react-router"; // For router prop type
/**
 * @file PhotoUpload component for selecting and uploading photos.
 */
import type React from "react";
import { type ChangeEvent, useRef, useState } from "react";

interface PhotoUploadProps {
	router: ReturnType<typeof useRouter>;
}

/**
 * PhotoUpload component allows users to select an image file and upload it.
 * It handles file reading, uses server functions for uploading, and displays loading/status messages.
 */
const PhotoUpload: React.FC<PhotoUploadProps> = ({ router }) => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadStatus, setUploadStatus] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);
	const [isUploading, setIsUploading] = useState<boolean>(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	/**
	 * Handles the change event of the file input.
	 * Updates the selectedFile state with the chosen file.
	 * @param event - The change event from the file input.
	 */
	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		setUploadStatus(null); // Clear previous messages
		if (event.target.files?.[0]) {
			setSelectedFile(event.target.files[0]);
		} else {
			setSelectedFile(null);
		}
	};

	const triggerUpload = async () => {
		if (!selectedFile || isUploading) {
			if (!selectedFile) {
				setUploadStatus({
					type: "error",
					message: "Please select a file first.",
				});
			}
			return;
		}

		setUploadStatus(null); // Clear previous messages
		setIsUploading(true);

		const reader = new FileReader();
		reader.onload = async (event) => {
			try {
				const base64Data = event.target?.result as string;
				if (!base64Data) {
					throw new Error("Failed to read file data.");
				}
				const photoDetailsToUpload = {
					name: selectedFile.name,
					type: selectedFile.type,
					data: base64Data,
				};

				// Directly call the server function
				const newPhotoId = await addPhotoServerFn(photoDetailsToUpload);

				router.invalidate(); // Invalidate router cache to refetch photos
				setUploadStatus({
					type: "success",
					message: `Photo "${selectedFile.name}" uploaded successfully! ID: ${newPhotoId}`,
				});
				setSelectedFile(null);
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}
			} catch (error) {
				console.error("Upload error:", error);
				setUploadStatus({
					type: "error",
					message: `Error uploading photo: ${error instanceof Error ? error.message : String(error)}`,
				});
			} finally {
				setIsUploading(false);
			}
		};
		reader.onerror = () => {
			console.error("FileReader error:", reader.error);
			setUploadStatus({
				type: "error",
				message: `Error reading file: ${reader.error?.message || "Unknown error"}`,
			});
			setIsUploading(false); // Also set isUploading to false on reader error
		};
		reader.readAsDataURL(selectedFile);
	};

	return (
		<div className="bg-card text-card-foreground p-6 space-y-6 rounded-lg shadow-lg max-w-lg mx-auto border">
			<h3 className="text-2xl font-semibold text-center text-primary">
				Upload a New Photo
			</h3>
			<div className="space-y-2">
				<label
					htmlFor="file-upload"
					className="text-sm font-medium text-muted-foreground"
				>
					Select image file (e.g., .jpg, .png, .gif)
				</label>
				<Input
					id="file-upload"
					ref={fileInputRef}
					type="file"
					accept="image/*"
					onChange={handleFileChange}
					disabled={isUploading}
					className="file:text-primary-foreground file:bg-primary hover:file:bg-primary/90"
				/>
			</div>
			<Button
				onClick={triggerUpload}
				disabled={!selectedFile || isUploading}
				className="w-full transition-all duration-150 ease-in-out"
				variant={isUploading ? "outline" : "default"}
				aria-busy={isUploading}
			>
				{isUploading ? (
					<>
						<svg
							className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							aria-hidden="true" // Decorative, as button has text and aria-busy
						>
							<title>Loading animation</title>
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							/>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
						Uploading...
					</>
				) : (
					"Upload Photo"
				)}
			</Button>
			{uploadStatus && (
				<div
					className={cn(
						"mt-4 p-3 rounded-md text-sm text-center border",
						uploadStatus.type === "error"
							? "bg-destructive/10 border-destructive text-destructive-foreground"
							: "bg-constructive/10 border-constructive text-constructive-foreground", // Assuming 'constructive' is a defined theme color
					)}
					role={uploadStatus.type === "error" ? "alert" : "status"}
				>
					<p className="font-medium">
						{uploadStatus.type === "error" ? "Error:" : "Success!"}
					</p>
					<p>{uploadStatus.message}</p>
				</div>
			)}
		</div>
	);
};

export default PhotoUpload;
