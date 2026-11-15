#!/usr/bin/env python3
"""Build the public Announcements feed from releases and the route catalog."""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "site" / "data" / "announcements-config.json"
CATALOG_PATH = ROOT / "site" / "data" / "catalog.json"
OUTPUT_PATH = ROOT / "site" / "data" / "announcements.json"
REPOSITORIES = (
    ("no-square/bettera2", "Better A2"),
    ("no-square/a2eg", "Better ESP"),
)
USER_AGENT = "Better-A2-Community-Announcements"


def read_json(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return default


def parse_date(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except (TypeError, ValueError):
        return None


def fetch_releases(repository: str) -> list[dict]:
    url = f"https://api.github.com/repos/{repository}/releases?per_page=100"
    request = Request(url, headers={"Accept": "application/vnd.github+json", "User-Agent": USER_AGENT})
    with urlopen(request, timeout=25) as response:
        payload = json.load(response)
    if not isinstance(payload, list):
        raise ValueError(f"Unexpected release response from {repository}")
    return payload


def release_channel(release: dict) -> str:
    tag = str(release.get("tag_name") or "")
    name = str(release.get("name") or "")
    combined = f"{tag} {name}".lower()
    if re.search(r"(?:hotfix|(?:^|[._-])hf\s*\d*)", combined):
        return "HOTFIX"
    if release.get("prerelease") or re.search(r"(?:^|[._-])beta(?:[._-]?\d+)?(?:$|[._-])", combined):
        return "BETA"
    return "STABLE"


def build_release_items(config: dict) -> list[dict]:
    release_since = parse_date(config.get("release_since"))
    items = []
    for repository, product in REPOSITORIES:
        try:
            releases = fetch_releases(repository)
        except (HTTPError, URLError, TimeoutError, ValueError, OSError) as error:
            print(f"::warning::Could not fetch releases from {repository}: {error}", file=sys.stderr)
            continue

        for release in releases:
            if release.get("draft") or not release.get("html_url"):
                continue
            published = parse_date(release.get("published_at"))
            if not published or (release_since and published <= release_since):
                continue
            tag = str(release.get("tag_name") or "").strip()
            if not tag:
                continue
            version = tag
            notes = str(release.get("body") or "").strip()
            if not notes:
                notes = f"{product} {version} is available. Open the release page for details and downloads."
            items.append(
                {
                    "kind": "release",
                    "date": published.date().isoformat(),
                    "published_at": published.isoformat().replace("+00:00", "Z"),
                    "product": product,
                    "tag": release_channel(release),
                    "version": version,
                    "title": f"{product} {version}",
                    "body": notes[:4000],
                    "url": release["html_url"],
                }
            )
    return items


def build_route_items(config: dict) -> list[dict]:
    catalog = read_json(CATALOG_PATH, {})
    grouped: dict[date, dict] = defaultdict(lambda: {"counts": defaultdict(int), "latest": None})
    for route in catalog.get("routes", []) if isinstance(catalog, dict) else []:
        added = parse_date(route.get("added_at"))
        if not added:
            continue
        platform = str(route.get("platform") or "Better A2")
        if platform not in ("Better A2", "ESP"):
            platform = "Better A2"
        group = grouped[added.date()]
        group["counts"][platform] += 1
        if group["latest"] is None or added > group["latest"]:
            group["latest"] = added

    route_since = parse_date(config.get("routes_since"))
    today = datetime.now(timezone.utc).date()
    items = []
    for added_day in sorted(grouped, reverse=True):
        if route_since and datetime.combine(added_day, datetime.min.time(), timezone.utc) < route_since:
            continue
        if (today - added_day).days > 30:
            continue
        counts = grouped[added_day]["counts"]
        total = sum(counts.values())
        breakdown = " · ".join(f"{platform}: {counts[platform]}" for platform in ("Better A2", "ESP") if counts.get(platform))
        latest_added = grouped[added_day]["latest"]
        items.append(
            {
                "kind": "routes",
                "date": added_day.isoformat(),
                "published_at": latest_added.isoformat().replace("+00:00", "Z"),
                "product": "COMMUNITY ROUTES",
                "tag": "ROUTE",
                "title": f"{total} new community route{'s' if total != 1 else ''}",
                "body": breakdown,
                "url": "routes.html",
            }
        )
    return items


def main() -> int:
    config = read_json(CONFIG_PATH, {})
    items = build_release_items(config) + build_route_items(config)
    items.sort(key=lambda item: (item["published_at"], item["kind"]), reverse=True)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps({"schema": 1, "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"), "items": items}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Built announcements feed with {len(items)} item(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
