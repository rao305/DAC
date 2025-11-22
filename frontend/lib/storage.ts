import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, app } from "./firebase";

export interface UploadProgress {
  status: "uploading" | "success" | "error";
  progress?: number;
  url?: string;
  error?: string;
}

/**
 * Upload a file to Firebase Storage
 * @param file - The file to upload
 * @param path - Optional custom path (defaults to chat-images/{userId}/{timestamp}-{filename})
 * @returns Promise with the public download URL
 */
export async function uploadFile(
  file: File,
  path?: string
): Promise<string> {
  try {
    if (!app) {
      console.error("[Storage] Firebase app not initialized");
      throw new Error("Firebase app not initialized");
    }

    // Get storage instance
    const storage = getStorage(app);

    // Generate path if not provided
    if (!path) {
      const userId = auth.currentUser?.uid || "anonymous";
      const timestamp = Date.now();
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      path = `chat-images/${userId}/${timestamp}-${sanitizedFilename}`;
    }

    console.log("[Storage] Uploading file to path:", path);
    const storageRef = ref(storage, path);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });
    console.log("[Storage] Upload complete, getting download URL");

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("[Storage] Download URL obtained:", downloadURL);

    return downloadURL;
  } catch (error) {
    console.error("[Storage] Error uploading file:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
    throw new Error("Failed to upload file");
  }
}

/**
 * Upload an image file with progress tracking
 * @param file - The image file to upload
 * @param onProgress - Optional callback for progress updates
 * @returns Promise with the public download URL
 */
export async function uploadImage(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  try {
    // Validate that it's an image
    if (!file.type.startsWith("image/")) {
      throw new Error("File must be an image");
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error("Image must be smaller than 10MB");
    }

    onProgress?.({ status: "uploading", progress: 0 });

    const url = await uploadFile(file);

    onProgress?.({ status: "success", progress: 100, url });

    return url;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Upload failed";
    onProgress?.({ status: "error", error: errorMessage });
    throw error;
  }
}
