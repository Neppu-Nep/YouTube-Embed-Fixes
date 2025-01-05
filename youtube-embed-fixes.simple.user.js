// ==UserScript==
// @name         Simple YouTube Embed Fixes
// @version      0.1
// @description  Fixes several issues for YouTube embed (simplified version)
// @author       Nep
// @connect      www.youtube.com
// @match        https://www.youtube.com/embed/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    Object.defineProperty(unsafeWindow, 'writeEmbed', {
        get: () => unsafeWindow.writeEmbed_,
        set: originalWriteEmbed => {
            unsafeWindow.writeEmbed_ = () => {
                const playerVars = JSON.parse(unsafeWindow.ytcfg.data_.PLAYER_VARS.embedded_player_response);
                unsafeWindow.ytcfg.data_.PLAYER_VARS.embedded_player_response =
                unsafeWindow.ytcfg.data_.PLAYER_VARS.player_response = JSON.stringify({
                    ...playerVars,
                    previewPlayabilityStatus: { status: "OK" },
                });
                originalWriteEmbed();
            }
        }
    });
})();
