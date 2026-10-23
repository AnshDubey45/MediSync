const express = require("express");
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Root repository path (MediSync workspace root directory)
const REPO_ROOT = path.resolve(__dirname, "../../..");

// Helper to ensure store journal exists on Windows to prevent Rust VFS transaction aborts
function ensureStoreJournal() {
  try {
    const slDir = path.join(REPO_ROOT, ".git", "sl");
    const storeDir = path.join(slDir, "store");
    const slJournal = path.join(slDir, "journal");
    const storeJournal = path.join(storeDir, "journal");

    if (fs.existsSync(slDir) && !fs.existsSync(slJournal)) {
      fs.writeFileSync(slJournal, "");
    }
    if (fs.existsSync(storeDir) && !fs.existsSync(storeJournal)) {
      fs.writeFileSync(storeJournal, "");
    }
  } catch (e) {
    // ignore
  }
}

// Helper to run sl safely
function runSl(args, callback) {
  ensureStoreJournal();
  const options = {
    cwd: REPO_ROOT,
    maxBuffer: 10 * 1024 * 1024, // 10MB
    env: {
      ...process.env,
      PATH: `C:\\Users\\Ansh Dubey\\Sapling;/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ""}`,
    },
  };
  const fullArgs = ["--config", "ui.paginate=False", ...args];

  execFile("sl", fullArgs, options, (err, stdout, stderr) => {
    callback(err, (stdout || "").toString(), (stderr || "").toString());
  });
}

