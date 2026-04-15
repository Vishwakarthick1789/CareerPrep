"""ATS-style resume analysis: structure, keywords, and JD alignment."""

import re
from dataclasses import dataclass

# Common section headers (normalized matching)
SECTION_PATTERNS = [
    (r"\b(summary|profile|objective|about)\b", "Summary / Profile"),
    (r"\b(experience|employment|work history|professional experience)\b", "Experience"),
    (r"\b(education|academic|qualifications)\b", "Education"),
    (r"\b(skills|technical skills|competencies)\b", "Skills"),
    (r"\b(certifications?|licenses?)\b", "Certifications"),
    (r"\b(projects?)\b", "Projects"),
]

ACTION_VERBS = frozenset(
    """
    achieved accelerated accomplished administered advised analyzed architected automated
    built championed closed collaborated communicated configured consolidated constructed
    coordinated created cut decreased defined delivered deployed designed developed directed
    drove earned eliminated enhanced established evaluated executed expanded facilitated
    generated grew guided implemented improved increased influenced initiated integrated
    introduced launched led maintained managed mentored migrated modernized negotiated
    optimized orchestrated oversaw owned planned presented prioritized produced programmed
    promoted proposed reduced reengineered reorganized researched resolved restored
    spearheaded streamlined strengthened supervised supported transformed tripled unified
    upgraded validated won wrote
    """.split()
)

STOPWORDS = frozenset(
    """
    a an the and or but if in on at to for of is are was were be been being as by with
    from that this these those it its we our your they their my me i you he she his her
    them us all any both each few more most other some such no nor not only same so than
    too very can will just should could would may might must shall do does did having
    have has had am about into through during before after above below between under
    again further then once here there when where why how
    """.split()
)


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower().strip())


def _tokens(text: str) -> list[str]:
    raw = re.findall(r"[a-z0-9+#]+", _normalize(text))
    return [t for t in raw if len(t) > 1 and t not in STOPWORDS]


def _keyword_set(text: str) -> set[str]:
    return set(_tokens(text))


def _count_bullets(text: str) -> int:
    lines = text.splitlines()
    n = 0
    for line in lines:
        s = line.strip()
        if re.match(r"^[\-\*\u2022\u2023\u25E6\u2043]\s+", s):
            n += 1
        elif re.match(r"^\d+[\.)]\s+", s):
            n += 1
    return n


def _detect_sections(text: str) -> list[str]:
    found: list[str] = []
    lower = _normalize(text)
    for pattern, label in SECTION_PATTERNS:
        if re.search(pattern, lower):
            found.append(label)
    return list(dict.fromkeys(found))


@dataclass
class ATSResult:
    overall_score: int
    keyword_match_pct: float
    structure_score: int
    readability_notes: list[str]
    strengths: list[str]
    improvements: list[str]
    missing_from_jd: list[str]
    matched_from_jd: list[str]


def analyze_resume(resume_text: str, job_description: str | None) -> ATSResult:
    resume = resume_text or ""
    jd = job_description or ""

    jd_keywords = _keyword_set(jd) if jd.strip() else set()
    resume_keywords = _keyword_set(resume)

    matched: list[str] = []
    missing: list[str] = []
    if jd_keywords:
        overlap = jd_keywords & resume_keywords
        matched = sorted(overlap)[:40]
        missing = sorted(jd_keywords - overlap)[:25]
        keyword_match_pct = round(100 * len(overlap) / max(len(jd_keywords), 1), 1)
    else:
        keyword_match_pct = 0.0

    sections = _detect_sections(resume)
    word_count = len(resume.split())
    bullets = _count_bullets(resume)
    action_hits = sum(1 for t in _tokens(resume) if t in ACTION_VERBS)

    structure_score = 0
    strengths: list[str] = []
    improvements: list[str] = []
    notes: list[str] = []

    if len(sections) >= 4:
        structure_score += 28
        strengths.append("Clear section structure (Experience, Education, Skills, etc.).")
    elif len(sections) >= 2:
        structure_score += 18
        improvements.append("Add labeled sections (Summary, Experience, Education, Skills) for ATS parsing.")
    else:
        improvements.append("Use standard section headings so ATS can map your content.")

    if 350 <= word_count <= 900:
        structure_score += 22
        strengths.append("Resume length is in a typical ATS-friendly range.")
    elif word_count < 200:
        structure_score += 5
        improvements.append("Content is short; expand with quantified achievements.")
        notes.append(f"Word count: {word_count} (aim for ~400–800 words for most roles).")
    elif word_count > 1200:
        structure_score += 12
        notes.append(f"Word count: {word_count} — consider tightening for skimmability.")
    else:
        structure_score += 15
        notes.append(f"Word count: {word_count}.")

    if bullets >= 6:
        structure_score += 22
        strengths.append("Good use of bullet points for scan-friendly achievements.")
    elif bullets >= 3:
        structure_score += 12
        improvements.append("Add more bullet points with metrics under each role.")
    else:
        improvements.append("Use bullets (• or -) to list achievements, not dense paragraphs only.")

    if action_hits >= 12:
        structure_score += 18
        strengths.append("Strong use of action verbs.")
    elif action_hits >= 5:
        structure_score += 10
        improvements.append("Swap weak phrases for strong action verbs (led, built, delivered).")
    else:
        improvements.append("Lead bullets with action verbs (achieved, implemented, scaled).")

    structure_score = min(100, structure_score)

    # Blend overall score
    if jd_keywords:
        kw_component = min(100, keyword_match_pct * 0.85 + (20 if keyword_match_pct > 40 else 0))
        overall = int(round(0.45 * kw_component + 0.55 * structure_score))
    else:
        overall = structure_score
        notes.append("Paste a job description to score keyword alignment with that role.")

    overall = max(0, min(100, overall))

    if jd_keywords and keyword_match_pct < 35:
        improvements.insert(0, "Increase overlap with the job description: mirror key skills and tools.")

    return ATSResult(
        overall_score=overall,
        keyword_match_pct=keyword_match_pct if jd_keywords else 0.0,
        structure_score=structure_score,
        readability_notes=notes,
        strengths=strengths[:6],
        improvements=improvements[:8],
        missing_from_jd=missing,
        matched_from_jd=matched,
    )
