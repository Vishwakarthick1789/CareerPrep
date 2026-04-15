import { useEffect, useState } from 'react'
import { ATSChecker } from './components/ATSChecker'
import { InterviewPractice } from './components/InterviewPractice'
import { fetchHealth } from './api'

type Tab = 'ats' | 'interview'

export default function App() {
  const [tab, setTab] = useState<Tab>('ats')
  const [apiOk, setApiOk] = useState<boolean | null>(null)
  const [openai, setOpenai] = useState(false)

  useEffect(() => {
    fetchHealth()
      .then((h) => {
        setApiOk(true)
        setOpenai(h.openai_configured)
      })
      .catch(() => setApiOk(false))
  }, [])

  return (
    <div className="min-h-svh bg-slate-950 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(34,211,238,0.12),transparent)]">
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/90">CareerPrep</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Resume ATS check & interview practice
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
              Tune your resume to a role, then rehearse answers tailored to your title. Built for serious job searches—clear metrics, no clutter.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                apiOk === null
                  ? 'bg-slate-800 text-slate-500'
                  : apiOk
                    ? 'bg-emerald-950/80 text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'bg-rose-950/80 text-rose-300 ring-1 ring-rose-500/30'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  apiOk === null ? 'bg-slate-500' : apiOk ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
              {apiOk === null ? 'Checking API…' : apiOk ? 'API connected' : 'Start backend (see README)'}
            </div>
            {apiOk && (
              <span className="text-[11px] text-slate-500">
                Interview AI: {openai ? 'OpenAI enabled' : 'offline mode (set API key for AI)'}
              </span>
            )}
          </div>
        </div>

        <nav className="mx-auto flex max-w-6xl gap-1 border-t border-white/5 px-4 sm:px-6 lg:px-8">
          {(
            [
              ['ats', 'ATS resume check'],
              ['interview', 'Interview practice'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`relative -mb-px border-b-2 px-4 py-3 text-sm font-medium transition ${
                tab === id
                  ? 'border-cyan-400 text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {tab === 'ats' ? <ATSChecker /> : <InterviewPractice />}
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-600">
        ATS scoring uses heuristics (sections, bullets, verbs, JD keywords). Always verify with the employer’s process.
      </footer>
    </div>
  )
}
