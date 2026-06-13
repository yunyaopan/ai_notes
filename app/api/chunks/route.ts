import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveTextChunks, getUserTextChunks } from "@/lib/api/database";
import { SaveChunksRequest, SaveChunksResponse } from "@/lib/api/types";
import { getCategoryKeys } from "@/lib/config/categories";
import { ensureSubscription, isSubscriptionOn } from "@/lib/api/subscription";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure subscription exists and check access
    await ensureSubscription(user);
    const hasAccess = await isSubscriptionOn(user);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Active subscription required" },
        { status: 403 },
      );
    }

    const body: SaveChunksRequest = await request.json();

    if (
      !body.chunks ||
      !Array.isArray(body.chunks) ||
      body.chunks.length === 0
    ) {
      return NextResponse.json(
        { error: "Chunks array is required" },
        { status: 400 },
      );
    }

    // Validate each chunk; unknown categories are normalized to 'other' instead of failing
    const validCategories = getCategoryKeys();
    for (const chunk of body.chunks) {
      if (!chunk.content || typeof chunk.content !== "string") {
        return NextResponse.json(
          { error: "Each chunk must have content" },
          { status: 400 },
        );
      }

      // If category is missing or invalid, fallback to 'other' to avoid 400s
      if (!chunk.category || !validCategories.includes(chunk.category)) {
        console.warn(
          'Invalid or missing category for chunk, falling back to "other":',
          chunk.category,
        );
        // assign fallback category
        chunk.category = "other";
      }
    }

    const savedChunks = await saveTextChunks(body.chunks, user.id);

    const response: SaveChunksResponse = {
      success: true,
      chunks: savedChunks,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Save chunks API error:", error);
    return NextResponse.json(
      { error: "Failed to save chunks" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure subscription exists and check access
    await ensureSubscription(user);
    const hasAccess = await isSubscriptionOn(user);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Active subscription required" },
        { status: 403 },
      );
    }

    const chunks = await getUserTextChunks(user.id);

    return NextResponse.json({ chunks });
  } catch (error) {
    console.error("Get chunks API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chunks" },
      { status: 500 },
    );
  }
}
