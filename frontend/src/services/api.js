import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
});

export async function analyzeResumeAndJD(file, jdText) {
  const formData = new FormData();
  formData.append("resume", file);
  formData.append("jdText", jdText);

  const { data } = await apiClient.post("/analyze", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}
