import OpenAI from "openai";
import { env } from "cloudflare:workers";

const allowedTypes = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/x-m4a",
]);

export async function POST(request: Request) {
  try {
    const apiKey = env.OPENAI_API_KEY as string | undefined;
    if (!apiKey) {
      return Response.json({ error: "OpenAI API 키가 설정되지 않았습니다." }, { status: 500 });
    }
    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File) || audio.size === 0) {
      return Response.json({ error: "녹음 파일이 없습니다." }, { status: 400 });
    }
    if (audio.size > 20 * 1024 * 1024) {
      return Response.json({ error: "녹음은 20MB 이하로 보내 주세요." }, { status: 413 });
    }
    const baseType = audio.type.split(";")[0];
    if (baseType && !allowedTypes.has(baseType)) {
      return Response.json({ error: "지원하지 않는 녹음 형식입니다." }, { status: 415 });
    }
    const openai = new OpenAI({ apiKey });
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: (env.OPENAI_TRANSCRIBE_MODEL as string | undefined) || "gpt-4o-mini-transcribe",
      language: "ko",
      prompt: "축산 농가 자연재해 피해 설명입니다. 한우, 젖소, 돼지, 닭, 오리, 축사, 폐사, 부상, 침수, 폭우, 폭설, 시설 파손 등의 표현을 정확히 기록하세요.",
    });
    return Response.json({ text: transcription.text.trim() });
  } catch (error) {
    console.error("Audio transcription failed", error instanceof Error ? error.message : "unknown error");
    return Response.json(
      { error: "음성을 글자로 바꾸지 못했습니다. 다시 녹음해 주세요." },
      { status: 500 },
    );
  }
}
