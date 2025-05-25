import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PhotoUpload from "../PhotoUpload";
import { vi } from "vitest";
import type { MutationOptions } from "@tanstack/react-query";
import type { Photo } from "@/lib/indexeddb"; // Assuming Photo type is exported

// Store mutation options to be called in tests
// Define a more specific type for mutationOptions
// Omit<Photo, 'id'> is the type for newPhotoData, number is the expected return from addPhoto (photoId)
let mutationOptions: MutationOptions<
	number,
	Error,
	Omit<Photo, "id">,
	unknown
> | null;

const mockMutate = vi.fn((variables: Omit<Photo, "id">) => {
	// Simulate async behavior and then call onSuccess or onError based on test needs
	if (mutationOptions?.mutationFn) {
		// Apply optional chaining here
		mutationOptions
			.mutationFn(variables)
			.then(
				(
					data: number, // data is photoId, which is a number
				) => mutationOptions.onSuccess?.(data, variables, undefined),
			)
			.catch(
				(
					error: Error, // error should be of type Error
				) => mutationOptions.onError?.(error, variables, undefined),
			);
	}
});
const mockInvalidateQueries = vi.fn();
let mockIsPending = false;

vi.mock("@tanstack/react-query", async (importOriginal) => {
	const original =
		await importOriginal<typeof import("@tanstack/react-query")>();
	return {
		...original,
		useMutation: vi.fn((options) => {
			mutationOptions = options; // Store options
			return {
				mutate: mockMutate,
				isPending: mockIsPending,
			};
		}),
		useQueryClient: vi.fn(() => ({
			invalidateQueries: mockInvalidateQueries,
		})),
	};
});

const mockAddPhoto = vi.fn();
vi.mock("@/lib/indexeddb", () => ({
	// Ensure this path matches your project structure
	addPhoto: mockAddPhoto,
}));

const renderPhotoUpload = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false, // Important for tests to prevent retries from masking issues
			},
		},
	});
	return render(
		<QueryClientProvider client={queryClient}>
			<PhotoUpload />
		</QueryClientProvider>,
	);
};

describe("PhotoUpload Component", () => {
	beforeEach(() => {
		vi.clearAllMocks(); // Clears all mocks, including call counts and stored options
		mockIsPending = false;
		mutationOptions = null; // Reset stored mutation options
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
		mockAddPhoto.mockResolvedValue(123); // Simulate addPhoto resolving successfully

		renderPhotoUpload();
		const fileInput = screen.getByLabelText(
			/select image file/i,
		) as HTMLInputElement;
		const uploadButton = screen.getByRole("button", { name: /upload photo/i });
		const file = new File(["(⌐□_□)"], "test.png", { type: "image/png" });

		fireEvent.change(fileInput, { target: { files: [file] } });
		fireEvent.click(uploadButton);

		await waitFor(() => {
			expect(mockMutate).toHaveBeenCalledTimes(1);
			// FileReader adds 'data:image/png;base64,...'
			// For simplicity, we check name and type. A more robust test might check data format.
			expect(mockMutate).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "test.png",
					type: "image/png",
					data: expect.any(String), // FileReader will produce a base64 string
				}),
			);
		});

		// Check that addPhoto was called by the mutationFn
		await waitFor(() => {
			expect(mockAddPhoto).toHaveBeenCalledTimes(1);
		});

		await waitFor(() => {
			expect(mockInvalidateQueries).toHaveBeenCalledWith({
				queryKey: ["photos"],
			});
			expect(
				screen.getByText(/photo "test.png" uploaded successfully! id: 123/i),
			).toBeInTheDocument();
			expect(fileInput.files?.length).toBe(0);
			expect(uploadButton).toBeDisabled(); // Should be disabled after successful upload & input clear
		});
	});

	test("handles failed photo upload", async () => {
		const errorMessage = "Failed to save photo";
		mockAddPhoto.mockRejectedValue(new Error(errorMessage)); // Simulate addPhoto rejecting

		renderPhotoUpload();
		const fileInput = screen.getByLabelText(/select image file/i);
		const uploadButton = screen.getByRole("button", { name: /upload photo/i });
		const file = new File(["(╯°□°）╯︵ ┻━┻"], "error.jpg", {
			type: "image/jpeg",
		});

		fireEvent.change(fileInput, { target: { files: [file] } });
		fireEvent.click(uploadButton);

		await waitFor(() => {
			expect(mockMutate).toHaveBeenCalledTimes(1);
			expect(mockMutate).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "error.jpg",
					type: "image/jpeg",
				}),
			);
		});

		// Check that addPhoto was called by the mutationFn
		await waitFor(() => {
			expect(mockAddPhoto).toHaveBeenCalledTimes(1);
		});

		await waitFor(() => {
			expect(
				screen.getByText(
					new RegExp(`error uploading photo: ${errorMessage}`, "i"),
				),
			).toBeInTheDocument();
			expect(mockInvalidateQueries).not.toHaveBeenCalled();
		});
	});

	test("shows uploading state when mutation is pending", async () => {
		mockIsPending = true; // Set pending state for this test
		// For this test, mockMutate will not resolve or reject, simulating a pending state.
		mockMutate.mockImplementationOnce(() => new Promise(() => {}));

		renderPhotoUpload();
		const fileInput = screen.getByLabelText(
			/select image file/i,
		) as HTMLInputElement;
		const uploadButton = screen.getByRole("button", { name: /uploading.../i });
		const file = new File(["(⌐□_□)"], "pending.png", { type: "image/png" });

		fireEvent.change(fileInput, { target: { files: [file] } });
		expect(uploadButton).not.toBeDisabled(); // Enabled after file select

		fireEvent.click(uploadButton);

		await waitFor(() => {
			expect(uploadButton).toBeDisabled(); // Disabled because isPending is true
			expect(screen.getByText(/uploading.../i)).toBeInTheDocument();
			expect(fileInput).toBeDisabled();
		});

		// Ensure mutate was called even in pending state
		expect(mockMutate).toHaveBeenCalledTimes(1);
	});
});
