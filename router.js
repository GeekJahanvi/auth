module.exports = () => [
  {
    "path": "/backend/authservice/(.*)",
    "proxy": {
      "instance": "authservice:3500",
      "path": "/v1.0/invoke/authservice/method/$1"
    }
  }
];
