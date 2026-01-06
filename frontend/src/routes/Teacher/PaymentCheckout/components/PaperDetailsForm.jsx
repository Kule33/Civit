import React from "react";
import { FloatingLabelInput } from "../../../../components/UI/FloatingLabelInput"; // Assuming path
import QuestionDropdown from "../../../../components/Paper-builder/question-dropdown"; // Assuming path
import whatsapplogo from "../../../../assets/images/whatsapp-logo.png";

const PaperDetailsForm = ({ paperId, questions }) => {
  return (
              <div className="flex flex-col gap-6 h-full">
                {/* Paper name input (now with placeholder showing the ID) */}
                {/* Centered title */}

                {/* Paper ID on the right */}
                <div className="w-full flex items-center gap-3">
                  {/* Input takes remaining width */}
                  <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                      Review Paper
                    </h1>
                  </div>

                  {/* Paper ID stays on one line */}
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    Paper&nbsp;ID:
                    <span className="ml-1 font-medium text-gray-700">
                      12321
                    </span>
                  </span>
                </div>
                <FloatingLabelInput
                  label="Paper Name"
                  placeholder="Paper – 12321"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />

                <div className="relative">
                  <QuestionDropdown
                    //mcqCount={3}
                    structuredCount={2}
                    essayCount={1}
                    questions={questions}
                    currency="LKR"
                  />
                </div>

                {/* Description */}
                <div>
                  {/* Description */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <span>Description</span>
                      <span className="text-xs text-gray-400">(optional)</span>
                    </label>

                    <textarea
                      rows={5}
                      placeholder="Order of questions, marks distribution, any water marks, special instructions..."
                      className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none outline-none transition-all duration-200 focus:border-blue-500"
                    />
                  </div>

                  {/* OR Divider */}
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      or
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* WhatsApp Contact */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-green-50 border border-green-200">
                    {/* Icon container */}
                    {/* WhatsApp Icon (Centered & Balanced) */}
                    <img
                      src={whatsapplogo}
                      alt="WhatsApp Logo"
                      className="w-5 h-5"
                    />

                    {/* Text */}
                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-gray-800">
                        DM us on{" "}
                        <span className="font-medium text-green-600">
                          WhatsApp
                        </span>{" "}
                        after payment
                      </p>
                    </div>
                  </div>
                </div>
                {/* Download sample */}
                <button className="mt-auto self-start text-xs text-purple-600 hover:underline">
                  Download sample paper
                </button>
              </div>
  );
};

export default PaperDetailsForm;