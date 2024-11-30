import http from "k6/http";

export const options = {
  // A number specifying the number of VUs to run concurrently.
  vus: 1,
  // A string specifying the total duration of the test run.
  duration: "30s",
};

const admin = {
  username: "admin",
  password: "abc123",
  email: "admin@356.com",
};

const baseUrl = "http://localhost";
const binFile = open("ms3.mp4", "b");

export function setup() {
  const secret = "somerandomstring";

  http.post(`${baseUrl}/api/adduser`, admin);

  http.post(`${baseUrl}/api/verify?email=${admin.email}&key=${secret}`);

  http.post(`${baseUrl}/api/login`, {
    username: admin.username,
    password: admin.password,
  });

  const vuJar = http.cookieJar();
  const cookiesForURL = vuJar.cookiesForURL(baseUrl);
  return cookiesForURL;
}

export default function (cookiesForURL) {
  const payload = {
    id: "1732336605494",
    value: true,
  };
  const params = {
    headers: {
      "Content-Type": "application/json",
    },
    cookies: cookiesForURL,
  };

  const data = {
    author: "this is a standard form field",
    title: "TEST",
    description: "YEET",
    mp4File: http.file(binFile, "ms3.mp4"),
  };

  http.post(`${baseUrl}/api/upload`, data, params);
}

export function teardown(data) {
  // 4. teardown code
}
