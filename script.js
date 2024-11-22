import http from 'k6/http';

export const options = {
  // A number specifying the number of VUs to run concurrently.
  vus: 1,
  // A string specifying the total duration of the test run.
  duration: '300s',

};

const binFile = open('ms3.mp4', 'b');

// The function that defines VU logic.
//
// See https://grafana.com/docs/k6/latest/examples/get-started-with-k6/ to learn more
// about authoring k6 scripts.
//
export default function() {
//   http.post('https://sev-1.cse356.compas.cs.stonybrook.edu/api/like', {
//     "id": "test",
//     "value": true
// });


const data = {
  author: 'this is a standard form field',
  title: "TEST",
  mp4File: http.file(binFile, 'ms3.mp4'),
};

http.post('https://doitand711gang.cse356.compas.cs.stonybrook.edu/api/upload', data);
}
