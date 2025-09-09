'use client';

import { useState } from 'react';

export default function Home() {
  const [diff, setDiff] = useState('');
  const [commit, setCommit] = useState('');
  const [loading, setLoading] = useState(false);

  // Fallback for browsers that don't support navigator.clipboard
  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      const msg = successful ? '✅ Copied!' : '❌ Failed to copy';
      alert(msg);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
      alert('❌ Failed to copy — please copy manually');
    }

    document.body.removeChild(textArea);
  };

  const copyToClipboard = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(commit)
        .then(() => {
          alert('✅ Copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          fallbackCopyTextToClipboard(commit);
        });
    } else {
      fallbackCopyTextToClipboard(commit);
    }
  };

  const generateCommit = async () => {
    setLoading(true);
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diff }),
    });
    const data = await res.json();
    setCommit(data.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">CommitGen — AI that writes your git commits</h1>

        <div className="mb-4 p-4 bg-gray-800 border border-gray-700 rounded text-sm">
          <h3 className="font-semibold mb-2">How to get your git diff:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open your terminal in your project folder</li>
            <li>Run: <code className="bg-gray-700 px-1 rounded">git diff</code></li>
            <li>Copy the output (Ctrl+A → Ctrl+C)</li>
            <li>Paste it below 👇</li>
          </ol>
        </div>

        <textarea
          value={diff}
          onChange={(e) => setDiff(e.target.value)}
          placeholder="Paste your git diff here..."
          className="w-full h-40 p-4 bg-gray-800 border border-gray-700 rounded mb-4 font-mono text-sm"
        />
        <button
          onClick={generateCommit}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Commit Message'}
        </button>

        {commit && (
          <div className="mt-6 p-4 bg-gray-800 border border-gray-700 rounded">
            <h2 className="text-xl font-semibold mb-2">Generated Commit Message:</h2>
            <p className="text-lg font-mono bg-gray-900 p-3 rounded">{commit}</p>
            <button
              onClick={copyToClipboard}
              className="mt-2 bg-green-600 hover:bg-green-700 px-4 py-1 rounded text-sm"
            >
              Copy to Clipboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}