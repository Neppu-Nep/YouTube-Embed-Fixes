# YouTube Embed Fixes

Userscripts that fix playback problems in embedded YouTube videos. Install either
script, or both if you need both fixes.

| Script | What it fixes | Install |
| --- | --- | --- |
| [YouTube Membership Embed Fix](youtube-membership-embed-fix.user.js) | Membership videos failing to load in embeds. Restores the thumbnail, title, channel information and available preview controls. | [Install](https://raw.githubusercontent.com/Neppu-Nep/YouTube-Embed-Fixes/main/youtube-membership-embed-fix.user.js) |
| [YouTube Embed Audio Isolation](youtube-embed-audio-fix.user.js) | Other embeds losing sound and buffering after the first playing video is removed in affected Chromium browsers. | [Install](https://raw.githubusercontent.com/Neppu-Nep/YouTube-Embed-Fixes/main/youtube-embed-audio-fix.user.js) |

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Click **Install** beside the script you want and confirm in Tampermonkey.
3. Reload the page containing your YouTube embeds.

### Chrome and Chromium-based browsers

Enable userscripts in your browser and select Tampermonkey's early-start mode:

1. Open your browser's extensions page and select Tampermonkey's **Details**.
   In Chrome 138 or newer, enable **Allow User Scripts**. On older Chrome
   versions, enable **Developer mode** on the extensions page instead.
2. Open **Tampermonkey → Dashboard → Settings**.
3. Under **General**, set **Config mode** to **Advanced**.
4. Under **Security**, set **Content Script API** to **UserScripts API Dynamic**.
5. Save the settings and reload the page containing your embeds.

Dynamic mode lets the scripts run at the start of page loading, before YouTube
initializes its player. This is important for the membership fix.

See Tampermonkey's [userscript permission guide](https://www.tampermonkey.net/faq.php#Q209)
and [Content Script API documentation](https://www.tampermonkey.net/documentation.php?q=content_script_api).

## Usage

After setup, both scripts work automatically and can run together.

The membership fix still requires a YouTube account with access to the video.
It does not bypass membership restrictions. Available preview controls depend on
YouTube's player layout.

If another userscript already provides the same fix, disable the duplicate.

## Updates

Use Tampermonkey to check for updates. Reload pages containing embeds after
updating, enabling or disabling either script.