const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    content: './src/content.js', // Keep only the content script
    popup: './src/popup.js',
    background: './src/background.js', // Add this line to include background.js
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'public' }
      ],
    }),
  ],
};
