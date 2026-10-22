const express = require("express");
const { execFile } = require("child_process");
const path = require("path");

const router = express.Router();

// Root repository path (MediSync workspace root directory)
const REPO_ROOT = path.resolve(__dirname, "../../..");

// Helper to run sl safely
function runSl(args, callback) {
  const options = {
    cwd: REPO_ROOT,
    maxBuffer: 10 * 1024 * 1024, // 10MB
    env: {
      ...process.env,
      PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ""}`,
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
    const counts = { modified: 0, added: 0, untracked: 0, missing: 0, total: 0 };

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
      } else if (statusCode === "!" || statusCode === "R") {
        statusType = "missing";
        counts.missing++;
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
    res.json({ success: true, message: stdout.trim() || "Missing files marked as removed." });
  });
});

// 7c. POST /api/scm/addremove
router.post("/addremove", (req, res) => {
  runSl(["addremove"], (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ success: false, error: stderr || err.message });
    }
    res.json({ success: true, message: stdout.trim() || "Added untracked and removed missing files." });
  });
});

// 8. GET /api/scm/undo/preview
router.get("/undo/preview", (req, res) => {
  runSl(["undo", "--preview"], (err, stdout, stderr) => {
    if (err && !stdout) {
      return res.status(500).json({ success: false, error: stderr || err.message });
    }
    res.json({
      success: true,
      data: {
        preview: (stdout || "").trim() || "No previous action to undo.",
      },
    });
  });
});

// 9. POST /api/scm/undo (One-click Sapling Time Machine)
router.post("/undo", (req, res) => {
  const { keep } = req.body || {};
  const args = ["undo"];
  if (keep) {
    args.push("--keep");
  }

  runSl(args, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ success: false, error: stderr || err.message });
    }

    // Keep Git synchronized with the undo
    runGit(["reset", keep ? "--soft" : "--mixed", "HEAD~1"], () => {
      res.json({
        success: true,
        message: stdout.trim() || "Last local action undone successfully in Sapling.",
      });
    });
  });
});

// 10. POST /api/scm/amend (Meld pending changes into the current commit)
router.post("/amend", (req, res) => {
  const { message, addAll } = req.body || {};
  const args = ["amend"];
  if (addAll) {
    args.push("-A");
  }
  if (message && typeof message === "string" && message.trim()) {
    args.push("-m", message.trim());
  }

  runSl(args, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ success: false, error: stderr || err.message });
    }

    // Keep Git synchronized with the amended commit
    runGit(["add", "."], () => {
      const gitArgs = ["commit", "--amend"];
      if (message && typeof message === "string" && message.trim()) {
        gitArgs.push("-m", message.trim());
      } else {
        gitArgs.push("--no-edit");
      }
      runGit(gitArgs, () => {
        res.json({
          success: true,
          message: stdout.trim() || "Amended changes into current commit.",
        });
      });
    });
  });
});

// 11. POST /api/scm/nav (Stack navigation: sl prev, sl next, sl goto <target>)
router.post("/nav", (req, res) => {
  const { action, target, clean } = req.body || {};
  if (!["prev", "next", "goto"].includes(action)) {
    return res.status(400).json({ success: false, error: "Action must be 'prev', 'next', or 'goto'." });
  }

  const args = [action];
  if (clean) {
    args.push("-C");
  }
  if (action === "goto") {
    if (!target || typeof target !== "string") {
      return res.status(400).json({ success: false, error: "Target revision or commit hash required for 'goto'." });
    }
    args.push(target.trim());
  }

  runSl(args, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ success: false, error: stderr || err.message });
    }

    // Sync working copy and checkout in git
    runSl(["whereami"], (whErr, whOut) => {
      const newHash = (whOut || "").trim();
      if (newHash && newHash !== "0000000000000000000000000000000000000000") {
        runGit(["checkout", newHash], () => {
          res.json({
            success: true,
            message: stdout.trim() || `Moved to ${action} commit (${newHash.substring(0, 10)})`,
            targetHash: newHash.substring(0, 12),
          });
        });
      } else {
        res.json({
          success: true,
          message: stdout.trim() || `Navigation '${action}' completed.`,
        });
      }
    });
  });
});

// 12. GET /api/scm/smartlog (Visual ASCII Tree + Stack Info)
router.get("/smartlog", (req, res) => {
  runSl(["smartlog"], (treeErr, treeOut) => {
    const tree = (treeOut || "").trim();
    const template = "{node|short}\t{author}\t{date|age}\t{desc|firstline}\n";
    runSl(["log", "-r", "reverse(smartlog())", "--template", template], (logErr, logStdout) => {
      const commits = (logStdout || "")
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const parts = line.split("\t");
          return {
            hash: parts[0] || "",
            author: parts[1] || "Unknown",
            age: parts[2] || "",
            message: parts[3] || "No message",
          };
        });

      res.json({
        success: true,
        data: {
          tree,
          commits,
        },
      });
    });
  });
});

// 13. sl web (Meta Interactive Smartlog Web GUI Server Management)
let slWebSession = null;

// GET /api/scm/web/status
router.get("/web/status", (req, res) => {
  if (!slWebSession || !slWebSession.pid) {
    return res.json({ success: true, running: false });
  }

  try {
    process.kill(slWebSession.pid, 0);
    return res.json({ success: true, running: true, session: slWebSession });
  } catch (e) {
    slWebSession = null;
    return res.json({ success: true, running: false });
  }
});

// POST /api/scm/web/start
router.post("/web/start", (req, res) => {
  const port = req.body?.port || 3011;
  runSl(["web", "--port", String(port), "--json", "--no-open"], (err, stdout, stderr) => {
    if (err && !stdout) {
      return res.status(500).json({ success: false, error: stderr || err.message });
    }

    try {
      const jsonStart = stdout.indexOf("{");
      const jsonEnd = stdout.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const rawJson = stdout.slice(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(rawJson);
        slWebSession = {
          url: parsed.url,
          port: parsed.port || port,
          token: parsed.token,
          pid: parsed.pid,
          cwd: parsed.cwd,
        };
        return res.json({ success: true, running: true, session: slWebSession });
      }
      return res.status(500).json({ success: false, error: "Unexpected output from sl web: " + stdout });
    } catch (parseErr) {
      return res.status(500).json({ success: false, error: "Failed to parse sl web response: " + parseErr.message });
    }
  });
});

// POST /api/scm/web/stop
router.post("/web/stop", (req, res) => {
  const port = req.body?.port || (slWebSession?.port ? slWebSession.port : 3011);
  runSl(["web", "--port", String(port), "--kill"], (err, stdout, stderr) => {
    if (slWebSession?.pid) {
      try {
        process.kill(slWebSession.pid, "SIGTERM");
      } catch (e) {
        // already killed
      }
    }
    slWebSession = null;
    res.json({ success: true, message: stdout.trim() || "Interactive Smartlog Web GUI server stopped." });
  });
});

// 14. POST /api/scm/exec
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

  // Expanded permitted subcommands for safety
  const allowed = [
    "status", "diff", "log", "smartlog", "whereami", "book", "branch",
    "branches", "summary", "paths", "help", "version", "add", "revert",
    "remove", "rm", "addremove", "push", "pull",
    "undo", "redo", "amend", "prev", "previous", "next", "goto", "go",
    "fold", "pr", "rebase", "absorb", "hide", "unhide", "restack"
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
