import express from "express";

const app = express();
const port = 8080;

app.get("/", () => {
  console.log("Hello World");
});

app.listen(port, () => {
  console.log(`Website đang chạy trên cổng ${port}`);
});
