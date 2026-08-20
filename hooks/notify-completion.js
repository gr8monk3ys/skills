#!/usr/bin/env node
/**
 * Stop Hook: Send notification when Claude finishes
 * Sends a desktop notification when Claude completes a task
 *
 * Usage: Configure in hooks.json under Stop
 *
 * Cross-platform Node.js implementation (macOS, Linux, Windows)
 */

const os = require("os");
const { execSync } = require("child_process");

// Error logging utility
function logError(context, err) {
  console.error(`[Hook Error] notify-completion: ${context} - ${err.message}`);
}

// Read stdin
async function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("readable", () => {
      let chunk;
      while ((chunk = process.stdin.read())) {
        data += chunk;
      }
    });
    process.stdin.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        logError("stdin parse", err);
        resolve({});
      }
    });
    process.stdin.on("error", (err) => {
      logError("stdin read", err);
      resolve({});
    });
    setTimeout(() => resolve({}), 500);
  });
}

// Send notification based on OS
function notify(title, message) {
  const platform = os.platform();

  try {
    if (platform === "darwin") {
      // macOS
      execSync(
        `osascript -e 'display notification "${message}" with title "${title}"'`,
        { stdio: "pipe" },
      );
      return true;
    } else if (platform === "linux") {
      // Linux
      execSync(`notify-send "${title}" "${message}"`, { stdio: "pipe" });
      return true;
    } else if (platform === "win32") {
      // Windows - use PowerShell toast notification
      const script = `
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
        $template.SelectSingleNode("//text[@id='1']").InnerText = "${title}"
        $template.SelectSingleNode("//text[@id='2']").InnerText = "${message}"
        $toast = [Windows.UI.Notifications.ToastNotification]::new($template)
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Claude Code").Show($toast)
      `.replace(/\n/g, "; ");
      execSync(`powershell -Command "${script}"`, { stdio: "pipe" });
      return true;
    }
  } catch (err) {
    // Notification failed - this is expected if notification system unavailable
    return false;
  }

  return false;
}

// Main execution
async function main() {
  const input = await readStdin();
  const stopReason = input.stop_hook_data?.stop_reason || "completed";

  // Compose notification message
  const title = "Claude Code";
  let message;

  switch (stopReason) {
    case "end_turn":
      message = "Task completed successfully";
      break;
    case "max_tokens":
      message = "Reached token limit";
      break;
    case "stop_sequence":
      message = "Stopped at sequence";
      break;
    default:
      message = `Task finished: ${stopReason}`;
  }

  notify(title, message);

  process.exit(0);
}

main();
