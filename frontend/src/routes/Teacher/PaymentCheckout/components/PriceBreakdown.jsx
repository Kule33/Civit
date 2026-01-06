import React from "react";

const PriceBreakdown = ({ questions }) => {
  const safeQuestions = Array.isArray(questions) ? questions : [];

  // Build: { [typeLower]: { [priceNumber]: count } }
  const breakdown = safeQuestions.reduce((acc, q) => {
    const type = String(q?.questionType ?? "")
      .trim()
      .toLowerCase();
    const price = Number(q?.price);
    if (!type || !Number.isFinite(price)) return acc;

    acc[type] ??= {};
    acc[type][price] = (acc[type][price] ?? 0) + 1;
    return acc;
  }, {});

  const pricesFor = (type) => {
    const typeKey = String(type).toLowerCase();
    const priceMap = breakdown[typeKey] ?? {};
    return Object.keys(priceMap)
      .map((p) => Number(p))
      .filter((p) => Number.isFinite(p))
      .sort((a, b) => a - b)
      .map((price) => ({ price, count: priceMap[price] }));
  };

  const renderPriceChips = (items) =>
    items.map(({ price, count }) => (
      <span
        key={`${price}`}
        className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1"
      >
        <span className="text-gray-600">Rs {price}</span>
        <span className="text-xs font-semibold text-white bg-gray-800 rounded px-1">
          ×{count}
        </span>
      </span>
    ));

  const mcqItems = pricesFor("mcq");
  const structuredItems = pricesFor("structured");
  const essayItems = pricesFor("essay");

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 lg:p-4 space-y-3 lg:space-y-4 text-xs lg:text-sm">
      {/* MCQ - All price points in one row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-gray-700 font-medium">MCQ</span>
        <div className="w-full sm:w-auto flex items-center gap-2 flex-wrap justify-end">
          {renderPriceChips(mcqItems)}
        </div>
      </div>

      {/* STRUCTURED - All price points in one row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-gray-700 font-medium">Structured</span>
        <div className="w-full sm:w-auto flex items-center gap-2 flex-wrap justify-end">
          {renderPriceChips(structuredItems)}
        </div>
      </div>

      {/* ESSAY - Single price point in one row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-gray-700 font-medium">Essay</span>
        <div className="w-full sm:w-auto flex items-center gap-2 flex-wrap justify-end">
          {renderPriceChips(essayItems)}
        </div>
      </div>
    </div>
  );
};

export default PriceBreakdown;
