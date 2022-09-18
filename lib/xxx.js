// Create a player with the GStreamer library and add it as a background to the video box
const player = Gst.ElementFactory.make('playbin', 'player');
player.set_property('uri', this.content);

// Play the video in loop
player.get_bus().add_watch(GLib.PRIORITY_DEFAULT, (bus, msg) => {
  if (msg.type === Gst.MessageType.EOS) {
    player.seek_simple(Gst.Format.TIME, Gst.SeekFlags.FLUSH, 0);
  }

  return true;
});

// Play the video
player.set_state(Gst.State.PLAYING);
