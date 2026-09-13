# LastSet V1 Beta

Product release label: **LastSet V1 Beta**  
Semantic version: **1.0.0-beta.1**  
Technical build baseline: **0.13.2**

## Beta purpose

This release is the first controlled real-user beta of LastSet. The objective is to validate trustworthy workout logging, navigation, user separation, Smart Log behaviour, Saved Workouts, Calendar use, Progress, backup and real mobile usability during actual training sessions.

## V1 Beta scope

Included in the beta:

- Calendar, Today, Progress and Profile navigation
- Resistance and cardio logging
- Smart Log local parser
- Bodyweight, weighted bodyweight, assisted and timed exercise handling
- EZ Bar, Kettlebell, Resistance Band and Smith Machine equipment support
- Saved Workouts and previous-workout planning
- Multiple local users with isolated training data
- Backup export and import
- Machine Scan Beta
- Production Playwright regression tests in mobile Chromium and WebKit

## Release gate

The production build reached **20/20 passing browser regression tests** across mobile Chromium and mobile WebKit before V1 Beta finalization. Integrity tests and production packaging also passed.

## Known beta limitations

- Training data is stored locally in the browser or installed PWA. There is no cloud account sync yet.
- Clearing browser or site storage can remove local data unless a backup has been exported.
- Machine Scan remains a limited beta and should not be treated as universal machine recognition.
- Physical iPhone Safari and installed-PWA behaviour can still expose device-specific issues that automated WebKit testing may not reproduce.
- Advanced Home gamification, animated character progression, progress photo comparison, cloud sync and advanced AI coaching are outside V1 Beta scope and are reserved for later expansion.

## Tester rules

- Use the app normally during real workouts.
- Export a backup periodically during the beta.
- Do not intentionally clear browser/site data unless testing recovery behaviour.
- When reporting a bug, include a screenshot where possible plus the exact taps or text entered, what you expected, and what actually happened.
- Prioritise data-trust issues: wrong date, wrong values, missing workout, duplicate workout, wrong user, or incorrect Progress.

## Beta change policy

V1 Beta is feature-frozen. During beta, only blocker defects, data-integrity issues and important usability faults should change the build. New feature ideas should be logged for later releases instead of being added immediately.
