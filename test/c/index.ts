import { Shweet, supports, ps, med, Var } from "../../src";
import BB from "../b";

const { c, d, kf, font, save } = new Shweet({
  __filename,
  Shweet: [BB],
  name: "i",
});

d.body = [
  {
    background: "gray",
    animation: "bounce 2s infinite",
    color: "red",
  },
  supports("selector(:has(*))")({
    grid: med(2, { lg: 3 }),
    color: "red",
  }),
  ps.withClass(".go")({
    height: 1,
  }),
];

kf.bounce = {
  "0%": {
    color: "indigo",
  },
  to: {
    color: "yellow",
  },
};

c.xx = [
  {
    fontFamily: "arial",
    color: "red",
    transition: "all 1s ease-in-out",
  },
  ps.child(".lol")(
    {
      color: "indigo",
    },
    Var({ vv: 123 }),
  ),
  ps.before()({
    color: "grey",
  }),
];

const v2 = Var({ V2: 5 });

c["n1"] = [
  v2,
  {
    top: 0,
    color: () => "red",
    animationName: med(["k", "1s", "infinite"], {
      sm: ["bouncer", "1s", "infinite"],
    }),

    transition: "all 0.25s",
    animation: med(
      [
        ["pop", "1s", "infinite"],
        ["okay", "1s", "infinite"],
      ],
      {},
    ),
  },
  ps.withClass(".kks")({
    bottom: 10,
  }),
  ps.attr({ level: "C2" })({
    color: "orange",
  }),
];

c.okay = {
  color: "okay",
};

c.lol = [
  //
  {
    color: "red-orange",
    padding: 2,
    fontSize: med(1, { xl: 3, dark: 2 }),
  },
  ps.general(".kkgolarge")(
    //
    {
      background: "orange",
    },
  ),
  supports({ display: "grid" })({
    grid: med(2, { lg: 3 }),
  }),
  supports("selector(:has(*))")({
    display: "flex",
    grid: 0,
  }),
];

c.hello = [
  {
    color: "red",
    padding: 1,
  },
  ps.child(".nice")({
    background: "purple",
  }),
  ps.desc(".hellos")({
    background: "orange",
  }),
  ps.next(".kk")({
    fontSize: 2,
  }),
  ps.withClass(".naks")({
    clear: 123,
  }),
];

save({
  dir: __dirname,
  mapDir: __dirname,
  mapName: "css",
  minify: false,
});
