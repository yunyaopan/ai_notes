import { createClient } from "@/lib/supabase/server";
import { TextChunk } from "./types";

export interface Customer {
  id: string;
  stripe_customer_id: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
  email: string;
  user_id: string;
}

export async function saveTextChunks(
  chunks: Omit<TextChunk, "id" | "user_id" | "created_at" | "updated_at">[],
  userId: string
): Promise<TextChunk[]> {
  const supabase = await createClient();

  const chunksToInsert = chunks.map((chunk) => ({
    ...chunk,
    user_id: userId,
  }));

  const { data, error } = await supabase
    .from("text_chunks")
    .insert(chunksToInsert)
    .select();

  if (error) {
    console.error("Database error:", error);
    throw new Error("Failed to save chunks to database");
  }

  return data || [];
}

export async function getUserTextChunks(userId: string): Promise<TextChunk[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("text_chunks")
    .select("*")
    .eq("user_id", userId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Database error:", error);
    throw new Error("Failed to fetch chunks from database");
  }

  return data || [];
}

export async function getUserNoteCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("text_chunks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("Database error:", error);
    throw new Error("Failed to fetch note count");
  }

  return count || 0;
}

export async function updateChunkPinStatus(
  chunkId: string,
  userId: string,
  pinned: boolean
): Promise<TextChunk> {
  const supabase = await createClient();

  // First, if we're pinning this chunk, unpin all other chunks for this user
  if (pinned) {
    const { error: unpinError } = await supabase
      .from("text_chunks")
      .update({ pinned: false })
      .eq("user_id", userId)
      .eq("pinned", true);

    if (unpinError) {
      console.error("Database error unpinning other chunks:", unpinError);
      throw new Error("Failed to unpin other chunks");
    }
  }

  // Now update the target chunk
  const { data, error } = await supabase
    .from("text_chunks")
    .update({ pinned, updated_at: new Date().toISOString() })
    .eq("id", chunkId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Database error updating pin status:", error);
    throw new Error("Failed to update chunk pin status");
  }

  if (!data) {
    throw new Error("Chunk not found or access denied");
  }

  return data;
}

export async function updateTextChunk(
  chunkId: string,
  userId: string,
  content: string,
  category: string
): Promise<TextChunk> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("text_chunks")
    .update({
      content,
      category,
      updated_at: new Date().toISOString(),
    })
    .eq("id", chunkId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Database error updating chunk:", error);
    throw new Error("Failed to update chunk");
  }

  if (!data) {
    throw new Error("Chunk not found or access denied");
  }

  return data;
}

export async function updateChunkStarStatus(
  chunkId: string,
  userId: string,
  starred: boolean
): Promise<TextChunk> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("text_chunks")
    .update({ starred, updated_at: new Date().toISOString() })
    .eq("id", chunkId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Database error updating star status:", error);
    throw new Error("Failed to update chunk star status");
  }

  if (!data) {
    throw new Error("Chunk not found or access denied");
  }

  return data;
}

export async function deleteTextChunk(
  chunkId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("text_chunks")
    .delete()
    .eq("id", chunkId)
    .eq("user_id", userId);

  if (error) {
    console.error("Database error deleting chunk:", error);
    throw new Error("Failed to delete chunk");
  }
}

// Customer operations
export async function createCustomer(
  customerData: Omit<Customer, "id" | "created_at" | "updated_at">
): Promise<Customer> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .insert(customerData)
    .select()
    .single();

  if (error) {
    console.error("Database error creating customer:", error);
    // Check if it's a unique constraint violation (PostgreSQL error code 23505)
    if (error.code === "23505") {
      console.log(
        `Unique constraint violation: Customer with user_id ${customerData.user_id} or stripe_customer_id ${customerData.stripe_customer_id} already exists`
      );
      // Try to fetch and return the existing customer
      const existing = await getCustomerByUserId(customerData.user_id);
      if (existing) {
        console.log(
          `Returning existing customer record for user_id ${customerData.user_id}`
        );
        return existing;
      }
    }
    // Throw the original error object to preserve error details
    throw error;
  }

  return data;
}

