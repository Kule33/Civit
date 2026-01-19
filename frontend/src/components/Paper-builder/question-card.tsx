import React from 'react';

interface QuestionCardProps {
  image: string;
  questionType: 'mcq' | 'structured' | 'essay';
  price: number;
  number?: number;
  onClick?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  image,
  questionType,
  price,
  number,
  onClick
}) => {
  const getTypeStyle = () => {
    switch (questionType) {
      case 'mcq':
        return 'border-blue-600 text-white bg-blue-500/80 rounded-sm';
      case 'structured':
        return 'border-emerald-600 text-white bg-emerald-500/80 rounded-sm';
      case 'essay':
        return 'border-purple-600 text-white bg-purple-500/80 rounded-sm';
    }
  };

  const getLabel = () => {
    switch (questionType) {
      case 'mcq':
        return 'MCQ';
      case 'structured':
        return 'Structured';
      case 'essay':
        return 'Essay';
    }
  };

  return (
    <div
      onClick={onClick}
      className="relative w-full cursor-pointer border border-gray-200 bg-white"
      style={{ fontFamily: 'sans-serif' }}
    >
      {/* NUMBER BADGE TOP-LEFT */}
      {number !== undefined && (
        <span
          className="absolute top-2 left-2 z-20 px-2 py-0.5 text-[10px] font-medium rounded-sm border border-black text-white bg-gray-500/80"
        >
          {number}
        </span>
      )}

      {/* IMAGE (NO CROP) */}
      <img
        src={image}
        alt="Question thumbnail"
        className="w-full h-auto object-contain"
      />

      {/* LABELS BOTTOM-RIGHT */}
      <div className="absolute bottom-2 right-2 z-20 flex items-center gap-2">
        {/* TYPE BADGE */}
        <span className={`px-1 text-[10px] font-medium border ${getTypeStyle()}`}>
          {getLabel()}
        </span>

        {/* PRICE BADGE */}
        <span className="px-1 text-[10px] font-bold rounded-sm text-gray-800 bg-white border border-gray-300 shadow-sm">
          {price.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
