import Head from 'next/head'
import Script from 'next/script'

export default function Bookmarklet() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Live Results Bookmarklet - Fantasy NY Marathon</title>
        <link rel="stylesheet" href="/style.css" />
      </Head>

      <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">🏃 Live Results Bookmarklet</h1>
          <p className="text-lg text-gray-600">Import race results from NYRR leaderboard with one click</p>
        </header>

        <main>
          {/* What is this section */}
          <section className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">What is this?</h2>
            <p className="text-gray-700 mb-4">
              The <strong>Live Results Bookmarklet</strong> is a special browser bookmark that lets you quickly 
              import live marathon results from the NYRR leaderboard page directly into your Fantasy Marathon game. 
              Instead of manually entering each athlete's time, you can capture all results with just a few clicks!
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="text-blue-900 font-semibold">Perfect for commissioners who want to update results throughout the race!</p>
            </div>
          </section>

          {/* Installation section */}
          <section className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">📥 Installation</h2>
            
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 text-center">
              <p className="text-lg font-semibold text-gray-700 mb-4">
                Drag this button to your bookmarks bar:
              </p>
              <a 
                href="javascript:(function(){var s=document.createElement('script');s.src='https://marathon-majors-league.vercel.app/bookmarklet.js?v='+Date.now();document.body.appendChild(s);})();"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg cursor-move"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Please drag this button to your bookmarks bar instead of clicking it!');
                }}
              >
                📊 Import NYRR Results
              </a>
              <p className="text-sm text-gray-500 mt-4">
                (Don't click - drag it to your bookmarks bar!)
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">Step-by-Step Guide:</h3>
              
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Show your bookmarks bar</h4>
                  <p className="text-gray-600">
                    • <strong>Chrome/Edge:</strong> Press Ctrl+Shift+B (Windows) or Cmd+Shift+B (Mac)<br/>
                    • <strong>Firefox:</strong> Press Ctrl+Shift+B (Windows) or Cmd+Shift+B (Mac)<br/>
                    • <strong>Safari:</strong> View → Show Bookmarks Bar
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Drag the orange button</h4>
                  <p className="text-gray-600">
                    Click and hold the orange "Import NYRR Results" button above, then drag it to your bookmarks bar at the top of your browser.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">You're ready!</h4>
                  <p className="text-gray-600">
                    The bookmarklet is now installed and ready to use on NYRR leaderboard pages.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How to use section */}
          <section className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">🎯 How to Use</h2>
            
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Navigate to NYRR Leaderboard</h4>
                  <p className="text-gray-600 mb-2">
                    Go to the live results page for the NY Marathon. Example URLs:
                  </p>
                  <ul className="list-disc ml-5 text-gray-600 text-sm space-y-1">
                    <li><code className="bg-gray-100 px-2 py-1 rounded">https://liveresults.nyrr.org/e/NY2025#/leaderboard/top-men-overall-marathon/FINISH</code></li>
                    <li><code className="bg-gray-100 px-2 py-1 rounded">https://liveresults.nyrr.org/e/NY2025#/leaderboard/top-women-overall-marathon/FINISH</code></li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Click the Bookmarklet</h4>
                  <p className="text-gray-600">
                    Click the "Import NYRR Results" bookmark you just added. A dialog will appear showing how many athletes were found on the page.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Configure Import Settings</h4>
                  <p className="text-gray-600 mb-2">
                    The bookmarklet will automatically detect most settings, but you should verify:
                  </p>
                  <ul className="list-disc ml-5 text-gray-600 space-y-1">
                    <li><strong>Game ID:</strong> Your game's unique identifier (e.g., "default")</li>
                    <li><strong>Split Type:</strong> Which split you're capturing (5K, 10K, 15K, 20K, Half, 25K, 30K, 35K, 40K, or Finish)</li>
                    <li><strong>Division:</strong> Men's or Women's race (usually auto-detected)</li>
                    <li><strong>Session Token:</strong> Optional - only needed if commissioner authentication is required</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Import Results</h4>
                  <p className="text-gray-600">
                    Click "Import Results" to send the data to your Fantasy Marathon game. You'll see a success message 
                    with details about how many athletes were imported.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">5</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Repeat for Each Split</h4>
                  <p className="text-gray-600">
                    Throughout the race, you can click the bookmarklet multiple times to update different splits. 
                    Just make sure to select the correct split type each time!
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Tips section */}
          <section className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">💡 Tips & Best Practices</h2>
            
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <span className="text-green-500 text-xl">✓</span>
                <p className="text-gray-700">
                  <strong>Test before race day:</strong> Try the bookmarklet on last year's results to make sure it works correctly
                </p>
              </div>
              
              <div className="flex gap-3 items-start">
                <span className="text-green-500 text-xl">✓</span>
                <p className="text-gray-700">
                  <strong>Update progressively:</strong> Import each split as it becomes available (5K, 10K, Half, etc.)
                </p>
              </div>
              
              <div className="flex gap-3 items-start">
                <span className="text-green-500 text-xl">✓</span>
                <p className="text-gray-700">
                  <strong>Check the summary:</strong> After each import, review the success/failure count to ensure all athletes were found
                </p>
              </div>
              
              <div className="flex gap-3 items-start">
                <span className="text-green-500 text-xl">✓</span>
                <p className="text-gray-700">
                  <strong>Name matching:</strong> The system matches athletes by name. If an athlete isn't found, check that they're in your game's athlete database
                </p>
              </div>
              
              <div className="flex gap-3 items-start">
                <span className="text-orange-500 text-xl">⚠</span>
                <p className="text-gray-700">
                  <strong>Page structure changes:</strong> If NYRR changes their website layout, the bookmarklet may need updates. Contact support if it stops working.
                </p>
              </div>
            </div>
          </section>

          {/* Troubleshooting section */}
          <section className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">🔧 Troubleshooting</h2>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Problem: "No athletes found on this page"</h4>
                <p className="text-gray-600 mb-1"><strong>Solution:</strong></p>
                <ul className="list-disc ml-5 text-gray-600 space-y-1">
                  <li>Make sure you're on the actual leaderboard page with athlete results visible</li>
                  <li>Try scrolling down to load all results if the page uses lazy loading</li>
                  <li>The page structure may have changed - contact support for an updated bookmarklet</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Problem: Some athletes failed to import</h4>
                <p className="text-gray-600 mb-1"><strong>Solution:</strong></p>
                <ul className="list-disc ml-5 text-gray-600 space-y-1">
                  <li>Check the failure reasons in the import summary</li>
                  <li>Athletes not in your database need to be added manually first</li>
                  <li>Name spelling differences may prevent matching - check athlete names in both systems</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Problem: "Forbidden" or authentication error</h4>
                <p className="text-gray-600 mb-1"><strong>Solution:</strong></p>
                <ul className="list-disc ml-5 text-gray-600 space-y-1">
                  <li>You may need a session token to import results</li>
                  <li>Log in to your Fantasy Marathon game as commissioner first</li>
                  <li>Copy your session token from the application and paste it into the bookmarklet dialog</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Problem: Bookmarklet doesn't appear in toolbar</h4>
                <p className="text-gray-600 mb-1"><strong>Solution:</strong></p>
                <ul className="list-disc ml-5 text-gray-600 space-y-1">
                  <li>Make sure your bookmarks bar is visible (see installation instructions above)</li>
                  <li>Try dragging the button again - you need to drag, not click</li>
                  <li>On mobile? Bookmarklets work best on desktop browsers</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Technical details section */}
          <section className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">⚙️ Technical Details</h2>
            
            <p className="text-gray-700 mb-4">
              For developers and technically curious users:
            </p>
            
            <div className="bg-white rounded border border-gray-200 p-4 space-y-3">
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">How it works:</h4>
                <ol className="list-decimal ml-5 text-gray-600 space-y-1 text-sm">
                  <li>Bookmarklet injects JavaScript into the NYRR leaderboard page</li>
                  <li>Script searches for table rows using multiple selectors</li>
                  <li>Extracts athlete name, country, rank, and time from each row</li>
                  <li>Displays a configuration dialog to verify settings</li>
                  <li>Sends data as JSON to the Fantasy Marathon API endpoint</li>
                  <li>API matches athletes by name and updates their split times</li>
                  <li>Returns a summary of successful and failed imports</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-1">API Endpoint:</h4>
                <code className="block bg-gray-100 px-3 py-2 rounded text-sm">
                  POST /api/import-live-results
                </code>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Source Code:</h4>
                <p className="text-gray-600 text-sm">
                  <a href="/bookmarklet.js" className="text-blue-600 hover:underline" target="_blank">
                    View bookmarklet source code
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Back to home */}
          <div className="text-center">
            <a href="/" className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg">
              ← Back to Fantasy Marathon
            </a>
          </div>
        </main>

        <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>Fantasy NY Marathon • Live Results Bookmarklet</p>
        </footer>
      </div>
    </>
  )
}