export async function updateCustomerSubscriptionStatus(
  stripeCustomerId: string,
  subscriptionStatus: string
): Promise<Customer> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .update({
      subscription_status: subscriptionStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", stripeCustomerId)
    .select()
    .single();

  if (error) {
    console.error(
      "Database error updating customer subscription status:",
      error
    );
    throw new Error("Failed to update customer subscription status");
  }

  if (!data) {
    throw new Error("Customer not found");
  }

  return data;
}

export async function getCustomerByStripeId(
  stripeCustomerId: string
): Promise<Customer | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    console.error("Database error fetching customer:", error);
    throw new Error("Failed to fetch customer");
  }

  return data;
}

export async function getCustomerByUserId(
  userId: string
): Promise<Customer | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    console.error("Database error fetching customer by user ID:", error);
    throw new Error("Failed to fetch customer by user ID");
  }

  return data;
}

export async function updateUserSubscriptionMetadata(
  userId: string,
  subscriptionStatus: string
): Promise<void> {
  // Create admin client for updating app_metadata
  const { createClient } = await import("@supabase/supabase-js");

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { subscription_status: subscriptionStatus },
  });

  if (error) {
    console.error("Error updating user app_metadata:", error);
    throw new Error("Failed to update user subscription metadata");
  }
}

// User settings operations
export interface UserSettings {
  id: string;
  user_id: string;
  anxiety_character: "octupus" | "yellow" | "worm" | "furry" | null;
  created_at: string;
  updated_at: string;
}

export async function getUserSettings(
  userId: string
): Promise<UserSettings | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    console.error("Database error fetching user settings:", error);
    throw new Error("Failed to fetch user settings");
  }

  return data;
}

export async function updateUserSettings(
  userId: string,
  anxietyCharacter: "octupus" | "yellow" | "worm" | "furry"
): Promise<UserSettings> {
  const supabase = await createClient();

  // First, check if settings exist
  const existing = await getUserSettings(userId);

  if (existing) {
    // Update existing settings
    const { data, error } = await supabase
      .from("user_settings")
      .update({
        anxiety_character: anxietyCharacter,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Database error updating user settings:", error);
      throw new Error("Failed to update user settings");
    }

    if (!data) {
      throw new Error("Settings not found or access denied");
    }

    return data;
  } else {
    // Create new settings
    const { data, error } = await supabase
      .from("user_settings")
      .insert({
        user_id: userId,
        anxiety_character: anxietyCharacter,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error creating user settings:", error);
      throw new Error("Failed to create user settings");
    }

    if (!data) {
      throw new Error("Failed to create settings");
    }

    return data;
  }
}

// Meal tracking operations
export interface Meal {
  id: number;
  user_id: string;
  week_start: string; // ISO date string for Monday of the week
  meal_index: number; // 1-14
  meat_type: "red_meat" | "salmon" | "chicken" | "other_seafood" | "small_fish";
  eaten: boolean;
  created_at: string;
  updated_at: string;
}

function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
}

export async function getWeekMeals(
  userId: string,
  weekStart?: string
): Promise<Meal[]> {
  const supabase = await createClient();
  const week = weekStart || getWeekStart();

  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", week)
    .order("meal_index", { ascending: true });

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return [];
    }
    console.error("Database error fetching meals:", error);
    throw new Error("Failed to fetch meals");
  }

  return data || [];
}

export async function initializeWeekMeals(
  userId: string,
  weekStart?: string
): Promise<Meal[]> {
  const supabase = await createClient();
  const week = weekStart || getWeekStart();

  // Check if meals already exist for this week
  const existing = await getWeekMeals(userId, week);
  if (existing.length > 0) {
    return existing;
  }

  // Define the meal quotas
  const mealQuotas: Array<{
    meat_type:
      | "red_meat"
      | "salmon"
      | "chicken"
      | "other_seafood"
      | "small_fish";
    count: number;
  }> = [
    { meat_type: "red_meat", count: 4 },
    { meat_type: "salmon", count: 2 },
    { meat_type: "chicken", count: 2 },
    { meat_type: "other_seafood", count: 1 },
    { meat_type: "small_fish", count: 5 },
  ];

  // Create meals array
  const mealsToInsert: Omit<Meal, "id" | "created_at" | "updated_at">[] = [];
  let mealIndex = 1;

  mealQuotas.forEach((quota) => {
    for (let i = 0; i < quota.count; i++) {
      mealsToInsert.push({
        user_id: userId,
        week_start: week,
        meal_index: mealIndex++,
        meat_type: quota.meat_type,
        eaten: false,
      });
    }
  });

  const { data, error } = await supabase
    .from("meals")
    .insert(mealsToInsert)
    .select();

  if (error) {
    console.error("Database error initializing meals:", error);
    throw new Error("Failed to initialize meals");
  }

  return data || [];
}

