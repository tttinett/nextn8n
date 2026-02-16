"use client";

import { useEffect, useRef, useState } from "react";

type ApiResult = {
  transcript?: string;
  answer?: string;
  matches?: Array<any>;
  error?: string;
};

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("พร้อมพูด");
  const [result, setResult] = useState<ApiResult>({});

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // รองรับ Chrome: webkitSpeechRecognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("เบราว์เซอร์นี้ไม่รองรับ Web Speech API (แนะนำ Chrome เท่านั้น)");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "th-TH";
    rec.interimResults = false; // เอาเฉพาะผลสุดท้าย
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setStatus("กำลังฟัง... พูดคำถามได้เลย");
    };

    rec.onend = () => {
      setIsListening(false);
      setStatus("หยุดฟังแล้ว");
    };

    rec.onerror = (e: any) => {
      setIsListening(false);
      setStatus(`เกิดข้อผิดพลาด: ${e?.error || "unknown"}`);
      setResult({ error: e?.error || "speech error" });
    };

    rec.onresult = async (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setStatus("ได้ข้อความแล้ว กำลังส่งไปถามระบบ...");
      setResult({ transcript });

      // ส่ง transcript ไป server (ไม่ส่งไฟล์เสียงแล้ว)
      const resp = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });

      const data: ApiResult = await resp.json();
      setResult(data);
      setStatus(data.error ? "เกิดข้อผิดพลาด" : "เสร็จสิ้น");
    };

    recognitionRef.current = rec;
  }, []);

  function start() {
    setResult({});
    try {
      recognitionRef.current?.start();
    } catch {
      // บางครั้ง start ซ้ำเร็วเกิน จะ throw
    }
  }

  function stop() {
    recognitionRef.current?.stop();
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <h1 className="text-4xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">🎙️ IT Shop Voice Q&A</h1>
      <p className="text-lg text-center text-gray-600 dark:text-gray-300 mb-8">
        กดเริ่มแล้วพูด เช่น “มี SSD 1TB ไหม ราคาเท่าไหร่”
      </p>

      <div className="flex justify-center gap-4 mb-8">
        {!isListening ? (
          <button className="px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200" onClick={start}>
            🎤 เริ่มพูด
          </button>
        ) : (
          <button className="px-6 py-3 rounded-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200" onClick={stop}>
            ⏹️ หยุด
          </button>
        )}
        <div className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-center text-sm font-medium shadow-md">{status}</div>
      </div>

      <section className="space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 border-0">
          <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">📝 ข้อความที่ถอดเสียง</div>
          <div className="text-base text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">{result.transcript ?? "ยังไม่มีข้อความ"}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 border-0">
          <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">💬 คำตอบ</div>
          <div className="text-base text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">{result.answer ?? "ยังไม่มีคำตอบ"}</div>
          {result.error && <div className="mt-3 text-sm text-red-500 bg-red-50 dark:bg-red-900 p-3 rounded-lg">{result.error}</div>}
        </div>
      </section>
    </main>
  );
}