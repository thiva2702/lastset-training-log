LASTSET PWA v0.13.0 — PROFILE CLARITY + EQUIPMENT EXPANSION

This release builds on the v0.12.9 trust and data integrity foundation. The Purple + Green interface, on device Smart Log, Calendar artwork, Saved Workouts and protected workout history remain in place.

PROFILE AND USER CHANGES

1. User identity is separate from Display Name.
   Each stored user keeps a stable user identity label.
   Editing Display Name only changes that user's greeting and Smart Log name.
   Changing Display Name does not switch users, rename another user or move workout history.
   Profile now shows the Current User clearly with a Switch User action.

2. Profile navigation.
   The user icon at the top right now opens Profile directly.

3. Optional gender.
   Profile includes Male, Female and Prefer not to say.
   Gender is stored with the current user and is not used for calculations yet.

EQUIPMENT AND EXERCISE LIBRARY

4. New equipment filters.
   Exercise Library now includes EZ Bar, Kettlebell, Resistance Band and Smith Machine alongside the existing Barbell, Dumbbell, Cable, Machine and Bodyweight options.

5. EZ Bar exercises.
   EZ Bar Biceps Curl.
   EZ Bar Preacher Curl.
   EZ Bar Reverse Curl.
   EZ Bar Skull Crusher.

6. Kettlebell exercises.
   Kettlebell Goblet Squat, Swing, Deadlift, Romanian Deadlift, Shoulder Press, Row, Floor Press, Reverse Lunge, Clean and Snatch.

7. Resistance Band exercises.
   Resistance Band Squat, Push Up, Row, Chest Press, Shoulder Press, Biceps Curl, Triceps Extension, Lateral Raise, Face Pull, Pull Apart and Good Morning.
   Band Assisted Pull Up is tracked as assisted work, so lower assistance represents progression when an assistance rating is recorded.
   Band exercises can be logged without a known kg rating; band colour or tension can be noted instead.

8. Smith Machine exercises.
   Smith Machine Squat, Bench Press, Incline Bench Press, Shoulder Press, Romanian Deadlift, Hip Thrust and Calf Raise.

9. Progress separation.
   Equipment variants are stored as distinct exercises so an EZ Bar Curl does not overwrite Dumbbell Curl or Cable Curl progress.
   Resistance Band work has band aware Progress labels.
   Band Assisted Pull Up follows assisted progression rather than normal resisted band progression.

TRUST AND DATA FOUNDATION RETAINED FROM v0.12.9

10. Fresh start integrity.
    The old seeded Chest Press demo session is removed from fresh and reset data.
    Existing stored data is only cleaned when it exactly matches the legacy demo signature and creation date pattern.

11. Previous workout behaviour.
    Using a previous workout creates a plan containing the exercise structure.
    Previous weights, reps and sets are not recorded as completed work for today.

12. Separate users.
    Existing users can be stored and switched without mixing workout history.
    Starting a new user starts with a clean profile and clean training history.
    The current user can be kept for later or permanently deleted after a separate confirmation.

13. Saved Workout date safety.
    Starting a Saved Workout from Profile targets the real current day.
    Starting one while working from a Calendar day targets that selected date.

14. Progress accuracy.
    External load exercises use highest load and reps.
    Assisted exercises treat less assistance as progression.
    Bodyweight exercises show reps or added external load.
    Timed exercises show duration in seconds.
    Session counts are based on distinct training dates.

15. Smart Log duplicate protection.
    If Smart Log identifies an exercise already logged in the current resistance session, the new sets are merged into that exercise instead of creating a duplicate exercise row.

16. Backup and storage controls.
    Profile includes Import Backup for LastSet JSON exports.
    Import replaces only the active user's data after confirmation.
    Profile shows a device storage health indicator.

17. Input validation.
    Resistance and cardio values receive sanity checks before saving so impossible or accidental values are less likely to pollute progress history.

18. Regression testing.
    Automated GitHub Actions checks run syntax tests, build input checks and integrity smoke tests.
    v0.13.0 adds tests for stable user identity, Display Name separation, profile navigation, optional gender, expanded equipment categories and exercise coverage.

CORE REGRESSION CASES

A fresh user must have zero workout sessions.
Changing Display Name must not rename the stored user identity.
The top right user icon must open Profile.
A new user must not inherit another user's height, body weight, Saved Workouts or history.
Switching back to a stored user must restore that user's own data.
Using a previous workout must not create completed sets.
Starting a Saved Workout from Profile must target today.
Assisted progress must prefer lower assistance.
Band Assisted Pull Up must be treated as assisted progression.
Bodyweight progress must show reps or added load rather than 0 kg.
Timed progress must show seconds.
Smart Log must merge repeated exercise sets into the same exercise for the day.
10 km/h must never become 10 km.
2 km remains distance.
Push Ups save reps without requiring weight.
Plank saves seconds.
Assisted Pull Up remains assisted.
Assisted Dip remains assisted.

DEPLOYMENT

Production repository: thiva2702/lastset-training-log
Production branch: main
Primary hosting target: Cloudflare
Framework preset: None
Build command: bash build-cloudflare.sh
Build output directory: dist

Cloudflare is connected directly to GitHub so pushes to main deploy automatically. The service worker cache for this release is v0.13.0.
