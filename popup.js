(function () {
  "use strict";

  // ------------------------------------
  // ONE SCREEN - MAIN APPLICATION
  // ------------------------------------

  const $ = function (id) {
    return document.getElementById(id);
  };

  let availableTabs = [];
  let currentWorkspace = null;
  let autosaveTimer = null;
  let isSaving = false;

  // ------------------------------------
  // LOAD OPEN BROWSER TABS
  // ------------------------------------

  async function loadTabs() {
  const tabsList = $("tabs-list");
  const tabCount = $("tab-count");

  try {
    if (tabsList) {
      tabsList.textContent = "Loading tabs...";
    }

    const tabs = await chrome.tabs.query({
      currentWindow: true
    });

    availableTabs = tabs.filter(function (tab) {
      return (
        tab.id !== undefined &&
        typeof tab.url === "string" &&
        /^https?:\/\//i.test(tab.url)
      );
    });

    if (tabCount) {
      tabCount.textContent =
        availableTabs.length + " available tabs";
    }

    renderTabs();
  } catch (error) {
    console.error("Error loading tabs:", error);

    if (tabsList) {
      tabsList.textContent = "Could not load tabs.";
    }
  }
}

  // ------------------------------------
  // DISPLAY OPEN TABS
  // ------------------------------------

  function renderTabs() {
    const tabsList = $("tabs-list");

    if (!tabsList) {
      return;
    }

    tabsList.replaceChildren();

    if (availableTabs.length === 0) {
      tabsList.textContent = "No accessible web tabs found.";
      return;
    }

    availableTabs.forEach(function (tab) {
      const label = document.createElement("label");
      label.className = "tab-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "tab-checkbox";
      checkbox.value = String(tab.id);

      const details = document.createElement("span");

      const title = document.createElement("strong");
      title.textContent = tab.title || "Untitled tab";

      const url = document.createElement("small");
      url.textContent = tab.url;

      details.appendChild(title);
      details.appendChild(document.createElement("br"));
      details.appendChild(url);

      label.appendChild(checkbox);
      label.appendChild(details);

      tabsList.appendChild(label);
    });

    updateSelectAllLabel();
  }

  // ------------------------------------
  // SELECT / DESELECT ALL TABS
  // ------------------------------------

  function toggleAllTabs() {
    const checkboxes = Array.from(
      document.querySelectorAll(".tab-checkbox")
    );

    if (checkboxes.length === 0) {
      return;
    }

    const allSelected = checkboxes.every(function (checkbox) {
      return checkbox.checked;
    });

    checkboxes.forEach(function (checkbox) {
      checkbox.checked = !allSelected;
    });

    updateSelectAllLabel();
  }

  function updateSelectAllLabel() {
    const button = $("select-all");

    if (!button) {
      return;
    }

    const checkboxes = Array.from(
      document.querySelectorAll(".tab-checkbox")
    );

    const allSelected =
      checkboxes.length > 0 &&
      checkboxes.every(function (checkbox) {
        return checkbox.checked;
      });

    button.textContent = allSelected
      ? "Deselect all"
      : "Select all";
  }

  // ------------------------------------
  // GENERATE WORKSPACE
  // ------------------------------------

  async function handleGenerate() {
    const goalInput = $("goal");
    const message = $("message");
    const generateButton = $("generate");

    if (!goalInput || !message || !generateButton) {
      return;
    }

    const goal = goalInput.value.trim();

    if (!goal) {
      message.textContent = "Please enter your goal first.";
      return;
    }

    const selectedIds = Array.from(
      document.querySelectorAll(".tab-checkbox:checked")
    ).map(function (checkbox) {
      return Number(checkbox.value);
    });

    const selectedTabs = availableTabs.filter(function (tab) {
      return selectedIds.includes(tab.id);
    });

    if (selectedTabs.length === 0) {
      message.textContent = "Please select at least one tab.";
      return;
    }

    if (typeof generateWorkspace !== "function") {
      message.textContent =
        "AI agent not loaded. Check agent.js.";
      return;
    }

    try {
      generateButton.disabled = true;
      message.textContent = "Creating your workspace...";

      const workspace = await generateWorkspace(
        goal,
        selectedTabs
      );

      if (!workspace || typeof workspace !== "object") {
        throw new Error("The agent returned an invalid workspace.");
      }

      // A newly generated workspace must be saved separately.
      workspace.id = null;
      workspace.goal = goal;

      if (!Array.isArray(workspace.resources)) {
        workspace.resources = [];
      }

      if (!Array.isArray(workspace.tasks)) {
        workspace.tasks = [];
      }

      if (typeof workspace.notes !== "string") {
        workspace.notes = "";
      }

      currentWorkspace = workspace;

      renderWorkspace(currentWorkspace);

      if (workspace.aiGenerated) {
        message.textContent =
          "Gemini AI workspace created successfully! Save it to keep it.";
      } else {
        message.textContent =
          "Workspace created using local fallback. Save it to keep it.";
      }
    } catch (error) {
      console.error("Workspace generation failed:", error);

      message.textContent =
        error.message || "Could not generate workspace.";
    } finally {
      generateButton.disabled = false;
    }
  }

  // ------------------------------------
  // DISPLAY WORKSPACE
  // ------------------------------------

  function renderWorkspace(workspace) {
    if (!workspace) {
      return;
    }

    const workspaceSection = $("workspace");
    const title = $("workspace-title");
    const resourcesContainer = $("resources");
    const checklist = $("checklist");

    if (workspaceSection) {
      workspaceSection.classList.remove("hidden");
    }

    if (title) {
      title.textContent =
        workspace.title || workspace.goal || "My Workspace";
    }

    // Organize resources by category.
    if (resourcesContainer) {
      resourcesContainer.replaceChildren();

      const groups = new Map();

      workspace.resources.forEach(function (resource) {
        const category = resource.category || "Reference";

        if (!groups.has(category)) {
          groups.set(category, []);
        }

        groups.get(category).push(resource);
      });

      groups.forEach(function (resources, category) {
        const heading = document.createElement("h3");
        heading.textContent = category;

        resourcesContainer.appendChild(heading);

        resources.forEach(function (resource) {
          const url = getSafeWebURL(resource.url);

          if (!url) {
            return;
          }

          const link = document.createElement("a");

          link.href = url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = resource.title || url;

          resourcesContainer.appendChild(link);
          resourcesContainer.appendChild(
            document.createElement("br")
          );
        });
      });
    }

    // Render checklist.
    if (checklist) {
      checklist.replaceChildren();

      workspace.tasks.forEach(function (task) {
        const label = document.createElement("label");
        label.className = "task-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(task.completed);

        checkbox.addEventListener("change", function () {
          task.completed = checkbox.checked;

          updateProgress(workspace.tasks);
          scheduleAutosave();
        });

        const taskInput = document.createElement("input");
        taskInput.type = "text";
        taskInput.className = "task-text";
        taskInput.value = task.text || "";
        taskInput.setAttribute("aria-label", "Edit checklist task");

        taskInput.addEventListener("input", function () {
          task.text = taskInput.value;
          scheduleAutosave();
        });

        label.appendChild(checkbox);
        label.appendChild(taskInput);

        checklist.appendChild(label);
      });
    }

    // Restore notes.
    const notes = $("notes");

    if (notes) {
      notes.value = workspace.notes || "";

      notes.oninput = function () {
        workspace.notes = notes.value;
        scheduleAutosave();
      };
    }

    updateProgress(workspace.tasks);
  }

  function getSafeWebURL(value) {
    try {
      const url = new URL(value);

      if (url.protocol === "https:" || url.protocol === "http:") {
        return url.href;
      }
    } catch (error) {
      // Ignore invalid URLs.
    }

    return null;
  }

  // ------------------------------------
  // CHECKLIST PROGRESS
  // ------------------------------------

  function updateProgress(tasks) {
    const progress = $("progress");

    if (!progress) {
      return;
    }

    const completed = tasks.filter(function (task) {
      return Boolean(task.completed);
    }).length;

    progress.textContent =
      completed + "/" + tasks.length + " completed";
  }

  // ------------------------------------
  // GET SAVED WORKSPACES
  // ------------------------------------

  async function getSavedWorkspaces() {
    const result = await chrome.storage.local.get(
      "oneScreenWorkspaces"
    );

    return Array.isArray(result.oneScreenWorkspaces)
      ? result.oneScreenWorkspaces
      : [];
  }

  // ------------------------------------
  // SAVE WORKSPACE
  // ------------------------------------

  async function saveWorkspace() {
    const message = $("message");

    if (!currentWorkspace) {
      if (message) {
        message.textContent = "Generate a workspace first.";
      }

      return;
    }

    try {
      const workspaces = await getSavedWorkspaces();

      if (currentWorkspace.id) {
        const index = workspaces.findIndex(function (workspace) {
          return workspace.id === currentWorkspace.id;
        });

        if (index !== -1) {
          workspaces[index] = currentWorkspace;
        } else {
          workspaces.push(currentWorkspace);
        }
      } else {
        currentWorkspace.id =
          "ws-" +
          Date.now() +
          "-" +
          Math.random().toString(36).slice(2, 8);

        workspaces.push(currentWorkspace);
      }

      await chrome.storage.local.set({
        oneScreenWorkspaces: workspaces
      });

      await renderSavedWorkspaces();

      if (message) {
        message.textContent = "Workspace saved successfully!";
      }
    } catch (error) {
      console.error("Save failed:", error);

      if (message) {
        message.textContent = "Could not save workspace.";
      }
    }
  }

  // ------------------------------------
  // AUTOSAVE
  // ------------------------------------

  function scheduleAutosave() {
    if (!currentWorkspace || !currentWorkspace.id) {
      return;
    }

    clearTimeout(autosaveTimer);

    autosaveTimer = setTimeout(function () {
      saveWorkspaceSilently();
    }, 400);
  }

  async function saveWorkspaceSilently() {
    if (
      !currentWorkspace ||
      !currentWorkspace.id ||
      isSaving
    ) {
      return;
    }

    isSaving = true;

    try {
      const workspaces = await getSavedWorkspaces();

      const index = workspaces.findIndex(function (workspace) {
        return workspace.id === currentWorkspace.id;
      });

      if (index === -1) {
        return;
      }

      workspaces[index] = currentWorkspace;

      await chrome.storage.local.set({
        oneScreenWorkspaces: workspaces
      });

      await renderSavedWorkspaces();
    } catch (error) {
      console.error("Autosave failed:", error);
    } finally {
      isSaving = false;
    }
  }

  // ------------------------------------
  // DISPLAY SAVED WORKSPACES
  // ------------------------------------

  async function renderSavedWorkspaces() {
    const container = $("saved-workspaces");

    if (!container) {
      return;
    }

    container.textContent = "Loading saved workspaces...";

    try {
      const workspaces = await getSavedWorkspaces();

      container.replaceChildren();

      if (workspaces.length === 0) {
        container.textContent = "No saved workspaces yet.";
        return;
      }

      workspaces.forEach(function (workspace) {
        const card = document.createElement("div");
        card.className = "saved-workspace-card";

        const heading = document.createElement("h3");
        heading.textContent =
          workspace.title ||
          workspace.goal ||
          "Untitled workspace";

        const goal = document.createElement("p");
        goal.textContent = workspace.goal || "";

        const tasks = Array.isArray(workspace.tasks)
          ? workspace.tasks
          : [];

        const completed = tasks.filter(function (task) {
          return Boolean(task.completed);
        }).length;

        const progress = document.createElement("p");
        progress.textContent =
          completed + "/" + tasks.length + " tasks completed";

        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.textContent = "Open Workspace";

        openButton.addEventListener("click", function () {
          openSavedWorkspace(workspace.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
          deleteSavedWorkspace(workspace.id);
        });

        card.appendChild(heading);
        card.appendChild(goal);
        card.appendChild(progress);
        card.appendChild(openButton);
        card.appendChild(deleteButton);

        container.appendChild(card);
      });
    } catch (error) {
      console.error("Could not load saved workspaces:", error);

      container.textContent = "Could not load saved workspaces.";
    }
  }

  // ------------------------------------
  // OPEN SAVED WORKSPACE
  // ------------------------------------

  async function openSavedWorkspace(id) {
    const message = $("message");

    try {
      const workspaces = await getSavedWorkspaces();

      const workspace = workspaces.find(function (item) {
        return item.id === id;
      });

      if (!workspace) {
        if (message) {
          message.textContent = "Workspace not found.";
        }

        await renderSavedWorkspaces();
        return;
      }

      clearTimeout(autosaveTimer);

      currentWorkspace = workspace;

      renderWorkspace(currentWorkspace);

      const goalInput = $("goal");

      if (goalInput) {
        goalInput.value = currentWorkspace.goal || "";
      }

      if (message) {
        message.textContent = "Previous workspace opened.";
      }

      const workspaceSection = $("workspace");

      if (workspaceSection) {
        workspaceSection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    } catch (error) {
      console.error("Could not open workspace:", error);

      if (message) {
        message.textContent = "Could not open workspace.";
      }
    }
  }

  // ------------------------------------
  // DELETE SAVED WORKSPACE
  // ------------------------------------

  async function deleteSavedWorkspace(id) {
    const confirmed = window.confirm(
      "Delete this workspace permanently? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    const message = $("message");

    try {
      const workspaces = await getSavedWorkspaces();

      const remaining = workspaces.filter(function (workspace) {
        return workspace.id !== id;
      });

      await chrome.storage.local.set({
        oneScreenWorkspaces: remaining
      });

      if (currentWorkspace && currentWorkspace.id === id) {
        clearTimeout(autosaveTimer);
        currentWorkspace = null;

        const workspaceSection = $("workspace");

        if (workspaceSection) {
          workspaceSection.classList.add("hidden");
        }
      }

      await renderSavedWorkspaces();

      if (message) {
        message.textContent = "Workspace deleted.";
      }
    } catch (error) {
      console.error("Delete failed:", error);

      if (message) {
        message.textContent = "Could not delete workspace.";
      }
    }
  }

  // ------------------------------------
  // GEMINI API KEY STATUS
  // ------------------------------------

  async function updateApiKeyStatus() {
    const apiKeyStatus = $("api-key-status");

    if (!apiKeyStatus) {
      return;
    }

    try {
      const result = await chrome.storage.local.get(
        "geminiApiKey"
      );

      const key = result.geminiApiKey;

      if (typeof key === "string" && key.trim().length > 0) {
        apiKeyStatus.textContent = "Gemini API key is configured.";
      } else {
        apiKeyStatus.textContent = "Gemini AI is not configured.";
      }
    } catch (error) {
      console.error("API key status check failed:", error);

      apiKeyStatus.textContent =
        "Could not check the API key status.";
    }
  }

  // ------------------------------------
  // SAVE GEMINI API KEY
  // ------------------------------------

  async function saveApiKey() {
    const apiKeyInput = $("api-key");
    const apiKeyStatus = $("api-key-status");
    const saveButton = $("save-api-key");

    if (!apiKeyInput || !apiKeyStatus || !saveButton) {
      console.error("Gemini settings elements are missing.");
      return;
    }

    const key = apiKeyInput.value.trim();

    if (!key) {
      apiKeyStatus.textContent = "Please enter your API key.";
      return;
    }

    try {
      saveButton.disabled = true;
      apiKeyStatus.textContent = "Saving API key...";

      await chrome.storage.local.set({
        geminiApiKey: key
      });

      const verification = await chrome.storage.local.get(
        "geminiApiKey"
      );

      if (verification.geminiApiKey !== key) {
        throw new Error("Could not verify the saved API key.");
      }

      apiKeyInput.value = "";

      apiKeyStatus.textContent =
        "API key saved locally. You can now test Gemini generation.";
    } catch (error) {
      console.error("API key save failed:", error);

      apiKeyStatus.textContent =
        "Could not save the API key. Check the extension and try again.";
    } finally {
      saveButton.disabled = false;
    }
  }

  // ------------------------------------
  // REMOVE GEMINI API KEY
  // ------------------------------------

  async function removeApiKey() {
    const apiKeyInput = $("api-key");
    const apiKeyStatus = $("api-key-status");
    const removeButton = $("remove-api-key");

    try {
      if (removeButton) {
        removeButton.disabled = true;
      }

      await chrome.storage.local.remove("geminiApiKey");

      if (apiKeyInput) {
        apiKeyInput.value = "";
      }

      await updateApiKeyStatus();

      if (apiKeyStatus) {
        apiKeyStatus.textContent = "Gemini API key removed.";
      }
    } catch (error) {
      console.error("API key removal failed:", error);

      if (apiKeyStatus) {
        apiKeyStatus.textContent =
          "Could not remove the API key.";
      }
    } finally {
      if (removeButton) {
        removeButton.disabled = false;
      }
    }
  }

  // ------------------------------------
  // INITIALIZE APPLICATION
  // ------------------------------------

  function initialize() {
    const generateButton = $("generate");
    const saveWorkspaceButton = $("save-workspace");
    const selectAllButton = $("select-all");
    const saveApiKeyButton = $("save-api-key");
    const removeApiKeyButton = $("remove-api-key");

    if (generateButton) {
      generateButton.addEventListener("click", handleGenerate);
    }

    if (saveWorkspaceButton) {
      saveWorkspaceButton.addEventListener("click", saveWorkspace);
    }

    if (selectAllButton) {
      selectAllButton.addEventListener("click", toggleAllTabs);
    }

    if (saveApiKeyButton) {
      saveApiKeyButton.addEventListener("click", saveApiKey);
    }

    if (removeApiKeyButton) {
      removeApiKeyButton.addEventListener("click", removeApiKey);
    }

    loadTabs();
    renderSavedWorkspaces();
    updateApiKeyStatus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {
      once: true
    });
  } else {
    initialize();
  }
})();