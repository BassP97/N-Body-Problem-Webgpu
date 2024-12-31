# N-Body-Problem-Webgpu

A n body problem simulation!

This simulation not only renders with webgpu, it also computes particle/planet interactions on the gpu by, at each timestep, spinning off one worker thread per particle, calculating its interactions with every other particle, and using that information to update its velocity.

If you just want to run it, clone the repo and start serving the site locally with your web server of choice (if you're looking for a good default choice, just use python's - ie just run `python3 -m http.server 8080` in the root of the repo) and navigate to localhost:8080. Everything should "just work" if you load the site in a browser with webgpu support - chrome on the desktop is a good choice, unless you're on linux, which disables webgpu support by default. If you are on linux, either use firefox nightly (the only version of firefox with webgpu support), or run chrome with webgpu enabled (`google-chrome-stable --enable-unsafe-webgpu --enable-features=Vulkan --temporary-unexpire-flags-m130`) - because chrome's webgpu support on linux is experimental (ie: possibly full of security holes), do NOT use the launched browser to do anything other than access this simulation!

Todo:

[ ] - Update force computation algorithm to use [barnes hut](https://en.wikipedia.org/wiki/Barnes%E2%80%93Hut_simulation)
[ ] - Implement 3d simulation
