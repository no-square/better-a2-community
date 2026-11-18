import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import URLError

import build_announcements as feed


def release(version="v1", product="Better A2"):
    repo = "bettera2" if product == "Better A2" else "a2eg"
    return {"kind": "release", "date": "2026-01-01", "published_at": "2026-01-01T12:00:00Z",
            "product": product, "version": version, "tag": "STABLE", "title": version,
            "body": "Initial notes", "url": f"https://github.com/no-square/{repo}/releases/tag/{version}"}


class AnnouncementHistoryChecks(unittest.TestCase):
    def test_multiple_runs_keep_versions_and_update_without_duplicates(self):
        first = release()
        second = release("v2")
        history = feed.merge_items([first], [second])
        history = feed.merge_items(history, [dict(second, body="Corrected notes")])
        self.assertEqual(len(history), 2)
        self.assertEqual(next(x for x in history if x["version"] == "v2")["body"], "Corrected notes")
        self.assertEqual(len(feed.merge_items(history, [])), 2)

    def test_api_outage_preserves_both_product_histories(self):
        previous = [release(), release("v3.1", "Better ESP")]
        with patch.object(feed, "fetch_releases", side_effect=URLError("offline")):
            current = feed.build_release_items({})
        self.assertEqual(feed.merge_items(previous, current), feed.merge_items(previous, []))

    def test_old_routes_are_generated_and_daily_card_is_updated(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "catalog.json"
            path.write_text(json.dumps({"routes": [
                {"added_at": "2020-01-01T12:00:00Z", "platform": "Better A2"}]}))
            with patch.object(feed, "CATALOG_PATH", path):
                routes = feed.build_route_items({})
            self.assertEqual(len(routes), 1)
            changed = dict(routes[0], title="2 new community routes")
            merged = feed.merge_items(routes, [changed])
            self.assertEqual(len(merged), 1)
            self.assertEqual(merged[0]["title"], changed["title"])
            self.assertEqual(feed.merge_items(merged, []), merged)

    def test_releases_are_fetched_beyond_first_page(self):
        class Response:
            def __init__(self, rows): self.rows = rows
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self): return json.dumps(self.rows).encode()
        with patch.object(feed, "urlopen", side_effect=[Response([{}] * 100), Response([{"tag_name": "old"}])]) as fetch:
            self.assertEqual(len(feed.fetch_releases("no-square/a2eg")), 101)
            self.assertIn("page=2", fetch.call_args.args[0].full_url)

    def test_corrupt_history_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "announcements.json"
            path.write_text("{bad")
            with self.assertRaises(json.JSONDecodeError): feed.read_history(path)
            self.assertEqual(path.read_text(), "{bad")

    def test_no_change_keeps_timestamp_and_content(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "announcements.json"
            old = {"schema": 1, "generated_at": "2026-01-01T12:00:00Z", "items": [release()]}
            feed.write_feed(path, old, old["items"])
            self.assertEqual(feed.read_history(path), old)
            self.assertEqual(list(Path(folder).iterdir()), [path])


if __name__ == "__main__":
    unittest.main()
