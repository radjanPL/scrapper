import { terser } from "rollup-plugin-terser";
import cleaner from "rollup-plugin-cleaner";
import postcss from "rollup-plugin-postcss";
import { babel } from "@rollup/plugin-babel";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import injectProcessEnv from "rollup-plugin-inject-process-env";
import commonjs from "@rollup/plugin-commonjs";
import svg from "rollup-plugin-svg";
import dev from "rollup-plugin-dev";
import htmlTemplate from "rollup-plugin-generate-html-template";
import copy from "rollup-plugin-copy";

const DIST_DIR = "public/dist";
const TEST_DIR = "public/test";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const TARGET_DIR = IS_PRODUCTION ? DIST_DIR : TEST_DIR;
const STATIC_DIR = "public/static";

const results = [
  {
    input: {
      "scrapper": "frontend/index.js",
    },
    output: {
      dir: TARGET_DIR,
      entryFileNames: "[name].js",
      format: "es",
    },
    plugins: [
      svg(),
      cleaner({
        targets: [`./${TARGET_DIR}/`],
      }),
      babel({
        extensions: [".js"],
        babelHelpers: "bundled",
      }),
      commonjs(),
      nodeResolve(),
      postcss({
        plugins: [],
      }),
      injectProcessEnv({
        NODE_ENV: process.env.NODE_ENV,
        BASE_URI: IS_PRODUCTION ? "" : "__PROXY__",
      }),
      ...(process.env.NODE_ENV === "production"
        ? [terser()]
        : [
            copy({
              targets: [{ src: `${STATIC_DIR}/test-page/*`, dest: `${TARGET_DIR}/test-page` }],
            }),
            htmlTemplate({
              template: `${STATIC_DIR}/test-page.html`,
              target: "index.html",
            }),
            dev({
              dirs: [TARGET_DIR],
              port: 10000,
              proxy: [
                {
                  from: "/__PROXY__",
                  to: "https://redstagfulfillment.com/",
                  opts: {
                    prefix: "/__PROXY__",
                  },
                },
              ],
            }),
          ]),
    ],
  },
];

export default results;
