export async function GET() {
  return Response.json(
    { ok: false, message: 'Mediator proxy not yet implemented' },
    { status: 501 }
  );
}
