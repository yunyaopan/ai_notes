import { MeatTracker } from "@/components/meat-tracker";
import { LeafyVegTracker } from "@/components/leafy-veg-tracker";
import { BowelMovementTracker } from "@/components/bowel-movement-tracker";

export default async function TrackerPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-6 sm:gap-8 max-w-4xl mx-auto px-4 sm:px-0">
      <MeatTracker />
      <LeafyVegTracker />
      <BowelMovementTracker />
    </div>
  );
}

