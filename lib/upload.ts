import { v4 as uuidv4 } from "uuid";
import { uploadLogger } from "./logger";

const CPANEL_API_URL = process.env.NEXT_PUBLIC_CPANEL_API_URL;
const CPANEL_USERNAME = process.env.NEXT_PUBLIC_CPANEL_USERNAME;
const CPANEL_API_TOKEN = process.env.NEXT_PUBLIC_CPANEL_API_TOKEN;
const PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_PUBLIC_DOMAIN;

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

export async function uploadImageToCPanel(
  file: File,
  folder: "public_images" | "receipts"
): Promise<UploadResult> {
  const extension = file.name.split(".").pop();
  const randomFileName = `${uuidv4()}.${extension}`;

  const uploadFolder =
    folder === "receipts" ? "public_images/receipts" : folder;

  const apiFormData = new FormData();
  apiFormData.append("dir", `/public_html/${uploadFolder}/`);
  apiFormData.append("file-1", file, randomFileName);

  const authHeader = `cpanel ${CPANEL_USERNAME}:${
    CPANEL_API_TOKEN?.trim() || ""
  }`;

  try {
    uploadLogger.debug(`Starting upload: ${randomFileName} (${file.size} bytes)`);

    const response = await fetch(
      `${CPANEL_API_URL}/execute/Fileman/upload_files`,
      {
        method: "POST",
        headers: { Authorization: authHeader },
        body: apiFormData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      uploadLogger.error(`cPanel API error: ${response.status} - ${errorText.substring(0, 200)}`);
      return {
        success: false,
        error: `Upload failed: ${response.status} ${response.statusText}`,
      };
    }

    let data;
    try {
      const responseText = await response.text();
      data = JSON.parse(responseText);
    } catch {
      uploadLogger.error("Failed to parse JSON response from cPanel");
      return {
        success: false,
        error: "Invalid response from upload service - received HTML instead of JSON",
      };
    }

    if (data.status === 0) {
      return {
        success: false,
        error: data.errors?.join(", ") || "Upload failed",
      };
    }

    const uploadedFile = data.data?.uploads[0];
    if (!uploadedFile || !uploadedFile.file) {
      return { success: false, error: "No uploaded file details returned" };
    }

    const publicUrl = `${PUBLIC_DOMAIN}/${uploadFolder}/${uploadedFile.file}`;
    uploadLogger.debug(`Upload successful: ${publicUrl}`);
    return { success: true, publicUrl };
  } catch (error) {
    uploadLogger.error("Image upload error:", error);
    return { success: false, error: "Failed to upload image" };
  }
}
