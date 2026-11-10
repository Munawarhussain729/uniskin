#!/bin/sh
# release-smoke.sh — post-release smoke test for published uniskin packages.
#
# For each adapter (default, shadcn, daisyui) the script creates a fresh
# npm project in a temp dir outside the repo, then:
#   1. npm init -y and installs tailwindcss, @tailwindcss/cli, uniskin and
#      the adapter — at VERSION from the real registry, or from local
#      tarballs with --from-tarballs
#   2. npx uniskin init --adapter <name> --yes
#   3. runs init a second time and asserts the stylesheet is unchanged
#      (idempotent)
#   4. compiles the stylesheet with @tailwindcss/cli
#   5. greps the output for .ui-button and a prefers-color-scheme block
#
# Usage:
#   release-smoke.sh [VERSION]            npm version to test (default: latest)
#   release-smoke.sh --from-tarballs DIR  test local pnpm pack tarballs in DIR
#   --upgrade-from VERSION                also install VERSION first, run init,
#                                         then upgrade to the version under test
#                                         and compile (catches peer-range and
#                                         changeset problems)
#
# Exit code: 0 when every adapter passes, 1 when any check fails,
# 2 on usage/environment errors. The temp dir is removed on exit.

set -eu

usage() {
  sed -n '2,26p' "$0"
}

VERSION="latest"
TARBALL_DIR=""
UPGRADE_FROM=""
while [ $# -gt 0 ]; do
  case "$1" in
    --from-tarballs)
      [ $# -ge 2 ] || { echo "error: --from-tarballs needs a directory" >&2; exit 2; }
      TARBALL_DIR=$2
      shift 2
      ;;
    --upgrade-from)
      [ $# -ge 2 ] || { echo "error: --upgrade-from needs a version" >&2; exit 2; }
      UPGRADE_FROM=$2
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      ;;
    -*)
      echo "error: unknown option $1" >&2
      exit 2
      ;;
    *)
      VERSION=$1
      shift
      ;;
  esac
done

command -v npm >/dev/null || { echo "error: npm not found" >&2; exit 2; }
command -v node >/dev/null || { echo "error: node not found" >&2; exit 2; }

find_tgz() {
  f=$(find "$TARBALL_DIR" -maxdepth 1 -name "$1" | head -1)
  [ -n "$f" ] || {
    echo "error: no tarball matching $1 in $TARBALL_DIR" >&2
    exit 2
  }
  echo "$f"
}

if [ -n "$TARBALL_DIR" ]; then
  [ -d "$TARBALL_DIR" ] || { echo "error: $TARBALL_DIR is not a directory" >&2; exit 2; }
  TARBALL_DIR=$(cd "$TARBALL_DIR" && pwd)
  # pnpm pack names scoped packages without the @scope/ prefix:
  # @uniskin/shadcn -> uniskin-shadcn-<version>.tgz
  CORE=$(find_tgz 'uniskin-[0-9]*.tgz')
  SHADCN=$(find_tgz 'uniskin-shadcn-*.tgz')
  DAISY=$(find_tgz 'uniskin-daisyui-*.tgz')
  MODE="tarballs from $TARBALL_DIR"
else
  CORE="uniskin@$VERSION"
  SHADCN="@uniskin/shadcn@$VERSION"
  DAISY="@uniskin/daisyui@$VERSION"
  MODE="uniskin@$VERSION from the npm registry"
fi

pkgs_for() {
  case $1 in
    default) echo "$CORE" ;;
    shadcn)  echo "$CORE $SHADCN" ;;
    daisyui) echo "$CORE $DAISY daisyui" ;;
  esac
}

# the same package list at the version being upgraded from
pkgs_prev() {
  case $1 in
    default) echo "uniskin@$UPGRADE_FROM" ;;
    shadcn)  echo "uniskin@$UPGRADE_FROM @uniskin/shadcn@$UPGRADE_FROM" ;;
    daisyui) echo "uniskin@$UPGRADE_FROM @uniskin/daisyui@$UPGRADE_FROM daisyui" ;;
  esac
}

TMP=$(mktemp -d "${TMPDIR:-/tmp}/uniskin-smoke.XXXXXX")
trap 'rm -rf "$TMP"' EXIT
trap 'exit 1' INT TERM

