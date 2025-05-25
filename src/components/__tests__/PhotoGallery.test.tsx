import type { Photo } from "@/lib/indexeddb"; // Assuming Photo type is exported
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";
import PhotoGallery from "../PhotoGallery"; // Adjust path as needed

// Mock the server actions module
const mockDeletePhotoServerFn = vi.fn();
vi.mock("@/server/photoActions", () => ({
	deletePhotoServerFn: mockDeletePhotoServerFn,
}));

import type { RouterHistory } from "@tanstack/react-router"; // Using a relevant type from the library

// Mock router passed as a prop
const mockRouterInvalidate = vi.fn();
// Define a minimal type for the mocked router
interface MockRouter {
	invalidate: ReturnType<typeof vi.fn>;
	// Add other properties if they are accessed by the component
	history?: Partial<RouterHistory>; // Optional, add if needed
}
const mockRouter: MockRouter = {
	invalidate: mockRouterInvalidate,
};

const mockPhotos: Photo[] = [
	{
		id: "1",
		name: "Photo 1",
		type: "image/jpeg",
		data: "data:image/jpeg;base64,photo1data",
	},
	{
		id: "2",
		name: "Photo 2",
		type: "image/png",
		data: "data:image/png;base64,photo2data",
	},
	{
		id: "3",
		name: "Photo 3",
		type: "image/gif",
		data: "data:image/gif;base64,photo3data",
	},
];

const renderPhotoGallery = (photos: Photo[] = mockPhotos) => {
	return render(<PhotoGallery photos={photos} router={mockRouter} />);
};

describe("PhotoGallery Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Displaying Photos", () => {
		it("renders the correct number of photo cards", () => {
			renderPhotoGallery();
			const images = screen.getAllByRole("img");
			expect(images).toHaveLength(mockPhotos.length);
		});

		it("renders photo details correctly", () => {
			renderPhotoGallery();
			for (const photo of mockPhotos) {
				const imgElement = screen.getByAltText(photo.name) as HTMLImageElement;
				expect(imgElement).toBeInTheDocument();
				expect(imgElement.src).toBe(photo.data);
				expect(screen.getByText(photo.name)).toBeInTheDocument();
			}
		});
	});

	describe("Photo Deletion Process", () => {
		it("successfully deletes a photo after confirmation", async () => {
			mockDeletePhotoServerFn.mockResolvedValue(undefined); // Simulate successful deletion

			renderPhotoGallery();
			const photoToDelete = mockPhotos[0];

			// Find the delete button for the first photo
			// The button is inside an AlertDialogTrigger, associated with the card
			const deleteButton = screen.getAllByRole("button", {
				name: /delete photo/i,
			})[0];
			expect(deleteButton).toBeInTheDocument();

			fireEvent.click(deleteButton);

			// AlertDialog should appear
			await waitFor(() => {
				expect(
					screen.getByText("Are you absolutely sure?"),
				).toBeInTheDocument();
			});

			const confirmDeleteButton = screen.getByRole("button", {
				name: /delete/i,
			}); // Assuming 'Delete' is the text for confirm
			expect(confirmDeleteButton).toBeInTheDocument();

			fireEvent.click(confirmDeleteButton);

			// Check if deletePhotoServerFn was called
			await waitFor(() => {
				expect(mockDeletePhotoServerFn).toHaveBeenCalledTimes(1);
				expect(mockDeletePhotoServerFn).toHaveBeenCalledWith({
					id: photoToDelete.id,
				});
			});

			// Check if router.invalidate was called
			expect(mockRouterInvalidate).toHaveBeenCalledTimes(1);

			// AlertDialog should close
			await waitFor(() => {
				expect(
					screen.queryByText("Are you absolutely sure?"),
				).not.toBeInTheDocument();
			});
		});

		it("cancels deletion when cancel button is clicked in dialog", async () => {
			renderPhotoGallery();

			const deleteButton = screen.getAllByRole("button", {
				name: /delete photo/i,
			})[0];
			fireEvent.click(deleteButton);

			await waitFor(() => {
				expect(
					screen.getByText("Are you absolutely sure?"),
				).toBeInTheDocument();
			});

			const cancelButton = screen.getByRole("button", { name: /cancel/i });
			fireEvent.click(cancelButton);

			await waitFor(() => {
				expect(
					screen.queryByText("Are you absolutely sure?"),
				).not.toBeInTheDocument();
			});

			expect(mockDeletePhotoServerFn).not.toHaveBeenCalled();
			expect(mockRouterInvalidate).not.toHaveBeenCalled();
		});

		it("handles error during photo deletion", async () => {
			const errorMessage = "Deletion failed";
			mockDeletePhotoServerFn.mockRejectedValue(new Error(errorMessage));
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			renderPhotoGallery();
			const photoToDelete = mockPhotos[0];
			const deleteButton = screen.getAllByRole("button", {
				name: /delete photo/i,
			})[0];
			fireEvent.click(deleteButton);

			await waitFor(() => {
				expect(
					screen.getByText("Are you absolutely sure?"),
				).toBeInTheDocument();
			});

			const confirmDeleteButton = screen.getByRole("button", {
				name: /delete/i,
			});
			fireEvent.click(confirmDeleteButton);

			await waitFor(() => {
				expect(mockDeletePhotoServerFn).toHaveBeenCalledWith({
					id: photoToDelete.id,
				});
			});

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"Failed to delete photo:",
				expect.any(Error),
			);
			expect(mockRouterInvalidate).not.toHaveBeenCalled(); // Should not invalidate if deletion fails

			// Dialog should still close
			await waitFor(() => {
				expect(
					screen.queryByText("Are you absolutely sure?"),
				).not.toBeInTheDocument();
			});
			consoleErrorSpy.mockRestore();
		});
	});

	describe("Empty Gallery", () => {
		it('displays a "No Photos Yet" message when there are no photos', () => {
			renderPhotoGallery([]); // Pass empty array
			expect(screen.getByText(/no photos yet/i)).toBeInTheDocument();
			expect(
				screen.getByText(/upload some photos to see them here!/i),
			).toBeInTheDocument();
		});
	});
});
