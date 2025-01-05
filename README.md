# YouTube Embed Fixes

This repository contains two userscripts to fix issues of YouTube embed videos.

You can choose between two scripts depending on what you prefer:

1. **`youtube-embed-fixes.user.js`**
2. **`youtube-embed-fixes.simple.user.js`**

---

## Features

### `youtube-embed-fixes.user.js`
This script include all the provided fixes for embedded YouTube videos:
- **Membership Video Playback**: Fixes the issue where membership-only videos fail to play in embeds.
- **Thumbnails and Titles**: Ensures that embedded videos display accurate thumbnails and titles.
- **Resume Playback**: Allows videos to continue playback from where they left off, similar to the behavior on the YouTube website.
  
> **Note**: This script uses the `GM_xmlhttpRequest` userscript API to fetch additional data, which some users might prefer to avoid due to potential privacy concerns.

---

### `youtube-embed-fixes.simple.user.js`
A stripped-down version of the script, focusing solely on:
- **Membership Video Playback**: Resolves the issue where membership-only videos do not play in embedded players.

This script does not include thumbnail/title enhancements or playback resumption since it does not use `GM_xmlhttpRequest`.

---

## Installation

To use one of these scripts:

1. **Install a User Script Manager**  
   You'll need a user script manager to run these scripts in your browser. Popular options include:
   - [Tampermonkey](https://www.tampermonkey.net/)
   - [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
   - [Violentmonkey](https://violentmonkey.github.io/)

2. **Install the Script**  
   Choose the script that best fits your needs:
   - [Download `youtube-embed-fixes.user.js`](./youtube-embed-fixes.user.js)  
   - [Download `youtube-embed-fixes.simple.user.js`](./youtube-embed-fixes.simple.user.js)

   And then click the "Raw" button to install the script.
---

## Known Issues

Sometimes, the embedded player may still show an error message even after applying the fix. This is usually due to failing the race condition between the script and the YouTube player. Two ways to mitigate this issue are:

1. **Refresh the Page**: Hard refresh the page (Ctrl + F5) to reload the page.
2. **Change Userscript settings**: 
    - Tampermonkey:
        - For Tampermonkey, Go to settings > "General" section, set Config mode to "Advanced". 
        - Then go to the "Security" section, set Content Script API to "Userscripts API Dynamic".
        - Save the settings and reload the page.
