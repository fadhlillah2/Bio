#!/bin/sh
# Starts the Playwright MCP server so a coding agent can open, inspect and screenshot the site.
# The version is pinned: an unpinned npx would run whatever was published last.
# Cloud sessions ship a Chromium under /opt/pw-browsers and no Chrome, so use that headless;
# anywhere else keep Playwright's own defaults.
set -eu
if [ -x /opt/pw-browsers/chromium ]; then
  exec npx -y @playwright/mcp@0.0.83 --headless --isolated --no-sandbox --executable-path /opt/pw-browsers/chromium "$@"
fi
exec npx -y @playwright/mcp@0.0.83 --isolated "$@"
