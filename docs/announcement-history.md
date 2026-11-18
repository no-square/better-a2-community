# Permanent announcement history

`site/data/announcements.json` is the persistent publication history, not a disposable
API snapshot. Each build merges fetched releases and daily route summaries into it.
Release identity uses the release URL; route summaries use the date. A repeated
release updates the same card. Missing/deleted releases, an API outage, a changed
cutoff or an empty route catalog do not remove historical cards.

The generator follows release pagination. Daily route posts have no 30-day expiry.
A corrupt history file fails the build rather than being replaced by an empty feed.
Unchanged items retain their generation timestamp to avoid unnecessary commits.

The Pages workflow commits the merged JSON before deployment, so subsequent runs
start from the latest history. It needs repository contents write permission for
that commit. The existing 12-hour schedule is unchanged. If a concurrent push
rejects the history commit, the run fails rather than force-pushing over changes.

Validation: `python -m unittest discover -s tools -p test_build_announcements.py -v`.
Manual generation: `python tools/build_announcements.py`.

Already lost announcements can be recovered from the existing local history and
current release listings. Release notes deleted from GitHub and absent from every
saved history cannot be reconstructed automatically.
