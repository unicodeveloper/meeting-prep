import { NextRequest, NextResponse } from "next/server";
import { Valyu } from "valyu-js";
import { isSelfHostedMode } from "@/lib/mode";

export const maxDuration = 800;

// Valyu OAuth Proxy URL (for user credit billing in valyu mode)
const VALYU_OAUTH_PROXY_URL = `${process.env.VALYU_APP_URL || 'https://platform.valyu.ai'}/api/oauth/proxy`;

/**
 * Call Valyu Answer API via OAuth proxy (user credits) or direct SDK (server API key)
 */
async function callValyuAnswer(
  query: string,
  options: any,
  valyuAccessToken?: string
): Promise<any> {
  if (valyuAccessToken) {
    // Use OAuth proxy - charges to user's org credits
    console.log('[Meeting Prep API] Using OAuth proxy for user credit billing');
    const response = await fetch(VALYU_OAUTH_PROXY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${valyuAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: '/v1/answer',
        method: 'POST',
        body: { query, ...options }
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'proxy_failed' }));
      throw new Error(error.error_description || error.error || 'Valyu proxy request failed');
    }

    return response.json();
  } else {
    // Use server API key directly (self-hosted mode)
    console.log('[Meeting Prep API] Using server API key (self-hosted mode)');
    const valyu = new Valyu();
    return valyu.answer(query, options);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    // Check app mode
    const isSelfHosted = isSelfHostedMode();
    console.log("[Meeting Prep API] App mode:", isSelfHosted ? 'self-hosted' : 'valyu');

    // Get Valyu access token from Authorization header (for valyu mode)
    const authHeader = req.headers.get('Authorization');
    const valyuAccessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : undefined;

    // REQUIRE VALYU AUTHENTICATION in valyu mode
    if (!isSelfHosted && !valyuAccessToken) {
      console.log("[Meeting Prep API] No Valyu token - authentication required");
      return NextResponse.json(
        {
          error: "AUTH_REQUIRED",
          message: "Sign in with Valyu to continue.",
        },
        { status: 401 }
      );
    }

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const data: any = await callValyuAnswer(
      `Latest news and key developments about ${topic}`,
      {
        structuredOutput: {
          type: "object",
          properties: {
            executive_summary: {
              type: "string",
              description: "2-minute read summary of key information",
            },
            key_developments: {
              type: "array",
              items: { type: "string" },
              description: "List of recent key developments or news",
            },
            key_people: {
              type: "array",
              items: { type: "string" },
              description: "Key people or leaders mentioned",
            },
            important_dates: {
              type: "array",
              items: { type: "string" },
              description: "Important upcoming dates or recent events",
            },
            talking_points: {
              type: "array",
              items: { type: "string" },
              description: "Key talking points to prepare",
            },
          },
        },
      },
      valyuAccessToken
    );

    if (!data.success) {
      throw new Error("Failed to generate meeting brief");
    }

    const briefData =
      typeof data.contents === "string"
        ? JSON.parse(data.contents)
        : data.contents;

    const result = {
      topic,
      generatedAt: new Date().toISOString(),
      brief: {
        executiveSummary: briefData.executive_summary || "",
        keyDevelopments: briefData.key_developments || [],
        keyPeople: briefData.key_people || [],
        importantDates: briefData.important_dates || [],
        talkingPoints: briefData.talking_points || [],
      },
      sources:
        data.search_results?.map((result: any) => ({
          title: result.title,
          url: result.url,
          publishedDate: result.publication_date,
          snippet: result.description,
        })) || [],
    };

    console.log("Meeting Brief result", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Meeting Prep API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
