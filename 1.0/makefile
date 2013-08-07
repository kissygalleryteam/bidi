ghPath = ~/code/gh-pages/bidi/
pages:
	cp -r demo/*.html ${ghPath}
	cp -r ./*.js ${ghPath}
	cp -r ./expression/* ${ghPath}expression/
	cp -r ./watch/*.js ${ghPath}watch/
	cd ${ghPath} && make publish
