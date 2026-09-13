LASTSET PWA v0.12.9 — TRUST + DATA INTEGRITY

This release protects the accuracy of training history before further feature expansion. The Purple + Green interface, on device Smart Log, assisted and bodyweight handling, Calendar artwork and Saved Workouts remain in place.

TRUST AND DATA CHANGES

1. Fresh start integrity.
   The old seeded Chest Press demo session is removed from fresh and reset data.
   Existing stored data is only cleaned when it exactly matches the legacy demo signature and creation date pattern.

2. Previous workout behaviour.
   Using a previous workout creates a plan containing the exercise structure.
   Previous weights, reps and sets are not recorded as completed work for today.

3. Separate users.
   Profile includes user data management.
   Existing users can be stored and switched without mixing workout history.
   Starting a new user starts with a clean profile and clean training history.
   The current user can be kept for later or permanently deleted after a separate confirmation.
   Resetting the current user's training data preserves that user's profile values while clearing sessions, plans and Saved Workouts.

4. Saved Workout date safety.
   Starting a Saved Workout from Profile targets the real current day.
   Starting one while working from a Calendar day targets that selected date and the button states the date clearly.

5. Progress accuracy.
   External load exercises use highest load and reps.
   Assisted exercises treat less assistance as progression.
   Bodyweight exercises show reps or added external load.
   Timed exercises show duration in seconds.
   Session counts are based on distinct training dates.

6. Smart Log duplicate protection.
   If Smart Log identifies an exercise already logged in the current resistance session, the new sets are merged into that exercise instead of creating a duplicate exercise row.

7. Backup and storage controls.
   Profile includes Import Backup for LastSet JSON exports.
   Import replaces only the active user's data after confirmation.
   Profile shows a device storage health indicator.

8. Input validation.
   Resistance and cardio values receive sanity checks before saving so impossible or accidental values are less likely to pollute progress history.

9. Clearer feature language.
   Saved Training Day language is normalized to Saved Workouts.
   Machine Scan is explicitly labelled Machine Scan Beta because reliable general machine recognition is not yet enabled.

10. Regression testing.
    Automated GitHub Actions checks now run syntax tests, build input checks and integrity smoke tests.
    Tests cover legacy demo removal, user data initialization, Saved Workout date targeting, load type specific Progress, backup validation and numeric range validation.

VISUAL AND TRAINING FEATURES RETAINED

Purple is the main atmospheric and structural colour.
Lime green is the primary action and progress colour.
The Home hero uses the approved user portrait artwork.
The Calendar uses its compact workout hero and improved date contrast.
The Home screen rotates through ten short motivational mottos.
Pull Up and Dip support Bodyweight, Assisted and Weighted modes.
Assisted Pull Up and Assisted Dip remain distinct assisted movements.
Plank uses timed holds.
Treadmill incline percentages are retained by Smart Log.
Cardio unit precedence prevents speed values from becoming phantom distance values.

CORE REGRESSION CASES

A fresh user must have zero workout sessions.
A new user must not inherit another user's height, body weight, Saved Workouts or history.
Switching back to a stored user must restore that user's own data.
Using a previous workout must not create completed sets.
Starting a Saved Workout from Profile must target today.
Starting a Saved Workout from an old Calendar date must target that selected date.
Assisted progress must prefer lower assistance.
Bodyweight progress must show reps or added load rather than 0 kg.
Timed progress must show seconds.
Smart Log must merge repeated exercise sets into the same exercise for the day.
10 km/h must never become 10 km.
2 km remains distance.
Push Ups save reps without requiring weight.
Plank saves seconds.
Assisted Pull Up remains assisted.
Assisted Dip remains assisted.
“struggled after rep 6” remains an effort note and does not reduce completed reps.

DEPLOYMENT

Production repository: thiva2702/lastset-training-log
Production branch: main
Primary hosting target: Cloudflare
Framework preset: None
Build command: bash build-cloudflare.sh
Build output directory: dist

Cloudflare is connected directly to GitHub so pushes to main deploy automatically. The service worker cache for this release is v0.12.9.
