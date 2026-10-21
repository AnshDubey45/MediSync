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

  const doCommit = () => {
    runSl(["commit", "-m", message.trim()], (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({ success: false, error: stderr || err.message });
      }
      res.json({ success: true, message: stdout.trim() || "Commit created successfully." });
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
    res.json({ success: true, message: stdout.trim() || "Files staged successfully." });
  });
});

// 7. POST /api/scm/sync
router.post("/sync", (req, res) => {
  const { action, to } = req.body;
  if (action !== "pull" && action !== "push") {
    return res.status(400).json({ success: false, error: "Invalid sync action. Expected 'pull' or 'push'." });
  }

  const args = action === "push" ? ["push", "--to", to || "main"] : ["pull"];

  runSl(args, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: stderr || err.message,
        details: stdout,
      });
    }
    res.json({
      success: true,
      action,
      output: stdout.trim() || `Sapling ${action} completed successfully.`,
    });
  });
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
