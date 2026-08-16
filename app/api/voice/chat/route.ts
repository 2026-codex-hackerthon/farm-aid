import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { env } from "cloudflare:workers";
import {
  damageInfoSchema,
  getMissingRequiredFields,
  interviewResultSchema,
  mergeDamageInfo,
} from "../../../lib/damage-interview";

const requestSchema = z.object({
  farm: z.object({
    region: z.string(),
    location: z.string(),
    livestockType: z.string(),
    normalCount: z.string(),
    barnCount: z.string(),
  }),
  damage: damageInfoSchema,
  messages: z.array(z.object({ who: z.enum(["ai", "user"]), text: z.string() })).max(30),
  userMessage: z.string().trim().min(1).max(3000),
});

const fieldLabels: Record<string, string> = {
  damageDate: "피해 발생 시점",
  damageLocation: "피해 발생 위치",
  disasterType: "재해 유형",
  livestockType: "피해 축종",
  totalLivestock: "평상시 사육 마릿수",
  deadLivestock: "폐사 마릿수",
  injuredLivestock: "다친 가축 마릿수",
  facilityDamage: "축사·시설 피해 여부",
  facilityDamageDescription: "피해 시설과 내용",
  damageDescription: "전체 피해 내용",
};

function parseCount(value: string) {
  const match = value.replace(/,/g, "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

function fallbackQuestion(field: string) {
  return `${fieldLabels[field] ?? "피해 정보"}을(를) 알려주시겠어요? 잘 모르시면 모른다고 말씀하셔도 괜찮습니다.`;
}

export async function POST(request: Request) {
  try {
    const apiKey = env.OPENAI_API_KEY as string | undefined;
    if (!apiKey) {
      return Response.json({ error: "OpenAI API 키가 설정되지 않았습니다." }, { status: 500 });
    }
    const payload = requestSchema.parse(await request.json());
    const profileDamage = {
      ...payload.damage,
      damageLocation: payload.damage.damageLocation || payload.farm.location || payload.farm.region || null,
      livestockType: payload.damage.livestockType || payload.farm.livestockType || null,
      totalLivestock: payload.damage.totalLivestock ?? parseCount(payload.farm.normalCount),
    };
    const today = new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const openai = new OpenAI({ apiKey });
    const response = await openai.responses.parse({
      model: (env.OPENAI_INTERVIEW_MODEL as string | undefined) || "gpt-5.4-mini",
      input: [
        {
          role: "system",
          content: `당신은 고령 축산 농장주의 피해 신고 준비를 돕는 인터뷰 AI입니다. 오늘은 ${today}(한국 시간)입니다.
공식 피해 판정이나 지원 자격을 확정하지 말고, 사용자가 직접 말한 사실만 추출하세요.
한 문장에 여러 정보가 있으면 모두 한 번에 추출하세요. 이미 농장정보나 이전 대화에서 확인된 내용은 다시 묻지 마세요.
상대 날짜(오늘, 어제, 그제)는 오늘 날짜를 기준으로 YYYY-MM-DD 형태로 바꾸되 시간이 불명확하면 날짜만 기록하세요.
현재 정보와 충돌하는 새 진술은 임의로 덮어쓰지 말고 해당 extracted 필드를 null로 둔 뒤 확인 질문을 하세요.
다음 질문은 가장 중요한 누락 정보 하나만, 짧고 쉬운 한국어로 작성하세요. 사용자가 모른다고 하면 같은 표현으로 반복 질문하지 마세요.
시설 피해가 없으면 facilityDamageDescription은 null이어도 됩니다. complete는 필수 정보가 모두 확인됐을 때만 true입니다.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            farmProfile: payload.farm,
            knownDamage: profileDamage,
            recentConversation: payload.messages.slice(-10),
            latestUserMessage: payload.userMessage,
          }),
        },
      ],
      text: { format: zodTextFormat(interviewResultSchema, "livestock_damage_interview") },
    });
    if (!response.output_parsed) throw new Error("Structured response was empty");
    const mergedDamage = mergeDamageInfo(profileDamage, response.output_parsed.extracted);
    const missingRequiredFields = getMissingRequiredFields(mergedDamage);
    const complete = missingRequiredFields.length === 0;
    const nextQuestion = complete
      ? null
      : response.output_parsed.nextQuestion || fallbackQuestion(missingRequiredFields[0]);
    return Response.json({
      extracted: response.output_parsed.extracted,
      damage: mergedDamage,
      missingRequiredFields,
      nextQuestion,
      complete,
    });
  } catch (error) {
    console.error("Livestock interview request failed", error instanceof Error ? error.message : "unknown error");
    return Response.json(
      { error: "피해 내용을 정리하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
