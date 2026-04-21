import { NextResponse } from "next/server";
import { verificaAdmin } from "@/lib/admin";
import { getWatchlistItem, updateWatchlistItem, deleteWatchlistItem } from "@/lib/db";
import type { WatchlistItem } from "@/types/portafoglio";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ error: "ID non valido" }, { status: 400 });
  }
  const item = await getWatchlistItem(numId);
  if (!item) {
    return NextResponse.json({ error: "Elemento watchlist non trovato" }, { status: 404 });
  }
  return NextResponse.json(item);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ error: "ID non valido" }, { status: 400 });
  }

  let body: Partial<WatchlistItem>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const existing = await getWatchlistItem(numId);
  if (!existing) {
    return NextResponse.json({ error: "Elemento watchlist non trovato" }, { status: 404 });
  }

  const oggi = new Date().toISOString().slice(0, 10);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, dataInserimento: _di, ...updateData } = body as Record<string, unknown>;
  await updateWatchlistItem(numId, { ...updateData, dataAggiornamento: oggi });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ error: "ID non valido" }, { status: 400 });
  }
  await deleteWatchlistItem(numId);
  return NextResponse.json({ success: true });
}
