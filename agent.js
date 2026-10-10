"use strict";

const GEMINI_MODEL = "gemini-3.8-flash";
const GEMINI_TIMEOUT_MS = 45000;

/**
 * Generate a workspace using Gemini.
 * If AI generation fails, create a local fallback workspace.
 *
 * The API key must be saved in:
 * chrome.storage.local -> geminiApiKey
 */
async function generateWorkspace(goal, tabs) {
  const safeGoal = String(goal || "").trim();

  const safeTabs = (Array.isArray(tabs) ? tabs : []).map(function (tab) {
    return {
      title:
        typeof tab.title === "string" && tab.title.trim()
          ? tab.title.trim().slice(0, 500)
          : "Untitled tab",
      url: typeof tab.url === "string" ? tab.url : ""
    };
  });

  let apiKey = "";

  try {
    const result = await chrome.storage.local.get("geminiApiKey");
    apiKey =
      typeof result.geminiApiKey === "string"
        ? result.geminiApiKey.trim()
        : "";
  } catch (error) {
    console.error("Could not read Gemini API key:", error);
  }

  if (!apiKey) {
    console.warn(
      "Gemini API key is missing. Using the local fallback workspace."
    );

    return createFallbackWorkspace(safeGoal, safeTabs);
  }

  const prompt = [
    "You are the planning agent for ONE SCREEN, a browser productivity extension.",
    "",
    "USER GOAL:",
    safeGoal,
    "",
    "SELECTED BROWSER TABS:",
    JSON.stringify(safeTabs),
    "",
    "YOUR TASK:",
    "Create a useful, focused workspace that helps the user achieve their goal.",
    "",
    "RULES:",
    "1. Use only the supplied tab titles and URLs as resource information.",
    "2. Do not claim to have read webpage contents.",
    "3. Preserve each supplied URL exactly.",
    "4. Categorize every supplied resource.",
    "5. Generate exactly 4 specific, actionable checklist tasks.",
    "6. Each task must be relevant to the user's goal.",
    "7. Avoid generic filler and invented facts.",
    "8. Do not create additional resources or URLs.",
    "9. Keep notes concise and useful.",
    "10. Return valid JSON only, without Markdown fences.",
    "",
    "REQUIRED JSON STRUCTURE:",
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

  console.time("ONE SCREEN Gemini generation");

  try {
    console.log("Generating workspace with Gemini.");

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
        "Gemini returned an invalid response. HTTP status: " +
          response.status
      );
    }

    if (!response.ok) {
      const apiMessage =
        data &&
        data.error &&
        typeof data.error.message === "string"
          ? data.error.message
          : "The Gemini request failed.";

      throw new Error(
        "Gemini API error (" +
          response.status +
          "): " +
          apiMessage
      );
    }

    const outputText = extractGeminiText(data);

    if (!outputText) {
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

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Gemini returned an invalid workspace.");
    }

    /*
     * Keep the original browser tab titles and URLs.
     * AI is only used to suggest categories.
     */
    const aiResources = Array.isArray(parsed.resources)
      ? parsed.resources
      : [];

    const resources = safeTabs.map(function (tab) {
      const match = aiResources.find(function (resource) {
        return resource && resource.url === tab.url;
      });

      const category =
        match &&
        typeof match.category === "string" &&
        match.category.trim()
          ? match.category.trim().slice(0, 60)
          : categorizeResource(tab.title + " " + tab.url);

      return {
        title: tab.title,
        url: tab.url,
        category: category
      };
    });

    /*
     * Validate and limit the checklist.
     */
    const tasks = Array.isArray(parsed.tasks)
      ? parsed.tasks
          .filter(function (task) {
            return (
              task &&
              typeof task.text === "string" &&
              task.text.trim().length > 0
            );
          })
          .slice(0, 4)
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

    /*
     * Fill missing tasks if Gemini returns fewer than four.
     */
    const fallbackTasks = [
      "Review the selected resources relevant to your goal.",
      "Identify the most useful information from the resources.",
      "Complete the first important action toward your goal.",
      "Review your progress and decide the next step."
    ];

    while (tasks.length < 4) {
      const fallbackText = fallbackTasks[tasks.length];

      tasks.push({
        text: fallbackText,
        completed: false
      });
    }

    console.log("AI workspace generated successfully.");

    return {
      id: null,
      goal: safeGoal,

      title:
        typeof parsed.title === "string" && parsed.title.trim()
          ? parsed.title.trim().slice(0, 100)
          : safeGoal || "My Workspace",

      resources: resources,

      tasks: tasks,

      notes:
        typeof parsed.notes === "string"
          ? parsed.notes.trim().slice(0, 2000)
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
      console.error("Gemini generation failed:", error.message);
    }

    return createFallbackWorkspace(safeGoal, safeTabs);
  } finally {
    clearTimeout(timeoutId);
    console.timeEnd("ONE SCREEN Gemini generation");
  }
}

/**
 * Extract generated text from the Gemini Interactions API response.
 */
function extractGeminiText(data) {
  if (!data || typeof data !== "object") {
    return "";
  }

  if (
    typeof data.output_text === "string" &&
    data.output_text.trim()
  ) {
    return data.output_text.trim();
  }

  const collected = [];

  if (Array.isArray(data.outputs)) {
    data.outputs.forEach(function (output) {
      if (!output) {
        return;
      }

      if (typeof output.text === "string") {
        collected.push(output.text);
      }

      if (Array.isArray(output.content)) {
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

/**
 * Create a usable workspace when AI is unavailable.
 */
function createFallbackWorkspace(goal, tabs) {
  const safeTabs = Array.isArray(tabs) ? tabs : [];

  return {
    id: null,

    goal: goal,

    title: goal || "My Workspace",

    resources: safeTabs.map(function (tab) {
      const title = tab.title || "Untitled tab";
      const url = tab.url || "";

      return {
        title: title,
        url: url,
        category: categorizeResource(title + " " + url)
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
        text: "Review your progress and determine the next steps.",
        completed: false
      }
    ],

    notes:
      "A local workspace was created because AI generation was unavailable.",

    aiGenerated: false,

    createdAt: new Date().toISOString()
  };
}

/**
 * Categorize a resource using its title and URL.
 * This is the local fallback when AI categorization is unavailable.
 */
function categorizeResource(text) {
  const value = String(text || "").toLowerCase();

  if (
    /internship|job|career|recruitment|application|vacancy/.test(value)
  ) {
    return "Jobs & Careers";
  }

  if (
    /github|gitlab|stackoverflow|developer|repository|api documentation/.test(
      value
    )
  ) {
    return "Development";
  }

  if (
    /tutorial|course|documentation|learn|guide|lecture|study/.test(value)
  ) {
    return "Learning";
  }

  if (/gmail|outlook|mail|inbox/.test(value)) {
    return "Communication";
  }

  if (/calendar|event|schedule|deadline/.test(value)) {
    return "Planning";
  }

  return "Reference";
}