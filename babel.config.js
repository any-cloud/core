module.exports = {
  presets: [["@babel/preset-env", { targets: { node: true } }]],
  plugins: [["@babel/transform-runtime"]]
};
