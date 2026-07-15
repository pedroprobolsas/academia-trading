const Minio = require('minio');
console.log(Object.keys(Minio.Client.prototype).filter(k => k.toLowerCase().includes('cors')));
