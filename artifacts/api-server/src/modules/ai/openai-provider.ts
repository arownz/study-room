const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function completeStudyTutorChat(history: ChatTurn[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return [
      "The AI tutor is not configured on this server yet.",
      "",
      "Ask your administrator to set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`, default `gpt-4o-mini`) in the API environment.",
      "Your message was saved — try again after configuration.",
    ].join("\n");
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const body = {
    model,
    messages: [
      {
        role: "system" as const,
        content:
          "You are StudyRoom Tutor, a concise study coach. Prefer short sections and bullet points. " +
          "If the user asks for disallowed content (exam cheating, plagiarism), refuse briefly and suggest legitimate study strategies.",
      },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ],
  };

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${errText.slice(0, 500)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("OpenAI returned an empty completion");
  }
  return text;
}
