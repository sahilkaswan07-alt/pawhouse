/* ===== pet-schedules.js =====
   SINGLE SOURCE OF TRUTH for every pet's vaccination & deworming schedule.

   Both home.html (for the small bell on each pet's box) and every pet's
   own petbox.html page (for the big bell + table there) read from this
   ONE file. That means:
     - You only ever edit a due date / add a vaccine in ONE place.
     - The home.html bell and the petbox.html bell can never fall out of
       sync with each other again.
     - Adding a brand-new pet's reminders is just adding one new object
       below — no hidden <span> lists to hand-copy into home.html anymore.

   ───────────────────────────────────────────────────────────────────
   HOW TO ADD A NEW PET'S SCHEDULE:
   1. Copy one of the blocks below (e.g. the "bruno" block).
   2. Rename the key to the new pet's id — it MUST exactly match:
        - the id used in that pet's <script>window.PET_ID = 'id';</script>
        - the "id=" part of that pet's box link in home.html
   3. Fill in each vaccine / deworming row:
        id     -> unique string, never reused for another row on this pet
        name   -> shown in the table & reminder popup
        due    -> "YYYY-MM-DD"
        status -> "done" | "due" | "miss"  (starting state; once someone
                  taps the pill on the pet's own page, that tap is what's
                  remembered from then on — this "status" is only the
                  fallback used the very first time, before any tap)
   That's it — the bell on home.html AND on that pet's own page will pick
   it up automatically. No other file needs to change.
   ───────────────────────────────────────────────────────────────────
*/

window.PET_SCHEDULES = {

  bruno: {
    vaccination: [
      { id: 'vax-dhppi',   name: 'DHPPi (Core Vaccine)', due: '2026-07-21', status: 'done' },
      { id: 'vax-rabies',  name: 'Rabies',                due: '2026-07-21', status: 'done' },
      { id: 'vax-lepto',   name: 'Leptospirosis',         due: '2026-07-21', status: 'due'  },
      { id: 'vax-booster', name: 'Booster Dose',          due: '2026-07-21', status: 'miss' }
    ],
    deworming: [
      { id: 'dew-1st',       name: '1st Deworming',        due: '2026-07-21', status: 'done' },
      { id: 'dew-2nd',       name: '2nd Deworming',        due: '2026-07-21', status: 'done' },
      { id: 'dew-quarterly', name: 'Quarterly Deworming',  due: '2026-07-21', status: 'due'  }
    ]
  }

  /* Add the next pet right here, e.g.:
  monty: {
    vaccination: [
      { id: 'vax-dhppi', name: 'DHPPi (Core Vaccine)', due: '2026-08-10', status: 'due' }
    ],
    deworming: [
      { id: 'dew-1st', name: '1st Deworming', due: '2026-08-10', status: 'due' }
    ]
  }
  */

};