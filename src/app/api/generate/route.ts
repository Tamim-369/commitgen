import { Groq } from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import tokenizer from "gpt-tokenizer";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Split text into chunks of maxTokens
function splitIntoChunks(text: string, maxTokens: number): string[] {
  const tokens = tokenizer.encode(text);
  const chunks: string[] = [];

  for (let i = 0; i < tokens.length; i += maxTokens) {
    const chunkTokens = tokens.slice(i, i + maxTokens);
    chunks.push(tokenizer.decode(chunkTokens));
  }

  return chunks;
}

// Generate commit message for one chunk
async function generateChunkSummary(diffChunk: string): Promise<string> {
  const prompt = `
You are a senior software engineer. Summarize this git diff chunk in 1 short phrase (max 10 words).
Focus on WHAT changed, not HOW.

DIFF CHUNK:
${diffChunk}
`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    temperature: 0.3,
    max_tokens: 32,
    top_p: 1,
  });

  return chatCompletion.choices[0]?.message?.content?.trim() || "Fix bug";
}

// Generate final commit from summaries → STRIP <thinking> tags
async function generateFinalCommit(summaries: string[]): Promise<string> {
  const prompt = `
You are a senior software engineer. Combine these change summaries into ONE concise, professional git commit message.
Rules:
- Max 50 characters
- Imperative mood ("Add feature", not "Added feature")
- No fluff, no emojis, no <thinking> tags

CHANGE SUMMARIES:
${summaries.join("\n")}

FINAL COMMIT MESSAGE:
`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "qwen/qwen3-32b",
  });

  let message =
    chatCompletion.choices[0]?.message?.content?.trim() || "Fix bug";

  // 🧹 STRIP <thinking>...</thinking> TAGS
  message = message.replace(/<thinking>[\s\S]*?<\/thinking>/g, "").trim();
  message = message.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

  // 🧹 STRIP any remaining "Thought:" or "Reasoning:" lines
  message = message
    .split("\n")
    .filter(
      (line) =>
        !line.toLowerCase().includes("thought:") &&
        !line.toLowerCase().includes("reasoning:")
    )
    .join("\n")
    .trim();

  // 🧹 IF message is empty → fallback
  if (!message) message = "Fix bug";

  return message;
}

export async function POST(request: NextRequest) {
  const { diff } = await request.json();

  try {
    // Trim huge diffs (optional safety)
    const safeDiff = diff.length > 100000 ? diff.slice(-100000) : diff;

    // Split into 3k-token chunks
    const chunks = splitIntoChunks(safeDiff, 3000);
    console.log(`Split into ${chunks.length} chunks`);

    // Generate summary for each chunk
    const summaries = [];
    for (const chunk of chunks) {
      const summary = await generateChunkSummary(chunk);
      summaries.push(summary);
      console.log("Chunk summary:", summary);
    }

    // Generate final commit from summaries
    const finalCommit = await generateFinalCommit(summaries);
    console.log("Final commit:", finalCommit);

    return NextResponse.json({ message: finalCommit });
  } catch (error: any) {
    console.error("Groq error:", error.message);
    if (error.status === 413) {
      return NextResponse.json(
        { message: "Diff too large. Try a smaller change." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "AI is tired. Try again in 10 sec." },
      { status: 500 }
    );
  }
}
