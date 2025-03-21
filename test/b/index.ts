import { Shweet, ps } from "../../src";

const {
  c: cx,
  shweet,
  kf: kx,
  at: ax,
  save,
} = new Shweet({
  __filename,
  prefix: "z",
  exportMap: true,
});

export default shweet;

save({
  mapDir: __dirname,
});
