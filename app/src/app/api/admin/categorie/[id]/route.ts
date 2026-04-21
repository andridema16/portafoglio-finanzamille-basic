import { NextResponse } from "next/server";
import { verificaAdmin } from "@/lib/admin";
import { getCategoriaById, updateCategoria, deleteCategoria } from "@/lib/db";
import type { Categoria } from "@/types/portafoglio";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  const { id } = await params;

  let body: Partial<Categoria>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const existing = await getCategoriaById(id);
  if (!existing) {
    return NextResponse.json({ error: "Categoria non trovata" }, { status: 404 });
  }

  await updateCategoria(id, body);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  const { id } = await params;
  await deleteCategoria(id);
  return NextResponse.json({ success: true });
}
