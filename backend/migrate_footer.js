const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/woodentoy').then(async () => {
  const Footer = mongoose.model('CmsFooter', new mongoose.Schema({}, { strict: false }));
  const result = await Footer.updateMany(
    { status: { $exists: false } },
    { $set: { status: true, title: 'Default Footer' } }
  );
  console.log('Migrated:', result.modifiedCount, 'footer(s)');
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
