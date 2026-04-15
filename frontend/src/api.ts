const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export type ATSResult = {
  overall_score: number
  keyword_match_pct: number
  structure_score: number
  readability_notes: string[]
  strengths: string[]
  improvements: string[]
  missing_from_jd: string[]
  matched_from_jd: string[]
}

export async function fetchHealth(): Promise<{ status: string; openai_configured: boolean }> {
  const r = await fetch(`${API_BASE}/api/health`)
  if (!r.ok) throw new Error('API unavailable')
  return r.json()
}

export async function analyzeResumeText(resumeText: string, jobDescription: string): Promise<ATSResult> {
  const r = await fetch(`${API_BASE}/api/ats/analyze-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription }),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error((err as { detail?: string }).detail ?? 'Analysis failed')
  }
  return r.json()
}

export async function analyzeResumeFile(file: File, jobDescription: string): Promise<ATSResult> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('job_description', jobDescription)
  const r = await fetch(`${API_BASE}/api/ats/analyze-file`, {
    method: 'POST',
    body: fd,
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error((err as { detail?: string }).detail ?? 'Upload failed')
  }
  return r.json()
}

export async function fetchInterviewQuestions(role: string): Promise<{ role: string; questions: string[] }> {
  const r = await fetch(`${API_BASE}/api/interview/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  })
  if (!r.ok) throw new Error('Could not load questions')
  return r.json()
}

export async function fetchInterviewFeedback(body: {
  role: string
  question: string
  answer: string
  job_context: string
}): Promise<{ feedback_markdown: string; used_ai: boolean }> {
  const r = await fetch(`${API_BASE}/api/interview/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error((err as { detail?: string }).detail ?? 'Feedback failed')
  }
  return r.json()
}
