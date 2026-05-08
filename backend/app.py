from io import BytesIO
import logging
import traceback

from flask import Flask, jsonify, request
from flask_cors import CORS
from pypdf import PdfReader

from app.services.analyzer import analyze_match


app = Flask(__name__)
CORS(app)
app.logger.setLevel(logging.DEBUG)


@app.get("/api/health")
def health_check():
    return jsonify({"status": "ok"})


@app.post("/api/analyze")
def analyze():
    jd_text = request.form.get("jdText", "").strip()
    resume_file = request.files.get("resume")

    if not resume_file:
        return jsonify({"error": "Please upload a PDF resume file."}), 400

    if not jd_text:
        return jsonify({"error": "Please provide JD content."}), 400

    try:
        app.logger.info("Analyze request started. filename=%s jd_length=%s", getattr(resume_file, "filename", ""), len(jd_text))
        try:
            pdf_data = resume_file.read()
            if not pdf_data:
                return jsonify({"error": "Uploaded PDF file is empty."}), 400
        except Exception as error:
            app.logger.error("Failed to read uploaded file: %s", error)
            app.logger.error("Traceback:\n%s", traceback.format_exc())
            return jsonify({"error": "Failed to read uploaded PDF file."}), 400

        try:
            pdf_reader = PdfReader(BytesIO(pdf_data))
            extracted_pages = []
            for page in pdf_reader.pages:
                extracted_pages.append(page.extract_text() or "")
            resume_text = " ".join(extracted_pages).strip()
        except Exception as error:
            app.logger.error("Failed to parse PDF: %s", error)
            app.logger.error("Traceback:\n%s", traceback.format_exc())
            return jsonify({"error": "PDF 解析失败，请确认文件未损坏且为标准 PDF。"}), 400

        if not resume_text:
            return jsonify({"error": "PDF 可能是扫描版，请上传可复制文字的 PDF。"}), 400

        result = analyze_match(resume_text=resume_text, jd_text=jd_text)
        app.logger.info("Analyze request completed. score=%s", result.get("match_score"))
        return jsonify(result)
    except Exception as error:
        app.logger.error("Analyze request failed: %s", error)
        app.logger.error("Traceback:\n%s", traceback.format_exc())
        return jsonify({"error": f"Analysis failed: {error}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
