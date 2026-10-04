export function GET() {
  return Response.json({ app: "VeloQuest", commit: process.env.NEXT_PUBLIC_BUILD_COMMIT }, {
    headers: { "Cache-Control": "no-store" }
  });
}
