"""Role-based interview questions and feedback (optional OpenAI)."""

import json
import re

import httpx

from config import settings

ROLE_QUESTIONS: dict[str, list[str]] = {
    "Software Engineer": [
        "Walk me through a system you designed or significantly improved. What were the tradeoffs?",
        "Describe a production incident you handled. How did you mitigate and prevent recurrence?",
        "How do you approach code review and maintaining quality in a fast-moving team?",
        "Tell me about a time you had to learn a new technology quickly for a deadline.",
    ],
    "Data Scientist / ML": [
        "Describe an end-to-end project: problem framing, data, modeling, and business impact.",
        "How do you validate that a model is ready for production?",
        "Tell me about a time your initial approach failed. What did you change?",
        "How do you communicate uncertainty and limitations to stakeholders?",
    ],
    "Product Manager": [
        "How do you prioritize a backlog when stakeholders disagree?",
        "Describe a product decision you made using data that surprised you.",
        "Tell me about a failed launch or feature. What would you do differently?",
        "How do you align engineering, design, and business goals?",
    ],
    "DevOps / SRE": [
        "Walk me through your CI/CD philosophy and how you measure pipeline health.",
        "Describe an outage or degradation: detection, response, and long-term fix.",
        "How do you balance reliability work with feature delivery?",
        "What metrics do you watch for capacity and incident trends?",
    ],
    "Business / Operations": [
        "Describe a process you optimized. What was the measurable outcome?",
        "Tell me about a cross-functional initiative you led.",
        "How do you handle conflicting priorities from multiple stakeholders?",
        "Give an example of using data to change a decision.",
    ],
    "Designer (UX/UI)": [
        "Walk me through a redesign: research, iteration, and how you measured success.",
        "Describe a time user research contradicted your assumption.",
        "How do you collaborate with PM and engineering under tight constraints?",
        "What is your approach to accessibility and inclusive design?",
    ],
}

GENERIC_POOL = [
    "Why this role and why our company?",
    "What is your greatest professional strength, with a concrete example?",
    "Describe a difficult feedback conversation and the outcome.",
    "Where do you want to grow in the next 2–3 years?",
]


def questions_for_role(role: str) -> list[str]:
    key = next((k for k in ROLE_QUESTIONS if k.lower() == role.strip().lower()), None)
    if key:
        return ROLE_QUESTIONS[key]
    # Partial match
    rl = role.lower()
    for k, qs in ROLE_QUESTIONS.items():
        if k.lower() in rl or rl in k.lower():
            return qs
    return GENERIC_POOL


def _star_score(answer: str) -> tuple[int, list[str]]:
    text = answer.strip()
    if len(text) < 40:
        return 25, ["Expand your answer: aim for 3–6 sentences with a clear example."]
    wc = len(text.split())
    tips: list[str] = []
    score = 55
    if re.search(r"\b(result|outcome|impact|metric|percent|%|increased|reduced|saved)\b", text, re.I):
        score += 15
        tips.append("Good: you hinted at outcome or impact.")
    else:
        tips.append("Add a measurable or explicit outcome (time, money, quality, scale).")
    if re.search(r"\b(situation|context|when|during|team|project)\b", text, re.I):
        score += 10
    else:
        tips.append("Briefly set context: team, timeline, or constraints.")
    if re.search(r"\b(i|we)\s+(led|built|designed|implemented|drove)\b", text, re.I):
        score += 10
    if wc > 120:
        score -= 5
        tips.append("Consider tightening: interview answers are often clearer under ~90 seconds spoken.")
    return min(100, max(0, score)), tips[:4]


async def feedback_with_openai(
    role: str,
    question: str,
    answer: str,
    job_context: str | None,
) -> str | None:
    if not settings.openai_api_key:
        return None
    system = (
        "You are an expert interview coach. Give concise, constructive feedback on the candidate's "
        "answer. Use: (1) what worked, (2) 2–3 specific improvements, (3) a stronger example framing "
        "if useful. Keep under 220 words. Tone: professional and supportive."
    )
    user = json.dumps(
        {
            "role": role,
            "job_context": job_context or "",
            "question": question,
            "answer": answer,
        },
        ensure_ascii=False,
    )
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.openai_model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    "temperature": 0.4,
                    "max_tokens": 500,
                },
            )
            r.raise_for_status()
            data = r.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception:
        return None


def feedback_offline(answer: str) -> str:
    score, tips = _star_score(answer)
    lines = [
        f"**Structure score (heuristic): {score}/100**",
        "",
        "This mode works without an API key. For deeper coaching, set `OPENAI_API_KEY` in `backend/.env`.",
        "",
        "**Quick tips:**",
        *[f"- {t}" for t in tips],
        "",
        "**STAR checklist:** Situation → Task → Action → Result. Mention numbers when possible.",
    ]
    return "\n".join(lines)