# Runs the per-adapter flow inside $PWD; echoes the failed step name, or
# "ok". Commands log to ./log so the table stays readable.
run_adapter() {
  adapter=$1
  step=install
  npm init -y >log 2>&1 || { echo "$step"; return 1; }
  # shellcheck disable=SC2046 # pkgs_for returns a package list on purpose
  npm install --no-audit --no-fund --loglevel=error \
    tailwindcss @tailwindcss/cli $(pkgs_for "$adapter") >>log 2>&1 || { echo "$step"; return 1; }
  printf '@import "tailwindcss";\n' >app.css
  printf '<!doctype html><button class="ui-button ui-primary">smoke</button>\n' >index.html
  step=init
  npx uniskin init --adapter "$adapter" --yes >>log 2>&1 || { echo "$step"; return 1; }
  grep -q '@plugin "uniskin"' app.css || { echo "$step: app.css lacks the @plugin line"; return 1; }
  # The snapshot must not end in .css: init scans the tree for Tailwind
  # entry stylesheets and would see it as a second candidate.
  cp app.css app.init1.snap
  step=idempotent
  npx uniskin init --adapter "$adapter" --yes >>log 2>&1 || { echo "$step"; return 1; }
  cmp -s app.init1.snap app.css || { echo "$step"; return 1; }
  step=compile
  npx @tailwindcss/cli -i app.css -o out.css >>log 2>&1 || { echo "$step"; return 1; }
  step=classes
  grep -q '\.ui-button' out.css || { echo "$step"; return 1; }
  step=dark
  grep -q 'prefers-color-scheme' out.css || { echo "$step"; return 1; }
  echo ok
}

# Upgrade flow inside $PWD: install the previous version, init, then move
# the three packages to the version under test and compile again. A wrong
# peer range or a stale stylesheet shows up as a failed install or compile.
run_upgrade() {
  adapter=$1
  step=install-previous
  npm init -y >log 2>&1 || { echo "$step"; return 1; }
  # shellcheck disable=SC2046
  npm install --no-audit --no-fund --loglevel=error \
    tailwindcss @tailwindcss/cli $(pkgs_prev "$adapter") >>log 2>&1 || { echo "$step"; return 1; }
  printf '@import "tailwindcss";\n' >app.css
  printf '<!doctype html><button class="ui-button ui-primary">smoke</button>\n' >index.html
  step=init-previous
  npx uniskin init --adapter "$adapter" --yes >>log 2>&1 || { echo "$step"; return 1; }
  cp app.css app.prev.snap
  step=upgrade
  # shellcheck disable=SC2046
  npm install --no-audit --no-fund --loglevel=error $(pkgs_for "$adapter") >>log 2>&1 || { echo "$step"; return 1; }
  step=stylesheet-unchanged
  cmp -s app.prev.snap app.css || { echo "$step"; return 1; }
  step=compile
  npx @tailwindcss/cli -i app.css -o out.css >>log 2>&1 || { echo "$step"; return 1; }
  grep -q '\.ui-button' out.css || { echo "$step: no .ui-button"; return 1; }
  grep -q 'prefers-color-scheme' out.css || { echo "$step: no dark block"; return 1; }
  echo ok
}

# Prints the installed version of $1 inside dir $2 (or "?").
pkgv() {
  node -e 'try { console.log(require(process.argv[1] + "/package.json").version) } catch { console.log("?") }' \
    "$2/node_modules/$1" 2>/dev/null
}

echo "uniskin release smoke — $MODE"
echo "temp dir: $TMP (removed on exit)"
echo
printf '%-9s %-6s %-9s %-11s %s\n' adapter result uniskin tailwind detail

FAILURES=0
for adapter in default shadcn daisyui; do
  dir=$TMP/$adapter
  mkdir -p "$dir"
  if out=$(cd "$dir" && run_adapter "$adapter"); then
    detail=""
    result=PASS
  else
    detail="failed step: $out"
    result=FAIL
    FAILURES=$((FAILURES + 1))
  fi
  printf '%-9s %-6s %-9s %-11s %s\n' \
    "$adapter" "$result" "$(pkgv uniskin "$dir")" "$(pkgv tailwindcss "$dir")" "$detail"
  if [ "$result" = FAIL ]; then
    echo "  last lines of $adapter log:"
    tail -12 "$dir/log" | sed 's/^/  /'
  fi
done

if [ -n "$UPGRADE_FROM" ]; then
  echo
  echo "upgrade path: $UPGRADE_FROM -> the version under test"
  printf '%-9s %-6s %-9s %s\n' adapter result uniskin detail
  for adapter in default shadcn daisyui; do
    dir=$TMP/upgrade-$adapter
    mkdir -p "$dir"
    if out=$(cd "$dir" && run_upgrade "$adapter"); then
      result=PASS
      detail=""
    else
      result=FAIL
      detail="failed step: $out"
      FAILURES=$((FAILURES + 1))
    fi
    printf '%-9s %-6s %-9s %s\n' "$adapter" "$result" "$(pkgv uniskin "$dir")" "$detail"
    if [ "$result" = FAIL ]; then
      echo "  last lines of the $adapter upgrade log:"
      tail -12 "$dir/log" | sed 's/^/  /'
    fi
  done
fi

echo
if [ "$FAILURES" -eq 0 ]; then
  echo "PASS: all adapters smoke-tested cleanly."
  exit 0
fi
echo "FAIL: $FAILURES adapter(s) failed."
exit 1
