# Actor Birthdays

## Install

In Foundry Setup, open **Add-on Modules → Install Module** and paste this manifest URL:

```text
https://raw.githubusercontent.com/sefaction/actor-birthdays/main/module.json
```

### Manual installation

1. Extract the repository ZIP, rename the extracted folder to `actor-birthdays`, and copy it into your Foundry user data's `Data/modules` directory.
2. Restart Foundry. In your world, enable Actor Birthdays and Simple Calendar under **Manage Modules**.
3. Open an actor sheet and click **Birthdate** in the header. Pick the in-world year, month, and day, then click **Save**. The header shows the actor's age and opens the same editor when clicked.

The module targets Foundry VTT 12 and later with a Simple Calendar version that works on your Foundry release and provides the Simple Calendar 2.4 API.

## How it works

- Actor owners and GMs can edit the birthdate. The module stores it on the actor and calculates age independently of any age field supplied by the game system.
- Public announcements are enabled by default for each saved birthdate. Clear **Announce birthdays in public chat** to keep tracking age without announcing it.
- The active GM posts birthdays for world actors when the calendar moves forward, including dates crossed during a time skip. On world load, the module checks the current day.
- Existing birthday messages prevent repeat announcements for the same actor and year. Deleting those messages removes that record. Moving the clock backward does not post announcements.
- Birthdates use the active calendar at the time they were saved. When a leap day is missing in a later year, its anniversary falls on the last available day of its month. If the entire month is absent, that year's announcement is skipped and the age is unavailable for that year.

[Simple Calendar documentation](https://simplecalendar.info/docs/developing-with-sc/api/namespaces/SimpleCalendar.api/)
