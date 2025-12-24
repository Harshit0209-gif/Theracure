"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function PrivacyPolicyPage() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPdf() {
      try {
        setIsLoading(true);

        // Dynamically import pdfjs-dist only on client-side
        const pdfjs = await import("pdfjs-dist");

        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.mjs",
          import.meta.url
        ).toString();

        const url = "/privacy-policy.pdf";
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();

          // Better text extraction preserving line breaks
          const textItems = content.items.map((item: any) => {
            return {
              str: item.str,
              transform: item.transform,
              width: item.width,
              height: item.height,
            };
          });

          // Sort items by their vertical position (top to bottom)
          textItems.sort((a, b) => b.transform[5] - a.transform[5]);

          let pageText = "";
          let currentY = null;

          for (let j = 0; j < textItems.length; j++) {
            const item = textItems[j];
            const y = item.transform[5];

            // Add line break if we've moved to a new line
            if (currentY !== null && Math.abs(currentY - y) > 5) {
              pageText += "\n";
            }

            pageText += item.str;
            currentY = y;
          }

          fullText += pageText + "\n\n";
        }
        setText(fullText);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load PDF");
      } finally {
        setIsLoading(false);
      }
    }

    loadPdf();
  }, []);

  const formatText = (text: string) => {
    // Split text into lines and process each line
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const formattedElements = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if line is a main heading (all caps or starts with number)
      if (line.match(/^[A-Z\s]+$/) && line.length > 10) {
        formattedElements.push(
          <h2
            key={`heading-${i}`}
            className="text-2xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200 font-sans"
          >
            {line}
          </h2>
        );
      }
      // Check if line is a numbered section
      else if (line.match(/^\d+\.\s+/)) {
        formattedElements.push(
          <h3
            key={`section-${i}`}
            className="text-xl font-semibold text-gray-900 mt-6 mb-3 font-sans"
          >
            {line}
          </h3>
        );
      }
      // Check if line is a bullet point
      else if (
        line.startsWith("●") ||
        line.startsWith("•") ||
        line.startsWith("-")
      ) {
        formattedElements.push(
          <li
            key={`bullet-${i}`}
            className="ml-6 mb-2 text-gray-700 leading-relaxed list-disc text-base font-sans"
          >
            {line.replace(/^[●•-]\s*/, "")}
          </li>
        );
      }
      // Check if line is a sub-bullet or indented content
      else if (line.startsWith("  ") || line.startsWith("\t")) {
        formattedElements.push(
          <div
            key={`indent-${i}`}
            className="ml-8 mb-2 text-gray-600 leading-relaxed text-base font-sans"
          >
            {line.trim()}
          </div>
        );
      }
      // Check if line looks like a title or important text
      else if (line.includes(":") && line.length < 100) {
        formattedElements.push(
          <h4
            key={`subtitle-${i}`}
            className="font-semibold text-gray-900 mt-4 mb-2 text-base font-sans"
          >
            {line}
          </h4>
        );
      }
      // Regular paragraph text
      else {
        formattedElements.push(
          <p
            key={`para-${i}`}
            className="mb-3 text-gray-700 leading-relaxed text-base font-sans"
          >
            {line}
          </p>
        );
      }
    }

    return formattedElements;
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Privacy Policy
            </h1>
            <div className="h-1 w-16 bg-blue-600 rounded"></div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading privacy policy...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="text-red-600 mb-4">
                  <svg
                    className="mx-auto h-12 w-12 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-lg font-semibold">
                    Error Loading Document
                  </p>
                  <p className="text-sm text-gray-600 mt-2">{error}</p>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8">
                <div className="max-w-none">
                  <div className="text-gray-700 text-base leading-7 font-sans">
                    {formatText(text)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
