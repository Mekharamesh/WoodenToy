const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/woodentoy').then(async () => {
  const CmsHeroBanner = require('./models/CmsHeroBanner');
  // Create one
  const banner = await CmsHeroBanner.create({ title: 'Test', position: null });
  console.log('Created:', banner.position);

  // Update exactly like controller
  const body = { title: 'Test updated', position: 3 };
  
  const updated = await CmsHeroBanner.findByIdAndUpdate(
    banner._id,
    { $set: body },
    { new: true }
  );
  
  console.log('Updated:', updated.position);
  
  // Fetch exactly like controller
  const fetched = await CmsHeroBanner.find({ _id: banner._id });
  console.log('Fetched position:', fetched[0].position);
  
  // cleanup
  await CmsHeroBanner.findByIdAndDelete(banner._id);
  
  process.exit(0);
});
