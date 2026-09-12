LASTSET PWA v0.11 — CARDIO & BODYWEIGHT

This preview build continues the free on-device Smart Log approach.

KEY CHANGES

1. Cardio parsing now uses unit precedence across activities.
   - 10 km/h is speed, never 10 km distance.
   - 2 km is distance.
   - min, km, km/h, kph, mph, %, rpm, watts, bpm, floors, calories and levels are parsed independently.
   - Running, walking, cycling, rowing, swimming, elliptical and stair climb use the same unit-safe rules.

2. Cardio follow-up flow is more useful but remains optional.
   - Running/walking asks outdoor vs treadmill when missing.
   - Treadmill then asks incline before confirmation; user can say 3%, no incline, or skip.
   - Stationary bike can optionally ask resistance level.
   - Stair machine can optionally ask machine level.

3. Typo tolerance.
   - Common replies such as threadmill/tredmill resolve to treadmill.
   - Exercise search tolerates close spelling such as dumbell/dumbbell and barbel/barbell.

4. Muscle filtering explains why exercises appear.
   - Each exercise shows Primary and Secondary muscles.
   - When filtering by a muscle, primary matches are sorted before secondary matches.

5. Bodyweight is now a first-class training type.
   - Push Up, Pull Up, Triceps Dip, Hanging Leg Raise and Bodyweight Squat accept reps without requiring kg.
   - Optional added load is supported.
   - Assisted Pull Up records assistance weight and treats lower assistance as progression.
   - Plank uses timed holds in seconds instead of kg x reps.
   - Bare “squat” in Smart Log asks whether it was bodyweight or weighted instead of guessing.

6. Workout assessment understands bodyweight, timed holds and assisted movements.

7. Today screen action text contrast is corrected.

REGRESSION CASES
- 10 km/h must never become 10 km.
- 2 km remains distance.
- threadmill resolves to Treadmill.
- Treadmill asks incline before confirmation unless incline was already stated.
- Cycling and running do not create phantom resistance sets.
- Push ups save reps with no weight requirement.
- Plank saves seconds.
- Assisted Pull Up accepts assistance weight.
- Bodyweight vs barbell squat is clarified when ambiguous.
- Incline, flat and decline chest press remain distinct.
- “struggled after rep 6” remains an effort note and does not reduce completed reps.

DEPLOYMENT
Commit these files to the open development branch / pull request. Do not merge to main until the Deploy Preview has been tested.
v0.11 dev preview
