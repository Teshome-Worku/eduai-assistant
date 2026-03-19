import { useState, useEffect, useRef } from 'react';
import {
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { generateQuiz, submitQuiz } from '../api/ai';
import { getMastery } from '../api/analytics';
import toast from 'react-hot-toast';
import Loader from '../components/Common/Loader';

const QuizPage = () => {
  const [phase, setPhase] = useState('setup'); // setup, loading, quiz, results
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('auto');
  const [questionCount, setQuestionCount] = useState(5);
  const [quiz, setQuiz] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [timer, setTimer] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    loadTopics();
    return () => clearInterval(timerRef.current);
  }, []);

  const loadTopics = async () => {
    try {
      const res = await getMastery();
      if (res.data.topics) {
        setTopics(res.data.topics);
      }
    } catch (error) {
      console.error('Failed to load topics');
    }
  };

  const startQuiz = async () => {
    setPhase('loading');
    try {
      const res = await generateQuiz(selectedTopic, questionCount);
      setQuiz(res.data);
      setCurrentQ(0);
      setAnswers({});
      setTimer(0);
      setQuestionStartTime(Date.now());
      setPhase('quiz');

      // Start timer
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate quiz');
      setPhase('setup');
    }
  };

  const selectAnswer = (questionIndex, answer) => {
    const responseTime = Math.round((Date.now() - questionStartTime) / 1000);
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: { answer, responseTime }
    }));
  };

  const nextQuestion = () => {
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setQuestionStartTime(Date.now());
    }
  };

  const finishQuiz = async () => {
    clearInterval(timerRef.current);
    setPhase('loading');

    const submissionQuestions = quiz.questions.map((q, i) => ({
      ...q,
      userAnswer: answers[i]?.answer || '',
      responseTime: answers[i]?.responseTime || 0
    }));

    try {
      const res = await submitQuiz({
        topic: quiz.topic,
        questions: submissionQuestions,
        difficulty: quiz.difficulty,
        timeSpent: timer
      });
      setResults(res.data);
      setPhase('results');
    } catch (error) {
      toast.error('Failed to submit quiz');
      setPhase('quiz');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // SETUP PHASE
  if (phase === 'setup') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Adaptive Quiz</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">AI generates questions based on your weak areas</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Topic</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="auto">Auto (Focus on weak areas)</option>
              {topics.map((t, i) => (
                <option key={i} value={t.topicName}>
                  {t.topicName} ({t.accuracy}% mastery)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Number of Questions</label>
            <div className="flex gap-3">
              {[3, 5, 10].map(n => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    questionCount === n
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {n} Questions
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startQuiz}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            <PlayIcon className="w-5 h-5" />
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  // LOADING PHASE
  if (phase === 'loading') {
    return <Loader text="Generating your quiz..." />;
  }

  // QUIZ PHASE
  if (phase === 'quiz' && quiz) {
    const question = quiz.questions[currentQ];
    const isAnswered = answers[currentQ] !== undefined;
    const isLast = currentQ === quiz.questions.length - 1;
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Quiz Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 rounded-full text-sm font-medium">
              {quiz.topic}
            </span>
            <span className="ml-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm">
              {quiz.difficulty}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <ClockIcon className="w-5 h-5" />
            <span className="text-sm font-mono">{formatTime(timer)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-400 mb-2">
            Question {currentQ + 1} of {quiz.questions.length}
          </p>
          <h2 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-6">{question.question}</h2>

          <div className="space-y-3">
            {question.options.map((option, i) => {
              const isSelected = answers[currentQ]?.answer === option;
              return (
                <button
                  key={i}
                  onClick={() => selectAnswer(currentQ, option)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition text-sm ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <span className="font-medium text-gray-500 dark:text-gray-400 mr-2">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {option}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between mt-6">
            <p className="text-sm text-gray-400">
              {answeredCount}/{quiz.questions.length} answered
            </p>
            {isLast ? (
              <button
                onClick={finishQuiz}
                disabled={answeredCount < quiz.questions.length}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
              >
                Finish Quiz
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                disabled={!isAnswered}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
              >
                Next Question
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // RESULTS PHASE
  if (phase === 'results' && results) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Score Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <TrophyIcon className={`w-16 h-16 mx-auto mb-4 ${
            results.percentage >= 70 ? 'text-yellow-500' : results.percentage >= 50 ? 'text-gray-400' : 'text-red-400'
          }`} />
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            {results.score}/{results.totalQuestions}
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">{results.percentage}% correct</p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-400">
            <span>Topic: {results.topic}</span>
            <span>Difficulty: {results.difficulty}</span>
            <span>Time: {formatTime(results.timeSpent)}</span>
          </div>
        </div>

        {/* Question Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Question Breakdown</h3>
          <div className="space-y-4">
            {results.questions.map((q, i) => (
              <div key={i} className={`p-4 rounded-lg border ${
                q.isCorrect ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
              }`}>
                <div className="flex items-start gap-2">
                  {q.isCorrect
                    ? <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    : <XCircleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  }
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{q.question}</p>
                    {!q.isCorrect && (
                      <div className="mt-2 text-xs">
                        <p className="text-red-600">Your answer: {q.userAnswer}</p>
                        <p className="text-green-600">Correct answer: {q.correctAnswer}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => { setPhase('setup'); setQuiz(null); setResults(null); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Take Another Quiz
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default QuizPage;
