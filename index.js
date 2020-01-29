const _get = require('lodash.get');

const regexes = {
    ipv4: /^(?:(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.){3}(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])$/,
    ipv6: /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i,
};

const isValidIP = (value) => {
    return regexes.ipv4.test(value) || regexes.ipv6.test(value);
};

/**
 * Parse x-forwarded-for headers.
 *
 * @param {string} value - The value to be parsed.
 * @return {string|null} First known IP address, if any.
 */
function getClientIpFromXForwardedFor(value) {
    if (!value || typeof value !== 'string') {
        return null;
    }

    // x-forwarded-for may return multiple IP addresses in the format: "client IP, proxy 1 IP, proxy 2 IP"
    // Therefore, the right-most IP address is the IP address of the most recent proxy
    // and the left-most IP address is the IP address of the originating client.
    const forwardedIps = value.split(',').map((e) => {
        const ip = e.trim();
        if (ip.includes(':')) {
            const splitted = ip.split(':');
            // make sure we only use this if it's ipv4 (ip:port)
            if (splitted.length === 2) {
                return splitted[0];
            }
        }
        return ip;
    });

    // Sometimes IP addresses in this header can be 'unknown' (http://stackoverflow.com/a/11285650).
    // Therefore taking the left-most IP address that is not unknown
    // A Squid configuration directive can also set the value to "unknown" (http://www.squid-cache.org/Doc/config/forwarded_for/)
    return forwardedIps.find(isValidIP);
}

/**
 * Determine client IP address.
 *
 * @param req
 * @returns {string} ip - The IP address if known, defaulting to empty string if unknown.
 */
module.exports = function getClientIp(req) {
    // Server is probably behind a proxy.
    if (req.headers) {
        if (isValidIP(req.headers['x-client-ip'])) {
            return req.headers['x-client-ip'];
        }

        const xForwardedFor = getClientIpFromXForwardedFor(req.headers['x-forwarded-for']);
        if (isValidIP(xForwardedFor)) {
            return xForwardedFor;
        }

        if (isValidIP(req.headers['cf-connecting-ip'])) {
            return req.headers['cf-connecting-ip'];
        }

        if (isValidIP(req.headers['fastly-client-ip'])) {
            return req.headers['fastly-client-ip'];
        }

        if (isValidIP(req.headers['true-client-ip'])) {
            return req.headers['true-client-ip'];
        }

        if (isValidIP(req.headers['x-real-ip'])) {
            return req.headers['x-real-ip'];
        }

        if (isValidIP(req.headers['x-cluster-client-ip'])) {
            return req.headers['x-cluster-client-ip'];
        }

        if (isValidIP(req.headers['x-forwarded'])) {
            return req.headers['x-forwarded'];
        }

        if (isValidIP(req.headers['forwarded-for'])) {
            return req.headers['forwarded-for'];
        }

        if (isValidIP(req.headers.forwarded)) {
            return req.headers.forwarded;
        }
    }

    if (_get(req, 'connection', null)) {
        if (isValidIP(_get(req, 'connection.remoteAddress', ''))) {
            return req.connection.remoteAddress;
        }
        if (isValidIP(_get(req, 'connection.socket.remoteAddres', ''))) {
            return req.connection.socket.remoteAddress;
        }
    }

    if (_get(req, 'info.socket.remoteAddress', null)) {
        return req.socket.remoteAddress;
    }


    if (_get(req, 'info.remoteAddress', null)) {
        return req.info.remoteAddress;
    }

    if (_get(req, 'requestContext.identity.sourceIp', null)) {
        return req.requestContext.identity.sourceIp;
    }

    return null;
}