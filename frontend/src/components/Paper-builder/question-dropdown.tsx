import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { QuestionCard } from "./question-card";

interface QuestionDropdownProps {
  mcqCount?: number;
  structuredCount?: number;
  essayCount?: number;
  questions: any[];
  currency?: string;
}

const QuestionDropdown: React.FC<QuestionDropdownProps> = ({
  mcqCount,
  structuredCount,
  essayCount,
  questions,
  currency = "USD"
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const targetNode = event.target as Node | null;
      if (!targetNode) return;
      if (!containerRef.current) return;

      if (!containerRef.current.contains(targetNode)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  const renderLabel = (label: string, color: string, count?: number) => {
    if (!count || count <= 0) return null;
    return (
      <span
        className={`px-2 py-0.5 text-[10px] font-medium rounded-md border ${color} bg-opacity-80`}
      >
        {label} - {count}
      </span>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full border border-gray-200 bg-white shadow-sm transition-all duration-300 ${open ? 'rounded-t-xl' : 'rounded-xl'}`}
    >
      {/* HEADER */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 "
      >
        <div className="flex items-center gap-2">
          {renderLabel("MCQ", "border-blue-600 text-white bg-blue-500", mcqCount)}
          {renderLabel(
            "Structured",
            "border-emerald-600 text-white bg-emerald-500",
            structuredCount
          )}
          {renderLabel("Essay", "border-purple-600 text-white bg-purple-500", essayCount)}
        </div>

        <ChevronDown
          className={`w-5 h-5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* EXPANDABLE CONTENT */}
      <div
        className={`absolute top-full left-0 right-0 bg-white border border-gray-200 border-t-0 shadow-lg overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out rounded-b-xl ${
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-gray-200 relative">
          {/* Currency display */}
          <div className="px-4 py-2 flex items-center gap-2 text-xs text-gray-600">
            <span>Currency:</span>
            <span className="font-bold text-gray-800 px-2 border border-gray-300 rounded">
              {currency}
            </span>
          </div>

          {/* Question cards */}
          <div className="max-h-[420px] overflow-y-auto space-y-4 p-4">
            {questions.map((q) => (
              <QuestionCard
                key={q.id}
                image={q.image}
                questionType={q.questionType}
                price={q.price}
                number={q.number}
              />
            ))}
          </div>

          {/* Bottom-middle chevron to collapse */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              <ChevronUp className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDropdown;
