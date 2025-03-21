import express from "express";
import morgan from "morgan";
import rootRouter from "./routers/rootRouter";
import userRouter from "./routers/userRouter";
import videoRouter from "./routers/videoRouter";
import apiRouter from "./routers/apiRouter";
import session from "express-session";
import flash from "express-flash";
import { localsMiddleware } from "./middlewares";
import MongoStore from "connect-mongo";

const app = express();

app.set("view engine", "pug");
app.set("views", process.cwd() + "/src/views");
app.use(morgan("tiny"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//session
app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    // cookie: {
    //   maxAge: 10000,
    // },
    store: MongoStore.create({ mongoUrl: process.env.DB_URL }),
  })
);

//middlewares
app.use(flash());
app.use(localsMiddleware);
app.use((req, res, next) => {
  res.header("Cross-Origin-Embedder-Policy", "require-corp");
  res.header("Cross-Origin-Opener-Policy", "same-origin");
  next();
});

//routers
app.use("/uploads", express.static("uploads"));
app.use("/static", express.static("assets"));
app.use("/videos", videoRouter);
app.use("/users", userRouter);
app.use("/", rootRouter);
app.use("/api", apiRouter);

export default app;
