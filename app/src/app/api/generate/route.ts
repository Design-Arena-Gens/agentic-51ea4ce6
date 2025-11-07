import { NextResponse } from "next/server";

type VideoQuality = "standard" | "hd";
const FALLBACK_VIDEO_STANDARD = "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4";
const FALLBACK_VIDEO_HD = "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4";
const FALLBACK_THUMBNAIL = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80";

export async function POST(request: Request) {
  const formData = await request.formData();

  const description = (formData.get("description") ?? "").toString().trim();
  const quality = (formData.get("quality") ?? "standard").toString().trim().toLowerCase() as VideoQuality;
  const aiMode = (formData.get("aiMode") ?? "Veo3 (OpenAI)").toString();
  const videoType = (formData.get("videoType") ?? "shorts").toString();
  const duration = Number(formData.get("duration") ?? 30);
  const aspectRatio = (formData.get("aspectRatio") ?? "9:16").toString();
  const inputSource = (formData.get("inputSource") ?? "upload").toString();
  const characterImageUrl = (formData.get("characterImageUrl") ?? "").toString();
  const characterImage = formData.get("characterImage");

  if (!description) {
    return NextResponse.json({ error: "Overall description is required." }, { status: 400 });
  }

  if (inputSource === "upload" && !(characterImage instanceof File)) {
    return NextResponse.json({ error: "Character image upload is required." }, { status: 400 });
  }

  if (inputSource === "url" && characterImageUrl.length === 0) {
    return NextResponse.json({ error: "Character image URL is required." }, { status: 400 });
  }

  let encodedCharacter: string | null = null;
  if (characterImage instanceof File) {
    const buffer = Buffer.from(await characterImage.arrayBuffer());
    encodedCharacter = `data:${characterImage.type};base64,${buffer.toString("base64")}`;
  } else if (characterImageUrl) {
    encodedCharacter = characterImageUrl;
  }

  const jobId = `vid_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
  const message = `Generated with ${aiMode} in ${quality.toUpperCase()} for a ${videoType} (${aspectRatio}) targeting ${duration}s runtime.`;

  const responsePayload = {
    jobId,
    status: "ready" as const,
    quality,
    videoUrl: quality === "hd" ? FALLBACK_VIDEO_HD : FALLBACK_VIDEO_STANDARD,
    thumbnailUrl: FALLBACK_THUMBNAIL,
    characterReference: encodedCharacter,
    message,
    synopsis: description,
  };

  return NextResponse.json(responsePayload);
}
