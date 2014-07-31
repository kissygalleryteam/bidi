parse:
	jison ./parse.yy ./parse.l
	@touch tmp.js
	@cat parse.js > tmp.js
	@echo 'KISSY.add(function(){\n' > parse.js
	@cat tmp.js >> parse.js
	@echo '\nreturn parse; \n});' >> parse.js
	@rm tmp.js
	@echo 'success'
