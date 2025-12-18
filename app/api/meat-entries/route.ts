import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getMeatEntries,
  getMeatEntriesByDate,
  getMeatEntriesByWeek,
  addMeatEntry,
  deleteMeatEntry,
  MeatType,
} from "@/lib/api/database";
import { ensureSubscription, isSubscriptionOn } from "@/lib/api/subscription";

export async function GET(request: NextRequest) {
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
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (action === "by-date") {
      const date = searchParams.get("date");
      if (!date) {
        return NextResponse.json(
          { error: "date query parameter is required" },
          { status: 400 }
        );
      }
      const entries = await getMeatEntriesByDate(user.id, date);
      return NextResponse.json({ entries });
    }

    if (action === "by-week") {
      const weekStart = searchParams.get("week_start");
      if (!weekStart) {
        return NextResponse.json(
          { error: "week_start query parameter is required" },
          { status: 400 }
        );
      }
      const entries = await getMeatEntriesByWeek(user.id, weekStart);
      return NextResponse.json({ entries });
    }

    // Default: get recent entries
    const entries = await getMeatEntries(user.id, limit);

    console.log("[API /meat-entries GET] Response data:", {
      entriesCount: entries.length,
      entries: entries.slice(0, 3), // Log first 3 entries
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Get meat entries API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch meat entries" },
      { status: 500 }
    );
  }
}

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
        { status: 403 }
      );
    }

    const body = await request.json();
    const { date, meat_type } = body;

    if (!date || typeof date !== "string") {
      return NextResponse.json(
        { error: "date (string) is required" },
        { status: 400 }
      );
    }

    if (!meat_type || typeof meat_type !== "string") {
      return NextResponse.json(
        { error: "meat_type (string) is required" },
        { status: 400 }
      );
    }

    const validMeatTypes: MeatType[] = [
      "red_meat",
      "salmon",
      "chicken",
      "other_seafood",
      "small_fish",
    ];
    if (!validMeatTypes.includes(meat_type as MeatType)) {
      return NextResponse.json(
        { error: `meat_type must be one of: ${validMeatTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const entry = await addMeatEntry(user.id, date, meat_type as MeatType);

    console.log("[API /meat-entries POST] Response data:", {
      entry,
      date,
      meat_type,
    });

    return NextResponse.json({
      success: true,
      entry,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Create meat entry API error:", { errorMessage, error });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
        { status: 403 }
      );
    }

    const body = await request.json();
    const { entryId } = body;

    if (typeof entryId !== "number") {
      return NextResponse.json(
        { error: "entryId (number) is required" },
        { status: 400 }
      );
    }

    await deleteMeatEntry(user.id, entryId);

    console.log("[API /meat-entries DELETE] Deleted entry:", { entryId });

    return NextResponse.json({
      success: true,
      message: "Entry deleted successfully",
    });
  } catch (error) {
    console.error("Delete meat entry API error:", error);
    return NextResponse.json(
      { error: "Failed to delete meat entry" },
      { status: 500 }
    );
  }
}
