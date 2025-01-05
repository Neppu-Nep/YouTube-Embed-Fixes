// ==UserScript==
// @name         YouTube Embed Fixes
// @version      0.1
// @description  Fixes several issues for YouTube embed
// @author       Nep
// @connect      www.youtube.com
// @match        https://www.youtube.com/embed/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    Object.defineProperty(unsafeWindow, 'writeEmbed', {
        get: () => unsafeWindow.writeEmbed_,
        set: originalWriteEmbed => {
            unsafeWindow.writeEmbed_ = () => {
                const ytID = location.pathname.match(/embed\/(.*)/)[1];
                GM_xmlhttpRequest({
                    method: "GET",
                    url: `https://www.youtube.com/watch?v=${ytID}`,
                    onload: r => {
                        const ytData = JSON.parse(r.responseText.split("var ytInitialPlayerResponse = ")[1].split(";var meta")[0]);
                        const playerVars = JSON.parse(unsafeWindow.ytcfg.data_.PLAYER_VARS.embedded_player_response);
                        unsafeWindow.ytcfg.data_.PLAYER_VARS.embedded_player_response =
                        unsafeWindow.ytcfg.data_.PLAYER_VARS.player_response = JSON.stringify({
                            ...playerVars,
                            playerConfig: ytData.playerConfig,
                            videoDetails: ytData.videoDetails,
                            previewPlayabilityStatus: { status: ytData.playabilityStatus.status !== "ERROR" ? "OK" : "ERROR" },
                            playabilityStatus: ytData.playabilityStatus
                        });
                        originalWriteEmbed();
                    }
                });
            };
        }
    });
})();