export async function updateMealEatenStatus(
  userId: string,
  mealId: number,
  eaten: boolean,
  weekStart?: string
): Promise<Meal> {
  const supabase = await createClient();
  const week = weekStart || getWeekStart();

  const { data, error } = await supabase
    .from("meals")
    .update({
      eaten,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mealId)
    .eq("user_id", userId)
    .eq("week_start", week)
    .select()
    .single();

  if (error) {
    console.error("Database error updating meal:", error);
    throw new Error("Failed to update meal");
  }

  if (!data) {
    throw new Error("Meal not found or access denied");
  }

  return data;
}

// Leafy vegetable tracking operations
export interface LeafyVeg {
  id: number;
  user_id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  grams: number;
  created_at: string;
  updated_at: string;
}

function getWeekStartDate(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // If it's Sunday (0), go back 6 days to get Monday
  // Otherwise, go back (day - 1) days to get Monday
  const daysToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(d);
  monday.setDate(monday.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Helper function to parse date string as local date (for Singapore timezone)
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed, creates local date
}

// Helper function to format date as YYYY-MM-DD in local timezone
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getLeafyVegEntries(
  userId: string,
  limit: number = 10
): Promise<LeafyVeg[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leafy_veg")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return [];
    }
    console.error("Database error fetching leafy veg entries:", error);
    throw new Error("Failed to fetch leafy veg entries");
  }

  return data || [];
}

export async function getWeekLeafyVegTotal(
  userId: string,
  weekStart?: string
): Promise<number> {
  const supabase = await createClient();

  // Parse weekStart as local date if provided, otherwise use current date
  const startDate = weekStart ? parseLocalDate(weekStart) : getWeekStartDate();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6); // Sunday (6 days after Monday)

  // Format dates as YYYY-MM-DD in local timezone
  const startDateStr = formatLocalDate(startDate);
  const endDateStr = formatLocalDate(endDate);

  // Ensure we're using the correct timezone and date format
  console.log("[getWeekLeafyVegTotal] Date calculation:", {
    weekStart,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    startDateStr,
    endDateStr,
  });

  console.log("[getWeekLeafyVegTotal] Query params:", {
    userId,
    weekStart,
    startDateStr,
    endDateStr,
  });

  const { data, error } = await supabase
    .from("leafy_veg")
    .select("grams")
    .eq("user_id", userId)
    .gte("date", startDateStr)
    .lte("date", endDateStr);

  if (error) {
    if (error.code === "PGRST116") {
      console.log("[getWeekLeafyVegTotal] No rows found, returning 0");
      return 0;
    }
    console.error("[getWeekLeafyVegTotal] Database error:", error);
    throw new Error("Failed to fetch week total");
  }

  console.log("[getWeekLeafyVegTotal] Raw data from DB:", data);
  const total = data?.reduce((sum, entry) => sum + entry.grams, 0) || 0;
  console.log("[getWeekLeafyVegTotal] Calculated total:", total);
  return total;
}

export async function getTodayLeafyVeg(
  userId: string,
  date?: string
): Promise<LeafyVeg | null> {
  const supabase = await createClient();
  const targetDate = date || new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("leafy_veg")
    .select("*")
    .eq("user_id", userId)
    .eq("date", targetDate)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    console.error("Database error fetching today's entry:", error);
    throw new Error("Failed to fetch today's entry");
  }

  return data;
}

