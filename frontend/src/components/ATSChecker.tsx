import { useCallback, useState } from 'react'
import { analyzeResumeFile, analyzeResumeText, type ATSResult } from '../api'

function ScoreRing({ score, label }: { score: number; label: string }) {
  const clamped = Math.min(100, Math.max(0, score))
  const deg = (clamped / 100) * 360
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative flex h-28 w-28 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(from -90deg, #22d3ee ${deg}deg, rgba(148, 163, 184, 0.25) ${deg}deg)`,
        }}
      >
        <div className="flex h-[5.5rem] w-[5.5rem] flex-col items-center justify-center rounded-full bg-slate-950">
          <span className="font-display text-3xl font-semibold text-white">{clamped}</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-500">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-medium text-slate-400">{label}</span>
    </div>
  )
}

export function ATSChecker() {
  const [mode, setMode] = useState<'paste' | 'file'>('paste')
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ATSResult | null>(null)

  const run = useCallback(async () => {
    setError(null)
    setLoading(true)
    setResult(null)
    try {
      let data: ATSResult
      if (mode === 'file') {
        if (!file) {
          setError('Choose a PDF or DOCX file.')
          setLoading(false)
          return
        }
        data = await analyzeResumeFile(file, jobDescription)
      } else {
        if (resumeText.trim().length < 80) {
          setError('Paste at least ~80 characters of resume text.')
          setLoading(false)
          return
        }
        data = await analyzeResumeText(resumeText, jobDescription)
      }
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [file, jobDescription, mode, resumeText])

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 rounded-xl bg-slate-900/60 p-1 ring-1 ring-white/10">
          {(
            [
              ['paste', 'Paste text'],
              ['file', 'Upload PDF / DOCX'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setMode(k)
                setResult(null)
                setError(null)
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                mode === k
                  ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'paste' ? (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Resume text</span>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={14}
              placeholder="Paste your resume content here (plain text works best)…"
              className="w-full resize-y rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </label>
        ) : (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Resume file</span>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full cursor-pointer rounded-xl border border-dashed border-white/15 bg-slate-950/50 px-4 py-8 text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:border-cyan-500/30"
            />
            <p className="mt-2 text-xs text-slate-500">Supported: PDF and DOCX. Text is extracted server-side.</p>
          </label>
        )}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Job description <span className="font-normal text-slate-500">(recommended)</span>
          </span>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={8}
            placeholder="Paste the job posting. We match keywords and surface gaps…"
            className="w-full resize-y rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </label>

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-900/30 transition hover:from-cyan-500 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Analyzing…' : 'Run ATS analysis'}
        </button>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        {result ? (
          <>
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 ring-1 ring-white/5">
              <h3 className="font-display text-lg font-semibold text-white">Match overview</h3>
              <div className="mt-6 flex flex-wrap items-start justify-around gap-6">
                <ScoreRing score={result.overall_score} label="Overall" />
                <ScoreRing score={result.structure_score} label="Structure" />
              </div>
              {result.keyword_match_pct > 0 && (
                <p className="mt-4 text-center text-sm text-slate-400">
                  Keyword overlap with JD:{' '}
                  <span className="font-semibold text-cyan-300">{result.keyword_match_pct}%</span>
                </p>
              )}
            </div>

            {result.readability_notes.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
                {result.readability_notes.map((n) => (
                  <p key={n} className="leading-relaxed">
                    {n}
                  </p>
                ))}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Strengths</h4>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-300">
                  {result.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-300">Improve</h4>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-300">
                  {result.improvements.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            {result.missing_from_jd.length > 0 && (
              <div className="rounded-xl border border-white/10 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Keywords in JD not in resume</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.missing_from_jd.map((k) => (
                    <span
                      key={k}
                      className="rounded-md bg-slate-800 px-2 py-1 font-mono text-xs text-slate-300"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.matched_from_jd.length > 0 && (
              <div className="rounded-xl border border-cyan-500/20 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Aligned keywords</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.matched_from_jd.slice(0, 20).map((k) => (
                    <span
                      key={k}
                      className="rounded-md bg-cyan-950/50 px-2 py-1 font-mono text-xs text-cyan-200"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/30 p-8 text-center">
            <p className="font-display text-base text-slate-300">Your ATS-style report</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Scores reflect section headings, bullets, action verbs, length, and—when you add a job description—keyword overlap. This is guidance, not a guarantee of ATS behavior.
            </p>
          </div>
        )}
      </aside>
    </div>
  )
}
