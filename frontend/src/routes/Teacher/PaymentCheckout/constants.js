import lkflag from "../../../assets/images/flags/lk.png";
import inflag from "../../../assets/images/flags/in.png";
import usflag from "../../../assets/images/flags/us.png";
import itflag from "../../../assets/images/flags/it.png";
import gbflag from "../../../assets/images/flags/gb.png";
import auflag from "../../../assets/images/flags/au.png";
import questiontumbnail from "../../../assets/images/question-tumbnail.png";

export const CURRENCIES = [
  { code: "LKR", name: "Sri Lankan Rupee", flag: lkflag, rate: 1 },
  { code: "INR", name: "Indian Rupee", flag: inflag, rate: 0.25 },
  { code: "USD", name: "US Dollar", flag: usflag, rate: 0.0033 },
  { code: "GBP", name: "British Pound", flag: gbflag, rate: 0.0025 },
  { code: "EUR", name: "Euro", flag: itflag, rate: 0.003 },
  { code: "AUD", name: "Australian Dollar", flag: auflag, rate: 0.0048 },
];

// Mock data - replace with actual props if dynamic
export   const MOCK_QUESTIONS = [
    {
      id: "1",
      image: questiontumbnail,
      questionType: "mcq",
      price: 25,
      number: 1,
    },
    {
      id: "2",
      image: questiontumbnail,
      questionType: "mcq",
      price: 25,
      number: 2,
    },
    {
      id: "3",
      image: questiontumbnail,
      questionType: "structured",
      price: 100,
      number: 3,
    },
    {
      id: "4",
      image: questiontumbnail,
      questionType: "structured",
      price: 200,
      number: 4,
    },
    {
      id: "5",
      image: questiontumbnail,
      questionType: "mcq",
      price: 30,
      number: 5,
    },
    {
      id: "6",
      image: questiontumbnail,
      questionType: "essay",
      price: 200,
      number: 6,
    },
     {
      id: "7",
      image: questiontumbnail,
      questionType: "mcq",
      price: 25,
      number: 1,
    },
    {
      id: "8",
      image: questiontumbnail,
      questionType: "mcq",
      price: 25,
      number: 2,
    },
    {
      id: "9",
      image: questiontumbnail,
      questionType: "structured",
      price: 100,
      number: 3,
    },
    {
      id: "10",
      image: questiontumbnail,
      questionType: "structured",
      price: 200,
      number: 4,
    },
    {
      id: "11",
      image: questiontumbnail,
      questionType: "mcq",
      price: 30,
      number: 5,
    },
    {
      id: "12",
      image: questiontumbnail,
      questionType: "essay",
      price: 300,
      number: 6,
    },
  ];