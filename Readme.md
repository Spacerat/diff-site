I made myself a little webapp which shows file diffs, in order to teach myself React. In hindsight, React.js was probably a bit overkill for such a small application.

To run, just set up a static web server, e.g.:

	$ python -m SimpleHTTPServer 8080

The .jsx file is compiled with 'babel'.

	$ babel diffview.jsx > diffview.js
 
