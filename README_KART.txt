Race Career - Karting Academy Race Regulations patch

1. Backup index.html and export a career JSON backup.
2. Place apply_kart_regulations.py in your repository root.
3. Run: python3 apply_kart_regulations.py
4. Review git diff and commit index.html on a new branch.
5. Test on Safari/iPhone before merging into main.

Adds proposed race settings (laps, practice, qualifying, damage, tyre wear,
fuel, penalties, start, weather, AI) for Kart Academy plans, and a calendar
button to edit them. Existing sessions receive non-destructive displayed
defaults; edits are persisted via the existing save() and cloud bridge.
Completed sessions are read-only. GT7 availability must be checked manually.

NOTE: This is a patch script, not a full copy of the GitHub repository.
