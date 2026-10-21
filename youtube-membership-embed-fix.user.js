// ==UserScript==
// @name         YouTube Membership Embed Fix
// @namespace    Nep
// @version      0.2
// @updateURL    https://raw.githubusercontent.com/Neppu-Nep/YouTube-Embed-Fixes/main/youtube-membership-embed-fix.user.js
// @downloadURL  https://raw.githubusercontent.com/Neppu-Nep/YouTube-Embed-Fixes/main/youtube-membership-embed-fix.user.js
// @description  Fixes membership embeds and restores their native preview from YouTube metadata.
// @author       Nep
// @match        https://www.youtube.com/embed/*
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(() => {
    'use strict';

    // Intercept the initial settings before the player reads them.
    function whenDefined(object, key, callback) {
        if (object == null) return;
        if (object[key] !== undefined) return callback(object[key]);

        const descriptor = Object.getOwnPropertyDescriptor(object, key);
        if (!descriptor || (descriptor.configurable && !descriptor.get && !descriptor.set)) {
            try {
                Object.defineProperty(object, key, {
                    configurable: true,
                    enumerable: descriptor?.enumerable ?? true,
                    get: () => undefined,
                    set(value) {
                        if (value === undefined) return;
                        Object.defineProperty(object, key, {
                            value,
                            writable: descriptor?.writable ?? true,
                            configurable: true,
                            enumerable: descriptor?.enumerable ?? true,
                        });
                        callback(value);
                    },
                });
                return;
            } catch { /* Fall back if the page prevents installing a hook. */ }
        }

        let attempts = 0;
        const timer = setInterval(() => {
            const value = object[key];
            if (value !== undefined || ++attempts >= 500) {
                clearInterval(timer);
                if (value !== undefined) callback(value);
            }
        }, 10);
    }

    // Extract JSON without executing the watch page's scripts.
    function readJSON(html, name) {
        const marker = `var ${name} = `;
        const offset = html.indexOf(marker);
        if (offset < 0) throw new Error(`${name} missing`);
        const start = html.indexOf('{', offset + marker.length);
        let depth = 0, quoted = false, escaped = false;
        for (let i = start; i < html.length; i++) {
            const char = html[i];
            if (quoted) {
                if (escaped) escaped = false;
                else if (char === '\\') escaped = true;
                else if (char === '"') quoted = false;
            } else if (char === '"') quoted = true;
            else if (char === '{') depth++;
            else if (char === '}' && --depth === 0) return JSON.parse(html.slice(start, i + 1));
        }
        throw new Error(`${name} incomplete`);
    }

    function findOwner(value) {
        if (!value || typeof value !== 'object') return;
        if (value.videoOwnerRenderer) return value.videoOwnerRenderer;
        for (const child of Object.values(value)) {
            const owner = findOwner(child);
            if (owner) return owner;
        }
    }

    async function restorePreview(vars, response) {
        try {
            const watchUrl = `https://www.youtube.com/watch?v=${vars.video_id}`;
            const result = await fetch(watchUrl, { credentials: 'omit', signal: AbortSignal.timeout(5000) });
            if (!result.ok) throw new Error(`Metadata request returned ${result.status}`);
            const html = await result.text();
            const details = readJSON(html, 'ytInitialPlayerResponse').videoDetails;
            if (details?.videoId !== vars.video_id || !details.thumbnail?.thumbnails?.length) {
                throw new Error('Video metadata missing');
            }
            let owner;
            try { owner = findOwner(readJSON(html, 'ytInitialData')); } catch { /* Title and poster still work. */ }
            const channelUrl = `https://www.youtube.com/channel/${details.channelId}`;
            const link = url => ({ urlEndpoint: { url, target: 'TARGET_NEW_WINDOW' } });
            const title = { runs: [{ text: details.title, navigationEndpoint: link(watchUrl) }] };
            const channel = { runs: [{ text: details.author }] };
            const api = (path, endpoint) => ({ commandMetadata: { webCommandMetadata: { apiUrl: path } }, ...endpoint });
            const shareEntity = encodeURIComponent(btoa('\x0a' + String.fromCharCode(vars.video_id.length) + vars.video_id));
            const playlistEdit = actions => api('/youtubei/v1/browse/edit_playlist', {
                playlistEditEndpoint: { playlistId: 'WL', actions },
            });
            const addToWatchLater = playlistEdit([{ addedVideoId: vars.video_id, action: 'ACTION_ADD_VIDEO' }]);
            const share = {
                shareEntityEndpoint: { serializedShareEntity: shareEntity, sharePanelType: 'SHARE_PANEL_TYPE_UNIFIED_SHARE_PANEL' },
            };
            const button = (label, icon, endpoint) => ({ buttonRenderer: {
                style: 'STYLE_OPACITY', size: 'SIZE_DEFAULT', isDisabled: false,
                icon: { iconType: icon }, accessibilityData: { accessibilityData: { label } }, ...endpoint,
            } });
            const watchButton = { buttonViewModel: {
                onTap: { innertubeCommand: link(watchUrl) }, accessibilityText: 'Watch on YouTube',
                style: 'BUTTON_VIEW_MODEL_STYLE_OVERLAY_DARK', type: 'BUTTON_VIEW_MODEL_TYPE_TEXT',
                buttonSize: 'BUTTON_VIEW_MODEL_SIZE_LARGE', titleFormatted: { content: 'Watch on YouTube' },
            } };
            response.videoDetails = details;
            response.embedPreview = {
                thumbnailPreviewRenderer: {
                    title,
                    defaultThumbnail: details.thumbnail,
                    shareButton: button('Share', 'SHARE_ARROW', { navigationEndpoint: share }),
                    addToWatchLaterButton: button('Watch later', 'ADD_TO_WATCH_LATER', { serviceEndpoint: addToWatchLater }),
                    webPlayerActionsPorting: {
                        getSharePanelCommand: api('/youtubei/v1/share/get_web_player_share_panel', {
                            webPlayerShareEntityServiceEndpoint: { serializedShareEntity: shareEntity },
                        }),
                        addToWatchLaterCommand: addToWatchLater,
                        removeFromWatchLaterCommand: playlistEdit([{
                            removedVideoId: vars.video_id, action: 'ACTION_REMOVE_VIDEO_BY_VIDEO_ID',
                        }]),
                    },
                    actionBarButtons: [
                        button('Share', 'SHARE_ARROW', { navigationEndpoint: share }),
                        button('Watch later', 'ADD_TO_WATCH_LATER', { serviceEndpoint: addToWatchLater }),
                    ],
                    quickActionsBar: { quickActionsViewModel: { watchOnYoutubeButton: {
                        watchOnYoutubeButtonViewModel: { watchOnYtLabelButton: watchButton, ytLogoOnlyButton: watchButton },
                    } } },
                    videoDetails: {
                        embeddedPlayerOverlayVideoDetailsRenderer: {
                            channelThumbnail: owner?.thumbnail,
                            channelThumbnailEndpoint: link(channelUrl),
                            collapsedRenderer: {
                                embeddedPlayerOverlayVideoDetailsCollapsedRenderer: { title, subtitle: channel },
                            },
                            expandedRenderer: {
                                embeddedPlayerOverlayVideoDetailsExpandedRenderer: {
                                    title: channel, subtitle: owner?.subscriberCountText,
                                },
                            },
                        },
                    },
                },
            };
            vars.embedded_player_response = JSON.stringify(response);
            vars.title = details.title;
            vars.author = details.author;
            return true;
        } catch (error) {
            console.warn('[YouTube Membership Embed Fix] Preview metadata unavailable:', error.message);
            return false;
        }
    }

    function preparePreview(vars, response) {
        const ready = restorePreview(vars, response);
        let deferred = false;
        whenDefined(unsafeWindow, 'writeEmbed', original => {
            const descriptor = Object.getOwnPropertyDescriptor(unsafeWindow, 'writeEmbed');
            if (typeof original !== 'function' || !descriptor?.writable ||
                unsafeWindow.document.getElementById('movie_player')) return;

            // Start exactly once, after metadata settles. Keep any existing wrapper.
            let startup;
            unsafeWindow.writeEmbed = function (...args) {
                return startup ??= ready.then(() => original.apply(this, args));
            };
            deferred = true;
        });

        ready.then(success => {
            if (deferred || !success) return;
            // A protected writeEmbed (e.g. BlockTube) or a late start gets a safe
            // metadata update. Never destroy a player connected to the parent site.
            let attempts = 0;
            const timer = setInterval(() => {
                const player = unsafeWindow.document.getElementById('movie_player');
                if (typeof player?.updateVideoData === 'function' && typeof player.getPlayerState === 'function') {
                    clearInterval(timer);
                    if ([-1, 5].includes(player.getPlayerState())) {
                        player.updateVideoData({ ...vars, raw_embedded_player_response: response });
                    }
                } else if (++attempts >= 100) clearInterval(timer);
            }, 50);
        });
    }

    whenDefined(unsafeWindow, 'ytcfg', config => {
        whenDefined(config, 'data_', data => {
            whenDefined(data, 'PLAYER_VARS', vars => {
                whenDefined(vars, 'embedded_player_response', raw => {
                    let response;
                    try { response = JSON.parse(raw); } catch { return; }
                    const preview = response?.previewPlayabilityStatus;
                    if (preview?.status !== 'UNPLAYABLE' || preview.playableInEmbed !== true) return;

                    // Fix only the preview gate; YouTube still checks actual playback access.
                    preview.status = 'OK';
                    delete preview.reason;
                    delete preview.errorScreen;

                    vars.embedded_player_response = JSON.stringify(response);
                    if (!response.embedPreview && /^[\w-]{11}$/.test(vars.video_id)) {
                        preparePreview(vars, response);
                    }
                });
            });
        });
    });
})();
