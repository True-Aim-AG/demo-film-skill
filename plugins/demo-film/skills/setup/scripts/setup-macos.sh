#!/bin/bash
# Check and install the tools that demo films need, on macOS.
#
#   bash setup-macos.sh                       check only
#   bash setup-macos.sh --install             install what is missing
#   bash setup-macos.sh --install --dry-run   print the install commands only
#   bash setup-macos.sh --pretend node,chrome test only: treat these tools as missing
#
# Tools: Homebrew, Node.js 20 or later, pnpm, ffmpeg, Google Chrome. Installs with Homebrew, then
# pnpm with npm. Safe to run again: it installs only what is missing. Runs under the bash 3.2 that
# macOS ships. Output: one line per tool (OK, MISSING, BLOCKED), then READY, NOT READY or BLOCKED.
# Exit code: 0 ready, 1 something missing (check mode), 2 blocked (ask IT), 3 waiting for the
# Homebrew install in Terminal (run the script again when it is done).
INSTALL=0; DRY=0; PRETEND=""
while [ $# -gt 0 ]; do
  case "$1" in
    --install) INSTALL=1 ;;
    --dry-run) DRY=1 ;;
    --pretend) PRETEND=",$2,"; shift ;;
  esac
  shift
done
if [ -n "$PRETEND" ] && [ $INSTALL = 1 ] && [ $DRY = 0 ]; then echo "--pretend works only with --dry-run or without --install"; exit 1; fi

# A Homebrew install puts brew in /opt/homebrew (Apple silicon) or /usr/local (Intel), and a new
# terminal finds it only after `brew shellenv`. Load it into this process.
load_brew() {
  for b in /opt/homebrew/bin/brew /usr/local/bin/brew; do
    if [ -x "$b" ]; then eval "$("$b" shellenv)"; return 0; fi
  done
  return 1
}

pretend() { case "$PRETEND" in *",$1,"*) return 0 ;; esac; return 1; }

check() {
  BREW=""; GIT=""; NODE=""; PNPM=""; FFMPEG=""; CHROME=""
  if ! pretend brew && command -v brew >/dev/null 2>&1; then BREW="OK brew $(brew --version 2>/dev/null | head -1)"; else BREW="MISSING brew"; fi
  # On a new Mac, /usr/bin/git is only a stub that opens an install window. Call git only when
  # the Command Line Tools are there, or a git from Homebrew is.
  GIT="MISSING git"
  if ! pretend git; then
    if xcode-select -p >/dev/null 2>&1 || [ -x /opt/homebrew/bin/git ] || [ -x /usr/local/bin/git ]; then
      g=$(git --version 2>/dev/null) && GIT="OK $g"
    fi
  fi
  v=$(node -v 2>/dev/null)
  major=$(echo "$v" | sed -n 's/^v\([0-9]*\)\..*/\1/p')
  if ! pretend node && [ -n "$major" ] && [ "$major" -ge 20 ]; then NODE="OK node $v"
  elif [ -n "$v" ] && ! pretend node; then NODE="MISSING node (found $v, need 20 or later)"
  else NODE="MISSING node"; fi
  if ! pretend pnpm && command -v pnpm >/dev/null 2>&1; then PNPM="OK pnpm $(pnpm -v 2>/dev/null)"; else PNPM="MISSING pnpm"; fi
  if ! pretend ffmpeg && command -v ffmpeg >/dev/null 2>&1; then FFMPEG="OK ffmpeg $(ffmpeg -version 2>/dev/null | head -1 | awk '{print $3}')"; else FFMPEG="MISSING ffmpeg"; fi
  CHROME="MISSING chrome"
  if ! pretend chrome; then
    for c in "/Applications/Google Chrome.app" "$HOME/Applications/Google Chrome.app"; do
      if [ -d "$c" ]; then CHROME="OK chrome $c"; fi
    done
  fi
}

show() { printf '%s\n' "$BREW" "$GIT" "$NODE" "$PNPM" "$FFMPEG" "$CHROME"; }
# Homebrew counts only when a tool needs it: a Mac with every tool is ready without it.
missing() { printf '%s\n' "$GIT" "$NODE" "$PNPM" "$FFMPEG" "$CHROME" | grep -c '^MISSING'; }
needs_brew() { printf '%s\n' "$NODE" "$FFMPEG" "$CHROME" | grep -q '^MISSING'; }

