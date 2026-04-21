import { NextResponse } from "next/server";
import { verificaAdmin } from "@/lib/admin";
import { updateDividendo, deleteDividendo, updateOperazione, deleteOperazione } from "@/lib/db";
import type { DividendoConId, OperazioneConId } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  const { id } = await params;
  const numId = Number(id);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const tabella = body.tabella as string;

  if (tabella === "dividendi") {
    await updateDividendo(numId, body as Partial<DividendoConId>);
    return NextResponse.json({ success: true });
  }

  if (tabella === "operazioni") {
    await updateOperazione(numId, body as Partial<OperazioneConId>);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Campo 'tabella' obbligatorio (dividendi o operazioni)" }, { status: 400 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  const { id } = await params;
  const numId = Number(id);

  const url = new URL(request.url);
  const tabella = url.searchParams.get("tabella");

  if (tabella === "dividendi") {
    await deleteDividendo(numId);
    return NextResponse.json({ success: true });
  }

  if (tabella === "operazioni") {
    await deleteOperazione(numId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Query param 'tabella' obbligatorio (dividendi o operazioni)" }, { status: 400 });
}
