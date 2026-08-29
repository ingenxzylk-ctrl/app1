import { Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { QuizPage } from "./pages/QuizPage";
import { ResumePage } from "./pages/ResumePage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/quiz" element={<QuizPage />} />
      <Route path="/quiz/resume/:id" element={<ResumePage />} />
    </Routes>
  );
}
