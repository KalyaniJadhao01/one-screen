@echo off
cd /d "%~dp0"

echo Setting up ONE SCREEN...

(
echo {
echo   "manifest_version": 3,
echo   "name": "ONE SCREEN",
echo   "version": "1.0.0",
echo   "description": "Turn browser tabs into an actionable workspace.",
echo   "permissions": ["tabs", "storage"],
echo   "host_permissions": ["https://generativelanguage.googleapis.com/*"],
echo   "action": {
echo     "default_title": "ONE SCREEN",
echo     "default_popup": "popup.html"
echo   }
echo }
) > manifest.json

if not exist popup.html (
echo Creating popup.html...
(
echo ^<!DOCTYPE html^>
echo ^<html lang="en"^>
echo ^<head^>
echo ^<meta charset="UTF-8"^>
echo ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo ^<title^>ONE SCREEN^</title^>
echo ^<link rel="stylesheet" href="style.css"^>
echo ^</head^>
echo ^<body^>
echo ^<h1^>ONE SCREEN^</h1^>
echo ^<p^>One task. One workspace.^</p^>
echo ^<textarea id="goal" placeholder="What are you working on?"^>^</textarea^>
echo ^<h3^>Open Tabs^</h3^>
echo ^<div id="tabs-list"^>Loading tabs...^</div^>
echo ^<button id="generate"^>Generate Workspace^</button^>
echo ^<p id="message"^>^</p^>
echo ^<section id="workspace" class="hidden"^>
echo ^<h2 id="workspace-title"^>^</h2^>
echo ^<div id="resources"^>^</div^>
echo ^<div id="checklist"^>^</div^>
echo ^<button id="save-workspace"^>Save Workspace^</button^>
echo ^</section^>
echo ^<button id="restore-workspace"^>Restore Workspace^</button^>
echo ^<script src="agent.js"^>^</script^>
echo ^<script src="popup.js"^>^</script^>
echo ^</body^>
echo ^</html^>
) > popup.html
)

if not exist style.css (
echo body { font-family: Arial, sans-serif; width: 380px; padding: 20px; color: #172033; }
echo textarea { width: 95%%; padding: 10px; }
echo button { padding: 10px; margin: 10px 0; background: #2563eb; color: white; border: 0; border-radius: 6px; cursor: pointer; }
echo .hidden { display: none; }
) > style.css

if not exist agent.js echo // AI agent logic will be added next.> agent.js
if not exist popup.js echo // Extension logic will be added next.> popup.js

echo.
echo ONE SCREEN starter files created successfully!
echo Open chrome://extensions and load this folder.
echo.
pause

