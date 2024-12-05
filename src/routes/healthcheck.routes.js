import { Router } from "express";
import { healthcheck } from "../controllers/healthcheck.controllers.js";

const healthCheckRouter = Router();

healthCheckRouter.route("/").get(healthcheck);

export default healthCheckRouter;
