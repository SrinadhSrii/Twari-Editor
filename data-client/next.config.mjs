const allowedOrigins = {
development: ["http://localhost:1337"],
production: ["https://673b686ea8b85674a05f21e1.webflow-ext.com"],
test: ["http://localhost:1337"],
};

const nextConfig = {
async headers() {
    return [
    {
        source: "/api/:path*",
        headers: [
        { key: "Access-Control-Allow-Credentials", value: "true" },
        {
            key: "Access-Control-Allow-Origin",
            value: "http://localhost:1337",
        },
        {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
        },
        {
            key: "Access-Control-Allow-Headers",
            value:
            "X-CSRF-Token, X-Requested-With, Authorization, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
        },
        ],
    },
    ];
},

async rewrites() {
    return [
    {
        source: "/api/:path*",
        destination: "/api/:path*",
        has: [
        {
            type: "header",
            key: "Origin",
            value: "(?<origin>.*)",
        },
        ],
    },
    ];
},
};

export default nextConfig;

