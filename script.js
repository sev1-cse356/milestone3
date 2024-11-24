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
 
}

const baseUrl = "http://localhost"
// const binFile = open("ms3.mp4", "b");

export function setup() {

  const secret =  "somerandomstring"
  
  http.post(`${baseUrl}/api/adduser`, admin);

  http.post(`${baseUrl}/api/verify?email=${admin.email}&key=${secret}`);

  http.post(`${baseUrl}/api/login`, {
    "username": admin.username,
    "password": admin.password
  });

  console.log(http.cookieJar())

}

export default function () {

  http.post(`${baseUrl}/api/like`, {
    id: "1732336605494",
    value: true,
  });

}

export function teardown(data) {
  // 4. teardown code
}