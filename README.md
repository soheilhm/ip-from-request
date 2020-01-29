# ip-from-request

A simple and powerful Ip location resolution library.

## Installation
```sh
npm install ip-from-request --save
```

## Usage
```js
// HAPI JS example
const Hapi = require('@hapi/hapi');
const getRequestIp = require('ip-from-request');

const init = async () => {
    const server = Hapi.server({ ... });

    server.route({
        method: 'GET',
        path: '/',
        handler: (request, h) => {
            const clientIp = getRequestIp(req); // e.g. 127.0.0.1
            // ...
        }
    });
    await server.start();
};

init();
```

## The logic

The user ip is determined by the following order:

- X-Client-IP
- X-Forwarded-For (Header may return multiple IP addresses in the format: "client IP, proxy 1 IP, proxy 2 IP", so we take the the first one.)
- CF-Connecting-IP (Cloudflare)
- Fastly-Client-Ip (Fastly CDN and Firebase hosting header when forwared to a cloud function)
- True-Client-Ip (Akamai and Cloudflare)
- X-Real-IP (Nginx proxy/FastCGI)
- X-Cluster-Client-IP (Rackspace LB, Riverbed Stingray)
- X-Forwarded, Forwarded-For and Forwarded (Variations of #2)
- req.connection.remoteAddress
- req.socket.remoteAddress
- req.connection.socket.remoteAddress
- req.info.remoteAddress