const fs = require('fs');

module.exports = {
  // ...
  devServer: {
    // ...
    https: {
      key: fs.readFileSync('./key.pem'),
      cert: fs.readFileSync('./cert.pem'),
    },
    // ...
  },
  node: {
    fs: 'empty'
  },
  resolve: {
    fallback: {
      fs: false
    }
  }
};
