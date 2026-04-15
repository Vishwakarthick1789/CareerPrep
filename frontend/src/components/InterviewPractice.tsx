import { useCallback, useEffect, useState } from 'react'
import { fetchInterviewFeedback, fetchInterviewQuestions } from '../api'

const ROLE_PRESETS = [
  'Software Engineer',
  'Data Scientist / ML',
  'Product Manager',
  'DevOps / SRE',
  'Business / Operations',
  'Designer (UX/UI)',
]

function renderSimpleMarkdown(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const bold = line.match(/^\*\*(.+)\*\*$/)
    if (bold) {
      return (
        <p key={i} className="font-semibold text-white">
          {bold[1]}
        </p>
      )
    }
    if (line.startsWith('- ')) {
      return (
        <li key={i} className="ml-4 list-disc text-slate-300">
          {line.slice(2)}
        </li>
      )
    }
    if (line.trim() === '') return <br key={i} />
    return (
      <p key={i} className="text-slate-300">
        {line}
      </p>
    )
  })
}

export function InterviewPractice() {
  const [role, setRole] = useState('Software Engineer')
  const [customRole, setCustomRole] = useState('')
  const [jobContext, setJobContext] = useState('')
  const [questions, setQuestions] = useState<string[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [loadingQ, setLoadingQ] = useState(false)
  const [loadingFb, setLoadingFb] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [usedAi, setUsedAi] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const effectiveRole = customRole.trim() || role

  const loadQuestions = useCallback(async () => {
    setLoadingQ(true)
    setErr(null)
    try {
      const res = await fetchInterviewQuestions(effectiveRole)
      setQuestions(res.questions)
      setQIndex(0)
      setAnswer('')
      setFeedback(null)
    } catch {
      setErr('Could not load questions. Is the API running?')
    } finally {
      setLoadingQ(false)
    }
  }, [effectiveRole])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  const currentQuestion = questions[qIndex] ?? ''

  const submitFeedback = async () => {
    if (!currentQuestion || answer.trim().length < 10) {
      setErr('Write a few sentences for a useful critique.')
      return
    }
    setErr(null)
    setLoadingFb(true)
    setFeedback(null)
    try {
      const res = await fetchInterviewFeedback({
        role: effectiveRole,
        question: currentQuestion,
        answer,
        job_context: jobContext,
      })
      setFeedback(res.feedback_markdown)
      setUsedAi(res.used_ai)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Feedback failed')
    } finally {
      setLoadingFb(false)
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-1">
            <span className="mb-2 block text-sm font-medium text-slate-300">Role preset</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              {ROLE_PRESETS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-1">
            <span className="mb-2 block text-sm font-medium text-slate-300">Or custom title</span>
            <input
              type="text"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Job / company context <span className="font-normal text-slate-500">(optional, improves AI feedback)</span>
          </span>
          <textarea
            value={jobContext}
            onChange={(e) => setJobContext(e.target.value)}
            rows={4}
            placeholder="Paste a short JD snippet, stack, or what they care about…"
            className="w-full resize-y rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadQuestions}
            disabled={loadingQ}
            className="rounded-lg border border-white/15 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          >
            {loadingQ ? 'Loading…' : 'Refresh questions'}
          </button>
          <span className="text-xs text-slate-500">
            Practicing as: <span className="text-cyan-300">{effectiveRole}</span>
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 ring-1 ring-white/5">
          <div className="flex items-start justify-between gap-4">
            <p className="font-display text-lg font-medium leading-snug text-white">
              {currentQuestion || '—'}
            </p>
            {questions.length > 1 && (
              <span className="shrink-0 rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-400">
                {qIndex + 1} / {questions.length}
              </span>
            )}
          </div>
          {questions.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={qIndex === 0}
                onClick={() => {
                  setQIndex((i) => Math.max(0, i - 1))
                  setAnswer('')
                  setFeedback(null)
                }}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={qIndex >= questions.length - 1}
                onClick={() => {
                  setQIndex((i) => Math.min(questions.length - 1, i + 1))
                  setAnswer('')
                  setFeedback(null)
                }}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-40"
              >
                Next question
              </button>
            </div>
          )}
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">Your answer</span>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={10}
            placeholder="Type as you would speak (STAR format helps)…"
            className="w-full resize-y rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </label>

        {err && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
            {err}
          </div>
        )}

        <button
          type="button"
          onClick={submitFeedback}
          disabled={loadingFb}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingFb ? 'Getting feedback…' : 'Get feedback'}
        </button>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 ring-1 ring-white/5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-lg font-semibold text-white">Coach feedback</h3>
            {feedback && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  usedAi ? 'bg-cyan-950 text-cyan-300 ring-1 ring-cyan-500/30' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {usedAi ? 'AI' : 'Heuristic'}
              </span>
            )}
          </div>
          {!feedback && (
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Feedback uses your API key when <code className="rounded bg-slate-800 px-1 text-xs">OPENAI_API_KEY</code> is set in{' '}
              <code className="rounded bg-slate-800 px-1 text-xs">backend/.env</code>. Otherwise you get structured offline tips (STAR, metrics, length).
            </p>
          )}
          {feedback && (
            <div className="mt-4 space-y-2 text-sm leading-relaxed">{renderSimpleMarkdown(feedback)}</div>
          )}
        </div>
      </aside>
    </div>
  )
}
