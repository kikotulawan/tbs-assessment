"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

type Source = {
  system: string;
  label?: string;
  recordId?: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

const suggestions = [
  "What is the phone number of employee E-1001?",
  "Which facilities require a TB test?",
  "Which shifts require W-202 assigned in the next 5 days?",
  "Can Maria Santos take shift S-3243?",
  "How many open shifts does Oakview Commons have in the next 7 days?",
  "What is employee E-1001's home address?",
];

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function sendQuestion(question = input) {
    const text = question.trim();
    if (!text || loading) return;

    setInput("");
    setError("");
    setLoading(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    const assistantId = crypto.randomUUID();

    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "The assistant could not process the request.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: message.content + chunk }
              : message
          )
        );
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message || "Something went wrong.");
        setMessages((current) =>
          current.filter((message) => message.id !== assistantId || message.content)
        );
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void sendQuestion();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Meridian Staffing Assistant</h1>
            <p className="text-sm text-slate-500">Staffing, shifts, credentials, and eligibility</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Assistant
          </div>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-5xl flex-col px-4 py-6 sm:px-6">
        <div className="flex-1">
          {messages.length === 0 ? (
            <div className="mx-auto max-w-3xl pt-12 text-center sm:pt-20">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white">
                M
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                How can I help with staffing?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-500">
                Ask about employees, facilities, shifts, credentials, employment status,
                or whether a worker is eligible for a shift.
              </p>

              <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => void sendQuestion(suggestion)}
                    className="surface p-4 text-sm text-slate-700 transition hover:border-slate-400 hover:shadow-md"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-5">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={
                      message.role === "user"
                        ? "max-w-[85%] rounded-2xl rounded-br-md bg-slate-900 px-4 py-3 text-sm text-white"
                        : "max-w-[90%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-5 py-4 text-sm leading-6 text-slate-700 shadow-sm"
                    }
                  >
                    {message.content || (loading ? "Thinking…" : "")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mx-auto mb-3 w-full max-w-3xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="surface mx-auto mt-5 flex w-full max-w-3xl gap-3 p-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendQuestion();
              }
            }}
            placeholder="Ask a staffing question..."
            rows={1}
            className="min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!canSend}
            className="self-end rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "..." : "Send"}
          </button>
        </form>

        {loading && (
          <div className="mx-auto mt-2 w-full max-w-3xl text-xs text-slate-400">
            Reading Meridian records and preparing an answer…
          </div>
        )}
      </section>
    </main>
  );
}