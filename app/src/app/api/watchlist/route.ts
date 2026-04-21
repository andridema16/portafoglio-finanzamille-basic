import { NextResponse } from "next/server";
import { getWatchlist } from "@/lib/db";

export async function GET() {
  const items = await getWatchlist();
  return NextResponse.json(items);
}