export async function upsertLeafyVegEntry(
  userId: string,
  date: string,
  grams: number
): Promise<LeafyVeg> {
  const supabase = await createClient();

  // Check if entry exists
  const existing = await getTodayLeafyVeg(userId, date);

  if (existing) {
    // Update existing entry
    const { data, error } = await supabase
      .from("leafy_veg")
      .update({
        grams,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Database error updating leafy veg entry:", error);
      throw new Error("Failed to update leafy veg entry");
    }

    if (!data) {
      throw new Error("Entry not found or access denied");
    }

    return data;
  } else {
    // Create new entry
    const { data, error } = await supabase
      .from("leafy_veg")
      .insert({
        user_id: userId,
        date,
        grams,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error creating leafy veg entry:", error);
      throw new Error("Failed to create leafy veg entry");
    }

    if (!data) {
      throw new Error("Failed to create entry");
    }

    return data;
  }
}

// Bowel movement tracking operations
export interface BowelMovement {
  id: number;
  user_id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  occurred: boolean;
  created_at: string;
  updated_at: string;
}

export async function getBowelMovementEntries(
  userId: string,
  limit: number = 10
): Promise<BowelMovement[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bowel_movement")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return [];
    }
    console.error("Database error fetching bowel movement entries:", error);
    throw new Error("Failed to fetch bowel movement entries");
  }

  return data || [];
}

export async function getTodayBowelMovement(
  userId: string,
  date?: string
): Promise<BowelMovement | null> {
  const supabase = await createClient();
  const targetDate = date || new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("bowel_movement")
    .select("*")
    .eq("user_id", userId)
    .eq("date", targetDate)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    console.error(
      "Database error fetching today's bowel movement entry:",
      error
    );
    throw new Error("Failed to fetch today's bowel movement entry");
  }

  return data;
}

export async function upsertBowelMovementEntry(
  userId: string,
  date: string,
  occurred: boolean
): Promise<BowelMovement> {
  const supabase = await createClient();

  // Check if entry exists
  const existing = await getTodayBowelMovement(userId, date);

  if (existing) {
    // Update existing entry
    const { data, error } = await supabase
      .from("bowel_movement")
      .update({
        occurred,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Database error updating bowel movement entry:", error);
      throw new Error("Failed to update bowel movement entry");
    }

    if (!data) {
      throw new Error("Entry not found or access denied");
    }

    return data;
  } else {
    // Create new entry
    const { data, error } = await supabase
      .from("bowel_movement")
      .insert({
        user_id: userId,
        date,
        occurred,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error creating bowel movement entry:", error);
      throw new Error("Failed to create bowel movement entry");
    }

    if (!data) {
      throw new Error("Failed to create entry");
    }

    return data;
  }
}

// Meat entry tracking operations
export type MeatType =
  | "red_meat"
  | "salmon"
  | "chicken"
  | "other_seafood"
  | "small_fish";

export interface MeatEntry {
  id: number;
  user_id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  meat_type: MeatType;
  created_at: string;
  updated_at: string;
}

export async function getMeatEntries(
  userId: string,
  limit: number = 10
): Promise<MeatEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("meat_entries")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return [];
    }
    console.error("Database error fetching meat entries:", error);
    throw new Error("Failed to fetch meat entries");
  }

  return data || [];
}

export async function getMeatEntriesByDate(
  userId: string,
  date: string
): Promise<MeatEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("meat_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return [];
    }
    console.error("Database error fetching meat entries by date:", error);
    throw new Error("Failed to fetch meat entries by date");
  }

  return data || [];
}

export async function addMeatEntry(
  userId: string,
  date: string,
  meatType: MeatType
): Promise<MeatEntry> {
  const supabase = await createClient();

  // Create new entry - allow duplicates (same meat type on same day is allowed)
  const { data, error } = await supabase
    .from("meat_entries")
    .insert({
      user_id: userId,
      date,
      meat_type: meatType,
    })
    .select()
    .single();

  if (error) {
    console.error("Database error creating meat entry:", error);
    throw new Error("Failed to create meat entry");
  }

  if (!data) {
    throw new Error("Failed to create entry");
  }

  return data;
}

export async function deleteMeatEntry(
  userId: string,
  entryId: number
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("meat_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", userId);

  if (error) {
    console.error("Database error deleting meat entry:", error);
    throw new Error("Failed to delete meat entry");
  }
}
