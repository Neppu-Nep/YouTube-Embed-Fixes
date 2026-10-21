// ==UserScript==
// @name         YouTube Embed Audio Isolation
// @namespace    Nep
// @version      0.1
// @updateURL    https://raw.githubusercontent.com/Neppu-Nep/YouTube-Embed-Fixes/main/youtube-embed-audio-fix.user.js
// @downloadURL  https://raw.githubusercontent.com/Neppu-Nep/YouTube-Embed-Fixes/main/youtube-embed-audio-fix.user.js
// @description  Keep other embeds playing when the first audible YouTube frame is removed.
// @author       Nep
// @match        https://www.youtube.com/embed/*
// @match        https://www.youtube-nocookie.com/embed/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
    'use strict';
    if (window.top === window.self || typeof AudioContext !== 'function') return;

    let context;
    const routed = new WeakSet();
    const pending = new WeakSet();
    const failed = new WeakSet();

    async function route(video) {
        if (!(video instanceof HTMLVideoElement) || routed.has(video) ||
            pending.has(video) || failed.has(video) || !video.isConnected) return;
        pending.add(video);
        try {
            context ||= new AudioContext();
            // Keep native audio until Web Audio is allowed to run. A suspended
            // context must never capture the element and leave it silent.
            if (context.state === 'suspended') await context.resume();
            if (context.state !== 'running' || !video.isConnected || video.paused) return;
            const source = context.createMediaElementSource(video);
            source.connect(context.destination);
            routed.add(video);
        } catch (error) {
            failed.add(video);
            console.warn('[Embed Audio Isolation] Could not route video:', error);
        } finally {
            pending.delete(video);
        }
    }

    // The normal media-element mixer can share an output owned by the first
    // cross-site frame. Web Audio gives this document its own output lifetime.
    document.addEventListener('play', event => route(event.target), true);
    function routePlaying() {
        for (const video of document.querySelectorAll('video')) {
            if (!video.paused) route(video);
        }
        if (context?.state === 'suspended') context.resume().catch(() => {});
    }
    document.addEventListener('pointerdown', routePlaying, true);
    document.addEventListener('keydown', routePlaying, true);
    routePlaying();
})();
