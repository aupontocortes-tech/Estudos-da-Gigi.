import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** Ajuda a confirmar na Vercel qual commit está no ar (variável automática do deploy). */
export async function GET() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? null
  return NextResponse.json({
    sha: sha ? sha.slice(0, 7) : null,
    ref: process.env.VERCEL_GIT_COMMIT_REF ?? null,
  })
}
