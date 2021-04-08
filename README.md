<p align="center">
  <img src="src/assets/images/quijis_128.png" width="128" height="128"/>
</p>

<h1 align="center">Quijis</h1>

*Quijis is a Chrome extension to create Jira tasks with errors log and video recording.*

## Installation
### For users
Install it through the [Chrome web store](https://chrome.google.com/webstore/detail/quijis-quick-jira-issues/ghcghfllbidkldfjkpghkeiopdikfbpp)
### For developers
1. Install all depencencies
2. Clone the **dev** branch. All PRs must be submitted to this branch
3. Run `npm install`
4. In Chrome go to `chrome://extensions/`
5. Enable **developer mode**
6. Click the **Load unpacked extension** button
7. Select the app folder

Any time you make a change go back to `chrome://extensions/` and refresh the extension

For more information on developing Chrome extensions visit [the official docs](https://developer.chrome.com/docs/extensions/mv3/getstarted/)

## Dependencies
- [Node](https://nodejs.org/en/) `v14.15`
- [NPM](https://www.npmjs.com/get-npm)

## Code style
This project follows the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript). Use `npm run lint` to run the linter

## Testing
Tests can be run with `npm run test`

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[GNU GPLv3](https://choosealicense.com/licenses/gpl-3.0/)