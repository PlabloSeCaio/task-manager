import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getR2Client() {
  if (
    !process.env.R2_ENDPOINT ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY
  ) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) {
    return new NextResponse("Missing key parameter", { status: 400 });
  }

  // If the key is a data URL, redirect directly
  if (key.startsWith("data:")) {
    return new NextResponse(null, {
      status: 302,
      headers: { Location: key },
    });
  }

  const r2 = getR2Client();
  if (!r2) {
    return new NextResponse("R2 not configured", { status: 501 });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    });
    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
    return new NextResponse(null, {
      status: 302,
      headers: { Location: signedUrl },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
