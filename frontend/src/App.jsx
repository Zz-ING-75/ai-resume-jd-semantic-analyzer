import { useMemo, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import MatchCharts from "./components/MatchCharts";
import SkillChips from "./components/SkillChips";
import { analyzeResumeAndJD } from "./services/api";

const EMPTY_RESULT = {
  match_score: 0,
  exact_matches: [],
  semantic_matches: [],
  missing_skills: [],
  suggestions: [],
  summary: "",
};

function App() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jdText, setJdText] = useState("");
  const [result, setResult] = useState(EMPTY_RESULT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const scoreLevel = useMemo(() => {
    if (result.match_score >= 80) return "高匹配";
    if (result.match_score >= 60) return "中匹配";
    return "低匹配";
  }, [result.match_score]);

  const exactCount = result.exact_matches?.length || 0;
  const semanticCount = result.semantic_matches?.length || 0;
  const missingCount = result.missing_skills?.length || 0;
  const totalCoveredCount = exactCount + semanticCount;
  const getConfidenceBadgeClass = (level) => {
    if (level === "强相关") {
      return "border-emerald-500/60 bg-emerald-500/15 text-emerald-200";
    }
    if (level === "中相关") {
      return "border-sky-500/60 bg-sky-500/15 text-sky-200";
    }
    return "border-amber-500/60 bg-amber-500/15 text-amber-200";
  };

  const handleAnalyze = async () => {
    if (!resumeFile) {
      setError("请先上传 PDF 简历。");
      return;
    }
    if (!jdText.trim()) {
      setError("请粘贴岗位 JD。");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await analyzeResumeAndJD(resumeFile, jdText);
      setResult(data);
    } catch (requestError) {
      const backendError = requestError?.response?.data?.error;
      setError(backendError || "分析失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b17] text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 rounded-3xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-fuchsia-500/10 p-8 shadow-[0_0_80px_rgba(34,211,238,0.1)]">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">AI Resume Intelligence</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">现代化 AI 简历与 JD 分析 Dashboard</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            上传简历并输入岗位 JD，系统自动提取技能关键词，计算岗位匹配度，并可视化展示短板技能。
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">1) 上传 PDF 简历</h2>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-cyan-400/50 bg-slate-800/50 p-8 text-center hover:bg-slate-800/80">
              <UploadCloud className="mb-3 h-8 w-8 text-cyan-300" />
              <span className="text-sm text-slate-200">点击选择 PDF 简历文件</span>
              <span className="mt-1 text-xs text-slate-400">{resumeFile?.name || "尚未选择文件"}</span>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">2) 粘贴岗位 JD</h2>
            <textarea
              className="h-44 w-full rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
              placeholder="请输入岗位职责、技术要求、加分项..."
              value={jdText}
              onChange={(event) => setJdText(event.target.value)}
            />
          </div>
        </section>

        <div className="mt-6">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            onClick={handleAnalyze}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "分析中..." : "开始智能分析"}
          </button>
          {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
            <p className="text-sm text-slate-400">匹配度评分</p>
            <p className="mt-2 text-3xl font-bold text-cyan-300">{result.match_score}%</p>
            <p className="mt-1 text-sm text-slate-300">{scoreLevel}</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
            <p className="text-sm text-slate-400">精确匹配数</p>
            <p className="mt-2 text-3xl font-bold text-emerald-300">{exactCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
            <p className="text-sm text-slate-400">语义匹配数</p>
            <p className="mt-2 text-3xl font-bold text-sky-300">{semanticCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
            <p className="text-sm text-slate-400">缺失技能数</p>
            <p className="mt-2 text-3xl font-bold text-amber-300">{missingCount}</p>
          </div>
        </section>

        <section className="mt-8">
          <MatchCharts matchedCount={totalCoveredCount} missingCount={missingCount} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <SkillChips title="精确匹配技能（Exact Match）" skills={result.exact_matches} variant="success" />
          <SkillChips title="缺失技能" skills={result.missing_skills} variant="warning" />
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 shadow-xl">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">LLM 分析说明</h3>
            <p className="text-sm leading-6 text-slate-200">
              匹配度采用加权算法：精确匹配权重更高，语义匹配权重稍低。系统基于 DeepSeek 对简历和 JD 进行语义理解，
              可识别同义技能与相关技术栈映射关系。
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-sky-400/30 bg-slate-900/60 p-6 shadow-xl">
          <h2 className="mb-4 text-lg font-semibold text-sky-200">语义匹配解析卡片</h2>
          <div className="space-y-4">
            {result.semantic_matches?.length ? (
              result.semantic_matches.map((item, index) => {
                const similarityPercent = Math.round((item.similarity || 0) * 100);
                const hasReason = item.reason?.length > 0;
                const confidenceLevel = item.confidence_level || "弱相关";
                return (
                  <div
                    key={`${item.jd_skill}-${item.resume_skill}-${index}`}
                    className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800/70 to-slate-900/70 p-4 shadow-[0_0_24px_rgba(56,189,248,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-sky-200">{item.jd_skill}</p>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getConfidenceBadgeClass(confidenceLevel)}`}>
                        {confidenceLevel}
                      </span>
                    </div>
                    <p className="my-2 text-center text-xs text-slate-400">↓</p>
                    {hasReason ? (
                      <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200">
                        因为检测到：{item.reason.join(" / ")}
                      </div>
                    ) : null}
                    <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                      <p className="text-sm text-slate-200">候选技能：{item.resume_skill}</p>
                      <p className="mt-1 text-sm text-slate-200">
                        匹配等级：<span className="font-semibold">{confidenceLevel}</span>（{similarityPercent}%）
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-400">暂无通过阈值的语义匹配结果。</p>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-indigo-400/30 bg-slate-900/60 p-6 shadow-xl">
          <h2 className="mb-4 text-lg font-semibold text-indigo-200">AI 总结</h2>
          <p className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm leading-6 text-slate-200">
            {result.summary || "暂无总结，请先上传简历并发起分析。"}
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-cyan-400/30 bg-slate-900/60 p-6 shadow-xl">
          <h2 className="mb-4 text-lg font-semibold text-cyan-200">AI 改简历建议</h2>
          <div className="space-y-3">
            {(result.suggestions?.length ? result.suggestions : [
              "你的简历与岗位要求匹配度较高，可继续优化项目经历和成果表达",
            ]).map((item) => (
              <div
                key={item}
                className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
