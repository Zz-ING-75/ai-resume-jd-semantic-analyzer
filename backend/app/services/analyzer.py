import json
import os
import re
from pathlib import Path

import requests
from dotenv import load_dotenv


ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ENV_PATH)

DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"
EXACT_WEIGHT = 1.0
SEMANTIC_WEIGHT = 0.7
SEMANTIC_THRESHOLD = 0.75


def _get_confidence_level(similarity: float) -> str:
    if similarity >= 0.93:
        return "强相关"
    if similarity >= 0.85:
        return "中相关"
    return "弱相关"


def _extract_json(raw_text: str) -> dict:
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        pass

    code_block_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_text, re.DOTALL)
    if code_block_match:
        return json.loads(code_block_match.group(1))

    first_brace = raw_text.find("{")
    last_brace = raw_text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        return json.loads(raw_text[first_brace : last_brace + 1])

    raise ValueError("LLM response is not valid JSON.")


def _to_clean_list(values: list) -> list[str]:
    if not isinstance(values, list):
        return []
    cleaned = [str(item).strip() for item in values if str(item).strip()]
    return sorted(set(cleaned), key=lambda x: x.lower())


def _normalize_semantic_matches(values: list) -> list[dict]:
    if not isinstance(values, list):
        return []

    normalized = []
    seen = set()
    for item in values:
        if isinstance(item, dict):
            resume_skill = str(item.get("resume_skill", "")).strip()
            jd_skill = str(item.get("jd_skill", "")).strip()
            similarity_raw = item.get("similarity", 0)
            reason = _to_clean_list(item.get("reason", []))
        else:
            text = str(item).strip()
            if "≈" in text:
                left, right = text.split("≈", 1)
                resume_skill = left.strip()
                jd_skill = right.strip()
            else:
                continue
            similarity_raw = 0
            reason = []

        try:
            similarity = float(similarity_raw)
        except (TypeError, ValueError):
            continue

        similarity = max(0.0, min(1.0, similarity))
        if not resume_skill or not jd_skill:
            continue
        if similarity <= SEMANTIC_THRESHOLD:
            continue

        key = (resume_skill.lower(), jd_skill.lower())
        if key in seen:
            continue
        seen.add(key)
        normalized.append(
            {
                "resume_skill": resume_skill,
                "jd_skill": jd_skill,
                "similarity": round(similarity, 2),
                "confidence_level": _get_confidence_level(similarity),
                "reason": reason,
            }
        )

    return sorted(normalized, key=lambda x: x["similarity"], reverse=True)


def _build_prompt(resume_text: str, jd_text: str) -> str:
    return f"""
请你作为资深招聘顾问与技术面试官，分析“简历”与“岗位 JD”的匹配度。

要求：
1) 区分 exact_matches（精确匹配）和 semantic_matches（语义匹配）
2) semantic matching 示例：
   - LLM ≈ Large Language Model
   - REST API ≈ FastAPI
   - AI Agent ≈ LangChain workflow
   - NLP ≈ 文本分析
3) 输出 missing_skills（JD有但简历明显缺失）
4) suggestions 输出3条左右可执行建议
5) summary 给出简洁中文总结（1-3句话）
6) semantic_matches 必须返回对象数组，每个对象包含：
   - resume_skill: 简历技能
   - jd_skill: JD技能
   - similarity: 0~1 的相似度分数（必须是数字）
   - confidence_level: 弱相关 / 中相关 / 强相关
   - reason: 匹配原因关键词数组（例如 ["Python", "NLP", "Machine Learning"]）
7) 对于低相关项请给低 similarity（例如 <=0.75），不要虚高评分
8) 只返回 JSON，不要额外说明

JSON schema:
{{
  "exact_matches": ["..."],
  "semantic_matches": [
    {{
      "resume_skill": "...",
      "jd_skill": "...",
      "similarity": 0.82,
      "confidence_level": "弱相关",
      "reason": ["Python", "NLP", "Machine Learning"]
    }}
  ],
  "missing_skills": ["..."],
  "suggestions": ["..."],
  "summary": "..."
}}

简历文本：
{resume_text[:12000]}

JD 文本：
{jd_text[:8000]}
""".strip()


def analyze_match(resume_text: str, jd_text: str) -> dict:
    api_key = os.getenv("DEEPSEEK_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("DEEPSEEK_API_KEY is missing in backend/.env.")

    payload = {
        "model": DEEPSEEK_MODEL,
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
        "messages": [
            {
                "role": "system",
                "content": "You are a strict JSON generator for resume-job matching.",
            },
            {
                "role": "user",
                "content": _build_prompt(resume_text, jd_text),
            },
        ],
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    response = None
    try:
        response = requests.post(
            DEEPSEEK_API_URL,
            json=payload,
            headers=headers,
            timeout=45,
        )
        response.raise_for_status()
    except requests.HTTPError as exc:
        response_text = ""
        if response is not None:
            response_text = response.text[:1500]
        raise RuntimeError(
            f"DeepSeek API HTTP error: {exc}. response={response_text}"
        ) from exc
    except requests.RequestException as exc:
        raise RuntimeError(f"DeepSeek API request failed: {exc}") from exc

    try:
        content = response.json()["choices"][0]["message"]["content"]
        llm_result = _extract_json(content)
    except Exception as exc:
        raise RuntimeError(f"Failed to parse DeepSeek response: {exc}") from exc

    exact_matches = _to_clean_list(llm_result.get("exact_matches", []))
    semantic_matches = _normalize_semantic_matches(llm_result.get("semantic_matches", []))
    exact_lower_set = {item.lower() for item in exact_matches}
    semantic_jd_skills = {item["jd_skill"].lower() for item in semantic_matches}
    missing_skills = [
        item
        for item in _to_clean_list(llm_result.get("missing_skills", []))
        if item.lower() not in exact_lower_set
        and item.lower() not in semantic_jd_skills
    ]

    if not missing_skills:
        suggestions = [
            "你的简历与岗位要求匹配度较高，可继续优化项目经历和成果表达"
        ]
    else:
        suggestions = _to_clean_list(llm_result.get("suggestions", []))
        if not suggestions:
            focus = ", ".join(missing_skills[:5])
            suggestions = [
                f"建议在简历中补充：{focus}",
                f"建议增加相关项目经历：{', '.join(missing_skills[:3])}",
                f"建议在技能栏中突出：{', '.join(missing_skills[:4])}",
            ]

    denominator = len(exact_matches) + len(semantic_matches) + len(missing_skills)
    if denominator == 0:
        match_score = 0.0
    else:
        weighted = (len(exact_matches) * EXACT_WEIGHT) + (len(semantic_matches) * SEMANTIC_WEIGHT)
        match_score = round((weighted / denominator) * 100, 2)

    summary = str(llm_result.get("summary", "")).strip()
    if not summary:
        summary = "已完成 LLM 语义匹配分析，可结合缺失技能继续优化简历内容。"

    return {
        "match_score": match_score,
        "exact_matches": exact_matches,
        "semantic_matches": semantic_matches,
        "missing_skills": missing_skills,
        "suggestions": suggestions,
        "summary": summary,
    }
