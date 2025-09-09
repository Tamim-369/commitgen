'use client';

import { useState } from 'react';
import { Copy, GitBranch, Terminal, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Home() {
  const [diff, setDiff] = useState('');
  const [commit, setCommit] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState('');

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

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
      if (successful) {
        setCopied(true);
        showNotification('Copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      } else {
        showNotification('Failed to copy', 'error');
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
      showNotification('Failed to copy — please copy manually', 'error');
    }

    document.body.removeChild(textArea);
  };

  const copyToClipboard = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(commit)
        .then(() => {
          setCopied(true);
          showNotification('Copied to clipboard!');
          setTimeout(() => setCopied(false), 2000);
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
    if (!diff.trim()) {
      showNotification('Please paste your git diff first', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diff }),
      });
      const data = await res.json();
      setCommit(data.message);
      showNotification('Commit message generated!');
    } catch (error) {
      showNotification('Failed to generate commit message', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-800">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300 ${notification.includes('Failed') || notification.includes('error')
          ? 'bg-red-500/90 text-white'
          : 'bg-green-500/90 text-white'
          }`}>
          <div className="flex items-center gap-2">
            {notification.includes('Failed') ?
              <AlertCircle className="w-4 h-4" /> :
              <CheckCircle2 className="w-4 h-4" />
            }
            {notification}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <GitBranch className="w-8 h-8 text-purple-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              CommitGen
            </h1>
          </div>
          <p className="text-xl text-slate-400 mb-2">AI-powered git commit message generator</p>
          <p className="text-sm text-slate-500">Turn your diffs into meaningful commit messages</p>
        </div>

        {/* Instructions Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Terminal className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-slate-200">Quick Setup</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center text-xs font-mono text-purple-400 mt-0.5">1</div>
                <p className="text-slate-300">Open terminal in your project</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center text-xs font-mono text-purple-400 mt-0.5">2</div>
                <p className="text-slate-300">Run <code className="bg-slate-700 px-2 py-1 rounded text-sm text-green-400 font-mono">git diff</code></p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center text-xs font-mono text-purple-400 mt-0.5">3</div>
                <p className="text-slate-300">Copy output (Ctrl+A → Ctrl+C)</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center text-xs font-mono text-purple-400 mt-0.5">4</div>
                <p className="text-slate-300">Paste below and generate!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Diff Input */}
          <div className="group">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Git Diff Input
            </label>
            <div className="relative">
              <textarea
                value={diff}
                onChange={(e) => setDiff(e.target.value)}
                placeholder="Paste your git diff output here...

Example:
diff --git a/src/App.js b/src/App.js
index 1234567..abcdefg 100644
--- a/src/App.js
+++ b/src/App.js
@@ -1,3 +1,4 @@
 function App() {
+  console.log('Hello World');
   return <div>App</div>;
 }"
                className="w-full h-48 p-4 bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-xl 
                         font-mono text-sm text-slate-200 placeholder-slate-500 
                         focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none
                         transition-all duration-200 resize-none
                         group-hover:border-slate-500/70"
              />
              <div className="absolute bottom-3 right-3 text-xs text-slate-500 font-mono">
                {diff.length} chars
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center">
            <button
              onClick={generateCommit}
              disabled={loading || !diff.trim()}
              className="group relative px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 
                       hover:from-purple-500 hover:to-pink-500 disabled:from-slate-600 disabled:to-slate-600
                       text-white font-semibold rounded-xl shadow-lg
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transform transition-all duration-200 hover:scale-105 active:scale-95
                       focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <div className="flex items-center gap-3">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                    Generate Commit Message
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Generated Commit */}
          {commit && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-xl 
                          animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <GitBranch className="w-5 h-5 text-green-400" />
                <h2 className="text-xl font-semibold text-slate-200">Generated Commit Message</h2>
              </div>

              <div className="bg-slate-900/70 border border-slate-600/30 rounded-lg p-4 mb-4">
                <p className="font-mono text-green-400 text-lg leading-relaxed">{commit}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={copyToClipboard}
                  className="group flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 
                           text-white font-medium rounded-lg shadow-md
                           transform transition-all duration-200 hover:scale-105 active:scale-95
                           focus:outline-none focus:ring-2 focus:ring-green-500/50"
                >
                  <Copy className={`w-4 h-4 transition-all duration-200 ${copied ? 'text-green-200' : 'group-hover:scale-110'}`} />
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>

                <div className="text-sm text-slate-400">
                  Ready to commit? Run: <code className="bg-slate-700 px-2 py-1 rounded text-green-400 font-mono">git commit -m "..."</code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-slate-500 text-sm">
          <p>Made with ❤️ for developers who care about clean commit history</p>
        </div>
      </div>
    </div>
  );
}