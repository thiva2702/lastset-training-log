LASTSET PWA v0.12 — PURPLE + GREEN PERFORMANCE UI

This release keeps the free on device Smart Log approach and combines the latest functional fixes with the new LastSet visual direction.

KEY CHANGES

1. New visual identity.
   Purple is the main atmospheric and structural colour.
   Lime green is the primary action and progress colour.
   Dark charcoal surfaces improve contrast and reduce the flat prototype feel.
   Home, exercise selection, cards, navigation and workout actions share the same visual system.

2. Rotating motivational headline.
   The Home screen rotates through ten short mottos when the app is opened so the first screen feels fresh and motivating.

3. Exercise discovery improvements.
   Equipment filters include All, Barbell, Dumbbell, Machine, Bodyweight and Cable.
   Recent and logged today states remain visible.
   Exercise search keeps the existing typo tolerance and muscle filtering logic.

4. Bodyweight and assisted exercise handling.
   Pull Up and Dip can be logged as Bodyweight, Assisted or Weighted.
   Assisted Pull Up stays recognised as assisted and does not silently become normal bodyweight Pull Up.
   Assisted Dip is included and uses assistance weight correctly.
   Lower assistance represents progression for assisted movements.

5. Smart Log parsing updates.
   Percent incline such as 3% remains recognised as treadmill incline.
   Cardio units remain protected from phantom distance or resistance interpretation.
   Resistance Training wording is used consistently.

6. Profile additions.
   Height and body weight can be stored in Profile.
   Body weight becomes available for bodyweight exercise context while keeping exercise specific override behaviour.

7. Existing v0.11 behaviour retained.
   Cardio parsing uses unit precedence.
   Running and walking can distinguish treadmill from outdoors.
   Push ups save reps without requiring weight.
   Plank uses timed holds.
   Incline, flat and decline chest press remain distinct.
   Workout assessment understands external weight, bodyweight, assisted and timed movements.

REGRESSION CASES

10 km/h must never become 10 km.
2 km remains distance.
threadmill resolves to Treadmill.
Treadmill recognises incline stated as a percentage.
Cycling and running do not create phantom resistance sets.
Push Ups save reps with no weight requirement.
Plank saves seconds.
Assisted Pull Up remains assisted.
Assisted Dip remains assisted.
Pull Up and Dip support Bodyweight, Assisted and Weighted modes.
Bodyweight versus weighted squat remains clarified when ambiguous.
Incline, flat and decline chest press remain distinct.
“struggled after rep 6” remains an effort note and does not reduce completed reps.

DEPLOYMENT

Production repository: thiva2702/lastset-training-log
Production branch: main
Netlify project: lastset-training-log
Publish directory: .

This commit is the v0.12 production release trigger for Netlify continuous deployment.
