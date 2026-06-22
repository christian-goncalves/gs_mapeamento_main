import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchMunicipios } from "@/domain/municipios";
import { isEmailAllowed } from "@/lib/auth/allowed-emails";

export async function GET(request: Request) {
  const session = await auth();
  if (!isEmailAllowed(session?.user?.email)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const query = new URL(request.url).searchParams.get("q") ?? "";
  return NextResponse.json({ municipios: searchMunicipios(query, 20) });
}
