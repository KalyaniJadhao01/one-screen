# ONE SCREEN

### One task. One screen. Everything you need.

**Hackyard Build 2026 · Team Spark Squad · IIIT Bhopal, India**

ONE SCREEN is an AI-powered Chrome extension that converts selected browser tabs into a goal-oriented workspace with categorized resources and an actionable checklist.

##  Quick Start — Install & Test

**1. Download:** Click **Code → Download ZIP** on this repository and extract it.

**2. Install:** Open `chrome://extensions` → enable **Developer mode** → click **Load unpacked** → select the extracted folder containing `manifest.json`.

**3. Configure AI:** Open ONE SCREEN, enter your Gemini API key in the AI settings, and save it locally. Each tester must configure their own key; the developer's key is not included.
         ### 🔑 Gemini API Setup

1. Visit [Google AI Studio](https://aistudio.google.com/apikey).
2. Sign in and click **Create API Key**.
3. Open ONE SCREEN in Chrome and go to API key settings.
4. Paste your key and click **Save API Key**.
5. Enter your goal, select tabs, and click **Generate Workspace**.

**Note:** Keep your API key private. If AI generation fails, ONE SCREEN uses a local fallback.


**4. Run the example below:** Open the sample websites in separate tabs, enter the provided goal, select the tabs, and click **Generate Workspace**.

**5. Verify:** Inspect the generated resources and checklist, mark a task complete, save the workspace, then reopen the extension and restore the saved workspace.

> No build step, Node.js installation, or package manager required. AI generation requires valid Gemini API access. A local fallback is available when AI generation fails.

## 🧪 Ready-to-Test Example

Open these official websites in separate browser tabs:

* [IIIT Bhopal — Official Website](https://www.iiitbhopal.ac.in/)
* [IIIT Bhopal — Placements](https://iiitbhopal.ac.in/placements)
* [Oracle Java Documentation](https://docs.oracle.com/en/java/)

**Goal to enter:**

`Prepare a Java internship application plan using these institutional and learning resources.`

**Expected result:** ONE SCREEN generates a workspace containing the selected resources, relevant categories, an actionable checklist, and notes when returned by the AI.

Example checklist actions may include:

* Review the available institutional and placement resources.
* Identify Java skills relevant to the target role.
* Review relevant Java documentation.
* Prepare a structured internship application plan.

The exact output depends on the AI response. These are test suggestions, not claims about the contents of the linked pages. The extension uses tab titles and URLs; it does not automatically read every webpage's full content.

---

## 🎯 Problem Statement

Browser-based work scatters resources across tabs, leaving users to remember why they opened each page, find relevant information again, and decide what to do next.

**The gap:** Traditional tab management organizes pages; it does not organize them around the user's intended outcome.

## 💡 Solution

ONE SCREEN transforms scattered browser resources into an actionable, task-specific workspace.

* **Goal-driven organization:** Build each workspace around a user-defined outcome.
* **Selective tab capture:** Include only user-selected tabs.
* **AI categorization:** Organize resources using the goal and supplied tab metadata.
* **Action planning:** Generate a structured, actionable checklist.
* **Progress tracking:** Mark checklist items complete.
* **Local persistence:** Save and restore workspaces using Chrome Storage.
* **Resilient fallback:** Create a basic workspace when AI generation is unavailable.
* **User-controlled execution:** Users review suggestions and perform actions themselves.

**Core differentiator:** From *“Which tabs did I open?”* to *“What am I trying to accomplish, and what should I do next?”*

## 🛠️ Tech Stack

* **Frontend:** HTML, CSS, JavaScript
* **Platform:** Chrome Extension Manifest V3
* **Browser integration:** Chrome Tabs API
* **Persistence:** Chrome Storage API (`chrome.storage.local`)
* **AI:** Google Gemini API — Interactions API
* **Architecture:** Lightweight JavaScript agent; no backend or database

## ⚙️ AI Agent Workflow

1. **Input:** Receive the user's goal and selected tab titles/URLs.
2. **Prompt construction:** Request categorized resources and actionable tasks in JSON.
3. **Inference:** Send the prompt to Gemini through the Interactions API.
4. **Parsing:** Extract the response, remove Markdown fences when present, and parse JSON.
5. **Normalization:** Preserve original URLs, match resource categories, filter invalid tasks, and apply output limits.
6. **Fallback:** Use keyword-based categorization and a default checklist if AI generation fails.
7. **Review & persistence:** Display the proposed workspace and save it locally when requested.

The current agent includes request timeouts, response validation, error handling, and a local fallback path. AI suggestions remain user-reviewable; the extension does not automatically submit forms or execute consequential actions.

## 🧩 Project Structure

```text
one-screen/
├── manifest.json   # Extension configuration and permissions
├── popup.html      # Extension interface
├── style.css       # Interface styling
├── popup.js        # UI, tab selection, and workspace interactions
├── agent.js        # Gemini integration and fallback logic
├── README.md
└── .gitignore
```

## ✅ Judge Verification Checklist

| Test                    | Expected result                                                          |
| ----------------------- | ------------------------------------------------------------------------ |
| Load unpacked extension | Extension loads without manifest errors                                  |
| Open several tabs       | Tab titles and URLs appear                                               |
| Select a subset         | Only selected tab metadata is sent to the agent                          |
| Generate workspace      | Structured workspace appears when AI succeeds                            |
| Inspect resources       | Original selected URLs are preserved and categorized                     |
| Complete checklist item | Completion state updates in the interface                                |
| Save workspace          | Workspace appears in saved workspaces                                    |
| Reopen extension        | Saved workspace remains available                                        |
| Restart browser         | Saved data remains when the Chrome profile and extension data are intact |
| Test AI failure         | Local fallback can generate a basic workspace                            |

For a clean test, use a fresh Chrome profile. The tester must configure their own Gemini API key to verify live AI generation.

##  Privacy & Limitations

* Only the user's selected tab metadata and goal are supplied to the AI workflow.
* Full webpage contents are not automatically extracted.
* Workspaces are stored locally and are not automatically synchronized across devices.
* The Gemini API key must be configured locally; it must never be committed to this repository.
* `chrome.storage.local` is convenient local storage, not a secure secret vault.
* AI availability depends on API access, model availability, and applicable usage limits.
* Removing the extension or clearing local data may result in data loss.

##  Team

**Spark Squad**
Indian Institute of Information Technology, Bhopal, India
**Built for Hackyard Build 2026**



**ONE SCREEN — Organize resources around outcomes, not just tabs.**
