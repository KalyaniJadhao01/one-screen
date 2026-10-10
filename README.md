# ONE SCREEN

### One task. One screen. Everything you need.

**Hackyard Build 2026 | Team Spark Squad | IIIT Bhopal, India**

ONE SCREEN is an AI-powered Chrome extension that transforms scattered browser tabs into an organized, goal-oriented workspace with categorized resources and an actionable checklist.

Instead of switching between tabs and trying to remember what to do next, users can bring their task, relevant resources, and next actions together in one place.

---

## 1. The Problem We Solve

Working on a single task often involves multiple browser tabs: job listings, institutional websites, documentation, tutorials, application pages, and reference materials.

These resources become scattered across the browser. Users waste time finding relevant information, remembering why they opened a page, and deciding what to do next.

**The problem is not a lack of browser tabs. It is the lack of organization around the user's actual goal.**

Existing tab organization primarily focuses on grouping pages. ONE SCREEN focuses on the outcome the user wants to achieve.

## 2. Our Solution

ONE SCREEN converts a user's goal and selected browser tabs into a task-specific workspace.

The user enters a goal, selects relevant tabs, and generates a workspace. The AI agent organizes the available resources and proposes actionable checklist items.

The resulting workspace can be edited, tracked, saved, and reopened later.

### Example

**Goal:** Prepare my Java internship applications.

The user selects relevant internship listings, company websites, and application resources.

ONE SCREEN generates a workspace containing categorized links, suggested actions, and a checklist for progressing through the application process.

**Outcome:** Less tab switching, less mental overhead, and a clearer path from intention to action.

---

## 3. Features

### Goal-Based Workspace Generation

* Enter a specific task or outcome.
* Use the goal to guide resource organization and checklist generation.
* Give each workspace a meaningful title.

### Browser Tab Selection

* Retrieve available browser tabs using the Chrome Tabs API.
* Display tab titles and URLs.
* Let users select relevant tabs before generating a workspace.
* Avoid including unselected tabs in the AI input.

### AI-Powered Resource Organization

* Send the user's goal and selected tab metadata to the Gemini API.
* Categorize resources according to their apparent relevance.
* Preserve original resource URLs.
* Return structured workspace data instead of an unstructured paragraph.

### Actionable Checklist

* Generate specific next steps for the user's goal.
* Mark tasks as completed.
* Track checklist progress.
* Keep the task workflow organized within the workspace.

### Local Persistence

* Save workspaces using `chrome.storage.local`.
* Reopen previously saved workspaces.
* Maintain saved information across popup closures and browser restarts, provided Chrome's profile data remains intact.
* Keep workspaces associated with the local Chrome profile rather than requiring a separate application account.

### AI Fallback

* Create a basic workspace if AI generation is unavailable.
* Categorize resources using local keyword-based rules.
* Provide a default checklist so the core workflow remains usable without a successful AI response.

### User-Controlled Workflow

* Users select the resources they want to include.
* Users review generated suggestions.
* The extension does not automatically submit forms or perform consequential actions on the user's behalf.

---

## 4. Technical Architecture

ONE SCREEN is built as a lightweight Chrome Extension using static web technologies.

| Component               | Technology                   | Responsibility                                                                        |
| ----------------------- | ---------------------------- | ------------------------------------------------------------------------------------- |
| Extension configuration | Chrome Extension Manifest V3 | Defines permissions and popup configuration                                           |
| User interface          | HTML                         | Goal input, tab list, workspace, checklist, and settings                              |
| Styling                 | CSS                          | Layout, resource cards, checklist, and interface presentation                         |
| UI controller           | JavaScript (`popup.js`)      | Handles user interactions, tab selection, rendering, and workspace operations         |
| AI agent                | JavaScript (`agent.js`)      | Constructs prompts, calls Gemini, processes responses, and provides fallback behavior |
| Browser integration     | Chrome Tabs API              | Retrieves browser tab metadata                                                        |
| Local persistence       | Chrome Storage API           | Stores API configuration and saved workspace data                                     |
| AI generation           | Google Gemini API            | Generates categorized resources and task suggestions                                  |

**No React, Node.js, backend server, database, or complex agent framework is required.**

### Project Structure

```text
one-screen/
├── manifest.json
├── popup.html
├── style.css
├── popup.js
├── agent.js
├── README.md
└── .gitignore
```

The repository may contain additional documentation or assets if added during development.

---

## 5. How the AI Agent Works

The agent follows a controlled, structured workflow.

### Step 1: Capture the Goal

The user enters the task they want to accomplish.

### Step 2: Collect Selected Tab Metadata

The extension prepares the selected tabs' titles and URLs.

It does not assume that a page's complete contents are available merely because its URL and title are known.

### Step 3: Construct the Prompt

The agent combines the user's goal and selected tab metadata into a prompt requesting a structured workspace.

The prompt instructs the model to:

* Use only the supplied metadata.
* Avoid claiming to have read webpage contents.
* Preserve original resource URLs.
* Categorize the provided resources.
* Generate actionable checklist tasks.
* Return JSON without Markdown formatting.

### Step 4: Request AI Generation

The agent sends a request to Google's Gemini Interactions API.

The current implementation uses:

* An API key supplied through the extension's settings.
* The `gemini-3.8-flash` model identifier.
* `store: false` in the request.
* A low thinking-level setting.
* A configured output-token limit.
* A request timeout to prevent indefinite waiting.

Model availability and API capabilities depend on Google's current API configuration and account access.

### Step 5: Extract and Parse the Response

The agent attempts to extract generated text from supported response fields.

It removes surrounding Markdown code fences when present and parses the result as JSON.

Invalid responses are handled through the error and fallback path rather than being treated as valid workspace data.

### Step 6: Validate and Normalize

The agent:

* Uses the original selected tabs as the authoritative resource list.
* Matches AI categories to the supplied resource URLs.
* Preserves the original titles and URLs.
* Uses local keyword-based categories when an AI category is missing.
* Filters invalid checklist entries.
* Limits the number and length of generated tasks.
* Checks that usable checklist tasks were returned.
* Normalizes the response into the workspace structure used by the interface.

### Step 7: Render and Save

The extension displays the generated workspace for the user to review.

The user can then save the workspace locally.

**Important:** The AI-generated checklist is a proposal. Users remain responsible for reviewing and completing the suggested actions.

---

## 6. Error Handling and Fallback Strategy

An AI dependency should not make the entire product unusable.

ONE SCREEN includes a local fallback for situations where AI generation is unavailable or fails.

The fallback can:

* Create a workspace from the user's goal.
* Retain selected resources.
* Assign basic keyword-based categories.
* Provide a default actionable checklist.
* Inform the user that AI generation was unavailable.

The AI request also uses a timeout to avoid waiting indefinitely for a response.

This approach keeps the core workspace workflow useful even when the external AI service cannot generate a result.

---

## 7. Installation Guide for Hackyard Judges

No build process or package installation is required.

### Prerequisites

* Google Chrome or a compatible Chromium-based browser.
* A downloaded copy of this repository.
* A Gemini API key for testing AI generation.

### Install the Extension

**Step 1 — Download the repository**

Open this repository on GitHub.

Click **Code → Download ZIP** and extract the downloaded archive.

Alternatively, clone the repository using Git:

```bash
git clone <REPOSITORY_URL>
```

Replace `<REPOSITORY_URL>` with the actual GitHub repository address.

**Step 2 — Open Chrome Extensions**

Navigate to:

`chrome://extensions`

**Step 3 — Enable Developer Mode**

Turn on the **Developer mode** toggle.

**Step 4 — Load the Extension**

Click **Load unpacked**.

Select the extracted project directory containing `manifest.json`.

**Step 5 — Open ONE SCREEN**

Pin the extension to the Chrome toolbar if desired, then click its icon.

The extension should open its popup interface.

### Configure Gemini AI

1. Obtain an API key through Google AI Studio.
2. Open the ONE SCREEN extension.
3. Locate the Gemini API settings.
4. Enter the API key.
5. Save the key locally.
6. Verify that the interface indicates the key has been saved.

The judge's Chrome profile will not automatically contain the developer's locally stored API key. Each tester must configure their own key to test AI generation.

API access, model availability, quotas, and billing conditions depend on the tester's Google account and current Google AI terms.

---

## 8. Judge Verification Checklist

Please verify the project using the following steps.

| Test                    | Action                                             | Expected Result                                                                  |
| ----------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------- |
| Extension installation  | Load the project through `chrome://extensions`     | The extension loads without manifest errors                                      |
| Tab discovery           | Open several browser tabs and open ONE SCREEN      | Available tabs appear in the interface                                           |
| Tab selection           | Select only a subset of the displayed tabs         | Only selected tab metadata is supplied to the agent                              |
| Goal input              | Enter a task                                       | The goal is available for workspace generation                                   |
| AI generation           | Configure a valid API key and generate a workspace | A structured workspace is produced when the API request succeeds                 |
| Resource categorization | Inspect the generated resource list                | Resources have categories and retain their original URLs                         |
| Checklist               | Generate a workspace and mark a task complete      | The interface reflects checklist completion                                      |
| Local fallback          | Test while AI generation is unavailable            | A basic workspace can be created through the fallback path                       |
| Workspace saving        | Save a generated workspace                         | It appears in the saved-workspace interface                                      |
| Persistence             | Close and reopen the popup or browser              | Previously saved workspaces remain available when local extension data is intact |
| Multiple workspaces     | Save more than one workspace                       | Previously saved workspaces can be accessed individually                         |