blocked() {
  echo "BLOCKED $1"
  echo "Ask IT to allow $1 on this Mac, then run the setup again."
  exit 2
}

run() {
  echo "RUN $*"
  if [ $DRY = 1 ]; then return 0; fi
  "$@"
}

load_brew
check
show
if [ "$(missing)" = 0 ]; then echo "READY"; exit 0; fi
if [ $INSTALL = 0 ]; then echo "NOT READY: missing $(show | grep '^MISSING' | awk '{print $2}' | tr '\n' ' ')"; exit 1; fi

case "$GIT" in MISSING*)
  # Apple's Command Line Tools bring git. Their installer is a window with an Install button.
  echo "STEP Git downloads the demo-film skill and its updates. It comes with Apple's Command Line Tools. A window opens: click Install."
  echo "RUN xcode-select --install"
  if [ $DRY = 0 ]; then
    xcode-select --install >/dev/null 2>&1
    i=0
    while [ $i -lt 120 ]; do
      if xcode-select -p >/dev/null 2>&1; then break; fi
      sleep 10; i=$((i + 1))
    done
    xcode-select -p >/dev/null 2>&1 || { echo "WAITING The Command Line Tools are not installed yet. Click Install in the window and wait, then run the setup again."; exit 3; }
    check
    case "$GIT" in MISSING*) blocked "git (Apple's Command Line Tools)" ;; esac
    echo "$GIT"
  fi
;; esac

needs_brew || BREW="SKIP"
case "$BREW" in MISSING*)
  # The Homebrew installer asks for the Mac password, which this script cannot type. Open it in
  # Terminal, where the user types the password, and wait for brew to appear.
  echo "STEP Homebrew installs the other tools. A Terminal window opens: type your Mac password there and press Enter."
  CMD='/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  echo "RUN (in Terminal) $CMD"
  if [ $DRY = 0 ]; then
    if ! id -Gn | grep -qw admin; then blocked "Homebrew (this Mac user is not an administrator)"; fi
    osascript -e "tell application \"Terminal\" to do script \"$(echo "$CMD" | sed 's/\\/\\\\/g; s/"/\\"/g')\"" -e 'tell application "Terminal" to activate' >/dev/null
    i=0
    while [ $i -lt 120 ]; do
      if load_brew; then break; fi
      sleep 10; i=$((i + 1))
    done
    load_brew || { echo "WAITING Homebrew is not installed yet. Finish it in Terminal, then run the setup again."; exit 3; }
    # Make new terminals find brew too. Only once.
    line="eval \"\$($(command -v brew) shellenv)\""
    grep -qF "$line" "$HOME/.zprofile" 2>/dev/null || echo "$line" >> "$HOME/.zprofile"
    echo "OK brew $(brew --version | head -1)"
  fi
;; esac

step() { # $1 tool key, $2 plain line, rest: the command
  key=$1; why=$2; shift 2
  echo "STEP $why"
  run "$@" || blocked "$key (the command was: $*)"
  if [ $DRY = 0 ]; then
    load_brew; hash -r; check
    case $key in node) now=$NODE ;; pnpm) now=$PNPM ;; ffmpeg) now=$FFMPEG ;; chrome) now=$CHROME ;; esac
    case "$now" in MISSING*) blocked "$key" ;; esac
    echo "$now"
  fi
}

case "$NODE" in MISSING*) step node "Node.js runs the film tools." brew install node ;; esac
case "$FFMPEG" in MISSING*) step ffmpeg "ffmpeg turns the recorded frames into a video file." brew install ffmpeg ;; esac
case "$CHROME" in MISSING*) step chrome "Google Chrome is the browser that records your app. macOS can ask for your password." brew install --cask google-chrome ;; esac
case "$PNPM" in MISSING*) step pnpm "pnpm installs the parts of the film engine." npm install -g pnpm ;; esac

if [ $DRY = 1 ]; then echo "DRY RUN: nothing was installed"; exit 1; fi
check
show
if [ "$(missing)" != 0 ]; then echo "NOT READY"; exit 1; fi
echo "READY"
exit 0
