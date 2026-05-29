import { useSearchParams, Link } from 'react-router-dom';

export default function ThankYou() {
  const [params] = useSearchParams();
  const formName = params.get('form') || 'the form';

  return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center px-4">
      <div className="bg-white border border-indigo-100 rounded-2xl p-10 max-w-md w-full text-center shadow-sm">
        <div className="text-5xl mb-5">✅</div>
        <h1 className="font-display font-bold text-2xl text-indigo-900 mb-2">
          Thanks for reaching out!
        </h1>
        <p className="text-indigo-400 text-sm mb-6">
          Your submission to <strong className="text-indigo-600">{decodeURIComponent(formName)}</strong> was
          received successfully.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          ← Go back
        </button>

        <p className="text-indigo-200 text-xs mt-8">
          Powered by{' '}
          <Link to="/" className="text-indigo-400 hover:text-indigo-600 transition-colors">
            FormForge
          </Link>
        </p>
      </div>
    </div>
  );
}