// Helper to run git safely for remote syncing with GitHub
function runGit(args, callback) {
  const options = {
    cwd: REPO_ROOT,
    maxBuffer: 10 * 1024 * 1024,
    env: {
      ...process.env,
      PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ""}`,
    },
  };
  execFile("git", args, options, (err, stdout, stderr) => {
    callback(err, (stdout || "").toString(), (stderr || "").toString());
  });
}

// 1. GET /api/scm/info
router.get("/info", (req, res) => {
  runSl(["version"], (verErr, verOut) => {
    const version = verOut.trim().split("\n")[0] || "Sapling SCM";
    runSl(["whereami"], (whErr, whOut) => {
      const commit = (whOut || "").trim() || "000000000000";
      runSl(["book"], (bkErr, bkOut) => {
        let activeBookmark = "main";
        if (bkOut && bkOut.trim() && !bkOut.includes("no bookmarks set")) {
          const match = bkOut.match(/\*\s+([^\s]+)/) || bkOut.match(/([^\s]+)/);
          if (match) activeBookmark = match[1];
        }
        res.json({
          success: true,
          data: {
            version,
            commit: commit.substring(0, 12),
            fullCommit: commit,
            bookmark: activeBookmark,
            repoRoot: REPO_ROOT,
            isInitialized: commit !== "0000000000000000000000000000000000000000",
          },
        });
      });
    });
  });
});

// 2. GET /api/scm/status
router.get("/status", (req, res) => {
  runSl(["status"], (err, stdout, stderr) => {
    if (err && !stdout) {
      return res.status(500).json({ success: false, error: stderr || err.message });
    }

    const lines = stdout.split("\n").filter(Boolean);
    const files = [];
    const counts = { modified: 0, added: 0, untracked: 0, missing: 0, removed: 0, total: 0 };

    for (const line of lines) {
      if (line.length < 2) continue;
      const statusCode = line[0];
      const filePath = line.slice(2).trim();

      let statusType = "unknown";
      if (statusCode === "M") {
        statusType = "modified";
        counts.modified++;
      } else if (statusCode === "A") {
        statusType = "added";
        counts.added++;
      } else if (statusCode === "?") {
        statusType = "untracked";
        counts.untracked++;
      } else if (statusCode === "!") {
        statusType = "missing";
        counts.missing++;
      } else if (statusCode === "R") {
        statusType = "removed";
        counts.removed++;
      }
      counts.total++;

      files.push({
        status: statusCode,
        type: statusType,
        file: filePath,
      });
    }

    res.json({
      success: true,
      data: {
        files,
        counts,
        raw: stdout,
      },
    });
  });
});

// 3. GET /api/scm/diff
router.get("/diff", (req, res) => {
  const file = req.query.file;
  const args = ["diff"];
  if (file && typeof file === "string") {
    const cleanPath = file.replace(/^[./\\]+/, "");
    args.push(cleanPath);
  }

  runSl(args, (err, stdout, stderr) => {
    if (err && !stdout) {
      return res.status(500).json({ success: false, error: stderr || err.message });
    }
    res.json({ success: true, data: { diff: stdout, file: file || "All" } });
  });
});

// 4. GET /api/scm/log
router.get("/log", (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 15;
  const template = "{node|short}\t{author}\t{date|age}\t{desc|firstline}\n";

  runSl(["log", "-l", String(limit), "--template", template], (err, stdout) => {
    if (err || !stdout.trim()) {
      return res.json({ success: true, data: { commits: [] } });
    }

    const lines = stdout.split("\n").filter(Boolean);
    const commits = lines.map((line) => {
      const parts = line.split("\t");
      return {
        hash: parts[0] || "",
        author: parts[1] || "Unknown",
        age: parts[2] || "",
        message: parts[3] || "No message",
      };
    });

    res.json({ success: true, data: { commits } });
  });
});

// 5. POST /api/scm/commit
router.post("/commit", (req, res) => {
  const { message, addAll } = req.body;
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ success: false, error: "A commit message is required." });
  }

  const commitMsg = message.trim();

  const doCommit = () => {
    runSl(["commit", "-m", commitMsg], (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({ success: false, error: stderr || err.message });
      }

      // Keep Git synchronized with the commit
      runGit(["add", "."], () => {
        runGit(["commit", "-m", commitMsg], () => {
          res.json({ success: true, message: stdout.trim() || "Commit created successfully in Sapling & Git." });
        });
      });
    });
  };

  if (addAll) {
    runSl(["add"], () => {
      doCommit();
    });
  } else {
    doCommit();
  }
});

// 6. POST /api/scm/add
router.post("/add", (req, res) => {
  const { files } = req.body;
  const args = ["add"];
  if (Array.isArray(files) && files.length > 0) {
    args.push(...files);
  }

  runSl(args, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ success: false, error: stderr || err.message });
    }
    // Also stage in git
    runGit(["add", "."], () => {
      res.json({ success: true, message: stdout.trim() || "Files staged successfully." });
    });
  });
});

// 7. POST /api/scm/sync (Pushes and Pulls directly with GitHub)
router.post("/sync", (req, res) => {
  const { action, to } = req.body;
  if (action !== "pull" && action !== "push") {
    return res.status(400).json({ success: false, error: "Invalid sync action. Expected 'pull' or 'push'." });
  }

  const targetBranch = to || "main";

  if (action === "push") {
    // Stage any uncommitted changes first to ensure nothing is missed
    runGit(["add", "."], () => {
      // Check if there are unstaged/uncommitted files
      runGit(["status", "--porcelain"], (statusErr, statusOut) => {
        const proceedWithPush = () => {
          runGit(["push", "origin", targetBranch], (pushErr, pushOut, pushErrText) => {
            if (pushErr) {
              return res.status(500).json({
                success: false,
                error: pushErrText.trim() || pushErr.message,
                details: pushOut,
              });
            }
            res.json({
              success: true,
              action: "push",
              output: pushErrText.trim() || pushOut.trim() || `Successfully pushed to origin/${targetBranch}!`,
            });
          });
        };

        if (statusOut && statusOut.trim()) {
          runGit(["commit", "-m", "chore: sync dashboard changes before push"], () => {
            proceedWithPush();
          });
        } else {
          proceedWithPush();
        }
      });
    });
  } else if (action === "pull") {
    runGit(["pull", "origin", targetBranch], (pullErr, pullOut, pullErrText) => {
      if (pullErr) {
        return res.status(500).json({
          success: false,
          error: pullErrText.trim() || pullErr.message,
          details: pullOut,
        });
      }
      res.json({
        success: true,
        action: "pull",
        output: pullOut.trim() || `Successfully pulled latest changes from origin/${targetBranch}!`,
      });
    });
  }
});

// 7b. POST /api/scm/remove-missing
router.post("/remove-missing", (req, res) => {
  runSl(["remove", "--mark"], (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ success: false, error: stderr || err.message });
    }
    runGit(["add", "-u"], () => {
      res.json({ success: true, message: stdout.trim() || "Missing files marked as removed in Sapling & Git." });
    });
  });
});

// 7c. POST /api/scm/addremove
router.post("/addremove", (req, res) => {
  runSl(["addremove"], (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ success: false, error: stderr || err.message });
    }
    runGit(["add", "-A"], () => {
      res.json({ success: true, message: stdout.trim() || "Added untracked and removed missing files." });
    });
  });
});

// 7d. POST /api/scm/revert (Restore uncommitted changes or deleted files)
router.post("/revert", (req, res) => {
  const { file } = req.body;
  const args = ["revert", "--no-backup"];
  if (file && typeof file === "string" && file.trim()) {
    const cleanPath = file.trim().replace(/^[./\\]+/, "");
    args.push(cleanPath);
  } else {
    args.push("--all");
  }

  runSl(args, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ success: false, error: stderr || err.message });
    }
    const gitTarget = file ? [file.trim().replace(/^[./\\]+/, "")] : ["."];
    runGit(["checkout", "--", ...gitTarget], () => {
      res.json({ success: true, message: stdout.trim() || `Reverted ${file || "all changes"} successfully.` });
    });
  });
});

// 8a. POST /api/scm/amend  — Update the last local (draft) commit
router.post("/amend", (req, res) => {
  const { message } = req.body;
  const amendArgs = ["amend", "-A"];
  if (message && typeof message === "string" && message.trim()) {
    amendArgs.push("-m", message.trim());
  }

  runSl(amendArgs, (err, stdout, stderr) => {
    if (err) {
      const errText = stderr || err.message || "";
      if (errText.includes("cannot amend public commits")) {
        return res.status(400).json({
          success: false,
          error:
            "Cannot amend: This commit is already pushed to GitHub (public phase). Sapling protects published history. Please uncheck 'Amend' and create a normal commit instead.",
        });
      }
      return res.status(500).json({ success: false, error: errText });
    }
    // Mirror in Git
    runGit(["add", "."], () => {
      runGit(["commit", "--amend", "--no-edit"], () => {
        res.json({ success: true, message: stdout.trim() || "Amended successfully into the previous commit." });
      });
    });
  });
});

// 8b. POST /api/scm/undo  — One-click time machine (sl undo)
router.post("/undo", (req, res) => {
  runSl(["undo"], (err, stdout, stderr) => {
    if (err) {
      const errText = stderr || err.message || "";
      if (errText.toLowerCase().includes("journal")) {
        return res.status(400).json({
          success: false,
          error:
            "Nothing to undo: No recent local operation found in the journal. (sl undo reverses committed Sapling transactions only.)",
        });
      }
      if (errText.includes("uncommitted changes")) {
        return res.status(400).json({
          success: false,
          error: "Cannot undo: You have uncommitted changes. Commit or revert them first.",
        });
      }
      return res.status(500).json({ success: false, error: errText });
    }
    res.json({ success: true, message: stdout.trim() || "Last operation undone successfully." });
  });
});

// 8c. POST /api/scm/redo  — Redo last undone operation (sl redo)
router.post("/redo", (req, res) => {
  runSl(["redo"], (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ success: false, error: stderr || err.message });
    }
    res.json({ success: true, message: stdout.trim() || "Redo completed successfully." });
  });
});

// 8d. POST /api/scm/navigate  — Stack navigation: sl prev, sl next, sl goto
router.post("/navigate", (req, res) => {
  const { action, target } = req.body;
  if (!["prev", "next", "goto"].includes(action)) {
    return res.status(400).json({ success: false, error: "Action must be 'prev', 'next', or 'goto'." });
  }

  let args = [];
  if (action === "prev") args = ["prev"];
  else if (action === "next") args = ["next"];
  else if (action === "goto") {
    if (!target || typeof target !== "string") {
      return res.status(400).json({ success: false, error: "Target commit hash is required for 'goto'." });
    }
    args = ["goto", target.trim()];
  }

  runSl(args, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ success: false, error: stderr || err.message });
    }
    res.json({ success: true, action, message: stdout.trim() || `Navigated via 'sl ${args.join(" ")}'.` });
  });
});

// 8e. GET /api/scm/web/status  — Check if sl web is running
let slWebProcess = null;
let slWebState = { running: false, url: null, port: 3011 };

router.get("/web/status", (req, res) => {
  res.json({ success: true, ...slWebState });
});

// 8f. POST /api/scm/web/start  — Start the sl web GUI server
router.post("/web/start", (req, res) => {
  if (slWebProcess && slWebState.running) {
    return res.json({ success: true, ...slWebState, message: "Sapling Web is already running." });
  }

  const { spawn } = require("child_process");
  const slExe = process.platform === "win32" ? "C:\\Users\\Ansh Dubey\\Sapling\\sl.exe" : "sl";
  const port = 3011;

  ensureStoreJournal();

  let proc;
  try {
    proc = spawn(slExe, ["web", "--port", String(port), "--no-open"], {
      cwd: REPO_ROOT,
      env: { ...process.env, PATH: `C:\\Users\\Ansh Dubey\\Sapling;${process.env.PATH || ""}` },
      shell: true,
      detached: false,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }

  slWebProcess = proc;
  let resolved = false;

  const tryResolve = (data) => {
    const text = String(data);
    const match = text.match(/http:\/\/localhost:[0-9]+[^\s]*/);
    if (match && !resolved) {
      resolved = true;
      slWebState = { running: true, url: match[0], port };
      return res.json({ success: true, ...slWebState });
    }
  };

  proc.stdout?.on("data", tryResolve);
  proc.stderr?.on("data", tryResolve);

  proc.on("error", (err) => {
    if (!resolved) {
      resolved = true;
      res.status(500).json({ success: false, error: err.message });
    }
  });

  proc.on("exit", () => {
    slWebProcess = null;
    slWebState = { running: false, url: null, port: 3011 };
  });

  // Fallback: if no URL detected in 4s, check if port is open
  setTimeout(() => {
    if (!resolved) {
      resolved = true;
      const fallbackUrl = `http://localhost:${port}`;
      slWebState = { running: true, url: fallbackUrl, port };
      res.json({ success: true, ...slWebState });
    }
  }, 4000);
});

