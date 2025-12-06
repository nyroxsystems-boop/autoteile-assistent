import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("OPENAI_API_KEY is required but not set.");
}

const client = new OpenAI({ apiKey });

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function generateChatCompletion(params: {
  messages: ChatMessage[];
  model?: string;
}): Promise<string> {
  const { messages, model = "gpt-4.1-mini" } = params;

  try {
    const response = await client.chat.completions.create({
      model,
      messages
    });

    return response.choices[0]?.message?.content ?? "";
  } catch (err: any) {
    console.error("OpenAI chat completion failed:", err?.message || err);
    throw new Error("OpenAI request failed");
  }
}
