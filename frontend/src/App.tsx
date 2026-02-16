import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Landing } from './components/shared/Landing';
import { Questionnaire } from './components/questionnaire/Questionnaire';
import { ReviewScreen } from './components/results/ReviewScreen';
import { Results } from './components/results/Results';
import { ChatPanel } from './components/chat/ChatPanel';
import { About } from './components/about/About';
import { NotDC } from './components/shared/NotDC';
import { BudgetExceeded } from './components/budget/BudgetExceeded';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/questionnaire" element={<Questionnaire />} />
        <Route path="/review" element={<ReviewScreen />} />
        <Route path="/results" element={<Results />} />
        <Route path="/chat" element={<ChatPanel />} />
        <Route path="/about" element={<About />} />
        <Route path="/not-dc" element={<NotDC />} />
        <Route path="/budget-exceeded" element={<BudgetExceeded />} />
      </Routes>
    </BrowserRouter>
  );
}