**Testing note:** AI-generated wording may differ between requests. The important checks are whether the workflow completes, the data structure is usable, original URLs are preserved, and the saved state behaves correctly.

For reliable verification, use a fresh Chrome profile or a clean extension installation where practical.

---

## 9. Ready-to-Test Example: IIIT Bhopal

Judges can test ONE SCREEN using real, publicly accessible institutional webpages.

### Step 1 — Open These Official Websites

1. [IIIT Bhopal — Official Website](https://www.iiitbhopal.ac.in/)
2. [IIIT Bhopal — Placements](https://iiitbhopal.ac.in/placements)

Open both links in separate browser tabs.

These are sample resources for demonstrating the extension. The user should verify any specific information directly on the relevant webpage.

### Step 2 — Enter This Goal

**Prepare an IIIT Bhopal student opportunity and career information workspace.**

### Step 3 — Select the Two Tabs

Select the official website and the placements page.

Click **Generate Workspace**.

### Step 4 — Inspect the Result

The generated workspace should contain the supplied resources, relevant categories, a suggested checklist, and any returned notes.

The exact categories and task wording depend on the AI response.

### Step 5 — Complete and Save

Mark a checklist item complete and save the workspace.

Close the popup, reopen it, and check the saved-workspace list.

This example demonstrates how ONE SCREEN can organize existing browser resources around a goal without requiring users to manually build a separate task list.

---

## 10. Privacy and Security Considerations

ONE SCREEN is designed around user-selected browser resources and local workspace storage.

* The agent sends selected tab titles, URLs, and the user's goal to Gemini when AI generation is requested.
* The extension does not claim to retrieve the complete contents of every selected webpage.
* Saved workspaces use Chrome's local storage.
* Workspaces are not automatically synchronized across devices.
* The API key is configured locally through the extension's settings.
* API keys must not be committed to the public repository.
* Removing the extension or clearing its stored data may cause local data loss.

**Security limitation:** `chrome.storage.local` is convenient for a prototype, but it is not a secure secret vault. Do not treat locally stored API keys as protected against someone with access to the browser profile or extension environment.

The current implementation sends requests directly from the extension to Gemini. It does not use a separate backend to protect a shared API key.

---

## 11. Technology and Design Decisions

### Why a Chrome Extension?

The problem occurs inside the browser. A Chrome extension can work directly with open tabs instead of requiring users to copy links into another application.

### Why Static HTML, CSS, and JavaScript?

The lightweight stack reduces setup complexity and keeps the project easy to inspect, install, and modify.

### Why an AI Agent?

A fixed tab-grouping rule cannot reliably understand the user's intended outcome. The agent uses the stated goal and available tab metadata to generate context-specific categories and suggested next steps.

### Why Structured JSON?

Structured output makes it easier for the extension to render resources, checklist items, and notes consistently instead of treating the entire AI response as plain text.

### Why a Local Fallback?

A failed AI request should not prevent users from organizing their resources into a basic workspace.

### Why Local Storage?

Local persistence allows users to resume saved workspaces without creating an account or requiring a cloud database.

---

## 12. Current Scope and Limitations

ONE SCREEN focuses on a practical, testable browser-workspace workflow.

The current implementation does not include:

* User accounts or cloud synchronization.
* Shared team workspaces.
* Automatic form submission.
* Unrestricted browser control.
* Guaranteed access to full webpage contents.
* A backend service for centralized API-key management.
* Guaranteed AI availability independent of Google's API service.

The extension depends on the browser's permissions, local storage availability, and the configured AI service.

These limitations are intentional for the current lightweight MVP.

---

## 13. Expected User Benefits

**Less context switching:** Keep a task's relevant resources together.

**Clearer next steps:** Turn a broad goal into a checklist of suggested actions.

**Better resource organization:** Group selected tabs according to their apparent relevance.

**Easier task resumption:** Save a workspace and return to it later.

**Lower setup overhead:** Use the extension directly in the browser without a separate account or backend deployment.

**Graceful degradation:** Continue with basic workspace creation when AI generation is unavailable.

---

## 14. Team and Hackathon

**Team:** Spark Squad
**Institution:** Indian Institute of Information Technology, Bhopal (IIIT Bhopal), India
**Event:** Hackyard Build 2026
**Project:** ONE SCREEN

We built ONE SCREEN to address a familiar productivity problem: browser resources are easy to collect, but difficult to turn into organized, actionable progress.

Our focus is a lightweight, practical product that connects a user's goal, selected browser resources, and next actions in one workspace.

### Project Links

* [IIIT Bhopal — Official Website](https://www.iiitbhopal.ac.in/)
* [IIIT Bhopal — Placements](https://iiitbhopal.ac.in/placements)

---

## Final Summary

**ONE SCREEN turns browser tabs into task-focused workspaces.**

Enter a goal. Select relevant tabs. Generate a workspace. Follow the checklist. Save your progress.

**One task. One screen. Everything you need.**
