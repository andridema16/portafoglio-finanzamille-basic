import { NextResponse } from "next/server";
import { getPasswordInfo, setPasswordManuale, removePasswordManuale } from "@/lib/password";

export async function GET() {
  try {
    const info = await getPasswordInfo();
    return NextResponse.json(info);
  } catch {
    return NextResponse.json(
      { error: "Errore nel recupero info password" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string" || password.trim().length < 4) {
      return NextResponse.json(
        { error: "La password deve avere almeno 4 caratteri" },
        { status: 400 }
      );
    }

    await setPasswordManuale(password.trim());
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Errore nel salvataggio della password" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await removePasswordManuale();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Errore nella rimozione della password manuale" },
      { status: 500 }
    );
  }
}