// 8g. POST /api/scm/web/stop  — Stop the sl web GUI server
router.post("/web/stop", (req, res) => {
  if (slWebProcess) {
    try {
      slWebProcess.kill();
    } catch (e) {
      // ignore kill errors
    }
    slWebProcess = null;
  }
  slWebState = { running: false, url: null, port: 3011 };
  res.json({ success: true, message: "Sapling Web server stopped." });
});

// 8. POST /api/scm/exec
router.post("/exec", (req, res) => {
  const { command } = req.body;
  if (!command || typeof command !== "string") {
    return res.status(400).json({ success: false, error: "Command string required." });
  }

  const rawTokens = command.trim().split(/\s+/).filter(Boolean);
  const subcommand = rawTokens[0] === "sl" ? rawTokens.slice(1) : rawTokens;

  if (subcommand.length === 0) {
    return res.status(400).json({ success: false, error: "Empty command." });
  }

  // Permitted subcommands for safety
  const allowed = [
    "status", "diff", "log", "smartlog", "whereami", "book", "branch",
    "branches", "summary", "paths", "help", "version", "add", "revert",
    "remove", "rm", "addremove", "push", "pull"
  ];

  if (!allowed.includes(subcommand[0])) {
    return res.status(403).json({
      success: false,
      error: `Command 'sl ${subcommand[0]}' is restricted for dashboard execution. Permitted commands: ${allowed.join(", ")}`,
    });
  }

  runSl(subcommand, (err, stdout, stderr) => {
    res.json({
      success: !err,
      stdout,
      stderr: stderr || (err ? err.message : ""),
      exitCode: err ? (err.code || 1) : 0,
    });
  });
});

module.exports = router;
