javascript
"use strict";

const GEMINI_MODEL = "gemini-3.8-flash";
const GEMINI_TIMEOUT_MS = 45000;

// Add your NEW Gemini API key here.
// Do not commit a real API key to a public repository.
const GEMINI_API_KEY = "PASTE_YOUR_NEW_API_KEY_HERE";

async function generateWorkspace(goal, tabs) {
  const safeGoal = String(goal || "").trim();

  const safeTabs = (Array.isArray(tabs) ? tabs : []).map(function (tab) {
    return {
      title: tab.title || "Untitled tab",
      url: tab.url || ""
    };
  });

  let apiKey = GEMINI_API_KEY || "";

  if (!apiKey) {
    try {
      const result = await chrome.storage.local.get("geminiApiKey");
      apiKey = result.geminiApiKey || "";
    } catch (error) {
      console.error("Could not read Gemini API key:", error);
    }
  }

  if (!apiKey) {
    console.warn("No API key found. Using local fallback.");
    return createFallbackWorkspace(safeGoal, safeTabs);
  }

  const prompt = [
    "You are the planning agent for ONE SCREEN.",
    "",
    "USER GOAL:",
    safeGoal,
    "",
    "SELECTED BROWSER TABS:",
    JSON.stringify(safeTabs),
    "",
    "Create a useful workspace for this goal.",
    "Use only the supplied tab titles and URLs.",
    "Do not claim to have read webpage contents.",
    "Preserve every original URL exactly.",
    "Categorize every provided resource.",
    "Generate exactly 4 specific, actionable checklist tasks.",
    "Avoid generic filler and invented facts.",
    "Return valid JSON only, without Markdown fences.",
    "",
    "Required JSON structure:",
    JSON.stringify({
      title: "Short workspace title",
      resources: [
        {
          title: "Resource title",
          url: "Original URL",
          category: "Relevant category"
        }
      ],
      tasks: [
        {
          text: "Specific actionable task",
          completed: false
        }
      ],
      notes: "Helpful starting suggestion"
    })
  ].join("\n");

  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/interactions";

  const controller = new AbortController();

  const timeoutId = setTimeout(function () {
    controller.abort();
  }, GEMINI_TIMEOUT_MS);

  console.time("Gemini interaction");

  try {
    console.log("Sending request through Gemini Interactions API.");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        input: prompt,
        store: false,
        generation_config: {
          thinking_level: "low",
          max_output_tokens: 1200
        }
      }),
      signal: controller.signal
    });

    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch (error) {
      throw new Error(
        "Gemini returned an invalid HTTP response. Status: " +
          response.status
      );
    }

    console.log("Gemini HTTP status:", response.status);

    if (!response.ok) {
      const apiMessage =
        data.error && data.error.message
          ? data.error.message
          : JSON.stringify(data);

      throw new Error(
        "Gemini API error (" +
          response.status +
          "): " +
          apiMessage
      );
    }

    const outputText = extractGeminiText(data);

    if (!outputText) {
      console.error("Unexpected Gemini response:", data);
      throw new Error("Gemini returned no usable text.");
    }

    let parsed;

    try {
      const cleanText = outputText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      parsed = JSON.parse(cleanText);
    } catch (error) {
      console.error("Gemini returned invalid JSON:", outputText);
      throw new Error("Could not parse Gemini's workspace response.");
    }

    const resources = safeTabs.map(function (tab) {
      const match = Array.isArray(parsed.resources)
        ? parsed.resources.find(function (resource) {
            return resource && resource.url === tab.url;
          })
        : null;

      return {
        title: tab.title,
        url: tab.url,
        category:
          match &&
          typeof match.category === "string" &&
          match.category.trim()
            ? match.category.trim().slice(0, 60)
            : categorizeResource(tab.title + " " + tab.url)
      };
    });

    const tasks = Array.isArray(parsed.tasks)
      ? parsed.tasks
          .filter(function (task) {
            return (
              task &&
              typeof task.text === "string" &&
              task.text.trim()
            );
          })
          .slice(0, 6)
          .map(function (task) {
            return {
              text: task.text.trim().slice(0, 250),
              completed: false
            };
          })
      : [];

    if (tasks.length === 0) {
      throw new Error("Gemini did not return valid checklist tasks.");
    }

    console.log("AI workspace generated successfully.");

    return {
      id: null,
      goal: safeGoal,
      title:
        typeof parsed.title === "string" && parsed.title.trim()
          ? parsed.title.trim().slice(0, 100)
          : safeGoal,
      resources: resources,
      tasks: tasks,
      notes:
        typeof parsed.notes === "string"
          ? parsed.notes.slice(0, 2000)
          : "",
      aiGenerated: true,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    if (error.name === "AbortError") {
      console.error(
        "Gemini request timed out after " +
          GEMINI_TIMEOUT_MS / 1000 +
          " seconds."
      );
    } else {
      console.error("Gemini generation failed:", error);
    }

    return createFallbackWorkspace(safeGoal, safeTabs);
  } finally {
    clearTimeout(timeoutId);
    console.timeEnd("Gemini interaction");
  }
}

function extractGeminiText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const collected = [];

  if (Array.isArray(data.outputs)) {
    data.outputs.forEach(function (output) {
      if (output && typeof output.text === "string") {
        collected.push(output.text);
      }

      if (output && Array.isArray(output.content)) {
        output.content.forEach(function (item) {
          if (item && typeof item.text === "string") {
            collected.push(item.text);
          }
        });
      }
    });
  }

  if (Array.isArray(data.steps)) {
    data.steps.forEach(function (step) {
      if (
        step &&
        step.type === "model_output" &&
        Array.isArray(step.content)
      ) {
        step.content.forEach(function (item) {
          if (item && typeof item.text === "string") {
            collected.push(item.text);
          }
        });
      }
    });
  }

  return collected.join("\n").trim();
}

function createFallbackWorkspace(goal, tabs) {
  return {
    id: null,
    goal: goal,
    title: goal || "My Workspace",
    resources: tabs.map(function (tab) {
      return {
        title: tab.title || "Untitled tab",
        url: tab.url || "",
        category: categorizeResource(
          (tab.title || "") + " " + (tab.url || "")
        )
      };
    }),
    tasks: [
      {
        text: "Review the selected resources relevant to your goal.",
        completed: false
      },
      {
        text: "Identify the most useful information.",
        completed: false
      },
      {
        text: "Complete the first important action.",
        completed: false
      },
      {
        text: "Review progress and determine the next steps.",
        completed: false
      }
    ],
    notes: "Local workspace created. AI generation was unavailable.",
    aiGenerated: false,
    createdAt: new Date().toISOString()
  };
}

function categorizeResource(text) {
  const value = String(text || "").toLowerCase();

  if (/internship|job|career|recruitment|application/.test(value)) {
    return "Jobs & Careers";
  }

  if (/github|gitlab|stackoverflow|developer|repository/.test(value)) {
    return "Development";
  }

  if (/tutorial|course|documentation|learn|guide/.test(value)) {
    return "Learning";
  }

  if (/gmail|outlook|mail/.test(value)) {
    return "Communication";
  }

  return "Reference";
}
````
