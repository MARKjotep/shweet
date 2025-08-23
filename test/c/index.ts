import { Shweet, supports, ps, med, Var, log } from "../../src";
import BB from "../b";

const { c, d, i, kf, font, save } = new Shweet({
  __filename,
  shweets: [BB],
  name: "i",
});

const _dx = Var({ _dx: med("red", { dark: "orange" }) });

d[":root"] = [_dx];

d.body = [
  {
    backgroundColor: _dx,
    animation: "bounce 2s infinite",
    color: "red",
  },
  ps.withClass(".go")({
    height: 1,
  }),
];

c.f = {
  backgroundClip: "kkk",
};

// test
c.__({
  a: { color: "red" },
  b: [
    {
      color: "orange",
    },
  ],
  root: { backgroundColor: "green" },
});

// kf.bounce = {
//   "0%": {
//     color: "indigo",
//   },
//   to: {
//     color: "yellow",
//   },
// };

// c.xx = [
//   {
//     fontFamily: "arial",
//     color: "red",
//     transition: "all 1s ease-in-out",
//   },
//   ps.child(".lol")(
//     {
//       color: "indigo",
//     },
//     Var({ vv: 123 }),
//   ),
//   ps.before()({
//     color: "grey",
//   }),
// ];

// const v2 = Var({ V2: 5 });

// c.okay = {
//   color: "okay",
// };

// i.acd = {
//   color: "red",
// };

// c.lol = [
//   //
//   {
//     color: "red-orange",
//     padding: 2,
//     fontSize: med(1, { xl: 3, dark: 2 }),
//   },
//   ps.general(".kkgolarge")(
//     //
//     {
//       background: "orange",
//     },
//   ),
//   supports({ display: "grid" })({
//     grid: med(2, { lg: 3 }),
//   }),
//   supports("selector(:has(*))")({
//     display: "flex",
//     grid: 0,
//   }),
// ];

// c.hello = [
//   {
//     backgroundColor: "#81db1a",
//     padding: 1,
//   },

//   ps.child(".nice")({
//     background: "purple",
//     color: med("red", { mobile: "orange" }),
//   }),
//   ps.desc(".hellos")({
//     background: "orange",
//   }),
//   ps.next(".kk")({
//     fontSize: 2,
//   }),
//   ps.withClass(".naks")({
//     clear: 123,
//   }),
// ];

save({
  dir: __dirname,
  mapDir: __dirname,
  mapName: "css",
  minify: false,
});
