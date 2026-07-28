import { NextResponse } from "next/server";
import { readPaisesCache } from "@/lib/paises.server";

export async function GET() {
  const cache = await readPaisesCache();
  return NextResponse.json({
    updatedAt: cache.updatedAt,
    countries: cache.countries,
  });
}
