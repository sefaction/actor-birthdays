# Actor Birthdays

## Install

In Foundry Setup, open **Add-on Modules → Install Module** and paste this manifest URL:

```text
https://raw.githubusercontent.com/sefaction/actor-birthdays/main/module.json
```

### Manual installation

1. Copy the entire `actor-birthdays` folder into your Foundry user data's `Data/modules` directory.
2. Restart Foundry. In your world, enable Actor Birthdays and Simple Timekeeping & Calendar by TheRipper93 (or Simple Calendar) under **Manage Modules**.
3. Open an actor sheet and click **Birthdate** on the **Summary** page beside the Age field. Pick the in-world year, month, and day, then click **Save**. The calculated age appears in that spot. Click it to edit the birthdate, or hover over it to see the saved date.

Pathfinder 1e character and NPC sheets display the calculated age in the Summary page's Age field location. The original Age text is preserved and becomes visible again when the tracked birthdate is cleared. Other sheet layouts use their Summary tab when available, with a header button as a fallback.

Simple Timekeeping & Calendar integration requires Foundry VTT 13 or later and uses the configured Foundry world calendar. Simple Calendar 2.4 API integration remains available on Foundry VTT 12 and later. When both calendar modules are enabled, Simple Timekeeping takes priority. Birthdates saved for a different calendar remain stored and can be viewed by switching back to that calendar.

## How it works

- Actor owners and GMs can edit the birthdate. The module stores it on the actor and calculates age independently of any age field supplied by the game system.
- Public announcements are enabled by default for each saved birthdate. Clear **Announce birthdays in public chat** to keep tracking age without announcing it.
- The active GM posts birthdays for world actors when the calendar moves forward, including dates crossed during a time skip. On world load, the module checks the current day.
- Existing birthday messages prevent repeat announcements for the same actor and year. Deleting those messages removes that record. Moving the clock backward does not post announcements.
- Birthdates use the active calendar at the time they were saved. When a leap day is missing in a later year, its anniversary falls on the last available day of its month. If the entire month is absent, that year's announcement is skipped and the age is unavailable for that year.

[Simple Timekeeping documentation](https://wiki.theripper93.com/premium/simple-timekeeping)
