import { NextResponse } from "next/server";
import { searchMunicipios } from "@/domain/municipios";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  return NextResponse.json({ municipios: searchMunicipios(query, 20) });
}
