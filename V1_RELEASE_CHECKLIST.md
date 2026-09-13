# LastSet v1 release checklist

This checklist is the freeze gate for the current LastSet training logger. A v1 release should not add new product ideas. It should only close defects found against the checks below.

## Navigation

- Calendar -> any date -> Back returns to Calendar.
- Calendar -> today date -> Back returns to Calendar.
- Bottom Today opens Today as a top level screen with no Back button.
- Today -> Resistance Training -> Back returns to Today.
- Today -> Cardio -> Back returns to Today.
- Today -> Smart Log -> Back returns to Today.
- Today -> Machine Scan Beta -> Back returns to Today.
- Day -> Exercise Library -> Exercise -> Back returns to Exercise Library, then Back returns to the day that opened it.
- Profile icon in the top right always opens Profile.
- Bottom navigation always starts a new top level navigation path.

## User separation

- Changing Display Name does not switch users or rename the stored user identity.
- Current User is visible in Profile.
- Switch User changes to the selected stored user's own data.
- A new user starts with no workout history, Saved Workouts, height or body weight inherited from another user.
- Switching back restores that user's own history and profile values.

## Data integrity

- Fresh users have zero fake workout sessions.
- Use Previous Workout creates a plan only and does not create completed sets.
- Saved Workouts started from Profile target the real current day.
- Saved Workouts started from an older Calendar day target that selected date.
- Smart Log merges repeated exercises into the same exercise entry for the day.
- Export backup creates valid LastSet JSON.
- Import backup restores only the active user after confirmation.

## Exercise library

- All equipment filter restores the full library.
- EZ Bar, Kettlebell, Resistance Band and Smith Machine filters return relevant exercises.
- Assisted Pull Up and Assisted Dip are treated as assisted exercises.
- Band Assisted Pull Up treats less assistance as better progress.
- Push Up, Pull Up and Dip bodyweight logging works without requiring external weight.
- Plank records timed holds in seconds.

## Progress

- External resistance uses load and reps.
- Assisted work rewards lower assistance.
- Bodyweight work reports reps or added load, not 0 kg.
- Timed work reports duration.
- Session counts use distinct training dates.

## Smart Log and cardio

- Treadmill incline percentages are retained.
- Speed values such as 10 km/h do not become distance.
- Cardio requires a plausible duration or distance.
- Obviously impossible numeric values are blocked or warned.

## v1 freeze rule

Once every item above passes on the production iPhone build, v1 is feature frozen. New ideas go into the v2 backlog unless they are required to fix a defect, prevent data loss or correct misleading training data.
