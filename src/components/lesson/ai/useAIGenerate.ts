"use client";

import { useState } from "react";

interface GenerateResult {
  content: string;
}

export function useAIGenerate(lessonId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async (section: string, action: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/lessons/${lessonId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, action }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate");
      }

      const data: GenerateResult = await res.json();
      setResult(data.content);
      return data.content;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clear = () => {
    setResult(null);
    setError(null);
  };

  return { generate, isLoading, result, error, clear };
}
