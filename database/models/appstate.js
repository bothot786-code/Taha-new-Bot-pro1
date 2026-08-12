/**
 * AppState Model
 * [FCA-PRIYANSH #53] Stores the Facebook session (appstate cookies) in MongoDB so it
 * SURVIVES redeploys (Render resets the filesystem, but the DB persists).
 * A single document (key: "primary") holds the current cookies array.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appStateSchema = new Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'primary'
  },
  cookies: {
    type: Schema.Types.Mixed,   // the appstate array (list of cookie objects)
    default: []
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AppState', appStateSchema);
