# Nassau Golf — App Store Submission Checklist

## App Store Connect Setup
- [ ] Create app in App Store Connect (appstoreconnect.apple.com)
- [ ] Bundle ID: golf.nassau
- [ ] App name: Nassau Golf
- [ ] Subtitle: Run the trip.
- [ ] Category: Sports (primary), Travel (secondary)
- [ ] Privacy policy URL: nassau.golf/privacy
- [ ] Support URL: nassau.golf
- [ ] Marketing URL: nassau.golf

## App Description
Nassau is the operating system for golf trips. Plan destinations, coordinate your crew, track live scores, settle bets, and share everything through one link.

Whether you're the trip captain organizing 8 guys for Bandon Dunes or running a Saturday Nassau with your regular crew, Nassau handles the coordination so you can just play golf.

Features:
- Browse 50+ curated golf destinations
- Create trips in 3 steps: destination, crew, dates
- Live scorecards with skins and Nassau bet tracking
- Settle up via Venmo with one tap
- Share your trip with one link
- Commissioner Mode for weekly rounds (free forever)

## Screenshots Needed (6.7" iPhone - 1290x2796)
- [ ] 1. Explore page — "Where to next?" with destination cards
- [ ] 2. Trip dashboard — Captain's Command Center
- [ ] 3. Live scorecard — color-coded scores on course
- [ ] 4. Settlements — "Who owes who" with Venmo buttons
- [ ] 5. Trip share — one link, crew status
- [ ] 6. Trip creation wizard — 3-step flow

## App Icon
- [ ] 1024x1024 PNG, no transparency, no rounded corners (iOS adds them)
- [ ] Should be the Nassau logo mark on dark background (#18181B)

## Build & Submit
- [ ] Run: npm run build:native
- [ ] Open Xcode: npm run open:ios
- [ ] Set signing team in Xcode
- [ ] Set deployment target to iOS 16.0
- [ ] Archive: Product → Archive
- [ ] Upload to App Store Connect via Xcode Organizer
- [ ] Submit for review

## Common Rejection Reasons to Avoid
- Missing privacy policy (must be live URL before submission)
- Login-required app without demo account (provide test credentials)
- Broken features (test every flow on real device first)
- "Wrapper app" rejection — must demonstrate native value beyond just a website
  → Haptic feedback on scorecard, push notifications, home screen presence
