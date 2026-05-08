# AI Resume & JD Analyzer

一个适合作为 GitHub 作品集展示的前后端分离项目：

- 前端：React + Vite + TailwindCSS
- 后端：Python Flask
- 功能：PDF 简历解析、JD 技能提取、匹配度计算、缺失技能分析、可视化 Dashboard

## 项目结构

```text
JD-Analyzer/
├─ backend/
│  ├─ app/
│  │  └─ services/
│  │     └─ analyzer.py
│  └─ app.py
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  │  ├─ MatchCharts.jsx
│  │  │  └─ SkillChips.jsx
│  │  ├─ services/
│  │  │  └─ api.js
│  │  ├─ App.jsx
│  │  ├─ index.css
│  │  └─ main.jsx
│  └─ ...
├─ requirements.txt
└─ README.md
```

## 功能清单

1. 上传 PDF 简历
2. 粘贴岗位 JD
3. 提取简历技能关键词
4. 提取 JD 技能关键词
5. 计算岗位匹配度
6. 显示缺失技能
7. 图表可视化匹配结果（饼图 + 柱状图）
8. 科技感现代化 Dashboard
9. 前后端分离
10. API 通信（`/api/analyze`）

## 本地运行

### 1) 启动后端（Flask）

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
pip install -r requirements.txt
python backend/app.py
```

后端默认运行在 `http://127.0.0.1:5000`

### 2) 启动前端（React）

```bash
cd frontend
npm install
npm run dev
```

前端默认运行在 `http://127.0.0.1:5173`，已通过 Vite Proxy 转发 `/api` 请求到后端。

## API 说明

### `POST /api/analyze`

- `multipart/form-data`
- 字段：
  - `resume`: PDF 文件
  - `jdText`: 岗位描述文本

返回字段包括：

- `resume_skills`
- `jd_skills`
- `matched_skills`
- `missing_skills`
- `match_score`
- `stats`

## 后续可扩展方向

- 更智能的关键词抽取（NLP、词向量、同义词映射）
- 多语言简历支持
- 登录与历史分析记录
- 一键导出分析报告（PDF）
