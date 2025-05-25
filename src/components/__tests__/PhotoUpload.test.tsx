import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";
import PhotoUpload from "../PhotoUpload";
// No longer need Photo type from indexeddb directly here if addPhotoServerFn schema is source of truth

// Mock the server actions module
const mockAddPhotoServerFn = vi.fn();
vi.mock("@/server/photoActions", () => ({
	addPhotoServerFn: mockAddPhotoServerFn,
}));

import type { RouterHistory } from "@tanstack/react-router"; // Using a relevant type from the library

// Mock router passed as a prop
const mockRouterInvalidate = vi.fn();
// Define a minimal type for the mocked router
interface MockRouter {
	invalidate: ReturnType<typeof vi.fn>;
	history?: Partial<RouterHistory>; // Optional, add if needed
}
const mockRouter: MockRouter = {
	invalidate: mockRouterInvalidate,
};

const renderPhotoUpload = () => {
	return render(<PhotoUpload router={mockRouter} />);
};

describe("PhotoUpload Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("renders initial state correctly", () => {
		renderPhotoUpload();
		expect(screen.getByLabelText(/select image file/i)).toBeInTheDocument();
		const uploadButton = screen.getByRole("button", { name: /upload photo/i });
		expect(uploadButton).toBeInTheDocument();
		expect(uploadButton).toBeDisabled();
	});

	test("enables upload button when a file is selected", () => {
		renderPhotoUpload();
		const fileInput = screen.getByLabelText(/select image file/i);
		const uploadButton = screen.getByRole("button", { name: /upload photo/i });
		const file = new File(["(⌐□_□)"], "chucknorris.png", { type: "image/png" });

		fireEvent.change(fileInput, { target: { files: [file] } });
		expect(uploadButton).not.toBeDisabled();
	});

	test("handles successful photo upload", async () => {
		const newPhotoId = "photo-id-123";
		mockAddPhotoServerFn.mockResolvedValue(newPhotoId);

		renderPhotoUpload();
		const fileInput = screen.getByLabelText(
			/select image file/i,
		) as HTMLInputElement;
		const uploadButton = screen.getByRole("button", { name: /upload photo/i });
		const file = new File(["(⌐□_□)"], "test.png", { type: "image/png" });

		fireEvent.change(fileInput, { target: { files: [file] } });
		fireEvent.click(uploadButton);

		// Check for uploading state
		expect(uploadButton).toBeDisabled();
		expect(screen.getByText(/uploading.../i)).toBeInTheDocument();
		expect(fileInput).toBeDisabled();

		await waitFor(() => {
			expect(mockAddPhotoServerFn).toHaveBeenCalledTimes(1);
			expect(mockAddPhotoServerFn).toHaveBeenCalledWith({
				name: "test.png",
				type: "image/png",
				data: expect.stringContaining("data:image/png;base64,"), // FileReader produces base64
			});
		});

		await waitFor(() => {
			expect(mockRouterInvalidate).toHaveBeenCalledTimes(1);
			expect(
				screen.getByText(
					new RegExp(
						`photo "test.png" uploaded successfully! id: ${newPhotoId}`,
						"i",
					),
				),
			).toBeInTheDocument();
			expect(fileInput.files?.length).toBe(0); // File input should be cleared
			// Button should be enabled but disabled because no file is selected
			expect(uploadButton).toBeDisabled();
			expect(screen.queryByText(/uploading.../i)).not.toBeInTheDocument(); // Uploading text gone
		});
	});

	test("handles failed photo upload", async () => {
		const errorMessage = "Upload failed miserably";
		mockAddPhotoServerFn.mockRejectedValue(new Error(errorMessage));

		renderPhotoUpload();
		const fileInput = screen.getByLabelText(/select image file/i);
		const uploadButton = screen.getByRole("button", { name: /upload photo/i });
		const file = new File(["(╯°□°）╯︵ ┻━┻"], "error.jpg", {
			type: "image/jpeg",
		});

		fireEvent.change(fileInput, { target: { files: [file] } });
		fireEvent.click(uploadButton);

		// Check for uploading state
		expect(uploadButton).toBeDisabled();
		expect(screen.getByText(/uploading.../i)).toBeInTheDocument();

		await waitFor(() => {
			expect(mockAddPhotoServerFn).toHaveBeenCalledTimes(1);
		});

		await waitFor(() => {
			expect(
				screen.getByText(
					new RegExp(`error uploading photo: ${errorMessage}`, "i"),
				),
			).toBeInTheDocument();
			expect(mockRouterInvalidate).not.toHaveBeenCalled();
			// Button should be enabled as upload finished (though failed) and file still selected
			expect(uploadButton).not.toBeDisabled();
			expect(screen.queryByText(/uploading.../i)).not.toBeInTheDocument();
		});
	});

	test("shows uploading state correctly during upload process", async () => {
		// Use a promise that doesn't resolve immediately to keep it in pending state
		let resolveUpload: (value: string) => void = () => {};
		const uploadPromise = new Promise<string>((resolve) => {
			resolveUpload = resolve;
		});
		mockAddPhotoServerFn.mockReturnValue(uploadPromise);

		renderPhotoUpload();
		const fileInput = screen.getByLabelText(
			/select image file/i,
		) as HTMLInputElement;
		const uploadButton = screen.getByRole("button", { name: /upload photo/i });
		const file = new File(["(⌐□_□)"], "pending.png", { type: "image/png" });

		fireEvent.change(fileInput, { target: { files: [file] } });
		expect(uploadButton).not.toBeDisabled(); // Enabled after file select

		fireEvent.click(uploadButton); // Start the upload

		// Check that UI updates to "Uploading..." and button is disabled
		await waitFor(() => {
			expect(screen.getByText(/uploading.../i)).toBeInTheDocument();
			expect(uploadButton).toBeDisabled();
			expect(uploadButton).toHaveAttribute("aria-busy", "true");
			expect(fileInput).toBeDisabled();
		});

		// Ensure addPhotoServerFn was called
		expect(mockAddPhotoServerFn).toHaveBeenCalledTimes(1);

		// Now resolve the promise to simulate completion
		resolveUpload("some-id");

		// Check that "Uploading..." text is gone and button is re-enabled (but disabled due to no file)
		await waitFor(() => {
			expect(screen.queryByText(/uploading.../i)).not.toBeInTheDocument();
			expect(uploadButton).toBeDisabled(); // Disabled because file input is cleared
			expect(uploadButton).not.toHaveAttribute("aria-busy"); // aria-busy removed
			expect(fileInput).not.toBeDisabled(); // File input re-enabled
		});
	});
});
