# Privacy

Glasses carry sensors into every room the wearer enters. The people nearby did not install the app.

| Rule | Basis |
|---|---|
| Do not record audio or video of the wearer or others without their knowledge. | vendor: [Meta](https://wearables.developer.meta.com/acceptable-use-policy/) |
| Do not identify people from their face, voice or other physical traits. | vendor: [Meta](https://wearables.developer.meta.com/acceptable-use-policy/) |
| Do not hide, bypass or work around the recording indicator. | vendor: [Meta](https://wearables.developer.meta.com/acceptable-use-policy/) |
| Do not encourage recording in sensitive places. | vendor: [Meta](https://wearables.developer.meta.com/acceptable-use-policy/) |
| Start capture only from an action the wearer takes. Show that capture is on for as long as it is on. | derived: [Meta](https://wearables.developer.meta.com/acceptable-use-policy/), [EDPB](https://www.edpb.europa.eu/news/edpb-publishes-statement-on-the-data-protection-challenges-of-smart-glasses_en) |
| Ask for motion, orientation or location permission only inside a user action, not on load. | vendor: [Meta](https://raw.githubusercontent.com/meta/meta-wearables-webapp/main/AGENTS.md) |
| Say what data you collect, why, and how it is stored. | vendor: [Google](https://developer.android.com/design/ui/ai-glasses/guides/foundations/design-principles) |
| Do not show demo values as live data. | vendor: [Meta](https://raw.githubusercontent.com/meta/meta-wearables-webapp/main/AGENTS.md) |
| Do not ship secrets or API keys in the app bundle. | vendor: [Meta](https://raw.githubusercontent.com/meta/meta-wearables-webapp/main/AGENTS.md) |

## Notes

- Meta's Acceptable Use Policy applies to every integration, published or not. It allows exceptions to the identification rule for some uses, accessibility among them, with Meta's approval in advance.
- The European Data Protection Board said in October 2026 that app providers carry their own data protection duties and cannot pass them to the wearer. An app that processes audio or video of other people, such as captions or translation, should expect to be treated as a controller in the EU.
- Recording law differs by country and by state. Some places require the consent of everyone in a conversation. The app cannot know which rule applies, so do not record by default.

## Safety

| Rule | Basis |
|---|---|
| Do not show sudden visuals that could block the view at a critical moment. | vendor: [Google](https://developer.android.com/design/ui/ai-glasses/guides/foundations/design-principles) |
| Do not expect the wearer to read long text while walking. | vendor: [Google](https://developer.android.com/design/ui/ai-glasses/guides/foundations/design-principles) |
| Keep audio low enough that the surroundings can be heard. | vendor: [Google](https://developer.android.com/design/ui/ai-glasses/guides/foundations/design-principles) |

## Before release

- [ ] The app works with every permission denied.
- [ ] Nothing is captured before the wearer starts it.
- [ ] Capture stops when the wearer leaves the screen.
- [ ] No feature recognizes or looks up a person.
- [ ] The data the app sends off the device is listed somewhere the wearer can read.
- [ ] No key or token is in the shipped files.
