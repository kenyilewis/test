export const appConfig = {
  port: parseInt(process.env.PORT || '8000', 10),
  outputDir: process.env.OUTPUT_DIR || './output',
};
