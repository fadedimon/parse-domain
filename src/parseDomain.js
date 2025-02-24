"use strict";

const icannTrie = require("../lists/icann.complete");
const privateTrie = require("../lists/private.complete");
const normalize = require("./normalize.js");
const lookUp = require("./tries/lookUp");

// eslint-disable-next-line
const urlParts = /^(:?\/\/|https?:\/\/)?([^/]*@)?(.+?)(:\d{2,5})?([/?].*)?$/; // 1 = protocol, 2 = auth, 3 = domain, 4 = port, 5 = path
const dot = /\./g;
const emptyArr = [];

function matchTld(domain, options) {
    // for potentially unrecognized tlds, try matching against custom tlds
    if (options.customTlds) {
        // try matching against a built regexp of custom tlds
        const tld = domain.match(options.customTlds);

        if (tld !== null) {
            return tld[0];
        }
    }

    const tries = (options.privateTlds ? [privateTrie] : emptyArr).concat(icannTrie);

    for (const trie of tries) {
        const tld = lookUp(trie, domain);

        if (tld !== null) {
            return "." + tld;
        }
    }

    return null;
}

/* eslint-disable jsdoc/no-undefined-types */
/**
 * Removes all unnecessary parts of the domain (e.g. protocol, auth, port, path, query)
 * and parses the remaining domain. The returned object contains the properties 'subdomain', 'domain' and 'tld'.
 *
 * Since the top-level domain is handled differently by every country, this function only
 * supports all tlds listed in src/build/tld.txt.
 *
 * If the given url is not valid or isn't supported by the tld.txt, this function returns null.
 *
 * @param {string} url
 * @param {Object} [options]
 * @param {Array<string>|RegExp} [options.customTlds]
 * @param {boolean} [options.privateTlds]
 * @returns {Object|null}
 */
function parseDomain(url, options) {
    const normalizedUrl = normalize.url(url);
    let tld = null;
    let urlSplit;
    let domain;

    if (!normalizedUrl) {
        return null;
    }

    const normalizedOptions = normalize.options(options);

    urlSplit = normalizedUrl.match(urlParts);

    // urlSplit is null if the url contains certain characters like '\n', '\r'.
    if (urlSplit === null) {
        return null;
    }

    domain = urlSplit[3]; // domain will now be something like sub.domain.example.com
    tld = matchTld(domain, normalizedOptions);

    if (tld === null) {
        return null;
    }

    // remove tld and split by dot
    urlSplit = domain.slice(0, -tld.length).split(dot);

    if (tld.charAt(0) === ".") {
        // removes the remaining dot, if present (added to handle localhost)
        tld = tld.slice(1);
    }

    domain = urlSplit.pop();

    const subdomain = urlSplit.join(".");

    return {
        tld,
        domain,
        subdomain,
    };
}

module.exports = parseDomain;
