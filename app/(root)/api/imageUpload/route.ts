import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { uploadLogger } from "@/lib/logger";

interface UploadResponse {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

const CPANEL_API_URL = process.env.NEXT_PUBLIC_CPANEL_API_URL;
const CPANEL_USERNAME = process.env.NEXT_PUBLIC_CPANEL_USERNAME;
const CPANEL_API_TOKEN = process.env.NEXT_PUBLIC_CPANEL_API_TOKEN;
const PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_PUBLIC_DOMAIN;

if (
  !CPANEL_API_URL ||
  !CPANEL_USERNAME ||
  !CPANEL_API_TOKEN ||
  !PUBLIC_DOMAIN
) {
  throw new Error("Missing required cPanel environment variables");
}

interface CpanelResponse {
  status: number;
  errors?: string[] | null;
  data?: {
    succeeded: number;
    failed: number;
    warned: number;
    uploads: {
      size: number;
      warnings: string[];
      file: string;
      reason: string;
      status: number;
    }[];
  };
  warnings?: string[] | null;
  messages?: string[] | null;
  metadata?: Record<string, unknown>;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<UploadResponse>> {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");

    uploadLogger.debug(`Starting upload: ${file.name} (${file.size} bytes)`);

    const response = await fetch(
      `${CPANEL_API_URL}/execute/Fileman/upload_files`,
      {
        method: "POST",
        headers: {
          Authorization: `cpanel ${CPANEL_USERNAME}:${CPANEL_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dir: "/public_html/uploads",
          file: {
            name: file.name,
            data: base64Data,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      uploadLogger.error(`cPanel API error: ${response.status} - ${errorText.substring(0, 200)}`);
      return NextResponse.json(
        {
          success: false,
          error: `Upload failed: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    let data;
    try {
      const responseText = await response.text();
      data = JSON.parse(responseText);
    } catch {
      uploadLogger.error("Failed to parse JSON response from cPanel");
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid response from upload service - received HTML instead of JSON",
        },
        { status: 500 }
      );
    }

    if (data.status === 0 || data.errors) {
      return NextResponse.json(
        { success: false, error: data.errors?.join(", ") || "Upload failed" },
        { status: 500 }
      );
    }

    const fileUrl = `${PUBLIC_DOMAIN}/uploads/${file.name}`;
    uploadLogger.debug(`Upload successful: ${fileUrl}`);
    return NextResponse.json({ success: true, publicUrl: fileUrl });
  } catch (error) {
    uploadLogger.error("Error uploading file:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
