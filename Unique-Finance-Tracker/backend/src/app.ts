import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import path from "path";

app.use("/api", router);

// Serve frontend static files
const frontendDist = path.resolve(__dirname, "../../frontend/dist/public");
app.use(express.static(frontendDist));

// Route all non-API requests to the frontend index.html
app.use((req, res, next) => {
  if (req.method === "GET") {
    res.sendFile(path.resolve(frontendDist, "index.html"));
  } else {
    next();
  }
});

export default app;
