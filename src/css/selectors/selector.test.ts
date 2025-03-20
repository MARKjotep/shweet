import { Var, log, med, media, ps } from "../..";
import { Loader } from "..";
import { expect, test, describe } from "bun:test";
import { Cid, Base, Keyframes } from ".";
import { Proc } from "./proc";

describe("css class", () => {
  // -------------------------

  const C2 = new Cid(".", "", false, "rem");
  const cx2 = C2.css;

  cx2.world = { color: "indigo" };

  const C = new Cid(".", "", false, "em").load(C2);
  const cx = C.css;

  test("properties", () => {
    //
    expect(C.PRE).toBe(".");
    expect(C.PREFIX).toBe("");
    expect(C).toBeInstanceOf(Base);
    expect(C.PS).toBeInstanceOf(Proc);
    expect(cx).toBeInstanceOf(Cid);

    expect(C.EXPORT).toBeBoolean();
    expect(C.UNIT).toBe("em");

    expect(C.DATA.size).toBe(0);
  });

  test("classes", () => {
    cx.hello = [
      {
        color: "red",
        padding: 1,
      },
      ps.child(".nice")({
        background: "purple",
      }),
      ps.withClass(".hola")({
        background: "purple",
      }),
      ps.next(".next")({
        background: "purple",
      }),
    ];
    // -------------------------
    const hello = cx.hello as string;

    expect(C.DATA.has(hello)).toBeTrue();
    const hellomap = C.DATA.get(hello);
    expect(hellomap).toBeDefined();
    expect(hellomap?.has("color")).toBeTrue();
    expect(hellomap!.get("color")).toBeInstanceOf(media);
    expect(C.DATA.has(".hello.hola")).toBeTrue();
    expect(C.DATA.has(".hello + .next")).toBeTrue();
  });

  test("imports", () => {
    expect(C.IMPORTED).toHaveLength(1);
    expect(C.IMPORTED[0]).toBeInstanceOf(Cid);
    expect(C.IMPORTED[0].DATA.has(".world")).toBeTrue();
  });
});

describe("css keyframe", () => {
  // -------------------------
  const KF = new Keyframes();

  const kf = KF.css;

  kf.bounce = {
    from: { background: "orange" },
    to: {
      background: "purple",
    },
  };

  test("check selector", () => {
    expect(KF.DATA.has("@keyframes bounce")).toBeTrue();
  });
});
